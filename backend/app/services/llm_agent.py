from __future__ import annotations

import json
import ssl
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from urllib import error, request

from app.settings import settings


ANALYZE_SYSTEM_PROMPT = """
你是一个后端诊疗 agent。根据用户输入的文本或语音转写内容，提炼患者隐藏画像，并给出结构化诊断。

必须只返回 JSON，不要返回 markdown，不要解释。

JSON 结构如下：
{
  "hidden_profile_update": {
    "name_hint": "可为空",
    "constitution": "如 肝郁/心火偏旺/脾虚/肺燥/肾虚/体质虚弱",
    "long_term_traits": ["..."],
    "chronic_symptoms": ["..."],
    "risk_flags": ["..."],
    "preferred_modes": ["角","徵","宫","商","羽"]
  },
  "diagnosis": {
    "status": "ready 或 care",
    "summary": "例如 肝郁气滞 · 疏肝理气",
    "primary_syndrome": "主证型",
    "secondary_syndrome": "次证型，可为空",
    "principle": "调理原则",
    "matched_symptoms": ["..."],
    "detected_keywords": ["..."],
    "tone_mode": "角/徵/宫/商/羽 之一",
    "selected_emotion": "烦躁/低落/思绪放不下/担忧/惶恐不安/还算平和 中的一个或空字符串",
    "intensity": 0-10,
    "rationale": ["最多3条中文短句"],
    "care_message": "如无则空字符串"
  }
}
""".strip()

RECOMMEND_SYSTEM_PROMPT = """
你是一个古琴疗愈曲目推荐 agent。你会收到患者画像、诊断结果和完整曲库，只能从曲库里挑选曲目。

必须只返回 JSON，不要返回 markdown，不要解释。

JSON 结构如下：
{
  "track_ids": ["曲目ID，最多4个"],
  "rationale": ["最多3条中文短句"]
}
""".strip()


@dataclass
class AgentExtraction:
    hidden_profile_update: Dict[str, Any]
    selected_symptoms: List[str]
    selected_emotion: str
    intensity: int
    reasoning_summary: List[str]
    provider: str


@dataclass
class PatientAnalysis:
    hidden_profile_update: Dict[str, Any]
    diagnosis: Dict[str, Any]
    provider: str


@dataclass
class TrackRecommendation:
    track_ids: List[str]
    rationale: List[str]
    provider: str


class LLMAgentService:
    def __init__(self) -> None:
        self.base_url = settings.tokendance_base_url
        self.api_key = settings.tokendance_api_key
        self.model = settings.tokendance_model
        self.verify_ssl = settings.tokendance_verify_ssl

    @property
    def configured(self) -> bool:
        return settings.tokendance_configured

    def analyze_input(self, transcript: str, current_hidden_profile: Optional[dict] = None) -> Optional[AgentExtraction]:
        if not self.configured:
            return None

        for endpoint in endpoints:
            try:
                parsed = self._chat_json(
                    endpoint,
                    system_prompt=ANALYZE_SYSTEM_PROMPT,
                    user_payload={
                        "transcript": transcript,
                        "current_hidden_profile": current_hidden_profile or {},
                    },
                )
                analysis = parsed.get("analysis", {})
                profile_update = parsed.get("hidden_profile_update", {})
                return AgentExtraction(
                    hidden_profile_update=profile_update,
                    selected_symptoms=analysis.get("selected_symptoms", []) or [],
                    selected_emotion=analysis.get("selected_emotion", "") or "",
                    intensity=max(0, min(10, int(analysis.get("intensity", 5) or 5))),
                    reasoning_summary=analysis.get("reasoning_summary", []) or [],
                    provider="tokendance-llm",
                )
            except Exception:
                continue

        return None

    def analyze_patient(self, transcript: str, current_hidden_profile: Optional[dict] = None) -> Optional[PatientAnalysis]:
        if not self.configured:
            return None

        for endpoint in endpoints:
            try:
                parsed = self._chat_json(
                    endpoint,
                    system_prompt=ANALYZE_SYSTEM_PROMPT,
                    user_payload={
                        "transcript": transcript,
                        "current_hidden_profile": current_hidden_profile or {},
                    },
                )
                return PatientAnalysis(
                    hidden_profile_update=parsed.get("hidden_profile_update", {}) or {},
                    diagnosis=parsed.get("diagnosis", {}) or {},
                    provider="tokendance-llm",
                )
            except Exception:
                continue

        return None

    def recommend_tracks(self, transcript: str, profile: dict, diagnosis: dict, track_library: List[dict]) -> Optional[TrackRecommendation]:
        if not self.configured:
            return None

        compact_tracks = [
            {
                "id": track["id"],
                "title": track["title"],
                "mode": track["mode"],
                "effect": track["effect"],
                "source_syndrome_ids": track["source_syndrome_ids"],
            }
            for track in track_library
        ]

        for endpoint in endpoints:
            try:
                parsed = self._chat_json(
                    endpoint,
                    system_prompt=RECOMMEND_SYSTEM_PROMPT,
                    user_payload={
                        "transcript": transcript,
                        "profile": profile,
                        "diagnosis": diagnosis,
                        "track_library": compact_tracks,
                    },
                )
                return TrackRecommendation(
                    track_ids=parsed.get("track_ids", []) or [],
                    rationale=parsed.get("rationale", []) or [],
                    provider="tokendance-llm",
                )
            except Exception:
                continue

        return None

    @staticmethod
    def _guard_output(text: str) -> str:
        """过滤 LLM 输出中的高风险内容，防止模型生成不当引导。"""
        BLOCKED = ["自杀方法", "自残教程", "如何结束生命"]
        for phrase in BLOCKED:
            if phrase in text:
                return ""
        return text

    def _chat_json(self, url: str, system_prompt: str, user_payload: dict) -> dict:
        payload = {
            "model": self.model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
            ],
        }
        response_json = self._post_json(url, payload)
        content = response_json["choices"][0]["message"]["content"]
        content = self._guard_output(content)
        if not content:
            raise RuntimeError("LLM output blocked by output guard")
        return json.loads(content)

    def _post_json(self, url: str, payload: dict) -> dict:
        req = request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        try:
            ssl_context = None if self.verify_ssl else ssl._create_unverified_context()
            with request.urlopen(req, timeout=40, context=ssl_context) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"LLM request failed: {exc.code} {body}") from exc


endpoints = [
    f"{settings.tokendance_base_url}/gateway/v1/chat/completions",
    f"{settings.tokendance_base_url}/v1/chat/completions",
    f"{settings.tokendance_base_url}/chat/completions",
]
