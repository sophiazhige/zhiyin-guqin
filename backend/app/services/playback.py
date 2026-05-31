from __future__ import annotations

import io
import math
import wave
from typing import List

from fastapi import HTTPException

from app.data.therapy_library import TRACK_BY_ID


class PlaybackService:
    def __init__(self, sample_rate: int = 22050) -> None:
        self.sample_rate = sample_rate

    @staticmethod
    def _frequency(offset: int) -> float:
        return 196 * (2 ** (offset / 12))

    def _pluck_note(self, frequency: float, duration: float = 0.42) -> List[int]:
        frame_count = int(self.sample_rate * duration)
        buffer: List[int] = []
        for index in range(frame_count):
            progress = index / max(frame_count, 1)
            envelope = math.exp(-4.8 * progress)
            sample = (
                math.sin(2 * math.pi * frequency * (index / self.sample_rate))
                + 0.35 * math.sin(2 * math.pi * frequency * 2 * (index / self.sample_rate))
            ) * envelope
            buffer.append(int(max(-1.0, min(1.0, sample)) * 14000))
        return buffer

    def synthesize_track_wav(self, track_id: str) -> bytes:
        track = TRACK_BY_ID.get(track_id)
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")

        notes: List[int] = []
        for offset in track["preview_pattern"]:
            notes.extend(self._pluck_note(self._frequency(offset)))

        byte_stream = io.BytesIO()
        with wave.open(byte_stream, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.sample_rate)
            frames = b"".join(int(sample).to_bytes(2, byteorder="little", signed=True) for sample in notes)
            wav_file.writeframes(frames)
        return byte_stream.getvalue()
