import React, { useState } from "react";
import { ScreenWrapper, EL_COLORS } from "../SharedElements";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { API, ELEMENT_TONE_MAP, useSharedAudio } from "../../store";
import type { PersonalityProfile } from "../../store";
import { useNav, PAGES } from "../../navigation";
import { useIntake } from "../../intake-context";

// --- Personality Overlay (Five Elements Radar + Summary) ---

function PersonalityOverlay({
  profile,
  onClose,
}: {
  profile: PersonalityProfile;
  onClose: () => void;
}) {
  const elements = [
    { key: "wood", label: "木", value: profile.wood, color: EL_COLORS.wood },
    { key: "fire", label: "火", value: profile.fire, color: EL_COLORS.fire },
    { key: "earth", label: "土", value: profile.earth, color: EL_COLORS.earth },
    { key: "metal", label: "金", value: profile.metal, color: EL_COLORS.metal },
    { key: "water", label: "水", value: profile.water, color: EL_COLORS.water },
  ];
  const maxVal = Math.max(...elements.map((e) => e.value), 1);

  // Five-point radar coordinates
  const cx = 80, cy = 80, r = 60;
  const angles = elements.map((_, i) => (Math.PI * 2 * i) / 5 - Math.PI / 2);
  const outerPoints = angles.map((a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(" ");
  const midPoints = angles.map((a) => `${cx + (r * 0.5) * Math.cos(a)},${cy + (r * 0.5) * Math.sin(a)}`).join(" ");
  const dataPoints = angles.map((a, i) => {
    const ratio = elements[i].value / maxVal;
    return `${cx + r * ratio * Math.cos(a)},${cy + r * ratio * Math.sin(a)}`;
  }).join(" ");

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
      <div className="w-[360px] bg-background border-[0.5px] border-border rounded-2xl shadow-2xl p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-serif text-2xl text-foreground tracking-widest mb-8 text-center">性格底色</h3>

        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 160 160" className="w-44 h-44">
            {/* Grid */}
            <polygon points={outerPoints} fill="none" stroke="var(--border)" strokeWidth="0.5" />
            <polygon points={midPoints} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
            {/* Axes */}
            {angles.map((a, i) => (
              <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="var(--border)" strokeWidth="0.5" />
            ))}
            {/* Data polygon */}
            <polygon points={dataPoints} fill="rgba(163,53,41,0.12)" stroke="rgba(163,53,41,0.6)" strokeWidth="1.5" />
            {/* Labels */}
            {elements.map((el, i) => {
              const labelR = r + 16;
              const lx = cx + labelR * Math.cos(angles[i]);
              const ly = cy + labelR * Math.sin(angles[i]);
              return (
                <text key={el.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={el.color} fontFamily="serif">
                  {el.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Bar chart */}
        <div className="flex flex-col gap-3 mb-6">
          {elements.map((el) => (
            <div key={el.key} className="flex items-center gap-3">
              <span className="text-xs font-serif w-4 text-center" style={{ color: el.color }}>{el.label}</span>
              <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(el.value / maxVal) * 100}%`, backgroundColor: el.color }} />
              </div>
              <span className="text-[10px] text-muted-foreground font-sans w-8 text-right">{el.value}%</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-card-foreground tracking-[0.08em] leading-loose text-center font-serif">
          {profile.summary}
        </p>
      </div>
    </div>
  );
}

// --- Main Screen ---

function SectionRow({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between rounded-[18px] border-[0.5px] border-border/60 bg-card/40 px-4 py-4 transition-colors hover:bg-card/60 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
        <div>
          <div className="font-serif tracking-widest text-foreground">{title}</div>
          {subtitle && <div className="mt-1 text-[10px] tracking-[0.18em] text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
    </div>
  );
}

export function ScreenMy() {
  const nav = useNav();
  const audio = useSharedAudio();
  const { diagnosis } = useIntake();
  const [showPersonality, setShowPersonality] = useState(false);
  const element = diagnosis?.element || "wood";
  const elInfo = ELEMENT_TONE_MAP[element as keyof typeof ELEMENT_TONE_MAP];
  const personality: PersonalityProfile = {
    wood: 35, fire: 20, earth: 15, metal: 15, water: 15,
    summary: "性情偏于疏达，木气较盛，宜多听商调以制衡。",
  };

  const moodCalendar = [
    { day: 1, type: null }, { day: 2, type: null }, { day: 3, type: null },
    { day: 4, type: "wood" }, { day: 5, type: "earth" }, { day: 6, type: null },
    { day: 7, type: "fire" }, { day: 8, type: "fire" }, { day: 9, type: null },
    { day: 10, type: null }, { day: 11, type: null }, { day: 12, type: "water" },
    { day: 13, type: null }, { day: 14, type: "earth" }, { day: 15, type: "wood" },
    { day: 16, type: null }, { day: 17, type: null }, { day: 18, type: "earth" },
    { day: 19, type: null }, { day: 20, type: null }, { day: 21, type: "wood" },
    { day: 22, type: null }, { day: 23, type: null }, { day: 24, type: null },
    { day: 25, type: "fire" }, { day: 26, type: null },
  ] as const;

  const elColorMap: Record<string, string> = {
    wood: EL_COLORS.wood,
    fire: EL_COLORS.fire,
    earth: EL_COLORS.earth,
    metal: EL_COLORS.metal,
    water: EL_COLORS.water,
  };

  return (
    <ScreenWrapper className="bg-background flex flex-col">
      {showPersonality && (
        <PersonalityOverlay profile={personality} onClose={() => setShowPersonality(false)} />
      )}

      <div className="z-10 flex flex-col h-full overflow-y-auto pb-12 hide-scrollbar">

        {/* Header */}
        <div className="w-full flex justify-between items-center px-8 pt-16 pb-4 relative">
          <button
            onClick={() => nav.goTo(PAGES.WELCOME)}
            className="flex items-center gap-1 hover:text-foreground transition-colors text-foreground"
          >
            <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
            <span className="text-xs tracking-widest font-serif">返回</span>
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase font-sans text-muted-foreground absolute left-1/2 -translate-x-1/2">My Memory</div>
          <button
            onClick={() => nav.goTo(PAGES.PLAYER)}
            className="w-9 h-9 rounded-full border-[0.5px] border-border bg-card/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <style>{`
              @keyframes barPulse1 { 0%,100% { height: 30%; } 50% { height: 80%; } }
              @keyframes barPulse2 { 0%,100% { height: 60%; } 50% { height: 30%; } }
              @keyframes barPulse3 { 0%,100% { height: 45%; } 50% { height: 90%; } }
            `}</style>
            {audio.isPlaying ? (
              <div className="flex items-end gap-[2px] h-3">
                <span className="w-[2px] bg-primary rounded-full" style={{ animation: "barPulse1 1.2s ease-in-out infinite" }} />
                <span className="w-[2px] bg-primary rounded-full" style={{ animation: "barPulse2 1.2s ease-in-out 0.2s infinite" }} />
                <span className="w-[2px] bg-primary rounded-full" style={{ animation: "barPulse3 1.2s ease-in-out 0.4s infinite" }} />
              </div>
            ) : (
              <svg className="w-3.5 h-3.5 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" fill="none" />
                <circle cx="18" cy="16" r="3" fill="none" />
              </svg>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="px-8 mt-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-[0.5px] border-border bg-card shadow-sm flex items-center justify-center overflow-hidden p-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" className="w-full h-full text-muted-foreground">
                <path d="M12 4.5c-1 0-1.5.5-1.5 1.5 0 1.5 1.5 2 1.5 3.5 0-1.5 1.5-2 1.5-3.5 0-1-0.5-1.5-1.5-1.5z" />
                <path d="M9 10a3 3 0 1 1 6 0c0 2-3 3-3 5-0 2-3 1-3-5z" />
                <path d="M6 20c0-3 2-4 6-4s6 1 6 4" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-muted-foreground tracking-[0.1em] mb-1">半山客</div>
              <div className="text-xs text-muted-foreground/60 tracking-widest font-sans">ID: 839201</div>
            </div>
          </div>
          <div className="text-right max-w-[150px]">
            <div className="text-sm font-serif tracking-[0.1em] mb-1" style={{ color: "#B5564A" }}>
              {diagnosis?.syndrome || "气机偏郁"}
            </div>
            <div className="text-[11px] text-muted-foreground tracking-[0.08em]">
              宜听{elInfo?.tone || "角"}调{diagnosis?.principle || "舒展"}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="px-8 mb-6 -mt-2">
          <div className="bg-[#EFEAE0] rounded-[16px] p-5 shadow-sm border-[0.5px] border-border/20">
            <div className="flex justify-between items-center mb-8">
              <div className="font-serif text-lg text-[#4A433A] tracking-wider">庚子月 · 十一月</div>
              <div className="flex items-center gap-2.5 text-[9px] text-[#7A736A] font-serif tracking-widest">
                {[
                  { label: "木", color: EL_COLORS.wood },
                  { label: "火", color: EL_COLORS.fire },
                  { label: "土", color: EL_COLORS.earth },
                  { label: "金", color: EL_COLORS.metal },
                  { label: "水", color: EL_COLORS.water },
                ].map((el) => (
                  <div key={el.label} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: el.color }} />
                    {el.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-5 gap-x-2 text-center text-[13px] font-serif">
              {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
                <div key={d} className="text-[#8A837A] mb-2">{d}</div>
              ))}
              <div /><div />
              {moodCalendar.map(({ day, type }) => {
                const bgColor = type ? elColorMap[type] : "";
                return (
                  <div key={day} className="flex justify-center items-center h-8 relative">
                    {bgColor && <div className="absolute w-8 h-8 rounded-full" style={{ backgroundColor: bgColor }} />}
                    <div className={cn("flex items-center justify-center relative z-10", bgColor ? "text-[#3A332A]" : "text-[#AA9F91]")}>
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* List Sections */}
        <div className="px-8 flex flex-col gap-1">
          <SectionRow title="历史播放" onClick={() => nav.goTo(PAGES.HISTORY)} />
          <SectionRow title="收藏夹" onClick={() => nav.goTo(PAGES.FAVORITES)} />
          <SectionRow title="疗程进度" onClick={() => nav.goTo(PAGES.PROGRESS)} />
        </div>

        {/* Personality Card */}
        <div
          className="mx-8 mt-6 border-[0.5px] border-border rounded-xl p-6 bg-card flex flex-col items-center justify-center gap-4 relative shadow-sm cursor-pointer hover:bg-card/80 transition-colors"
          onClick={() => setShowPersonality(true)}
        >
          <div className="w-full flex justify-between items-center text-sm font-serif tracking-widest text-foreground">
            <span className="font-serif text-xl">性格底色</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          </div>

          {/* Mini radar preview */}
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <polygon points="50,5 95,38 78,90 22,90 5,38" fill="none" stroke="var(--border)" strokeWidth="0.5" />
              <polygon points="50,20 80,42 68,80 32,80 20,42" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
              <polygon points="50,35 65,47 59,70 41,70 35,47" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
              {[0, 1, 2, 3, 4].map((i) => {
                const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                return <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos(a)} y2={50 + 45 * Math.sin(a)} stroke="var(--border)" strokeWidth="0.5" />;
              })}
              <polygon
                points={[
                  { v: personality.wood }, { v: personality.fire }, { v: personality.earth }, { v: personality.metal }, { v: personality.water },
                ].map((el, i) => {
                  const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  const ratio = el.v / 100;
                  return `${50 + 45 * ratio * Math.cos(a)},${50 + 45 * ratio * Math.sin(a)}`;
                }).join(" ")}
                fill="rgba(163,53,41,0.15)"
                stroke="rgba(163,53,41,0.6)"
                strokeWidth="1"
              />
              {/* Labels */}
              {[
                { label: "木", color: EL_COLORS.wood },
                { label: "火", color: EL_COLORS.fire },
                { label: "土", color: EL_COLORS.earth },
                { label: "金", color: EL_COLORS.metal },
                { label: "水", color: EL_COLORS.water },
              ].map((el, i) => {
                const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                return (
                  <text key={el.label} x={50 + 55 * Math.cos(a)} y={50 + 55 * Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={el.color} fontFamily="serif">
                    {el.label}
                  </text>
                );
              })}
            </svg>
          </div>

          <p className="text-xs text-card-foreground tracking-[0.08em] text-center">
            {personality.summary}
          </p>
        </div>

      </div>
    </ScreenWrapper>
  );
}
