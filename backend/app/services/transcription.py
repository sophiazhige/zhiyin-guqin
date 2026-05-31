from __future__ import annotations

import base64
import json
import ssl
import shutil
from pathlib import Path
from urllib import error, request
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.models import TranscriptionResponse
from app.settings import settings

try:
    from faster_whisper import WhisperModel  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    WhisperModel = None


class TranscriptionService:
    def __init__(self, upload_dir: Path) -> None:
        self.upload_dir = upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self._model = None

    @property
    def provider_name(self) -> str:
        if settings.stepfun_configured:
            return "stepfun-asr"
        return "faster-whisper" if WhisperModel is not None else "hint-or-manual"

    def _ensure_model(self):
        if WhisperModel is None:
            return None
        if self._model is None:
            self._model = WhisperModel("base", device="cpu", compute_type="int8")
        return self._model

    async def save_upload(self, file: UploadFile) -> Path:
        suffix = Path(file.filename or "audio.bin").suffix or ".bin"
        target_path = self.upload_dir / f"{uuid4().hex}{suffix}"
        with target_path.open("wb") as output_file:
            shutil.copyfileobj(file.file, output_file)
        await file.close()
        return target_path

    async def transcribe_upload(self, file: UploadFile) -> TranscriptionResponse:
        audio_path = await self.save_upload(file)
        stepfun_error = None

        if settings.stepfun_configured:
            try:
                transcript = self._transcribe_with_stepfun(audio_path)
                if transcript:
                    return TranscriptionResponse(
                        provider="stepfun-asr",
                        transcript=transcript,
                        language="zh",
                        fallback_used=False,
                    )
            except Exception as exc:
                stepfun_error = exc

        model = self._ensure_model()

        if model is None:
            detail = "当前没有可用的语音识别服务。请检查 StepFun 配置，或安装 backend 的 stt 可选依赖。"
            if stepfun_error is not None:
                detail = f"StepFun 语音转写失败：{stepfun_error}；{detail}"
            raise HTTPException(status_code=503, detail=detail)

        segments, info = model.transcribe(str(audio_path), language="zh")
        transcript = "".join(segment.text for segment in segments).strip()

        if not transcript:
            detail = "语音识别未返回有效文本。"
            if stepfun_error is not None:
                detail = f"StepFun 语音转写失败并已回退本地识别，但仍未返回文本：{stepfun_error}"
            raise HTTPException(status_code=422, detail=detail)

        provider = "faster-whisper" if stepfun_error is None else "stepfun+faster-whisper"
        return TranscriptionResponse(
            provider=provider,
            transcript=transcript,
            language=info.language or "zh",
            fallback_used=stepfun_error is not None,
        )

    def _transcribe_with_stepfun(self, audio_path: Path) -> str:
        audio_bytes = audio_path.read_bytes()
        if not audio_bytes:
            raise RuntimeError("上传音频为空")

        audio_type = self._detect_audio_type(audio_path)
        payload = {
            "audio": {
                "data": base64.b64encode(audio_bytes).decode("utf-8"),
                "input": {
                    "transcription": {
                        "language": "zh",
                        "model": settings.stepfun_asr_model,
                        "enable_itn": True,
                        "enable_timestamp": False,
                    },
                    "format": {
                        "type": audio_type,
                    },
                },
            }
        }

        req = request.Request(
            f"{settings.stepfun_base_url}/v1/audio/asr/sse",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                "Authorization": f"Bearer {settings.stepfun_api_key}",
            },
            method="POST",
        )

        ssl_context = None if settings.stepfun_verify_ssl else ssl._create_unverified_context()

        try:
            with request.urlopen(req, timeout=120, context=ssl_context) as response:
                return self._read_stepfun_sse(response)
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"HTTP {exc.code}: {body}") from exc

    @staticmethod
    def _detect_audio_type(audio_path: Path) -> str:
        suffix = audio_path.suffix.lower()
        if suffix == ".mp3":
            return "mp3"
        if suffix == ".ogg":
            return "ogg"
        if suffix == ".pcm":
            return "pcm"
        return "wav"

    @staticmethod
    def _read_stepfun_sse(response) -> str:
        chunks = []
        data_lines = []

        for raw_line in response:
            line = raw_line.decode("utf-8", errors="ignore").strip()
            if not line:
                if data_lines:
                    event_data = "\n".join(data_lines)
                    data_lines = []
                    payload = json.loads(event_data)
                    event_type = payload.get("type")
                    if event_type == "transcript.text.delta":
                        delta = payload.get("delta", "")
                        if delta:
                            chunks.append(delta)
                    elif event_type == "transcript.text.done":
                        final_text = payload.get("text", "").strip()
                        return final_text or "".join(chunks).strip()
                    elif event_type == "error":
                        raise RuntimeError(payload.get("message", "StepFun ASR failed"))
                continue

            if line.startswith("data:"):
                data_lines.append(line[5:].strip())

        return "".join(chunks).strip()
