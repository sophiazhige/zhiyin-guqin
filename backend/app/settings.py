from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    tokendance_api_key: str = os.getenv("TOKENDANCE_API_KEY", "")
    tokendance_base_url: str = os.getenv("TOKENDANCE_BASE_URL", "https://tokendance.space").rstrip("/")
    tokendance_model: str = os.getenv("TOKENDANCE_MODEL", "glm-5.1")
    tokendance_verify_ssl: bool = os.getenv("TOKENDANCE_VERIFY_SSL", "true").lower() not in {"0", "false", "no"}
    stepfun_api_key: str = os.getenv("STEPFUN_API_KEY", "")
    stepfun_base_url: str = os.getenv("STEPFUN_BASE_URL", "https://api.stepfun.com").rstrip("/")
    stepfun_asr_model: str = os.getenv("STEPFUN_ASR_MODEL", "stepaudio-2.5-asr")
    stepfun_verify_ssl: bool = os.getenv("STEPFUN_VERIFY_SSL", "true").lower() not in {"0", "false", "no"}

    @property
    def tokendance_configured(self) -> bool:
        return bool(self.tokendance_api_key.strip())

    @property
    def stepfun_configured(self) -> bool:
        return bool(self.stepfun_api_key.strip())


settings = Settings()
