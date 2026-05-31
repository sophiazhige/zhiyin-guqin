from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional, Set

from app.data.therapy_library import EMOTION_OPTIONS, SYNDROME_PROFILES, TONE_PROFILES, TRACK_BY_TITLE
from app.models import DiagnosisResponse, ToneProfileResponse, TrackResponse


HIGH_RISK_TOKENS = ["自杀", "轻生", "不想活", "活不下去", "结束生命", "伤害自己", "没有活着的意义", "撑不住了"]

BODY_SYMPTOM_RULES = [
    {"syndrome_id": "sleep-relief", "tokens": ["入睡难", "易醒", "睡浅", "失眠", "多梦"], "weight": 3},
    {"syndrome_id": "heart-cooling", "tokens": ["心悸", "胸闷", "心慌", "烦热"], "weight": 3},
    {"syndrome_id": "liver-soothing", "tokens": ["烦躁", "易怒", "情绪低落", "郁闷"], "weight": 3},
    {"syndrome_id": "stress-release", "tokens": ["压力大", "紧绷", "脑疲劳", "专注力差"], "weight": 3},
    {"syndrome_id": "spleen-balance", "tokens": ["思虑过度", "没胃口", "腹胀"], "weight": 3},
    {"syndrome_id": "lung-moistening", "tokens": ["易感冒", "咽干", "咳嗽", "鼻炎"], "weight": 3},
    {"syndrome_id": "kidney-restoring", "tokens": ["腰膝酸软", "耳鸣", "健忘", "脱发"], "weight": 3},
]

TEXT_RULES = [
    {"syndrome_id": "sleep-relief", "tokens": ["睡不着", "夜里醒", "半夜醒", "睡眠差", "脑子停不下来"], "weight": 2},
    {"syndrome_id": "liver-soothing", "tokens": ["压抑", "委屈", "想哭", "烦闷", "心口堵"], "weight": 2},
    {"syndrome_id": "spleen-balance", "tokens": ["没食欲", "吃不下", "胃胀", "消化不好"], "weight": 2},
    {"syndrome_id": "lung-moistening", "tokens": ["呼吸不畅", "嗓子干", "喉咙不舒服", "皮肤干"], "weight": 2},
    {"syndrome_id": "kidney-restoring", "tokens": ["腰酸", "记性差", "耳朵响", "容易累"], "weight": 2},
    {"syndrome_id": "heart-cooling", "tokens": ["心跳快", "火气大", "胸口闷", "坐立不安"], "weight": 2},
    {"syndrome_id": "stress-release", "tokens": ["压力很大", "注意力不集中", "工作太满", "脑子很累"], "weight": 2},
    {"syndrome_id": "women-balance", "tokens": ["经期", "痛经", "姨妈", "例假"], "weight": 3},
    {"syndrome_id": "vitality-support", "tokens": ["体质差", "免疫力低", "恢复慢", "总生病"], "weight": 3},
]


class DiagnosisService:
    def __init__(self, preview_base_url: str = "/api/playback/preview") -> None:
        self.preview_base_url = preview_base_url.rstrip("/")

    @staticmethod
    def _normalize_text(text: str) -> str:
        return "".join(text.split()).strip()

    @staticmethod
    def _collect_matches(text: str, rules: List[dict], scores: Dict[str, int], keywords: Set[str]) -> None:
        for rule in rules:
            hit = next((token for token in rule["tokens"] if token in text), None)
            if not hit:
                continue
            scores[rule["syndrome_id"]] = scores.get(rule["syndrome_id"], 0) + rule["weight"]
            keywords.add(hit)

    def _score_emotion(self, emotion: str, intensity: int, scores: Dict[str, int], keywords: Set[str]) -> None:
        if not emotion or emotion not in EMOTION_OPTIONS:
            return

        base_weight = max(1, round(intensity / 3))
        mapping = {
            "烦躁": ["liver-soothing", "heart-cooling"],
            "低落": ["liver-soothing", "vitality-support"],
            "思绪放不下": ["sleep-relief", "spleen-balance"],
            "担忧": ["spleen-balance", "sleep-relief"],
            "惶恐不安": ["sleep-relief", "heart-cooling"],
            "还算平和": ["stress-release"],
        }
        for syndrome_id in mapping.get(emotion, []):
            scores[syndrome_id] = scores.get(syndrome_id, 0) + base_weight
        keywords.add(emotion)

    @staticmethod
    def _rank_profiles(scores: Dict[str, int]) -> List[dict]:
        return sorted(
            [{"profile": profile, "score": scores.get(profile["id"], 0)} for profile in SYNDROME_PROFILES],
            key=lambda item: item["score"],
            reverse=True,
        )

    def _build_track_response(self, track: dict) -> TrackResponse:
        return TrackResponse(
            id=track["id"],
            title=track["title"],
            mode=track["mode"],
            element=track["element"],
            duration_sec=track["duration_sec"],
            effect=track["effect"],
            source_syndrome_ids=track["source_syndrome_ids"],
            preview_url=f"{self.preview_base_url}/{track['id']}.wav",
        )

    def _build_recommendations(self, primary: dict, secondary: Optional[dict]) -> List[TrackResponse]:
        titles = primary["tracks"][:3]
        if secondary:
            titles += secondary["tracks"][:1]
        titles += TONE_PROFILES[primary["mode"]]["anchor_tracks"][:2]

        unique_tracks = []
        seen = set()
        for title in titles:
            track = TRACK_BY_TITLE.get(title)
            if not track or track["id"] in seen:
                continue
            seen.add(track["id"])
            unique_tracks.append(self._build_track_response(track))
        return unique_tracks[:4]

    def analyze(
        self,
        transcript: str,
        selected_symptoms: List[str],
        selected_emotion: str,
        intensity: int,
        user_id: str,
        hidden_profile: Optional[dict] = None,
        llm_provider: str = "",
        reasoning_summary: Optional[List[str]] = None,
    ) -> DiagnosisResponse:
        normalized = self._normalize_text(transcript)
        scores: Dict[str, int] = {}
        matched_symptoms: Set[str] = set()
        detected_keywords: Set[str] = set()

        all_selected_symptoms = list(selected_symptoms)
        if hidden_profile:
            all_selected_symptoms.extend(hidden_profile.get("chronic_symptoms", []))

        for symptom in all_selected_symptoms:
            self._collect_matches(symptom, BODY_SYMPTOM_RULES, scores, matched_symptoms)

        self._collect_matches(normalized, TEXT_RULES, scores, detected_keywords)
        self._score_emotion(selected_emotion, intensity, scores, detected_keywords)

        if intensity >= 8:
            scores["stress-release"] = scores.get("stress-release", 0) + 2
            scores["sleep-relief"] = scores.get("sleep-relief", 0) + 1

        # 性别差异规则：女性对 women-balance 额外加权
        if hidden_profile and hidden_profile.get("gender") == "female":
            if any(s in all_selected_symptoms for s in ["痛经/经期不调", "经前烦躁/乳胀"]):
                scores["women-balance"] = scores.get("women-balance", 0) + 3

        # 体质-证型权重矩阵：已有体质的用户对对应证型加权
        CONSTITUTION_BOOST: Dict[str, List[str]] = {
            "肝郁": ["liver-soothing", "sleep-relief"],
            "心火偏旺": ["heart-cooling", "sleep-relief"],
            "脾虚": ["spleen-balance", "vitality-support"],
            "肺燥": ["lung-moistening"],
            "肾虚": ["kidney-restoring", "vitality-support"],
        }
        if hidden_profile and hidden_profile.get("constitution"):
            constitution = hidden_profile["constitution"]
            detected_keywords.add(constitution)
            for key, syndrome_ids in CONSTITUTION_BOOST.items():
                if key in constitution:
                    for sid in syndrome_ids:
                        scores[sid] = scores.get(sid, 0) + 2
                    break

        # 疗程进度感知：多次来访后调整权重（避免推荐完全相同证型）
        if hidden_profile:
            history = hidden_profile.get("diagnosis_history", [])
            if len(history) >= 3:
                last_syndromes = [h.get("primary_syndrome", "") for h in history[-3:]]
                dominant = max(set(last_syndromes), key=last_syndromes.count) if last_syndromes else ""
                if dominant:
                    for profile in __import__("app.data.therapy_library", fromlist=["SYNDROME_PROFILES"]).SYNDROME_PROFILES:
                        if profile["title"] == dominant:
                            scores[profile["id"]] = scores.get(profile["id"], 0) - 1
                            break

        if not normalized and not all_selected_symptoms:
            scores["stress-release"] = 1

        ranked = self._rank_profiles(scores)
        primary = ranked[0]["profile"]
        secondary = ranked[1]["profile"] if len(ranked) > 1 and ranked[1]["score"] >= max(2, ranked[0]["score"] - 1) else None
        tone_profile = TONE_PROFILES[primary["mode"]]
        recommended_tracks = self._build_recommendations(primary, secondary)
        high_risk_hit = next((token for token in HIGH_RISK_TOKENS if token in normalized), "")

        caller = hidden_profile.get("name_hint") if hidden_profile else ""
        caller_label = caller if caller else "当前用户"
        rationale = reasoning_summary[:] if reasoning_summary else []
        if not rationale:
            rationale = [
                f"{caller_label}更接近“{primary['title']}”状态，建议以{primary['principle']}为主。",
                f"本轮命中 {primary['tone_label']}，对应 {tone_profile['description']}",
                (
                    f"兼顾“{secondary['title']}”倾向，因此推荐曲单加入辅助调和曲。"
                    if secondary
                    else f"优先从 {primary['organ']} 系曲目中提取主旋律。"
                ),
            ]

        return DiagnosisResponse(
            status="care" if high_risk_hit else "ready",
            user_id=user_id,
            summary=f"{primary['title']} · {primary['principle']}",
            primary_syndrome=primary["title"],
            secondary_syndrome=secondary["title"] if secondary else "",
            principle=primary["principle"],
            rationale=rationale,
            matched_symptoms=sorted(matched_symptoms) or list(dict.fromkeys(all_selected_symptoms)),
            detected_keywords=sorted(detected_keywords | ({high_risk_hit} if high_risk_hit else set())),
            tone_profile=ToneProfileResponse(
                mode=tone_profile["mode"],
                title=tone_profile["title"],
                label=tone_profile["label"],
                description=tone_profile["description"],
            ),
            recommended_tracks=recommended_tracks,
            care_message=(
                "检测到高风险表达，建议优先联系心理援助热线或专业支持，暂不直接进入音乐诊疗流程。"
                if high_risk_hit
                else ""
            ),
            agent_profile_version=1,
            llm_provider=llm_provider,
            transcript=transcript,
        )

    @staticmethod
    def build_history_record(response: DiagnosisResponse, transcript: str) -> dict:
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "summary": response.summary,
            "primary_syndrome": response.primary_syndrome,
            "secondary_syndrome": response.secondary_syndrome,
            "principle": response.principle,
            "transcript": transcript,
            "recommended_track_ids": [track.id for track in response.recommended_tracks],
        }
