import { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";

// --- Types ---

export interface UserProfile {
  userId: string;
  name: string;
  gender: "male" | "female" | "";
  birthDate: { year: number; month: number; day: number } | null;
  isFirstTime: boolean;
}

export interface IntakeData {
  selectedSymptoms: string[];
  selectedEmotion: string;
  intensity: number;
  sleepDuration: string;
  voiceTranscript: string;
}

export interface DiagnosisResult {
  status: "ready" | "care";
  element: "wood" | "fire" | "earth" | "metal" | "water";
  tone: "角" | "徵" | "宫" | "商" | "羽";
  primarySyndrome: string;
  secondarySyndrome: string;
  principle: string;
  summary: string;
  rationale: string[];
  careMessage: string;
}

export interface Track {
  id: string;
  title: string;
  mode: string;
  element: string;
  effect: string;
  audioUrl: string;
  durationSec: number;
}

export interface ResonanceText {
  userName: string;
  userSummary: string;
  poeticComfort: string;
}

export interface MoodEntry {
  date: string;
  element: "wood" | "fire" | "earth" | "metal" | "water";
}

export interface PersonalityProfile {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
  summary: string;
}

// --- Emotion options (mutually exclusive, mapped to Five Elements) ---

export const EMOTION_OPTIONS = [
  { label: "烦躁易怒", element: "wood", organ: "肝" },
  { label: "心慌不安", element: "fire", organ: "心" },
  { label: "思虑不止", element: "earth", organ: "脾" },
  { label: "悲伤低落", element: "metal", organ: "肺" },
  { label: "恐惧空虚", element: "water", organ: "肾" },
  { label: "平和安宁", element: "neutral", organ: "" },
] as const;

// --- Body symptom options ---

export const BODY_SYMPTOM_OPTIONS = [
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
  "痛经/经期不调",
  "经前烦躁/乳胀",
];

// --- Track library (matches dataset.zip structure) ---

export const TRACK_LIBRARY: Track[] = [
  { id: "track-平沙落雁", title: "平沙落雁", mode: "徵", element: "fire", effect: "养心宁神", audioUrl: "/audio/平沙落雁.mp3", durationSec: 720 },
  { id: "track-春晓吟", title: "春晓吟", mode: "徵", element: "fire", effect: "养心宁神", audioUrl: "/audio/春晓吟.mp3", durationSec: 360 },
  { id: "track-良宵引", title: "良宵引", mode: "徵", element: "fire", effect: "养心宁神", audioUrl: "/audio/良宵引.mp3", durationSec: 480 },
  { id: "track-虚籁", title: "虚籁", mode: "徵", element: "fire", effect: "养心宁神", audioUrl: "/audio/虚籁.mp3", durationSec: 390 },
  { id: "track-庄周梦蝶", title: "庄周梦蝶", mode: "角", element: "wood", effect: "疏肝理气", audioUrl: "/audio/庄周梦蝶.mp3", durationSec: 540 },
  { id: "track-流水", title: "流水", mode: "角", element: "wood", effect: "疏肝理气", audioUrl: "/audio/流水.mp3", durationSec: 510 },
  { id: "track-醉渔唱晚", title: "醉渔唱晚", mode: "角", element: "wood", effect: "疏肝理气", audioUrl: "/audio/醉渔唱晚.mp3", durationSec: 420 },
  { id: "track-山居吟", title: "山居吟", mode: "宫", element: "earth", effect: "健脾和中", audioUrl: "/audio/山居吟.mp3", durationSec: 540 },
  { id: "track-梅花三弄", title: "梅花三弄", mode: "宫", element: "earth", effect: "健脾和中", audioUrl: "/audio/梅花三弄.mp3", durationSec: 480 },
  { id: "track-泛沧浪", title: "泛沧浪", mode: "宫", element: "earth", effect: "健脾和中", audioUrl: "/audio/泛沧浪.mp3", durationSec: 360 },
  { id: "track-阳春", title: "阳春", mode: "宫", element: "earth", effect: "健脾和中", audioUrl: "/audio/阳春.mp3", durationSec: 420 },
  { id: "track-子夜吴歌", title: "子夜吴歌", mode: "商", element: "metal", effect: "润肺理气", audioUrl: "/audio/子夜吴歌.mp3", durationSec: 390 },
  { id: "track-白雪", title: "白雪", mode: "商", element: "metal", effect: "润肺理气", audioUrl: "/audio/白雪.mp3", durationSec: 480 },
  { id: "track-石上流泉", title: "石上流泉", mode: "商", element: "metal", effect: "润肺理气", audioUrl: "/audio/石上流泉.mp3", durationSec: 360 },
  { id: "track-秋鸿", title: "秋鸿", mode: "商", element: "metal", effect: "润肺理气", audioUrl: "/audio/秋鸿.mp3", durationSec: 540 },
  { id: "track-阳关三叠", title: "阳关三叠", mode: "商", element: "metal", effect: "润肺理气", audioUrl: "/audio/阳关三叠.mp3", durationSec: 420 },
  { id: "track-鹤鸣九皋", title: "鹤鸣九皋", mode: "商", element: "metal", effect: "润肺理气", audioUrl: "/audio/鹤鸣九皋.mp3", durationSec: 510 },
  { id: "track-乌夜啼", title: "乌夜啼", mode: "羽", element: "water", effect: "补肾固本", audioUrl: "/audio/乌夜啼.mp3", durationSec: 360 },
  { id: "track-太古引", title: "太古引", mode: "羽", element: "water", effect: "补肾固本", audioUrl: "/audio/太古引.mp3", durationSec: 420 },
  { id: "track-雉朝飞", title: "雉朝飞", mode: "羽", element: "water", effect: "补肾固本", audioUrl: "/audio/雉朝飞.mp3", durationSec: 480 },
  { id: "track-思贤操", title: "思贤操", mode: "徵", element: "fire", effect: "清心平肝", audioUrl: "/audio/思贤操.mp3", durationSec: 390 },
  { id: "track-泣颜回", title: "泣颜回", mode: "徵", element: "fire", effect: "清心平肝", audioUrl: "/audio/泣颜回.mp3", durationSec: 450 },
  { id: "track-泽畔吟", title: "泽畔吟", mode: "徵", element: "fire", effect: "清心平肝", audioUrl: "/audio/泽畔吟.mp3", durationSec: 360 },
  { id: "track-龙朔操", title: "龙朔操", mode: "徵", element: "fire", effect: "清心平肝", audioUrl: "/audio/龙朔操.mp3", durationSec: 420 },
  { id: "track-洞庭秋思", title: "洞庭秋思", mode: "角", element: "wood", effect: "整体疏解", audioUrl: "/audio/洞庭秋思.mp3", durationSec: 480 },
  { id: "track-捣衣", title: "捣衣", mode: "角", element: "wood", effect: "调肝养血", audioUrl: "/audio/捣衣.mp3", durationSec: 390 },
  { id: "track-湘妃怨", title: "湘妃怨", mode: "角", element: "wood", effect: "调肝养血", audioUrl: "/audio/湘妃怨.mp3", durationSec: 450 },
  { id: "track-竹枝词", title: "竹枝词", mode: "角", element: "wood", effect: "调肝养血", audioUrl: "/audio/竹枝词.mp3", durationSec: 360 },
  { id: "track-长相思", title: "长相思", mode: "角", element: "wood", effect: "调肝养血", audioUrl: "/audio/长相思.mp3", durationSec: 420 },
  { id: "track-崆峒问道", title: "崆峒问道", mode: "羽", element: "water", effect: "五脏同调", audioUrl: "/audio/崆峒问道.mp3", durationSec: 540 },
  { id: "track-普庵咒", title: "普庵咒", mode: "羽", element: "water", effect: "五脏同调", audioUrl: "/audio/普庵咒.mp3", durationSec: 480 },
  { id: "track-玄默", title: "玄默", mode: "羽", element: "water", effect: "五脏同调", audioUrl: "/audio/玄默.mp3", durationSec: 390 },
  { id: "track-羽化登仙", title: "羽化登仙", mode: "羽", element: "water", effect: "五脏同调", audioUrl: "/audio/羽化登仙.mp3", durationSec: 510 },
  { id: "track-释谈章", title: "释谈章", mode: "羽", element: "water", effect: "五脏同调", audioUrl: "/audio/释谈章.mp3", durationSec: 420 },
  { id: "track-颐真", title: "颐真", mode: "羽", element: "water", effect: "五脏同调", audioUrl: "/audio/颐真.mp3", durationSec: 360 },
];

export const TRACK_BY_ID = Object.fromEntries(TRACK_LIBRARY.map(t => [t.id, t]));

// --- Element ↔ Tone mapping ---

export const ELEMENT_TONE_MAP = {
  wood: { tone: "角" as const, label: "肝木疏达", color: "#7C9A78" },
  fire: { tone: "徵" as const, label: "心火调平", color: "#B5564A" },
  earth: { tone: "宫" as const, label: "脾土中和", color: "#BE9A4F" },
  metal: { tone: "商" as const, label: "肺金清润", color: "#D8CDB5" },
  water: { tone: "羽" as const, label: "肾水涵养", color: "#5B6E7A" },
} as const;

// --- High risk detection ---

const HIGH_RISK_TOKENS = ["自杀", "轻生", "不想活", "活不下去", "结束生命", "伤害自己", "没有活着的意义", "撑不住了"];

export function detectHighRisk(text: string): boolean {
  return HIGH_RISK_TOKENS.some(token => text.includes(token));
}

// --- Audio player hook ---

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = useCallback((track: Track) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(track.audioUrl);
    audioRef.current = audio;
    setCurrentTrack(track);
    setCurrentTime(0);

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => setIsPlaying(false));

    audio.play();
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  return { isPlaying, currentTime, duration, currentTrack, play, togglePlay, seek };
}

export type AudioPlayer = ReturnType<typeof useAudioPlayer>;

const AudioContext = createContext<AudioPlayer | null>(null);
export const AudioProvider = AudioContext.Provider;

export function useSharedAudio(): AudioPlayer {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useSharedAudio must be inside AudioProvider");
  return ctx;
}

// --- Lunar calendar utility (simplified) ---

const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const LUNAR_MONTHS = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
const LUNAR_DAYS = [
  "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十",
];

export function getGanZhiYear(year: number): string {
  const ganIdx = (year - 4) % 10;
  const zhiIdx = (year - 4) % 12;
  return `${TIAN_GAN[ganIdx]}${DI_ZHI[zhiIdx]}年`;
}

export function getLunarMonthName(month: number): string {
  return LUNAR_MONTHS[Math.max(0, Math.min(11, month - 1))];
}

export function getLunarDayName(day: number): string {
  return LUNAR_DAYS[Math.max(0, Math.min(29, day - 1))];
}

// --- Format duration ---

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// --- Recommend tracks by element ---

export function recommendTracks(element: string, count: number): Track[] {
  const primary = TRACK_LIBRARY.filter(t => t.element === element);
  const others = TRACK_LIBRARY.filter(t => t.element !== element);
  const pool = [...primary, ...others];
  return pool.slice(0, count);
}

// --- Backend API base URL ---

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function post(path: string, body: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

async function get(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export const API = {
  // TTS interface — to be connected to voice synthesis model
  async synthesizeSpeech(_text: string): Promise<ArrayBuffer | null> {
    return null;
  },

  // Voice transcription — to be connected to ASR model
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      const res = await fetch(`${API_BASE}/api/transcribe`, { method: "POST", body: formData });
      if (!res.ok) return "";
      const data = await res.json();
      return data.transcript || "";
    } catch {
      return "";
    }
  },

  // Healer Agent: generate resonance text
  async generateResonance(profile: UserProfile, intake: IntakeData): Promise<ResonanceText> {
    try {
      const data = await post("/api/resonance", {
        user_id: profile.userId,
        name: profile.name,
        selected_symptoms: intake.selectedSymptoms,
        selected_emotion: intake.selectedEmotion,
        intensity: intake.intensity,
        sleep_duration: intake.sleepDuration,
        free_text: intake.voiceTranscript,
      });
      return { userName: data.user_name, userSummary: data.user_summary, poeticComfort: data.poetic_comfort };
    } catch {
      return {
        userName: profile.name || "旅人",
        userSummary: "木郁挟思，情志与睡眠一并受扰。",
        poeticComfort: "夜深人静时，让琴音替你说出那些难以言说的疲惫。明日的风，会比今日温柔。",
      };
    }
  },

  // TCM+Music Agent: diagnose and recommend
  async diagnose(intake: IntakeData, profile: UserProfile): Promise<DiagnosisResult> {
    try {
      const data = await post("/api/diagnosis", {
        user_id: profile.userId,
        transcript: intake.voiceTranscript || intake.selectedSymptoms.join(","),
        selected_symptoms: intake.selectedSymptoms,
        selected_emotion: intake.selectedEmotion,
        intensity: intake.intensity,
      });
      const toneToElement: Record<string, string> = { "角": "wood", "徵": "fire", "宫": "earth", "商": "metal", "羽": "water" };
      return {
        status: data.status,
        element: (toneToElement[data.tone_profile?.mode] || "wood") as DiagnosisResult["element"],
        tone: (data.tone_profile?.mode || "角") as DiagnosisResult["tone"],
        primarySyndrome: data.primary_syndrome,
        secondarySyndrome: data.secondary_syndrome,
        principle: data.principle,
        summary: data.summary,
        rationale: data.rationale,
        careMessage: data.care_message,
      };
    } catch {
      return {
        status: "ready", element: "wood", tone: "角",
        primarySyndrome: "肝郁气滞", secondarySyndrome: "心神不宁",
        principle: "疏肝理气", summary: "肝郁气滞 · 疏肝理气",
        rationale: ["以角音先开郁，再借羽调收神"], careMessage: "",
      };
    }
  },

  // Memory Agent: daily status
  async generateDailyStatus(profile: UserProfile): Promise<string> {
    try {
      const data = await get(`/api/user/${profile.userId}/daily-status`);
      return data.status_text;
    } catch {
      return "今日气机偏郁，宜听角调舒展";
    }
  },

  // Memory Agent: personality profile
  async generatePersonality(userId: string): Promise<PersonalityProfile> {
    try {
      return await get(`/api/user/${userId}/personality`);
    } catch {
      return { wood: 35, fire: 20, earth: 15, metal: 15, water: 15, summary: "性情偏于疏达，木气较盛，宜多听商调以制衡。" };
    }
  },

  // Qinshi Agent: real-time chat
  async chatWithQinshi(userId: string, message: string, currentTrackId?: string): Promise<{ reply: string; newTrackIds: string[] }> {
    try {
      const data = await post("/api/qinshi/chat", {
        user_id: userId,
        message,
        current_track_id: currentTrackId || "",
      });
      return { reply: data.reply, newTrackIds: data.new_track_ids || [] };
    } catch {
      return { reply: "琴声如水，此刻不必多想，让旋律带你走一程。", newTrackIds: [] };
    }
  },

  // User profile update
  async updateProfile(profile: UserProfile): Promise<void> {
    try {
      await post("/api/user/profile", {
        user_id: profile.userId,
        name: profile.name,
        gender: profile.gender,
        birth_year: profile.birthDate?.year,
        birth_month: profile.birthDate?.month,
        birth_day: profile.birthDate?.day,
      });
    } catch { /* silent */ }
  },

  // Favorites
  async addFavorite(userId: string, trackId: string): Promise<void> {
    try { await post("/api/user/favorites/add", { user_id: userId, track_id: trackId }); } catch { /* */ }
  },
  async removeFavorite(userId: string, trackId: string): Promise<void> {
    try { await post("/api/user/favorites/remove", { user_id: userId, track_id: trackId }); } catch { /* */ }
  },
  async getFavorites(userId: string): Promise<string[]> {
    try { const data = await get(`/api/user/${userId}/favorites`); return data.track_ids || []; } catch { return []; }
  },

  // History
  async addHistoryEntry(userId: string, trackId: string, listenedSec: number): Promise<void> {
    try { await post(`/api/user/history/add?user_id=${userId}&track_id=${trackId}&listened_sec=${listenedSec}`, {}); } catch { /* */ }
  },
};
