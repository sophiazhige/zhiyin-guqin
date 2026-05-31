import React, { useState, useCallback, useEffect, useRef } from "react";
import { ScreenWrapper } from "../SharedElements";
import { ChevronLeft } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  BODY_SYMPTOM_OPTIONS,
  EMOTION_OPTIONS,
  getGanZhiYear,
  getLunarMonthName,
  getLunarDayName,
  ELEMENT_TONE_MAP,
  detectHighRisk,
} from "../../store";
import { useNav, PAGES } from "../../navigation";
import { useIntake, EMOTION_BACKEND_MAP } from "../../intake-context";

// --- Simplified solar→lunar conversion (approximate) ---

function solarToLunar(y: number, m: number, d: number) {
  const lunarMonth = ((m + 10) % 12) + 1;
  const lunarDay = ((d + 2) % 30) + 1;
  return { lunarYear: y, lunarMonth, lunarDay };
}

// --- Shared Intake Layout ---

function IntakeLayout({
  step,
  title,
  subtitle,
  children,
  showBack = true,
  buttonText = "下一步",
  showSkip = false,
  totalSteps = 6,
  onNext,
  onBack,
  onSkip,
}: {
  step: number;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  showBack?: boolean;
  buttonText?: string;
  showSkip?: boolean;
  totalSteps?: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}) {
  const nav = useNav();
  const handleNext = onNext || nav.goNext;
  const handleBack = onBack || nav.goPrev;
  const handleSkip = onSkip || nav.goNext;

  const guideText = step === 1
    ? "你好，我是琴师，初次相逢，先容我认识你。"
    : step === totalSteps
      ? "看来我已了解大概。"
      : "你好，我是琴师。";

  const progress = step / totalSteps;

  return (
    <ScreenWrapper className="bg-background px-8 py-16">
      <div className="z-10 flex flex-col h-full">

        {/* Top Header */}
        <div className="flex justify-between items-center mb-4 h-6">
          {showBack ? (
            <button
              onClick={handleBack}
              className="text-foreground/70 hover:text-foreground flex items-center gap-1"
            >
              <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
              <span className="text-xs tracking-widest font-serif">上一页</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
          <div className="text-[10px] text-muted-foreground tracking-widest font-sans">{step}/{totalSteps}</div>
          <div className="w-16" />
        </div>

        {/* Progress Bar — segmented */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-[3px] w-6 rounded-full transition-all duration-500",
                  i < step ? "bg-primary" : "bg-border/40"
                )}
              />
            ))}
          </div>
        </div>

        {/* Avatar & Guide */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-card border-[0.5px] border-border flex items-center justify-center text-foreground/70 shadow-sm shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" className="w-7 h-7">
              <path d="M12 4.5c-1 0-1.5.5-1.5 1.5 0 1.5 1.5 2 1.5 3.5 0-1.5 1.5-2 1.5-3.5 0-1-0.5-1.5-1.5-1.5z" />
              <path d="M9 10a3 3 0 1 1 6 0c0 2-3 3-3 5-0 2-3 1-3-5z" />
              <path d="M6 20c0-3 2-4 6-4s6 1 6 4" />
            </svg>
          </div>
          <div className="text-sm text-card-foreground tracking-[0.1em] border-l-[0.5px] border-border pl-4 h-8 flex items-center">
            {guideText}
          </div>
        </div>

        {/* Title Area */}
        <div className="mb-10">
          <h2 className="font-serif text-[2.2rem] text-foreground leading-snug tracking-widest">
            {title}
          </h2>
          {subtitle && (
            <div className="text-xs tracking-[0.2em] text-muted-foreground mt-4">{subtitle}</div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar -mx-2 px-2 pb-8">
          {children}
        </div>

        {/* Bottom Button */}
        <div className="mt-auto flex justify-between items-center pt-4">
          {showSkip ? (
            <button
              onClick={handleSkip}
              className="text-muted-foreground/60 hover:text-muted-foreground text-sm tracking-[0.2em] px-4 font-medium transition-colors"
            >
              跳过
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            className={cn(
              "rounded-full px-10 py-3 tracking-[0.2em] text-sm transition-colors border-none",
              buttonText === "为我辨证"
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-transparent text-primary hover:bg-primary/5 font-medium"
            )}
          >
            {buttonText}
          </button>
        </div>

      </div>
    </ScreenWrapper>
  );
}

// --- Card D: 生辰与称呼 (Step 1) ---

export function ScreenIntakeCardD() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [dateStr, setDateStr] = useState("1984-12-08");

  const parsed = dateStr ? dateStr.split("-").map(Number) : [1984, 12, 8];
  const solarY = parsed[0] || 1984;
  const solarM = parsed[1] || 1;
  const solarD = parsed[2] || 1;
  const lunar = solarToLunar(solarY, solarM, solarD);

  return (
    <IntakeLayout step={1} title={<>生辰与称呼</>} subtitle="首次使用请填写，仅作五行推演与落款" showBack={false} showSkip={true}>
      <div className="flex flex-col gap-8 mt-2">

        {/* Name */}
        <div className="flex flex-col gap-3">
          <label className="text-xs text-muted-foreground tracking-[0.2em] ml-2">如何称呼你</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：半山客"
            className="w-full bg-card border-[0.5px] border-border rounded-xl px-5 py-4 text-sm tracking-[0.1em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-3">
          <label className="text-xs text-muted-foreground tracking-[0.2em] ml-2">性别</label>
          <div className="flex gap-3">
            {([["male", "男"], ["female", "女"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setGender(val)}
                className={cn(
                  "flex-1 rounded-xl px-5 py-4 text-sm tracking-[0.2em] transition-all",
                  gender === val
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border-[0.5px] border-border text-foreground hover:bg-card/90"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Birth Date — solar input, lunar display */}
        <div className="flex flex-col gap-3">
          <label className="text-xs text-muted-foreground tracking-[0.2em] ml-2">出生日期（阳历）</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full bg-card border-[0.5px] border-border rounded-xl px-5 py-4 text-sm tracking-[0.1em] text-foreground focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
          {dateStr && (
            <div className="bg-card/60 border-[0.5px] border-border rounded-xl px-5 py-3 flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground tracking-widest">农历</span>
              <span className="text-sm font-serif text-foreground tracking-widest">
                {getGanZhiYear(lunar.lunarYear)} {getLunarMonthName(lunar.lunarMonth)} {getLunarDayName(lunar.lunarDay)}
              </span>
            </div>
          )}
        </div>

      </div>
    </IntakeLayout>
  );
}

// --- Card A: 身体求助 (Step 2) ---

const SYMPTOM_GROUPS = [
  ["身体无恙"],
  ["入睡难/易醒", "心悸/胸闷"],
  ["烦躁/易怒", "压力大/紧绷"],
  ["情绪低落/郁闷", "思虑过度"],
  ["没胃口/腹胀", "气短/容易累"],
  ["易感冒/咽干", "腰膝酸软/耳鸣"],
  ["健忘/脱发", "痛经/经期不调"],
  ["经前烦躁/乳胀"],
];

export function ScreenIntakeCardA() {
  const { setSymptoms } = useIntake();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback((label: string) => {
    setSelected((prev) => {
      let next: string[];
      if (label === "身体无恙") {
        next = prev.includes(label) ? [] : [label];
      } else {
        const without = prev.filter((s) => s !== "身体无恙");
        next = without.includes(label) ? without.filter((s) => s !== label) : [...without, label];
      }
      setSymptoms(next);
      return next;
    });
  }, [setSymptoms]);

  return (
    <IntakeLayout step={2} title={<>近来身体，<br />哪里在向你求助？</>} subtitle="可多选">
      <div className="flex flex-wrap gap-x-3 gap-y-4">
        {SYMPTOM_GROUPS.flat().map((label) => {
          const isActive = selected.includes(label);
          return (
            <div
              key={label}
              onClick={() => toggle(label)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm tracking-[0.1em] transition-all border-none cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card/60 text-foreground hover:bg-card/90"
              )}
            >
              {label}
            </div>
          );
        })}
      </div>
    </IntakeLayout>
  );
}

// --- Card B: 心头感受 (Step 3) ---

export function ScreenIntakeCardB() {
  const { setEmotion, setIntensity: setCtxIntensity } = useIntake();
  const [selected, setSelected] = useState("");
  const [intensity, setIntensity] = useState(5);

  const handleSelectEmotion = (label: string) => {
    setSelected(label);
    setEmotion(EMOTION_BACKEND_MAP[label] || label);
  };
  const handleSetIntensity = (v: number) => {
    setIntensity(v);
    setCtxIntensity(v);
  };

  return (
    <IntakeLayout step={3} title={<>此时此刻，<br />盘踞在心头的感受是？</>} subtitle="单选">
      <div className="flex flex-wrap gap-x-3 gap-y-4 mb-16">
        {EMOTION_OPTIONS.map(({ label, element }) => {
          const isActive = selected === label;
          const elColor = element !== "neutral" ? ELEMENT_TONE_MAP[element as keyof typeof ELEMENT_TONE_MAP]?.color : undefined;
          return (
            <div
              key={label}
              onClick={() => handleSelectEmotion(label)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm tracking-[0.1em] transition-all border-none cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card/60 text-foreground hover:bg-card/90"
              )}
            >
              {label}
              {isActive && elColor && (
                <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: elColor }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Intensity Slider */}
      <div className="mt-8 px-2">
        <div className="flex justify-between items-center mb-6 text-sm tracking-widest text-foreground font-serif">
          <span>它的分量</span>
          <span className="text-primary font-medium text-lg">{intensity}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={intensity}
          onChange={(e) => handleSetIntensity(Number(e.target.value))}
          className="w-full accent-primary h-1 bg-border rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between w-full mt-4 text-[10px] text-muted-foreground tracking-widest font-sans">
          <span>轻如鸿毛</span>
          <span>重如泰山</span>
        </div>
      </div>
    </IntakeLayout>
  );
}

// --- Card C: 入睡 (Step 4) ---

export function ScreenIntakeCardC() {
  const options = ["一刻钟内", "半小时", "一小时", "更久"];
  const [selected, setSelected] = useState("半小时");

  return (
    <IntakeLayout step={4} title={<>入睡通常需要多久？</>}>
      <div className="flex flex-col gap-4 mt-4">
        {options.map((opt) => (
          <div
            key={opt}
            onClick={() => setSelected(opt)}
            className={cn(
              "p-5 rounded-xl border-none flex items-center gap-4 cursor-pointer transition-colors",
              selected === opt
                ? "bg-primary/10 shadow-sm"
                : "bg-card/60 hover:bg-card/90"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full border-[1px] flex items-center justify-center",
                selected === opt ? "border-primary" : "border-border"
              )}
            >
              {selected === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span
              className={cn(
                "text-sm tracking-[0.2em]",
                selected === opt ? "text-primary font-medium" : "text-foreground"
              )}
            >
              {opt}
            </span>
          </div>
        ))}
      </div>
    </IntakeLayout>
  );
}

// --- Card F: 与琴师细说 (Step 5) ---

export function ScreenIntakeCardF() {
  const { setFreeText } = useIntake();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleTextChange = useCallback((val: string) => {
    setText(val);
    setFreeText(val);
  }, [setFreeText]);

  const handleVoiceInput = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("当前浏览器不支持语音识别");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalText = text;
    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript;
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      const combined = finalText + interim;
      setText(combined);
      setFreeText(combined);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    setIsRecording(true);
  }, [isRecording, text, setFreeText]);

  return (
    <IntakeLayout step={5} title={<>可有更多心事，<br />愿与琴师细说？</>} subtitle="选填">
      <div className="relative mt-4 flex-1 flex flex-col">
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full flex-1 min-h-[240px] bg-card border-[0.5px] border-border rounded-xl px-5 py-4 text-sm tracking-[0.1em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-sm resize-none"
          placeholder="在此倾吐你的心声..."
        />
        <button
          onClick={handleVoiceInput}
          className={cn(
            "absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md",
            isRecording
              ? "bg-red-500 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          {isRecording && (
            <span className="absolute -inset-1 rounded-full border border-red-500 animate-ping opacity-75" />
          )}
        </button>
      </div>
    </IntakeLayout>
  );
}

// --- Card E: 你的回响 (Step 6) ---

const RESONANCE_API = (typeof import.meta !== "undefined" && (import.meta as Record<string, unknown>).env)
  ? ((import.meta as { env: Record<string, string> }).env.VITE_API_BASE ?? "http://localhost:8000")
  : "http://localhost:8000";

const POETIC_ENDINGS = [
  "山有木兮木有枝，心悦君兮君不知",
  "行到水穷处，坐看云起时",
  "回首向来萧瑟处，也无风雨也无晴",
  "人间有味是清欢",
  "此心安处是吾乡",
  "且将新火试新茶，诗酒趁年华",
  "明日的风，会比今日温柔",
];

function buildFallbackResonance(intake: { symptoms: string[]; emotion: string; intensity: number }): string {
  const parts: string[] = [];

  if (intake.symptoms.length > 0 && !intake.symptoms.includes("身体无恙")) {
    const top = intake.symptoms.slice(0, 2).join("、");
    parts.push(`近来身有${top}之扰，气机不畅`);
  } else {
    parts.push("近来身无大恙，尚算安适");
  }

  if (intake.emotion) {
    const emotionMap: Record<string, string> = {
      "烦躁": "心绪烦乱，肝火偏旺",
      "惶恐不安": "惶恐不宁，心神失守",
      "思绪放不下": "思虑缠绵，脾土受困",
      "低落": "情志低沉，气郁于胸",
      "还算平和": "心境尚且平和，惟求更深安宁",
    };
    parts.push(emotionMap[intake.emotion] || "情志微有波动");
  }

  if (intake.intensity >= 7) {
    parts.push("此等重负已久，正宜以琴音解之");
  } else {
    parts.push("虽非深患，亦当早调");
  }

  const poem = POETIC_ENDINGS[Math.floor(parts.join("").length % POETIC_ENDINGS.length)];
  return parts.join("。") + "。" + poem;
}

export function ScreenIntakeCardE() {
  const nav = useNav();
  const { intake } = useIntake();
  const [resonanceText, setResonanceText] = useState("");
  const [loading, setLoading] = useState(true);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    async function fetchResonance() {
      try {
        const res = await fetch(`${RESONANCE_API}/api/resonance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: "user-default",
            name: "",
            selected_symptoms: intake.symptoms,
            selected_emotion: intake.emotion,
            intensity: intake.intensity,
            sleep_duration: "",
            free_text: intake.freeText,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const parts = [data.user_summary, data.poetic_comfort].filter(Boolean);
        const raw = parts.map((s: string) => s.replace(/[。！？]+$/, "")).join("。");
        const text = raw || buildFallbackResonance(intake);
        setResonanceText(text.length > 100 ? text.slice(0, 100) : text);
      } catch {
        setResonanceText(buildFallbackResonance(intake));
      } finally {
        setLoading(false);
      }
    }

    fetchResonance();
  }, [intake]);

  const handleDiagnose = useCallback(() => {
    if (detectHighRisk(resonanceText)) {
      nav.goTo(PAGES.CARE);
    } else {
      nav.goTo(PAGES.TRANSITION);
    }
  }, [nav, resonanceText]);

  return (
    <IntakeLayout step={6} title={<>你的回响</>} buttonText={"为我辨证"} onNext={handleDiagnose}>
      <div
        className="relative w-full bg-card/50 backdrop-blur-sm border-[0.5px] border-border rounded-sm shadow-sm overflow-hidden flex justify-center items-center p-8 mt-2"
        style={{ height: "320px" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, transparent, transparent 31.5px, var(--border) 31.5px, var(--border) 32px)",
            backgroundPosition: "center",
          }}
        />

        <div className="absolute inset-2 border-[0.5px] border-border/40 pointer-events-none" />

        {loading ? (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground tracking-widest">琴师正在倾听…</span>
          </div>
        ) : (
          <div
            className="leading-[2.2] text-[15px] text-foreground tracking-[0.4em] font-serif text-justify py-4 relative z-10"
            style={{ writingMode: "vertical-rl", textOrientation: "upright", maxHeight: "280px" }}
          >
            {resonanceText}
          </div>
        )}
      </div>
    </IntakeLayout>
  );
}
