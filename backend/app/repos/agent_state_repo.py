from __future__ import annotations

import fcntl
import json
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)


class AgentStateRepository:
    def __init__(self, storage_path: Path) -> None:
        self.storage_path = storage_path
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.storage_path.exists():
            self.storage_path.write_text("{}", encoding="utf-8")

    def _load(self) -> Dict[str, Any]:
        try:
            text = self.storage_path.read_text(encoding="utf-8").strip()
            return json.loads(text) if text else {}
        except (json.JSONDecodeError, OSError) as exc:
            logger.error("agent_state 读取失败，返回空状态: %s", exc)
            return {}

    def _save(self, data: Dict[str, Any]) -> None:
        tmp = self.storage_path.with_suffix(".tmp")
        try:
            with tmp.open("w", encoding="utf-8") as f:
                fcntl.flock(f, fcntl.LOCK_EX)
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.flush()
                fcntl.flock(f, fcntl.LOCK_UN)
            tmp.replace(self.storage_path)
        except OSError as exc:
            logger.error("agent_state 写入失败: %s", exc)
            if tmp.exists():
                tmp.unlink(missing_ok=True)

    def get_profile(self, user_id: str) -> dict:
        data = self._load()
        entry = data.get(user_id, {})
        return entry.get("hidden_profile", {})

    def merge_profile(self, user_id: str, profile_update: dict) -> dict:
        data = self._load()
        entry = data.get(user_id, {"hidden_profile": {}, "history": []})
        hidden_profile = entry.get("hidden_profile", {})

        for key, value in profile_update.items():
            if value in (None, "", [], {}):
                continue
            if isinstance(value, list):
                merged = list(dict.fromkeys(hidden_profile.get(key, []) + value))
                hidden_profile[key] = merged
            else:
                hidden_profile[key] = value

        entry["hidden_profile"] = hidden_profile
        data[user_id] = entry
        self._save(data)
        return hidden_profile

    def append_history(self, user_id: str, record: dict) -> None:
        data = self._load()
        entry = data.get(user_id, {"hidden_profile": {}, "history": []})
        history = entry.get("history", [])
        history.append(record)
        entry["history"] = history[-30:]

        # 情绪时序记录：单独维护，用于趋势分析
        emotion_log = entry.setdefault("emotion_timeline", [])
        if record.get("transcript") or record.get("primary_syndrome"):
            emotion_log.append({
                "timestamp": record.get("timestamp", ""),
                "syndrome": record.get("primary_syndrome", ""),
                "summary": record.get("summary", ""),
            })
        entry["emotion_timeline"] = emotion_log[-60:]  # 保留60条

        data[user_id] = entry
        self._save(data)

    def get_emotion_timeline(self, user_id: str) -> list:
        """返回情绪/证型时序，用于趋势分析。"""
        data = self._load()
        return data.get(user_id, {}).get("emotion_timeline", [])

    def add_favorite(self, user_id: str, track_id: str) -> None:
        data = self._load()
        entry = data.setdefault(user_id, {"hidden_profile": {}, "history": []})
        favorites = entry.setdefault("favorites", [])
        if track_id not in favorites:
            favorites.append(track_id)
        data[user_id] = entry
        self._save(data)

    def remove_favorite(self, user_id: str, track_id: str) -> None:
        data = self._load()
        entry = data.get(user_id, {})
        favorites = entry.get("favorites", [])
        if track_id in favorites:
            favorites.remove(track_id)
            entry["favorites"] = favorites
            data[user_id] = entry
            self._save(data)

    def get_favorites(self, user_id: str) -> list:
        data = self._load()
        entry = data.get(user_id, {})
        return entry.get("favorites", [])

    def add_history_entry(self, user_id: str, entry_data: dict) -> None:
        data = self._load()
        entry = data.setdefault(user_id, {"hidden_profile": {}, "history": []})
        play_history = entry.setdefault("play_history", [])
        play_history.append(entry_data)
        entry["play_history"] = play_history[-100:]
        data[user_id] = entry
        self._save(data)

    def get_history_entries(self, user_id: str) -> list:
        data = self._load()
        entry = data.get(user_id, {})
        return entry.get("play_history", [])
