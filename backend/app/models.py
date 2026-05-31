from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class UserProfileCreate(BaseModel):
    user_id: str = Field(..., description="Unique user id")
    name: str = ""
    age: Optional[int] = None
    gender: str = ""
    constitution: str = ""
    preferred_modes: List[str] = Field(default_factory=list)
    chronic_symptoms: List[str] = Field(default_factory=list)
    notes: str = ""


class UserProfile(UserProfileCreate):
    diagnosis_history: List[dict] = Field(default_factory=list)


class IntakeTextRequest(BaseModel):
    user_id: str
    text: str
    selected_symptoms: List[str] = Field(default_factory=list)
    selected_emotion: str = ""
    intensity: int = Field(default=5, ge=0, le=10)


class DiagnosisRequest(BaseModel):
    user_id: str
    transcript: str = ""
    selected_symptoms: List[str] = Field(default_factory=list)
    selected_emotion: str = ""
    intensity: int = Field(default=5, ge=0, le=10)


class ToneProfileResponse(BaseModel):
    mode: str
    title: str
    label: str
    description: str


class TrackResponse(BaseModel):
    id: str
    title: str
    mode: str
    element: str
    duration_sec: int
    effect: str
    source_syndrome_ids: List[str]
    preview_url: str = ""


class DiagnosisResponse(BaseModel):
    status: Literal["ready", "care"]
    user_id: str
    summary: str
    primary_syndrome: str
    secondary_syndrome: str = ""
    principle: str
    rationale: List[str]
    matched_symptoms: List[str]
    detected_keywords: List[str]
    tone_profile: ToneProfileResponse
    recommended_tracks: List[TrackResponse]
    care_message: str = ""
    agent_profile_version: int = 1
    llm_provider: str = ""
    transcript: str = ""


class AgentProfileResponse(BaseModel):
    constitution: str = ""
    long_term_traits: List[str] = Field(default_factory=list)
    chronic_symptoms: List[str] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    preferred_modes: List[str] = Field(default_factory=list)


class TranscriptionResponse(BaseModel):
    provider: str
    transcript: str
    language: str = "zh"
    fallback_used: bool = False


class TextIntakeResponse(BaseModel):
    transcription: TranscriptionResponse
    diagnosis: DiagnosisResponse


class AudioIntakeResponse(BaseModel):
    transcription: TranscriptionResponse
    diagnosis: DiagnosisResponse


class AgentRunResponse(BaseModel):
    transcription: TranscriptionResponse
    profile: AgentProfileResponse
    diagnosis: DiagnosisResponse
    recommended_tracks: List[TrackResponse]
    recommendation_rationale: List[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    stt_provider: str
    track_count: int


# --- New models for enhanced features ---

class UserProfileUpdate(BaseModel):
    user_id: str
    name: str = ""
    gender: str = ""
    birth_year: Optional[int] = None
    birth_month: Optional[int] = None
    birth_day: Optional[int] = None

class ResonanceRequest(BaseModel):
    user_id: str
    name: str = ""
    selected_symptoms: List[str] = Field(default_factory=list)
    selected_emotion: str = ""
    intensity: int = 5
    sleep_duration: str = ""
    free_text: str = ""

class ResonanceResponse(BaseModel):
    user_name: str
    user_summary: str
    poetic_comfort: str

class DailyStatusResponse(BaseModel):
    status_text: str
    mood_element: str = ""

class PersonalityResponse(BaseModel):
    wood: int = 20
    fire: int = 20
    earth: int = 20
    metal: int = 20
    water: int = 20
    summary: str = ""

class FavoriteAction(BaseModel):
    user_id: str
    track_id: str

class HistoryEntry(BaseModel):
    track_id: str
    track_title: str
    played_at: str
    listened_sec: int

class HistoryResponse(BaseModel):
    entries: List[HistoryEntry] = Field(default_factory=list)

class FavoritesResponse(BaseModel):
    track_ids: List[str] = Field(default_factory=list)

class QinshiChatRequest(BaseModel):
    user_id: str
    message: str
    current_track_id: str = ""

class QinshiChatResponse(BaseModel):
    reply: str
    new_track_ids: List[str] = Field(default_factory=list)
