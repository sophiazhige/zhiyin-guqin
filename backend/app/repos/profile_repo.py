from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from app.models import UserProfile, UserProfileCreate


class ProfileRepository:
    def __init__(self, storage_path: Path) -> None:
        self.storage_path = storage_path
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.storage_path.exists():
            self.storage_path.write_text("{}", encoding="utf-8")

    def _load(self) -> dict:
        return json.loads(self.storage_path.read_text(encoding="utf-8"))

    def _save(self, data: dict) -> None:
        self.storage_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def upsert(self, payload: UserProfileCreate) -> UserProfile:
        data = self._load()
        existing = data.get(payload.user_id, {})
        merged = {
            **existing,
            **payload.model_dump(),
            "diagnosis_history": existing.get("diagnosis_history", []),
        }
        data[payload.user_id] = merged
        self._save(data)
        return UserProfile(**merged)

    def get(self, user_id: str) -> Optional[UserProfile]:
        data = self._load()
        found = data.get(user_id)
        return UserProfile(**found) if found else None

    def append_history(self, user_id: str, record: dict) -> Optional[UserProfile]:
        data = self._load()
        found = data.get(user_id)
        if not found:
            return None

        history = found.get("diagnosis_history", [])
        history.append(record)
        found["diagnosis_history"] = history[-20:]
        data[user_id] = found
        self._save(data)
        return UserProfile(**found)
