from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response

from app.data.therapy_library import TONE_PROFILES, TRACK_BY_ID, TRACK_LIBRARY
from app.models import (
    AgentProfileResponse,
    AgentRunResponse,
    AudioIntakeResponse,
    DiagnosisRequest,
    DiagnosisResponse,
    HealthResponse,
    IntakeTextRequest,
    TextIntakeResponse,
    TrackResponse,
    TranscriptionResponse,
    UserProfileUpdate,
    ResonanceRequest,
    ResonanceResponse,
    DailyStatusResponse,
    PersonalityResponse,
    FavoriteAction,
    HistoryEntry,
    HistoryResponse,
    FavoritesResponse,
    QinshiChatRequest,
    QinshiChatResponse,
)
from app.repos.agent_state_repo import AgentStateRepository
from app.settings import settings
from app.services.diagnosis import DiagnosisService
from app.services.llm_agent import LLMAgentService
from app.services.playback import PlaybackService
from app.services.transcription import TranscriptionService


BASE_DIR = Path(__file__).resolve().parents[1]
STORAGE_DIR = BASE_DIR / "storage"
TEMPLATES_DIR = BASE_DIR / "app" / "templates"

agent_state_repo = AgentStateRepository(STORAGE_DIR / "agent_state.json")
diagnosis_service = DiagnosisService()
playback_service = PlaybackService()
transcription_service = TranscriptionService(STORAGE_DIR / "audio_uploads")
llm_agent_service = LLMAgentService()

app = FastAPI(title="Zhiyin Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _track_response(track: dict) -> TrackResponse:
    return TrackResponse(
        id=track["id"],
        title=track["title"],
        mode=track["mode"],
        element=track["element"],
        duration_sec=track["duration_sec"],
        effect=track["effect"],
        source_syndrome_ids=track["source_syndrome_ids"],
        preview_url=f"/api/playback/preview/{track['id']}.wav",
    )


def _persist_history(user_id: str, diagnosis: DiagnosisResponse, transcript: str) -> None:
    history_record = diagnosis_service.build_history_record(diagnosis, transcript)
    agent_state_repo.append_history(user_id, history_record)


def _profile_response(hidden_profile: dict) -> AgentProfileResponse:
    return AgentProfileResponse(
        constitution=hidden_profile.get("constitution", ""),
        long_term_traits=hidden_profile.get("long_term_traits", []),
        chronic_symptoms=hidden_profile.get("chronic_symptoms", []),
        risk_flags=hidden_profile.get("risk_flags", []),
        preferred_modes=hidden_profile.get("preferred_modes", []),
    )


def _llm_diagnosis_response(
    *,
    user_id: str,
    transcript: str,
    diagnosis_payload: dict,
    llm_provider: str,
    recommended_track_ids: list[str],
) -> DiagnosisResponse:
    tone_mode = diagnosis_payload.get("tone_mode", "角")
    tone_profile = TONE_PROFILES.get(tone_mode, TONE_PROFILES["角"])
    recommended_tracks = []
    for track_id in recommended_track_ids:
        track = TRACK_BY_ID.get(track_id)
        if track:
            recommended_tracks.append(_track_response(track))

    return DiagnosisResponse(
        status=diagnosis_payload.get("status", "ready"),
        user_id=user_id,
        summary=diagnosis_payload.get("summary", ""),
        primary_syndrome=diagnosis_payload.get("primary_syndrome", ""),
        secondary_syndrome=diagnosis_payload.get("secondary_syndrome", ""),
        principle=diagnosis_payload.get("principle", ""),
        rationale=diagnosis_payload.get("rationale", []) or [],
        matched_symptoms=diagnosis_payload.get("matched_symptoms", []) or [],
        detected_keywords=diagnosis_payload.get("detected_keywords", []) or [],
        tone_profile={
            "mode": tone_profile["mode"],
            "title": tone_profile["title"],
            "label": tone_profile["label"],
            "description": tone_profile["description"],
        },
        recommended_tracks=recommended_tracks,
        care_message=diagnosis_payload.get("care_message", "") or "",
        agent_profile_version=1,
        llm_provider=llm_provider,
        transcript=transcript,
    )


def _run_agent_flow(
    user_id: str,
    transcript: str,
    selected_symptoms: list[str],
    selected_emotion: str,
    intensity: int,
) -> DiagnosisResponse:
    hidden_profile = agent_state_repo.get_profile(user_id)
    extraction = llm_agent_service.analyze_input(transcript, current_hidden_profile=hidden_profile)

    merged_selected_symptoms = list(selected_symptoms)
    merged_selected_emotion = selected_emotion
    merged_intensity = intensity
    reasoning_summary: list[str] = []
    llm_provider = extraction.provider if extraction else "rule-based"

    if extraction:
        hidden_profile = agent_state_repo.merge_profile(user_id, extraction.hidden_profile_update)
        merged_selected_symptoms = list(dict.fromkeys(merged_selected_symptoms + extraction.selected_symptoms))
        merged_selected_emotion = extraction.selected_emotion or merged_selected_emotion
        merged_intensity = extraction.intensity if extraction.intensity is not None else merged_intensity
        reasoning_summary = extraction.reasoning_summary

    diagnosis = diagnosis_service.analyze(
        user_id=user_id,
        transcript=transcript,
        selected_symptoms=merged_selected_symptoms,
        selected_emotion=merged_selected_emotion,
        intensity=merged_intensity,
        hidden_profile=hidden_profile,
        llm_provider=llm_provider,
        reasoning_summary=reasoning_summary,
    )
    _persist_history(user_id, diagnosis, transcript)
    return diagnosis


def _run_unified_agent_flow(user_id: str, transcript: str) -> AgentRunResponse:
    hidden_profile = agent_state_repo.get_profile(user_id)
    analysis = llm_agent_service.analyze_patient(transcript, current_hidden_profile=hidden_profile)

    if analysis:
        hidden_profile = agent_state_repo.merge_profile(user_id, analysis.hidden_profile_update)
        recommendation = llm_agent_service.recommend_tracks(
            transcript=transcript,
            profile=hidden_profile,
            diagnosis=analysis.diagnosis,
            track_library=TRACK_LIBRARY,
        )
        recommended_track_ids = recommendation.track_ids if recommendation else []
        diagnosis = _llm_diagnosis_response(
            user_id=user_id,
            transcript=transcript,
            diagnosis_payload=analysis.diagnosis,
            llm_provider=analysis.provider,
            recommended_track_ids=recommended_track_ids,
        )
        fallback_diagnosis = diagnosis_service.analyze(
            user_id=user_id,
            transcript=transcript,
            selected_symptoms=analysis.diagnosis.get("matched_symptoms", []) or [],
            selected_emotion=analysis.diagnosis.get("selected_emotion", "") or "",
            intensity=max(0, min(10, int(analysis.diagnosis.get("intensity", 5) or 5))),
            hidden_profile=hidden_profile,
            llm_provider=analysis.provider,
            reasoning_summary=analysis.diagnosis.get("rationale", []) or [],
        )
        if recommendation and recommendation.rationale:
            diagnosis.rationale = recommendation.rationale
            diagnosis.recommended_tracks = [_track_response(TRACK_BY_ID[track_id]) for track_id in recommended_track_ids if track_id in TRACK_BY_ID]
        if not diagnosis.recommended_tracks:
            diagnosis.recommended_tracks = fallback_diagnosis.recommended_tracks
        if not diagnosis.summary:
            diagnosis.summary = fallback_diagnosis.summary
        if not diagnosis.primary_syndrome:
            diagnosis.primary_syndrome = fallback_diagnosis.primary_syndrome
        if not diagnosis.principle:
            diagnosis.principle = fallback_diagnosis.principle
    else:
        diagnosis = diagnosis_service.analyze(
            user_id=user_id,
            transcript=transcript,
            selected_symptoms=[],
            selected_emotion="",
            intensity=5,
            hidden_profile=hidden_profile,
            llm_provider="rule-based",
        )
        hidden_profile = agent_state_repo.get_profile(user_id)
        recommendation = None

    _persist_history(user_id, diagnosis, transcript)
    return AgentRunResponse(
        transcription=TranscriptionResponse(provider="text", transcript=transcript, language="zh", fallback_used=False),
        profile=_profile_response(hidden_profile),
        diagnosis=diagnosis,
        recommended_tracks=diagnosis.recommended_tracks,
        recommendation_rationale=recommendation.rationale if recommendation else diagnosis.rationale,
    )


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    html = (TEMPLATES_DIR / "index.html").read_text(encoding="utf-8")
    html = html.replace("__TOKENDANCE_STATUS__", "已配置" if settings.tokendance_configured else "未配置")
    html = html.replace("__TOKENDANCE_BASE_URL__", settings.tokendance_base_url or "-")
    return HTMLResponse(content=html)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        stt_provider=transcription_service.provider_name,
        track_count=len(TRACK_LIBRARY),
    )


@app.post("/api/intake/text", response_model=TextIntakeResponse)
def intake_text(payload: IntakeTextRequest) -> TextIntakeResponse:
    diagnosis = _run_agent_flow(
        user_id=payload.user_id,
        transcript=payload.text,
        selected_symptoms=payload.selected_symptoms,
        selected_emotion=payload.selected_emotion,
        intensity=payload.intensity,
    )
    return TextIntakeResponse(
        transcription=TranscriptionResponse(provider="text", transcript=payload.text, language="zh", fallback_used=False),
        diagnosis=diagnosis,
    )


@app.post("/api/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)) -> TranscriptionResponse:
    return await transcription_service.transcribe_upload(file)


@app.post("/api/agent/run", response_model=AgentRunResponse)
async def run_agent(
    user_id: str = Form(...),
    text: str = Form(""),
    file: Optional[UploadFile] = File(default=None),
) -> AgentRunResponse:
    transcription = None
    transcript = text.strip()

    if file is not None and getattr(file, "filename", ""):
        transcription = await transcription_service.transcribe_upload(file)
        transcript = transcription.transcript.strip()
    elif transcript:
        transcription = TranscriptionResponse(provider="text", transcript=transcript, language="zh", fallback_used=False)

    if not transcript:
        raise HTTPException(status_code=400, detail="text or file is required")

    result = _run_unified_agent_flow(user_id=user_id, transcript=transcript)
    result.transcription = transcription
    return result


@app.post("/api/intake/audio", response_model=AudioIntakeResponse)
async def intake_audio(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    selected_symptoms: str = Form(""),
    selected_emotion: str = Form(""),
    intensity: int = Form(5),
) -> AudioIntakeResponse:
    transcription = await transcription_service.transcribe_upload(file)
    symptoms = [item.strip() for item in selected_symptoms.split(",") if item.strip()]
    diagnosis = _run_agent_flow(
        user_id=user_id,
        transcript=transcription.transcript,
        selected_symptoms=symptoms,
        selected_emotion=selected_emotion,
        intensity=intensity,
    )
    return AudioIntakeResponse(transcription=transcription, diagnosis=diagnosis)


@app.post("/api/diagnosis", response_model=DiagnosisResponse)
def diagnose(payload: DiagnosisRequest) -> DiagnosisResponse:
    return _run_agent_flow(
        user_id=payload.user_id,
        transcript=payload.transcript,
        selected_symptoms=payload.selected_symptoms,
        selected_emotion=payload.selected_emotion,
        intensity=payload.intensity,
    )


@app.get("/api/tracks", response_model=list[TrackResponse])
def list_tracks() -> list[TrackResponse]:
    return [_track_response(track) for track in TRACK_LIBRARY]


@app.get("/api/tracks/{track_id}", response_model=TrackResponse)
def get_track(track_id: str) -> TrackResponse:
    track = TRACK_BY_ID.get(track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return _track_response(track)


@app.get("/api/playback/preview/{track_id}.wav")
def preview_track(track_id: str) -> Response:
    audio_bytes = playback_service.synthesize_track_wav(track_id)
    return Response(content=audio_bytes, media_type="audio/wav")


# --- New endpoints for enhanced features ---

@app.post("/api/user/profile", response_model=dict)
def update_user_profile(payload: UserProfileUpdate) -> dict:
    """Create or update user profile. If fields changed, creates new persona in agent memory."""
    existing = agent_state_repo.get_profile(payload.user_id)
    changed = False
    if existing:
        storage_key = {"name": "name_hint", "gender": "gender", "birth_year": "birth_year", "birth_month": "birth_month", "birth_day": "birth_day"}
        for field in ("name", "gender", "birth_year", "birth_month", "birth_day"):
            val = getattr(payload, field, None)
            if val and val != existing.get(storage_key[field]):
                changed = True
                break

    profile_data = {
        "name_hint": payload.name,
        "gender": payload.gender,
        "birth_year": payload.birth_year,
        "birth_month": payload.birth_month,
        "birth_day": payload.birth_day,
    }
    agent_state_repo.merge_profile(payload.user_id, profile_data)
    return {"status": "updated", "profile_changed": changed}


@app.post("/api/resonance", response_model=ResonanceResponse)
def generate_resonance(payload: ResonanceRequest) -> ResonanceResponse:
    """Generate poetic resonance text using LLM (healer agent).
    Falls back to rule-based if LLM not configured."""
    prompt = (
        f"用户名：{payload.name or '旅人'}。"
        f"症状：{','.join(payload.selected_symptoms) or '未选择'}。"
        f"情绪：{payload.selected_emotion or '未选择'}，强度{payload.intensity}/10。"
        f"入睡：{payload.sleep_duration or '未知'}。"
        f"自述：{payload.free_text or '无'}。"
    )

    hidden_profile = agent_state_repo.get_profile(payload.user_id)
    history = hidden_profile.get("diagnosis_history", []) if hidden_profile else []

    if llm_agent_service.configured:
        try:
            system = (
                "你是知音古琴疗愈的医师agent。根据用户信息生成回响文字。"
                "格式：JSON {\"user_name\": \"...\", \"user_summary\": \"一句话概括用户状况\", "
                "\"poetic_comfort\": \"诗意安慰，不超过100字，有温度有共情\"}。"
                "如果有历史记录，可以对比用户的变化。只返回JSON。"
            )
            if history:
                prompt += f" 历史记录（最近3次）：{history[-3:]}"
            parsed = llm_agent_service._chat_json(
                f"{settings.tokendance_base_url}/v1/chat/completions",
                system_prompt=system,
                user_payload={"input": prompt},
            )
            return ResonanceResponse(
                user_name=parsed.get("user_name", payload.name or "旅人"),
                user_summary=parsed.get("user_summary", ""),
                poetic_comfort=parsed.get("poetic_comfort", ""),
            )
        except Exception:
            pass

    name = payload.name or "旅人"
    symptoms_str = "、".join(payload.selected_symptoms[:3]) if payload.selected_symptoms else "诸般不适"
    return ResonanceResponse(
        user_name=name,
        user_summary=f"近期常感{symptoms_str}，情绪偏于{payload.selected_emotion or '波动'}。",
        poetic_comfort=f"{name}，夜深人静时，让琴音替你说出那些难以言说的疲惫。明日的风，会比今日温柔。",
    )


@app.get("/api/user/{user_id}/daily-status", response_model=DailyStatusResponse)
def get_daily_status(user_id: str) -> DailyStatusResponse:
    """Generate daily status via LLM, or fallback to rule-based."""
    hidden_profile = agent_state_repo.get_profile(user_id)

    if llm_agent_service.configured and hidden_profile:
        try:
            system = (
                "你是知音古琴疗愈的琴师。根据用户画像生成今日状态短语（15字以内）和对应的五行元素。"
                "只返回JSON：{\"status_text\": \"...\", \"mood_element\": \"wood/fire/earth/metal/water\"}"
            )
            parsed = llm_agent_service._chat_json(
                f"{settings.tokendance_base_url}/v1/chat/completions",
                system_prompt=system,
                user_payload={"profile": hidden_profile},
            )
            return DailyStatusResponse(
                status_text=parsed.get("status_text", "今日宜静心聆听"),
                mood_element=parsed.get("mood_element", "wood"),
            )
        except Exception:
            pass

    constitution = hidden_profile.get("constitution", "") if hidden_profile else ""
    if "肝郁" in constitution or "木" in constitution:
        return DailyStatusResponse(status_text="今日气机偏郁，宜听角调舒展", mood_element="wood")
    if "心火" in constitution or "火" in constitution:
        return DailyStatusResponse(status_text="心火微燥，宜以徵音安抚", mood_element="fire")
    return DailyStatusResponse(status_text="今日宜静心聆听", mood_element="earth")


@app.get("/api/user/{user_id}/personality", response_model=PersonalityResponse)
def get_personality(user_id: str) -> PersonalityResponse:
    """Compute personality profile from all historical data."""
    hidden_profile = agent_state_repo.get_profile(user_id)

    if llm_agent_service.configured and hidden_profile:
        try:
            system = (
                "你是知音的记忆agent。根据用户所有历史数据，计算五行性格底色。"
                "返回JSON：{\"wood\": 0-100, \"fire\": 0-100, \"earth\": 0-100, "
                "\"metal\": 0-100, \"water\": 0-100, \"summary\": \"一句话总结性格\"}"
                "五项总和应为100。"
            )
            parsed = llm_agent_service._chat_json(
                f"{settings.tokendance_base_url}/v1/chat/completions",
                system_prompt=system,
                user_payload={"profile": hidden_profile},
            )
            return PersonalityResponse(**parsed)
        except Exception:
            pass

    return PersonalityResponse(
        wood=35, fire=20, earth=15, metal=15, water=15,
        summary="性情偏于疏达，木气较盛，宜多听商调以制衡。",
    )


@app.post("/api/user/favorites/add")
def add_favorite(payload: FavoriteAction) -> dict:
    agent_state_repo.add_favorite(payload.user_id, payload.track_id)
    return {"status": "added"}


@app.post("/api/user/favorites/remove")
def remove_favorite(payload: FavoriteAction) -> dict:
    agent_state_repo.remove_favorite(payload.user_id, payload.track_id)
    return {"status": "removed"}


@app.get("/api/user/{user_id}/favorites", response_model=FavoritesResponse)
def get_favorites(user_id: str) -> FavoritesResponse:
    track_ids = agent_state_repo.get_favorites(user_id)
    return FavoritesResponse(track_ids=track_ids)


@app.get("/api/user/{user_id}/history", response_model=HistoryResponse)
def get_history(user_id: str) -> HistoryResponse:
    entries = agent_state_repo.get_history_entries(user_id)
    return HistoryResponse(entries=[HistoryEntry(**e) for e in entries])


@app.post("/api/user/history/add")
def add_history_entry(
    user_id: str,
    track_id: str,
    listened_sec: int,
) -> dict:
    track = TRACK_BY_ID.get(track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    from datetime import datetime
    entry = {
        "track_id": track_id,
        "track_title": track["title"],
        "played_at": datetime.utcnow().isoformat() + "Z",
        "listened_sec": listened_sec,
    }
    agent_state_repo.add_history_entry(user_id, entry)
    return {"status": "added"}


@app.post("/api/qinshi/chat", response_model=QinshiChatResponse)
def chat_with_qinshi(payload: QinshiChatRequest) -> QinshiChatResponse:
    """Real-time chat with qinshi agent. Returns reply + optional new track recommendations."""
    hidden_profile = agent_state_repo.get_profile(payload.user_id)

    if llm_agent_service.configured:
        try:
            current_track = TRACK_BY_ID.get(payload.current_track_id, {})
            system = (
                "你是知音的琴师，温文尔雅的女生，和用户交谈。"
                "根据用户的话和当前播放的曲目，给出温暖的回复，"
                "并推荐3首新曲目（从曲库中选）。"
                "只返回JSON：{\"reply\": \"...\", \"new_track_ids\": [\"track-xxx\", ...]}"
            )
            compact_tracks = [{"id": t["id"], "title": t["title"], "mode": t["mode"], "effect": t["effect"]} for t in TRACK_LIBRARY]
            parsed = llm_agent_service._chat_json(
                f"{settings.tokendance_base_url}/v1/chat/completions",
                system_prompt=system,
                user_payload={
                    "message": payload.message,
                    "current_track": current_track,
                    "profile": hidden_profile or {},
                    "track_library": compact_tracks,
                },
            )
            return QinshiChatResponse(
                reply=parsed.get("reply", "琴声如水，此刻不必多想。"),
                new_track_ids=parsed.get("new_track_ids", []),
            )
        except Exception:
            pass

    return QinshiChatResponse(
        reply="琴声如水，此刻不必多想，让旋律带你走一程。",
        new_track_ids=[],
    )
