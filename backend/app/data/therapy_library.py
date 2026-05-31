from __future__ import annotations

from typing import Dict, List


TONE_PROFILES: Dict[str, dict] = {
    "角": {
        "mode": "角",
        "element": "wood",
        "title": "第二五七弦(角调)",
        "label": "肝木疏达",
        "description": "声调沉郁，叙事感强，适合疏肝理气、化解郁滞。",
        "anchor_tracks": ["流水", "醉渔唱晚", "庄周梦蝶"],
    },
    "徵": {
        "mode": "徵",
        "element": "fire",
        "title": "徵调",
        "label": "心火调平",
        "description": "偏明朗温煦，常用于养心宁神、平复躁动。",
        "anchor_tracks": ["良宵引", "平沙落雁", "泣颜回"],
    },
    "宫": {
        "mode": "宫",
        "element": "earth",
        "title": "宫调",
        "label": "脾土中和",
        "description": "音色端稳厚实，适合健脾和中、安定思绪。",
        "anchor_tracks": ["梅花三弄", "山居吟", "阳春"],
    },
    "商": {
        "mode": "商",
        "element": "metal",
        "title": "商调",
        "label": "肺金清润",
        "description": "音气清肃透亮，适合润肺理气、宣散郁结。",
        "anchor_tracks": ["阳关三叠", "白雪", "秋鸿"],
    },
    "羽": {
        "mode": "羽",
        "element": "water",
        "title": "羽调",
        "label": "肾水涵养",
        "description": "音色深静内敛，适合补肾固本、收摄心神。",
        "anchor_tracks": ["乌夜啼", "太古引", "普庵咒"],
    },
}


# `SYNDROME_PROFILES` is the single source of truth for the backend label and track mapping.
# To adjust labels, syndrome names, tone mode, or bound tracks, edit this list first.
SYNDROME_PROFILES: List[dict] = [
    {
        "id": "sleep-relief",
        "title": "失眠多梦",
        "organ": "心",
        "principle": "养心宁神",
        "mode": "徵",
        "tone_label": "徵音入心，安神定志",
        "summary": "适合失眠、多梦、焦虑、神经衰弱等睡眠受扰场景。",
        "symptoms": ["失眠", "多梦", "焦虑", "神经衰弱", "入睡难", "易醒", "睡浅", "夜醒"],
        "emotion_tags": ["焦虑", "紧绷", "心慌", "睡不着"],
        "tracks": ["良宵引", "平沙落雁", "虚籁", "春晓吟"],
    },
    {
        "id": "liver-soothing",
        "title": "肝郁气滞",
        "organ": "肝",
        "principle": "疏肝理气",
        "mode": "角",
        "tone_label": "第二五七弦(角调)",
        "summary": "适合抑郁、情绪低落、易怒、肝郁气滞等情志郁结场景。",
        "symptoms": ["抑郁", "情绪低落", "易怒", "肝郁气滞", "烦躁", "压抑", "胸闷", "叹气"],
        "emotion_tags": ["低落", "委屈", "烦躁", "想哭", "思绪放不下"],
        "tracks": ["流水", "醉渔唱晚", "庄周梦蝶"],
    },
    {
        "id": "spleen-balance",
        "title": "脾胃虚弱",
        "organ": "脾",
        "principle": "健脾和中",
        "mode": "宫",
        "tone_label": "宫音培土，缓释思虑",
        "summary": "适合脾胃虚弱、消化不良、腹胀、思虑过度等场景。",
        "symptoms": ["脾胃虚弱", "消化不良", "腹胀", "思虑过度", "没胃口", "乏力", "食欲差"],
        "emotion_tags": ["疲惫", "反复想", "心累"],
        "tracks": ["梅花三弄", "山居吟", "阳春", "泛沧浪"],
    },
    {
        "id": "lung-moistening",
        "title": "肺燥气滞",
        "organ": "肺",
        "principle": "润肺理气",
        "mode": "商",
        "tone_label": "商音清肃，宣散郁结",
        "summary": "适合咳嗽、气喘、咽炎、鼻炎、皮肤干燥、易感冒等场景。",
        "symptoms": ["咳嗽", "气喘", "咽炎", "鼻炎", "皮肤干燥", "易感冒", "咽干", "嗓子不舒服"],
        "emotion_tags": ["呼吸不畅", "干涩"],
        "tracks": ["阳关三叠", "白雪", "鹤鸣九皋", "秋鸿", "子夜吴歌", "石上流泉"],
    },
    {
        "id": "kidney-restoring",
        "title": "肾虚不足",
        "organ": "肾",
        "principle": "补肾固本",
        "mode": "羽",
        "tone_label": "羽音沉静，收摄归根",
        "summary": "适合肾虚、腰膝酸软、记忆力差、耳鸣、脱发等场景。",
        "symptoms": ["肾虚", "腰膝酸软", "记忆力差", "耳鸣", "脱发", "怕冷", "健忘"],
        "emotion_tags": ["虚弱", "精神不足"],
        "tracks": ["乌夜啼", "雉朝飞", "太古引"],
    },
    {
        "id": "heart-cooling",
        "title": "心火偏旺",
        "organ": "心",
        "principle": "清心平肝",
        "mode": "徵",
        "tone_label": "徵中佐角，清心平肝",
        "summary": "适合高血压、心慌心悸、胸闷、心火偏旺等场景。",
        "symptoms": ["高血压", "心慌", "心悸", "胸闷", "心火偏旺", "上火", "烦热"],
        "emotion_tags": ["急躁", "心烦", "坐立不安"],
        "tracks": ["泣颜回", "泽畔吟", "思贤操", "龙朔操"],
    },
    {
        "id": "stress-release",
        "title": "压力紧张",
        "organ": "肝脾同调",
        "principle": "整体疏解",
        "mode": "角",
        "tone_label": "角宫相济，舒压醒神",
        "summary": "适合压力大、紧张、脑疲劳、专注力差等高消耗状态。",
        "symptoms": ["压力大", "紧张", "脑疲劳", "专注力差", "疲劳", "绷着", "效率低"],
        "emotion_tags": ["压力大", "紧绷", "注意力差"],
        "tracks": ["洞庭秋思"],
    },
    {
        "id": "women-balance",
        "title": "经期不适",
        "organ": "肝血失调",
        "principle": "调肝养血",
        "mode": "角",
        "tone_label": "角音柔养，调肝和血",
        "summary": "适合经期不适、痛经、情绪波动等阶段性调养场景。",
        "symptoms": ["经期不适", "痛经", "情绪波动", "姨妈", "月经", "腹痛"],
        "emotion_tags": ["敏感", "波动"],
        "tracks": ["湘妃怨", "捣衣", "长相思", "竹枝词"],
    },
    {
        "id": "vitality-support",
        "title": "体质虚弱",
        "organ": "五脏同调",
        "principle": "五脏同调",
        "mode": "羽",
        "tone_label": "羽宫同养，培元复气",
        "summary": "适合免疫力低下、体质虚弱等整体恢复场景。",
        "symptoms": ["免疫力低下", "体质虚弱", "容易生病", "恢复慢", "久病"],
        "emotion_tags": ["虚", "没精神"],
        "tracks": ["普庵咒", "羽化登仙", "崆峒问道", "释谈章", "颐真", "玄默"],
    },
]


NOTE_PATTERNS = [
    [0, 2, 4, 7, 9, 7, 4, 2],
    [0, 3, 5, 7, 10, 7, 5, 3],
    [0, 2, 5, 9, 7, 5, 2, 0],
    [0, 4, 7, 11, 7, 4, 2, 0],
    [0, 2, 4, 6, 9, 6, 4, 2],
]


MODE_OFFSETS = {
    "角": 0,
    "徵": 2,
    "宫": -2,
    "商": 5,
    "羽": -5,
}


BODY_SYMPTOM_OPTIONS = [
    "入睡难/易醒",
    "心悸/胸闷",
    "烦躁/易怒",
    "压力大/紧绷",
    "情绪低落/郁闷",
    "思虑过度",
    "没胃口/腹胀",
    "气短/容易累",
    "易感冒/咽干",
    "腰膝酸软/耳鸣",
    "健忘/脱发",
]


EMOTION_OPTIONS = ["烦躁", "低落", "思绪放不下", "担忧", "惶恐不安", "还算平和"]


def _hash_title(title: str) -> int:
    return sum(ord(char) for char in title)


def _build_preview_pattern(title: str, mode: str) -> List[int]:
    source = NOTE_PATTERNS[_hash_title(title) % len(NOTE_PATTERNS)]
    return [value + MODE_OFFSETS[mode] + (0 if index % 2 == 0 else 12) for index, value in enumerate(source)]


_TRACK_DURATION_SEC: Dict[str, int] = {
    "平沙落雁": 720, "春晓吟": 360, "良宵引": 480, "虚籁": 390,
    "庄周梦蝶": 540, "流水": 510, "醉渔唱晚": 420,
    "山居吟": 540, "梅花三弄": 480, "泛沧浪": 360, "阳春": 420,
    "子夜吴歌": 390, "白雪": 480, "石上流泉": 360, "秋鸿": 540, "阳关三叠": 420, "鹤鸣九皋": 510,
    "乌夜啼": 360, "太古引": 420, "雉朝飞": 480,
    "思贤操": 390, "泣颜回": 450, "泽畔吟": 360, "龙朔操": 420,
    "洞庭秋思": 480,
    "捣衣": 390, "湘妃怨": 450, "竹枝词": 360, "长相思": 420,
    "崆峒问道": 540, "普庵咒": 480, "玄默": 390, "羽化登仙": 510, "释谈章": 420, "颐真": 360,
}


def _build_track_library() -> List[dict]:
    track_map: Dict[str, dict] = {}

    for syndrome in SYNDROME_PROFILES:
        for title in syndrome["tracks"]:
            if title in track_map:
                track_map[title]["source_syndrome_ids"].append(syndrome["id"])
                continue

            mode = syndrome["mode"]
            track_map[title] = {
                "id": f"track-{title}",
                "title": title,
                "mode": mode,
                "element": TONE_PROFILES[mode]["element"],
                "duration_sec": _TRACK_DURATION_SEC.get(title, 360),
                "effect": syndrome["principle"],
                "source_syndrome_ids": [syndrome["id"]],
                "preview_pattern": _build_preview_pattern(title, mode),
            }

    return list(track_map.values())


TRACK_LIBRARY = _build_track_library()
TRACK_BY_ID = {track["id"]: track for track in TRACK_LIBRARY}
TRACK_BY_TITLE = {track["title"]: track for track in TRACK_LIBRARY}
