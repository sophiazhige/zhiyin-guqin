import React, { useEffect, useRef, useState } from "react";
import { ScreenWrapper, EL_COLORS } from "../SharedElements";
import { ChevronLeft } from "lucide-react";
import { useNav, PAGES } from "../../navigation";
import { useIntake } from "../../intake-context";
import { recommendTracks } from "../../store";
import type { DiagnosisResult } from "../../intake-context";

const BACKEND = (typeof import.meta !== "undefined" && (import.meta as Record<string, unknown>).env)
  ? ((import.meta as { env: Record<string, string> }).env.VITE_API_BASE ?? "http://localhost:8000")
  : "http://localhost:8000";

function modeToElement(mode: string): string {
  return ({ "角": "wood", "徵": "fire", "宫": "earth", "商": "metal", "羽": "water" } as Record<string, string>)[mode] || "wood";
}

const MIN_DISPLAY_MS = 6000;

export function ScreenTransition() {
  const nav = useNav();
  const { intake, setDiagnosis } = useIntake();
  const [error, setError] = useState("");
  const called = useRef(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const startTime = Date.now();

    async function runDiagnosis() {
      try {
        const body = {
          user_id: "user-default",
          transcript: intake.freeText || "",
          selected_symptoms: intake.symptoms,
          selected_emotion: intake.emotion,
          intensity: intake.intensity,
        };

        const res = await fetch(`${BACKEND}/api/diagnosis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const element = data.tone_profile?.mode ? modeToElement(data.tone_profile.mode) : "wood";

        const tracks = (data.recommended_tracks || []).slice(0, 4).map((t: {
          id: string; title: string; mode: string; element: string; duration_sec: number; effect: string;
        }) => ({
          id: t.id, title: t.title, mode: t.mode, element: t.element,
          durationSec: t.duration_sec, effect: t.effect, audioUrl: `/audio/${t.title}.mp3`,
        }));

        const courseExtra = recommendTracks(element, 7).filter(
          (t) => !tracks.some((r: { id: string }) => r.id === t.id)
        );
        const courseTracks = [...tracks, ...courseExtra].slice(0, 7);

        const result: DiagnosisResult = {
          element,
          syndrome: data.primary_syndrome || "压力紧张",
          principle: data.principle || "整体疏解",
          tracks: tracks.length ? tracks : recommendTracks(element, 3),
          courseTracks,
        };
        setDiagnosis(result);
      } catch (e) {
        console.error("诊断接口失败，使用本地兜底", e);
        setError("网络异常，已为你使用本地推算");
        const element = "wood";
        setDiagnosis({
          element,
          syndrome: "压力紧张",
          principle: "整体疏解",
          tracks: recommendTracks(element, 3),
          courseTracks: recommendTracks(element, 7),
        });
      } finally {
        readyRef.current = true;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(() => nav.goTo(PAGES.DIAGNOSIS), remaining);
      }
    }

    runDiagnosis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenWrapper className="items-center justify-center relative">
      <div className="absolute top-16 left-8 z-20">
        <button
          onClick={() => nav.goPrev()}
          className="flex items-center gap-1 hover:text-foreground transition-colors text-foreground"
        >
          <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
          <span className="text-xs tracking-widest font-serif">上一页</span>
        </button>
      </div>

      <div className="absolute inset-0 z-0 opacity-15 mix-blend-multiply flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 400 400" className="w-[800px] h-[800px] blur-2xl text-foreground">
          <path d="M50 200 C 150 100, 250 300, 350 200" stroke="currentColor" strokeWidth="40" fill="none" opacity="0.6"/>
          <path d="M0 250 C 150 350, 250 150, 400 250" stroke="currentColor" strokeWidth="60" fill="none" opacity="0.4"/>
          <path d="M100 150 C 200 50, 300 250, 400 100" stroke="currentColor" strokeWidth="30" fill="none" opacity="0.5"/>
        </svg>
      </div>

      <div className="z-10 flex flex-col items-center">
        <div className="text-xl font-serif tracking-[0.3em] text-foreground mb-16">辨证中…</div>

        <div className="relative w-64 h-64 mb-12">
          <div className="absolute inset-0 border-[0.5px] border-border rounded-full opacity-20" />
          <div className="absolute inset-4 border-[0.5px] border-border/40 rounded-full" />
          <div className="absolute inset-8 border-[0.5px] border-border rounded-full" />

          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s" }}>
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <path d="M 100 25 A 75 75 0 0 1 171.3 76.9" fill="none" stroke={EL_COLORS.wood} strokeWidth="6" className="opacity-70" strokeLinecap="round" />
              <path d="M 171.3 76.9 A 75 75 0 0 1 144.1 160.7" fill="none" stroke={EL_COLORS.fire} strokeWidth="6" className="opacity-70" strokeLinecap="round" />
              <path d="M 144.1 160.7 A 75 75 0 0 1 55.9 160.7" fill="none" stroke={EL_COLORS.earth} strokeWidth="6" className="opacity-70" strokeLinecap="round" />
              <path d="M 55.9 160.7 A 75 75 0 0 1 28.7 76.9" fill="none" stroke={EL_COLORS.metal} strokeWidth="6" className="opacity-70" strokeLinecap="round" />
              <path d="M 28.7 76.9 A 75 75 0 0 1 100 25" fill="none" stroke={EL_COLORS.water} strokeWidth="6" className="opacity-70" strokeLinecap="round" />
            </svg>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        <p className="text-sm text-foreground/70 tracking-[0.1em] text-center px-12 leading-loose">
          倾听经络的回响<br />寻找五音的共鸣
        </p>

        {error && <p className="mt-4 text-xs text-muted-foreground tracking-widest">{error}</p>}
      </div>
    </ScreenWrapper>
  );
}
