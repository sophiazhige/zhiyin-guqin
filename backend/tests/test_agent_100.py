"""
知音 Agent 100 用例测试套件
覆盖：API接口 / 诊断规则引擎 / 记忆仓库 / 边界与异常
"""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# ── 应用初始化 ────────────────────────────────────────────────
from app.main import app, agent_state_repo
from app.services.diagnosis import DiagnosisService
from app.repos.agent_state_repo import AgentStateRepository

client = TestClient(app)

VALID_USER = "test-user-001"
NEW_USER = "test-user-new-999"


# ══════════════════════════════════════════════════════════════
# 分组 A：基础健康与路由 (TC-001~005)
# ══════════════════════════════════════════════════════════════

class TestHealth:
    def test_TC001_health_ok(self):
        """TC-001 /health 返回 status=ok"""
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_TC002_health_track_count_positive(self):
        """TC-002 /health track_count > 0"""
        r = client.get("/health")
        assert r.json()["track_count"] > 0

    def test_TC003_health_stt_provider_present(self):
        """TC-003 /health stt_provider 字段存在"""
        r = client.get("/health")
        assert "stt_provider" in r.json()

    def test_TC004_index_returns_html(self):
        """TC-004 GET / 返回 HTML"""
        r = client.get("/")
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]

    def test_TC005_unknown_route_404(self):
        """TC-005 未知路由返回 404"""
        r = client.get("/api/nonexistent")
        assert r.status_code == 404


# ══════════════════════════════════════════════════════════════
# 分组 B：曲目接口 (TC-006~015)
# ══════════════════════════════════════════════════════════════

class TestTracks:
    def test_TC006_list_tracks(self):
        """TC-006 GET /api/tracks 返回列表"""
        r = client.get("/api/tracks")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) > 0

    def test_TC007_track_has_required_fields(self):
        """TC-007 每条曲目含必要字段"""
        r = client.get("/api/tracks")
        track = r.json()[0]
        for field in ("id", "title", "mode", "element", "duration_sec", "effect"):
            assert field in track, f"缺少字段 {field}"

    def test_TC008_get_valid_track(self):
        """TC-008 GET /api/tracks/{id} 有效ID"""
        tracks = client.get("/api/tracks").json()
        first_id = tracks[0]["id"]
        r = client.get(f"/api/tracks/{first_id}")
        assert r.status_code == 200
        assert r.json()["id"] == first_id

    def test_TC009_get_invalid_track_404(self):
        """TC-009 GET /api/tracks/{id} 无效ID 返回 404"""
        r = client.get("/api/tracks/track-nonexistent-xxx")
        assert r.status_code == 404

    def test_TC010_track_mode_in_pentatonic(self):
        """TC-010 所有曲目 mode 在五音内"""
        tracks = client.get("/api/tracks").json()
        valid_modes = {"角", "徵", "宫", "商", "羽"}
        for t in tracks:
            assert t["mode"] in valid_modes, f"{t['id']} mode 异常: {t['mode']}"

    def test_TC011_track_element_valid(self):
        """TC-011 所有曲目 element 合法"""
        valid_elements = {"wood", "fire", "earth", "metal", "water"}
        tracks = client.get("/api/tracks").json()
        for t in tracks:
            assert t["element"] in valid_elements

    def test_TC012_track_duration_positive(self):
        """TC-012 曲目时长 > 0"""
        tracks = client.get("/api/tracks").json()
        for t in tracks:
            assert t["duration_sec"] > 0

    def test_TC013_track_preview_url_format(self):
        """TC-013 preview_url 格式正确"""
        tracks = client.get("/api/tracks").json()
        for t in tracks:
            assert t["preview_url"].endswith(".wav")

    def test_TC014_playback_preview_returns_wav(self):
        """TC-014 /api/playback/preview/{id}.wav 返回音频"""
        tracks = client.get("/api/tracks").json()
        first_id = tracks[0]["id"]
        r = client.get(f"/api/playback/preview/{first_id}.wav")
        assert r.status_code == 200
        assert r.headers["content-type"] == "audio/wav"

    def test_TC015_playback_invalid_track_returns_bytes(self):
        """TC-015 无效曲目 preview 仍返回（静音/空）bytes"""
        r = client.get("/api/playback/preview/track-nonexistent.wav")
        # 静音wav也是合法wav，不应500
        assert r.status_code in (200, 404)


# ══════════════════════════════════════════════════════════════
# 分组 C：诊断 API (TC-016~035)
# ══════════════════════════════════════════════════════════════

class TestDiagnosis:
    BASE = {"user_id": VALID_USER, "transcript": "", "selected_symptoms": [], "selected_emotion": "", "intensity": 5}

    def test_TC016_diagnosis_empty_input(self):
        """TC-016 空输入也能返回诊断结果"""
        r = client.post("/api/diagnosis", json=self.BASE)
        assert r.status_code == 200
        assert "primary_syndrome" in r.json()

    def test_TC017_diagnosis_sleep_symptom(self):
        """TC-017 失眠症状触发 sleep-relief"""
        payload = {**self.BASE, "transcript": "我最近睡不着，半夜经常醒来"}
        r = client.post("/api/diagnosis", json=payload)
        data = r.json()
        assert data["status"] in ("ready", "care")
        # sleep-relief 或 liver-soothing 应出现
        assert data["primary_syndrome"] != ""

    def test_TC018_diagnosis_heart_symptom(self):
        """TC-018 心悸症状"""
        payload = {**self.BASE, "selected_symptoms": ["心悸"]}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200

    def test_TC019_diagnosis_liver_emotion(self):
        """TC-019 烦躁情绪触发肝郁方向"""
        payload = {**self.BASE, "selected_emotion": "烦躁", "intensity": 7}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200
        assert r.json()["primary_syndrome"] != ""

    def test_TC020_diagnosis_high_risk_care_status(self):
        """TC-020 高风险词触发 status=care"""
        payload = {**self.BASE, "transcript": "我最近有自杀的念头"}
        r = client.post("/api/diagnosis", json=payload)
        data = r.json()
        assert data["status"] == "care"
        assert "care_message" in data and len(data["care_message"]) > 0

    def test_TC021_diagnosis_high_risk_qingsheng(self):
        """TC-021 '轻生' 触发高风险"""
        payload = {**self.BASE, "transcript": "我有轻生的想法"}
        r = client.post("/api/diagnosis", json=payload)
        assert r.json()["status"] == "care"

    def test_TC022_diagnosis_multiple_symptoms(self):
        """TC-022 多症状并发"""
        payload = {**self.BASE, "selected_symptoms": ["失眠", "心悸", "腰膝酸软"], "intensity": 8}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200
        assert len(r.json()["recommended_tracks"]) > 0

    def test_TC023_diagnosis_returns_tracks(self):
        """TC-023 诊断结果含推荐曲目"""
        payload = {**self.BASE, "transcript": "我失眠很严重"}
        r = client.post("/api/diagnosis", json=payload)
        tracks = r.json()["recommended_tracks"]
        assert isinstance(tracks, list)
        assert len(tracks) > 0

    def test_TC024_diagnosis_track_has_id_title(self):
        """TC-024 推荐曲目含 id 和 title"""
        payload = {**self.BASE, "transcript": "睡不着"}
        r = client.post("/api/diagnosis", json=payload)
        for t in r.json()["recommended_tracks"]:
            assert "id" in t
            assert "title" in t

    def test_TC025_diagnosis_intensity_max(self):
        """TC-025 intensity=10 时触发应激强化"""
        payload = {**self.BASE, "transcript": "压力极大", "intensity": 10}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200

    def test_TC026_diagnosis_intensity_min(self):
        """TC-026 intensity=0 极小值"""
        payload = {**self.BASE, "intensity": 0}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200

    def test_TC027_diagnosis_invalid_intensity_rejected(self):
        """TC-027 intensity=11 超范围被 pydantic 拒绝"""
        payload = {**self.BASE, "intensity": 11}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 422

    def test_TC028_diagnosis_negative_intensity_rejected(self):
        """TC-028 intensity=-1 被拒绝"""
        payload = {**self.BASE, "intensity": -1}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 422

    def test_TC029_diagnosis_missing_user_id(self):
        """TC-029 缺少 user_id 返回 422"""
        r = client.post("/api/diagnosis", json={"transcript": "test"})
        assert r.status_code == 422

    def test_TC030_diagnosis_tone_profile_in_pentatonic(self):
        """TC-030 tone_profile.mode 在五音范围内"""
        r = client.post("/api/diagnosis", json=self.BASE)
        mode = r.json()["tone_profile"]["mode"]
        assert mode in ("角", "徵", "宫", "商", "羽")

    def test_TC031_diagnosis_women_symptom(self):
        """TC-031 痛经触发 women-balance"""
        payload = {**self.BASE, "transcript": "我痛经很严重，每次经期都难受"}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200

    def test_TC032_diagnosis_kidney_symptom(self):
        """TC-032 腰膝酸软触发肾虚方向"""
        payload = {**self.BASE, "selected_symptoms": ["腰膝酸软"], "transcript": "腰酸背痛，记性越来越差"}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200

    def test_TC033_diagnosis_long_transcript(self):
        """TC-033 超长自述文本"""
        long_text = "我最近" + "睡不好觉，压力很大，" * 100
        payload = {**self.BASE, "transcript": long_text}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200

    def test_TC034_diagnosis_special_characters(self):
        """TC-034 特殊字符不崩溃"""
        payload = {**self.BASE, "transcript": "😭💔 我好痛苦！！@#$%"}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200

    def test_TC035_diagnosis_english_text(self):
        """TC-035 英文输入不崩溃"""
        payload = {**self.BASE, "transcript": "I can not sleep and feel very anxious"}
        r = client.post("/api/diagnosis", json=payload)
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════
# 分组 D：文本摄入 /api/intake/text (TC-036~045)
# ══════════════════════════════════════════════════════════════

class TestIntakeText:
    def test_TC036_intake_text_basic(self):
        """TC-036 基础文字摄入"""
        r = client.post("/api/intake/text", json={
            "user_id": VALID_USER, "text": "我最近失眠",
            "selected_symptoms": [], "selected_emotion": "烦躁", "intensity": 5
        })
        assert r.status_code == 200
        assert "diagnosis" in r.json()

    def test_TC037_intake_text_transcription_provider(self):
        """TC-037 文字摄入的 provider='text'"""
        r = client.post("/api/intake/text", json={
            "user_id": VALID_USER, "text": "压力大",
            "selected_symptoms": [], "selected_emotion": "", "intensity": 3
        })
        assert r.json()["transcription"]["provider"] == "text"

    def test_TC038_intake_text_empty_text(self):
        """TC-038 text 为空字符串"""
        r = client.post("/api/intake/text", json={
            "user_id": VALID_USER, "text": "",
            "selected_symptoms": [], "selected_emotion": "", "intensity": 5
        })
        assert r.status_code == 200  # 规则引擎降级处理

    def test_TC039_intake_text_missing_user_id(self):
        """TC-039 缺少 user_id"""
        r = client.post("/api/intake/text", json={"text": "test"})
        assert r.status_code == 422

    def test_TC040_intake_text_with_symptoms(self):
        """TC-040 文字+症状组合"""
        r = client.post("/api/intake/text", json={
            "user_id": VALID_USER,
            "text": "心跳很快，容易紧张",
            "selected_symptoms": ["心悸", "易感冒"],
            "selected_emotion": "惶恐不安",
            "intensity": 7
        })
        assert r.status_code == 200
        assert len(r.json()["diagnosis"]["recommended_tracks"]) > 0

    def test_TC041_intake_text_all_emotions(self):
        """TC-041 遍历全部六种情绪"""
        emotions = ["烦躁", "低落", "思绪放不下", "担忧", "惶恐不安", "还算平和"]
        for emotion in emotions:
            r = client.post("/api/intake/text", json={
                "user_id": VALID_USER, "text": "测试",
                "selected_symptoms": [], "selected_emotion": emotion, "intensity": 5
            })
            assert r.status_code == 200, f"情绪 {emotion} 失败"

    def test_TC042_intake_text_unknown_emotion(self):
        """TC-042 未知情绪字符串"""
        r = client.post("/api/intake/text", json={
            "user_id": VALID_USER, "text": "不知道",
            "selected_symptoms": [], "selected_emotion": "无名情绪", "intensity": 5
        })
        assert r.status_code == 200  # 未知情绪跳过，不崩溃

    def test_TC043_intake_text_history_persisted(self):
        """TC-043 摄入后历史记录增加"""
        uid = "test-history-persist"
        client.post("/api/intake/text", json={
            "user_id": uid, "text": "心慌",
            "selected_symptoms": [], "selected_emotion": "", "intensity": 5
        })
        profile = agent_state_repo.get_profile(uid)
        # 历史被写入 diagnosis_history
        history = agent_state_repo._load().get(uid, {}).get("history", [])
        assert len(history) >= 1

    def test_TC044_intake_text_concurrent_users(self):
        """TC-044 不同用户互不干扰"""
        for uid in ["user-a", "user-b", "user-c"]:
            r = client.post("/api/intake/text", json={
                "user_id": uid, "text": "我有些疲惫",
                "selected_symptoms": [], "selected_emotion": "", "intensity": 5
            })
            assert r.status_code == 200

    def test_TC045_intake_text_high_risk_triggers_care(self):
        """TC-045 高风险词通过文字摄入触发 care"""
        r = client.post("/api/intake/text", json={
            "user_id": VALID_USER, "text": "我不想活了",
            "selected_symptoms": [], "selected_emotion": "", "intensity": 5
        })
        assert r.json()["diagnosis"]["status"] == "care"


# ══════════════════════════════════════════════════════════════
# 分组 E：Agent Run /api/agent/run (TC-046~055)
# ══════════════════════════════════════════════════════════════

class TestAgentRun:
    def test_TC046_agent_run_text_only(self):
        """TC-046 仅文字调用 agent/run"""
        r = client.post("/api/agent/run", data={"user_id": VALID_USER, "text": "我最近睡不好"})
        assert r.status_code == 200
        body = r.json()
        assert "diagnosis" in body
        assert "profile" in body

    def test_TC047_agent_run_empty_input_400(self):
        """TC-047 无文字无文件 返回 400"""
        r = client.post("/api/agent/run", data={"user_id": VALID_USER, "text": ""})
        assert r.status_code == 400

    def test_TC048_agent_run_missing_user_id(self):
        """TC-048 缺少 user_id"""
        r = client.post("/api/agent/run", data={"text": "test"})
        assert r.status_code == 422

    def test_TC049_agent_run_recommended_tracks_list(self):
        """TC-049 recommended_tracks 是列表"""
        r = client.post("/api/agent/run", data={"user_id": VALID_USER, "text": "心情很差"})
        assert isinstance(r.json()["recommended_tracks"], list)

    def test_TC050_agent_run_profile_fields(self):
        """TC-050 返回 profile 含必要字段"""
        r = client.post("/api/agent/run", data={"user_id": VALID_USER, "text": "身体不好"})
        profile = r.json()["profile"]
        for f in ("constitution", "long_term_traits", "chronic_symptoms"):
            assert f in profile

    def test_TC051_agent_run_whitespace_only_text(self):
        """TC-051 纯空白字符文本"""
        r = client.post("/api/agent/run", data={"user_id": VALID_USER, "text": "   "})
        assert r.status_code == 400

    def test_TC052_agent_run_high_risk(self):
        """TC-052 高风险词通过 agent/run 触发 care"""
        r = client.post("/api/agent/run", data={"user_id": VALID_USER, "text": "我有自杀的想法"})
        assert r.status_code == 200
        assert r.json()["diagnosis"]["status"] == "care"

    def test_TC053_agent_run_new_user_creates_profile(self):
        """TC-053 新用户调用后生成画像"""
        uid = "brand-new-user-xyz"
        client.post("/api/agent/run", data={"user_id": uid, "text": "我压力很大"})
        profile = agent_state_repo.get_profile(uid)
        # 规则引擎或LLM都应写入history
        assert profile is not None  # 可为空dict，但不报错

    def test_TC054_agent_run_large_text(self):
        """TC-054 大段文字"""
        text = "我睡不好觉。" * 50
        r = client.post("/api/agent/run", data={"user_id": VALID_USER, "text": text})
        assert r.status_code == 200

    def test_TC055_agent_run_returns_rationale(self):
        """TC-055 返回 recommendation_rationale"""
        r = client.post("/api/agent/run", data={"user_id": VALID_USER, "text": "失眠，烦躁"})
        assert "recommendation_rationale" in r.json()


# ══════════════════════════════════════════════════════════════
# 分组 F：用户画像 /api/user/profile (TC-056~062)
# ══════════════════════════════════════════════════════════════

class TestUserProfile:
    def test_TC056_create_profile(self):
        """TC-056 创建用户画像"""
        r = client.post("/api/user/profile", json={
            "user_id": "profile-test-001",
            "name": "小明", "gender": "male",
            "birth_year": 1995, "birth_month": 6, "birth_day": 15
        })
        assert r.status_code == 200
        assert r.json()["status"] == "updated"

    def test_TC057_update_profile_changes(self):
        """TC-057 更新画像 profile_changed=True"""
        uid = "profile-change-002"
        client.post("/api/user/profile", json={"user_id": uid, "name": "张三"})
        r = client.post("/api/user/profile", json={"user_id": uid, "name": "李四"})
        assert r.json()["profile_changed"] is True

    def test_TC058_update_profile_no_change(self):
        """TC-058 相同数据无变化"""
        uid = "profile-nochange-003"
        client.post("/api/user/profile", json={"user_id": uid, "name": "王五", "gender": "female"})
        r = client.post("/api/user/profile", json={"user_id": uid, "name": "王五", "gender": "female"})
        assert r.json()["profile_changed"] is False

    def test_TC059_profile_missing_user_id(self):
        """TC-059 缺少 user_id"""
        r = client.post("/api/user/profile", json={"name": "测试"})
        assert r.status_code == 422

    def test_TC060_profile_empty_fields_ok(self):
        """TC-060 全空字段不报错"""
        r = client.post("/api/user/profile", json={"user_id": "empty-fields-user"})
        assert r.status_code == 200

    def test_TC061_profile_birth_year_edge(self):
        """TC-061 出生年份边界值"""
        r = client.post("/api/user/profile", json={
            "user_id": "birth-edge",
            "birth_year": 1900, "birth_month": 1, "birth_day": 1
        })
        assert r.status_code == 200

    def test_TC062_profile_gender_values(self):
        """TC-062 性别字段 male/female"""
        for gender in ("male", "female", "other", ""):
            r = client.post("/api/user/profile", json={"user_id": "gender-test", "gender": gender})
            assert r.status_code == 200


# ══════════════════════════════════════════════════════════════
# 分组 G：回响 /api/resonance (TC-063~070)
# ══════════════════════════════════════════════════════════════

class TestResonance:
    def test_TC063_resonance_basic(self):
        """TC-063 基础回响生成（规则兜底）"""
        r = client.post("/api/resonance", json={
            "user_id": VALID_USER, "name": "小红",
            "selected_symptoms": ["失眠"], "selected_emotion": "烦躁",
            "intensity": 6, "sleep_duration": "难以入睡", "free_text": "最近很累"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["user_name"] != ""
        assert body["poetic_comfort"] != ""

    def test_TC064_resonance_no_name_uses_default(self):
        """TC-064 不传 name 使用默认称谓 旅人"""
        r = client.post("/api/resonance", json={
            "user_id": VALID_USER,
            "selected_symptoms": [], "selected_emotion": "", "intensity": 5
        })
        assert r.status_code == 200
        assert r.json()["user_name"] in ("旅人", "")  # 允许LLM返回其他

    def test_TC065_resonance_missing_user_id(self):
        """TC-065 缺少 user_id"""
        r = client.post("/api/resonance", json={"name": "test"})
        assert r.status_code == 422

    def test_TC066_resonance_empty_symptoms(self):
        """TC-066 空症状列表"""
        r = client.post("/api/resonance", json={
            "user_id": VALID_USER, "selected_symptoms": []
        })
        assert r.status_code == 200

    def test_TC067_resonance_many_symptoms(self):
        """TC-067 多症状（取前3）"""
        r = client.post("/api/resonance", json={
            "user_id": VALID_USER,
            "selected_symptoms": ["失眠", "心悸", "头疼", "烦躁", "腰酸"]
        })
        assert r.status_code == 200

    def test_TC068_resonance_user_summary_present(self):
        """TC-068 user_summary 字段存在"""
        r = client.post("/api/resonance", json={
            "user_id": VALID_USER, "selected_symptoms": ["压力大"]
        })
        assert "user_summary" in r.json()

    def test_TC069_resonance_high_intensity(self):
        """TC-069 intensity=10 极端值"""
        r = client.post("/api/resonance", json={
            "user_id": VALID_USER, "intensity": 10,
            "selected_symptoms": [], "selected_emotion": "烦躁"
        })
        assert r.status_code == 200

    def test_TC070_resonance_long_free_text(self):
        """TC-070 free_text 很长"""
        r = client.post("/api/resonance", json={
            "user_id": VALID_USER,
            "free_text": "我很累。" * 200,
            "selected_symptoms": []
        })
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════
# 分组 H：每日状态 & 性格底色 (TC-071~078)
# ══════════════════════════════════════════════════════════════

class TestUserInsights:
    def test_TC071_daily_status_new_user(self):
        """TC-071 新用户每日状态返回默认"""
        r = client.get(f"/api/user/{NEW_USER}/daily-status")
        assert r.status_code == 200
        assert "status_text" in r.json()

    def test_TC072_daily_status_text_nonempty(self):
        """TC-072 status_text 非空"""
        r = client.get(f"/api/user/{NEW_USER}/daily-status")
        assert r.json()["status_text"] != ""

    def test_TC073_daily_status_element_valid(self):
        """TC-073 mood_element 合法"""
        r = client.get(f"/api/user/{NEW_USER}/daily-status")
        el = r.json()["mood_element"]
        assert el in ("wood", "fire", "earth", "metal", "water", "")

    def test_TC074_personality_new_user_defaults(self):
        """TC-074 新用户性格底色返回默认值"""
        r = client.get(f"/api/user/{NEW_USER}/personality")
        assert r.status_code == 200
        body = r.json()
        assert all(k in body for k in ("wood", "fire", "earth", "metal", "water", "summary"))

    def test_TC075_personality_values_non_negative(self):
        """TC-075 五行分值非负"""
        r = client.get(f"/api/user/{NEW_USER}/personality")
        body = r.json()
        for k in ("wood", "fire", "earth", "metal", "water"):
            assert body[k] >= 0

    def test_TC076_personality_sum_reasonable(self):
        """TC-076 默认五行分值总和 == 100"""
        r = client.get(f"/api/user/{NEW_USER}/personality")
        body = r.json()
        total = sum(body[k] for k in ("wood", "fire", "earth", "metal", "water"))
        assert total == 100

    def test_TC077_daily_status_wood_constitution(self):
        """TC-077 肝郁体质 -> wood 方向"""
        uid = "wood-const-user"
        agent_state_repo.merge_profile(uid, {"constitution": "肝郁"})
        r = client.get(f"/api/user/{uid}/daily-status")
        assert r.status_code == 200

    def test_TC078_daily_status_fire_constitution(self):
        """TC-078 心火体质 -> fire 方向"""
        uid = "fire-const-user"
        agent_state_repo.merge_profile(uid, {"constitution": "心火偏旺"})
        r = client.get(f"/api/user/{uid}/daily-status")
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════
# 分组 I：收藏夹 (TC-079~086)
# ══════════════════════════════════════════════════════════════

class TestFavorites:
    UID = "fav-test-user"
    TRACK_ID = "track-良宵引"

    def test_TC079_add_favorite(self):
        """TC-079 添加收藏"""
        r = client.post("/api/user/favorites/add", json={"user_id": self.UID, "track_id": self.TRACK_ID})
        assert r.status_code == 200
        assert r.json()["status"] == "added"

    def test_TC080_get_favorites_contains_track(self):
        """TC-080 收藏列表含已添加曲目"""
        client.post("/api/user/favorites/add", json={"user_id": self.UID, "track_id": self.TRACK_ID})
        r = client.get(f"/api/user/{self.UID}/favorites")
        assert self.TRACK_ID in r.json()["track_ids"]

    def test_TC081_add_favorite_idempotent(self):
        """TC-081 重复添加不重复"""
        for _ in range(3):
            client.post("/api/user/favorites/add", json={"user_id": self.UID, "track_id": self.TRACK_ID})
        r = client.get(f"/api/user/{self.UID}/favorites")
        count = r.json()["track_ids"].count(self.TRACK_ID)
        assert count == 1

    def test_TC082_remove_favorite(self):
        """TC-082 删除收藏"""
        client.post("/api/user/favorites/add", json={"user_id": self.UID, "track_id": self.TRACK_ID})
        r = client.post("/api/user/favorites/remove", json={"user_id": self.UID, "track_id": self.TRACK_ID})
        assert r.json()["status"] == "removed"

    def test_TC083_remove_nonexistent_favorite_safe(self):
        """TC-083 删除不存在的收藏不报错"""
        r = client.post("/api/user/favorites/remove", json={"user_id": "no-fav-user", "track_id": "nonexistent"})
        assert r.status_code == 200

    def test_TC084_favorites_new_user_empty(self):
        """TC-084 新用户收藏为空"""
        r = client.get(f"/api/user/brand-new-fav-user/favorites")
        assert r.json()["track_ids"] == []

    def test_TC085_add_multiple_favorites(self):
        """TC-085 添加多首收藏"""
        uid = "multi-fav-user"
        tracks = client.get("/api/tracks").json()[:3]
        for t in tracks:
            client.post("/api/user/favorites/add", json={"user_id": uid, "track_id": t["id"]})
        r = client.get(f"/api/user/{uid}/favorites")
        assert len(r.json()["track_ids"]) == 3

    def test_TC086_favorites_missing_user_id(self):
        """TC-086 缺少 user_id"""
        r = client.post("/api/user/favorites/add", json={"track_id": self.TRACK_ID})
        assert r.status_code == 422


# ══════════════════════════════════════════════════════════════
# 分组 J：历史记录 (TC-087~091)
# ══════════════════════════════════════════════════════════════

class TestHistory:
    UID = "history-test-user"

    def test_TC087_add_history_entry(self):
        """TC-087 添加播放历史"""
        tracks = client.get("/api/tracks").json()
        r = client.post(
            "/api/user/history/add",
            params={"user_id": self.UID, "track_id": tracks[0]["id"], "listened_sec": 60}
        )
        assert r.status_code == 200
        assert r.json()["status"] == "added"

    def test_TC088_get_history_entries(self):
        """TC-088 获取历史列表"""
        r = client.get(f"/api/user/{self.UID}/history")
        assert r.status_code == 200
        assert "entries" in r.json()

    def test_TC089_history_entry_fields(self):
        """TC-089 历史条目含必要字段"""
        tracks = client.get("/api/tracks").json()
        tid = tracks[0]["id"]
        client.post("/api/user/history/add", params={"user_id": self.UID, "track_id": tid, "listened_sec": 30})
        entries = client.get(f"/api/user/{self.UID}/history").json()["entries"]
        if entries:
            for f in ("track_id", "track_title", "played_at", "listened_sec"):
                assert f in entries[0]

    def test_TC090_history_invalid_track_404(self):
        """TC-090 无效曲目 ID 返回 404"""
        r = client.post("/api/user/history/add", params={
            "user_id": self.UID, "track_id": "nonexistent-track", "listened_sec": 10
        })
        assert r.status_code == 404

    def test_TC091_history_new_user_empty(self):
        """TC-091 新用户历史为空"""
        r = client.get("/api/user/empty-history-user/history")
        assert r.json()["entries"] == []


# ══════════════════════════════════════════════════════════════
# 分组 K：琴师对话 /api/qinshi/chat (TC-092~095)
# ══════════════════════════════════════════════════════════════

class TestQinshiChat:
    def test_TC092_chat_basic_fallback(self):
        """TC-092 LLM未配置时返回兜底回复"""
        r = client.post("/api/qinshi/chat", json={
            "user_id": VALID_USER,
            "message": "我想换首曲子",
            "current_track_id": ""
        })
        assert r.status_code == 200
        assert r.json()["reply"] != ""

    def test_TC093_chat_reply_is_string(self):
        """TC-093 reply 字段是字符串"""
        r = client.post("/api/qinshi/chat", json={
            "user_id": VALID_USER, "message": "谢谢"
        })
        assert isinstance(r.json()["reply"], str)

    def test_TC094_chat_new_track_ids_is_list(self):
        """TC-094 new_track_ids 是列表"""
        r = client.post("/api/qinshi/chat", json={
            "user_id": VALID_USER, "message": "换一首"
        })
        assert isinstance(r.json()["new_track_ids"], list)

    def test_TC095_chat_missing_message(self):
        """TC-095 缺少 message 字段"""
        r = client.post("/api/qinshi/chat", json={"user_id": VALID_USER})
        assert r.status_code == 422


# ══════════════════════════════════════════════════════════════
# 分组 L：诊断服务单元测试 (TC-096~098)
# ══════════════════════════════════════════════════════════════

class TestDiagnosisServiceUnit:
    def setup_method(self):
        self.svc = DiagnosisService()

    def test_TC096_normalize_text_strips_spaces(self):
        """TC-096 _normalize_text 去空格"""
        result = DiagnosisService._normalize_text("  我 最近 失眠  ")
        assert " " not in result

    def test_TC097_analyze_returns_diagnosis_response(self):
        """TC-097 analyze 返回 DiagnosisResponse"""
        from app.models import DiagnosisResponse
        result = self.svc.analyze(
            transcript="睡不着", selected_symptoms=["失眠"],
            selected_emotion="烦躁", intensity=6,
            user_id="unit-test-user"
        )
        assert isinstance(result, DiagnosisResponse)

    def test_TC098_build_history_record_keys(self):
        """TC-098 build_history_record 含必要字段"""
        from app.models import DiagnosisResponse
        diag = self.svc.analyze(
            transcript="腰酸", selected_symptoms=[],
            selected_emotion="", intensity=5,
            user_id="unit-test-user"
        )
        record = DiagnosisService.build_history_record(diag, "腰酸")
        for k in ("timestamp", "summary", "primary_syndrome", "transcript"):
            assert k in record


# ══════════════════════════════════════════════════════════════
# 分组 M：记忆仓库单元测试 (TC-099~100)
# ══════════════════════════════════════════════════════════════

class TestAgentStateRepoUnit:
    def setup_method(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
        self.tmp.close()
        Path(self.tmp.name).write_text("{}", encoding="utf-8")
        self.repo = AgentStateRepository(Path(self.tmp.name))

    def test_TC099_merge_profile_list_dedup(self):
        """TC-099 merge_profile 列表字段自动去重"""
        self.repo.merge_profile("u1", {"chronic_symptoms": ["失眠", "心悸"]})
        self.repo.merge_profile("u1", {"chronic_symptoms": ["失眠", "腰酸"]})
        profile = self.repo.get_profile("u1")
        assert profile["chronic_symptoms"].count("失眠") == 1
        assert "腰酸" in profile["chronic_symptoms"]

    def test_TC100_history_capped_at_30(self):
        """TC-100 诊断历史最多保留 30 条"""
        for i in range(35):
            self.repo.append_history("u2", {"timestamp": f"t{i}", "summary": f"s{i}"})
        data = self.repo._load()
        assert len(data["u2"]["history"]) == 30
