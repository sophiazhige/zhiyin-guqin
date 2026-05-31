import React, { useEffect, useState } from "react";
import { ScreenWrapper, EL_COLORS } from "../SharedElements";
import { ChevronLeft } from "lucide-react";
import { ELEMENT_TONE_MAP } from "../../store";
import { useNav, PAGES } from "../../navigation";
import { useIntake } from "../../intake-context";

const EL_LABELS: Record<string, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ScreenDiagnosisResult() {
  const nav = useNav();
  const { diagnosis } = useIntake();
  const [rippleKey, setRippleKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setRippleKey((k) => k + 1), 3000);
    return () => clearInterval(timer);
  }, []);

  const element = diagnosis?.element || "wood";
  const syndrome = diagnosis?.syndrome || "肝郁气滞";

  const elInfo = ELEMENT_TONE_MAP[element as keyof typeof ELEMENT_TONE_MAP];
  const elLabel = EL_LABELS[element] || "木";

  return (
    <ScreenWrapper className="bg-background flex flex-col px-8 py-16 items-center">
      <style>{`
        @keyframes breathe { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.06); opacity: 1; } }
        @keyframes ripple1 { 0% { transform: scale(0.85); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes ripple2 { 0% { transform: scale(0.85); opacity: 0.4; } 100% { transform: scale(1.6); opacity: 0; } }
      `}</style>
      <div className="w-full flex justify-between items-center mb-8 h-6 z-10">
        <button
          onClick={() => nav.goTo(PAGES.INTAKE_E)}
          className="flex items-center gap-1 hover:text-foreground transition-colors text-foreground"
        >
          <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
          <span className="text-xs tracking-widest font-serif">上一页</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
        <h2 className="text-sm text-muted-foreground tracking-[0.3em] uppercase mb-16 font-sans">
          辨证结果
        </h2>

        {/* Diagnosis Centerpiece */}
        <div className="relative flex items-center justify-center w-64 h-64 mb-12">
          {/* Water ripple rings */}
          <div key={`r1-${rippleKey}`} className="absolute inset-0 rounded-full border-[0.5px]" style={{ borderColor: elInfo?.color, animation: "ripple1 3s ease-out forwards" }} />
          <div key={`r2-${rippleKey}`} className="absolute inset-0 rounded-full border-[0.5px]" style={{ borderColor: elInfo?.color, animation: "ripple2 3s ease-out 0.6s forwards", opacity: 0 }} />

          <div className="absolute inset-0 border-[0.5px] border-border rounded-full opacity-40 scale-[1.1]" />
          <div className="absolute inset-4 border-[0.5px] border-border/80 rounded-full" />

          <div
            className="absolute inset-8 rounded-full border-[1px]"
            style={{
              borderColor: elInfo?.color,
              backgroundColor: (elInfo?.color || "#7C9A78") + "33",
              animation: "breathe 4s ease-in-out infinite",
            }}
          />

          <div className="flex flex-col items-center justify-center gap-4 relative z-10">
            <span className="font-serif text-5xl tracking-widest drop-shadow-md" style={{ color: elInfo?.color }}>
              {elLabel}
            </span>
            <div className="w-8 h-[0.5px] bg-border" />
            <span className="font-serif text-3xl text-foreground tracking-widest">
              {elInfo?.tone}
            </span>
          </div>

          <div
            className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tracking-[0.2em]"
            style={{ writingMode: "vertical-rl" }}
          >
            {syndrome} · 宜用{elInfo?.tone}调
          </div>
        </div>

        <p className="text-center text-sm text-foreground/80 leading-loose tracking-[0.1em] max-w-[280px] mb-8">
          推演显示，你此刻的状况对应五行之
          <span className="font-medium" style={{ color: elInfo?.color }}>「{elLabel}」</span>。<br /><br />
          我们将以五音之<span className="text-foreground font-medium">「{elInfo?.tone}」</span>为你疏导气机，解开心结。
        </p>

        {/* Five Elements reference bar */}
        <div className="w-full px-6 py-4 bg-card/40 border-[0.5px] border-border rounded-xl mb-12">
          <div className="text-[10px] text-muted-foreground tracking-[0.2em] text-center mb-3">五行与五音之理</div>
          <div className="flex justify-between items-center text-xs tracking-widest font-serif text-foreground/80">
            {(["wood", "fire", "earth", "metal", "water"] as const).map((el, i) => {
              const info = ELEMENT_TONE_MAP[el];
              const label = EL_LABELS[el];
              const isActive = el === element;
              return (
                <React.Fragment key={el}>
                  {i > 0 && <div className="w-[1px] h-3 bg-border" />}
                  <div className={cn("flex flex-col items-center gap-1", isActive && "scale-110")}>
                    <span style={{ color: info.color, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                    <span style={{ opacity: isActive ? 1 : 0.6 }}>{info.tone}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => nav.goTo(PAGES.PRESCRIPTION)}
          className="mt-auto group relative px-12 py-3.5 overflow-hidden rounded-full border-[0.5px] border-primary/30 bg-primary text-primary-foreground transition-all hover:opacity-90 backdrop-blur-sm"
        >
          <span className="relative z-10 tracking-[0.3em] text-sm ml-1">查看处方笺</span>
        </button>
      </div>
    </ScreenWrapper>
  );
}
