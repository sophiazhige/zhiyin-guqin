import React, { useState, useCallback, useRef } from "react";
import { User, Share2, ChevronLeft, Play, Pause, SkipBack, SkipForward, Music, Calendar, X } from "lucide-react";
import { PaperTexture, EL_COLORS } from "./components/SharedElements";
import { GuqinSVG } from "./components/GuqinSVG";
import { cn } from "../lib/utils";
import {
  ELEMENT_TONE_MAP, useAudioPlayer, useSharedAudio, AudioProvider, formatTime, recommendTracks, detectHighRisk,
} from "./store";
import type { Track } from "./store";

import { ScreenIntakeCardA, ScreenIntakeCardB, ScreenIntakeCardC, ScreenIntakeCardD, ScreenIntakeCardE, ScreenIntakeCardF } from "./components/screens/ScreenIntakeCards";
import { ScreenTransition } from "./components/screens/ScreenTransition";
import { ScreenMy } from "./components/screens/ScreenMy";
import { ScreenCare } from "./components/screens/ScreenCare";
import { ScreenHistory, ScreenFavorites, ScreenProgress } from "./components/screens/ScreenExtras";
import { ScreenDiagnosisResult } from "./components/screens/ScreenDiagnosisResult";
import { NavContext, PAGES, useNav } from "./navigation";
import { IntakeProvider, useIntake } from "./intake-context";

// --- Page flip animation wrapper ---

function PageFlip({
  currentPage,
  children,
}: {
  currentPage: number;
  children: React.ReactNode;
}) {
  const pages = React.Children.toArray(children);
  const [prev, setPrev] = useState<number | null>(null);
  const prevRef = useRef(currentPage);

  React.useEffect(() => {
    if (currentPage !== prevRef.current) {
      setPrev(prevRef.current);
      prevRef.current = currentPage;
      const t = setTimeout(() => setPrev(null), 400);
      return () => clearTimeout(t);
    }
  }, [currentPage]);

  const fwd = prev !== null && currentPage > prev;
  const back = prev !== null && currentPage < prev;

  return (
    <div className="relative w-[430px] h-[932px] overflow-hidden">
      {pages.map((page, i) => {
        const isActive = i === currentPage;
        const isLeaving = i === prev;
        if (!isActive && !isLeaving) return null;

        let s: React.CSSProperties = { position: "absolute", inset: 0 };

        if (isLeaving) {
          s.zIndex = 5;
          s.transform = fwd ? "translateX(-20%)" : "translateX(20%)";
          s.opacity = 0;
          s.transition = "transform 0.4s ease, opacity 0.4s ease";
        } else if (isActive && prev !== null) {
          s.zIndex = 10;
          s.animation = fwd
            ? "slideIn 0.4s ease forwards"
            : "slideInBack 0.4s ease forwards";
        } else {
          s.zIndex = 10;
        }

        return <div key={i} style={s}>{page}</div>;
      })}
      <style>{`
        @keyframes slideIn { from { transform: translateX(20%); opacity: .5; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInBack { from { transform: translateX(-20%); opacity: .5; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// --- Welcome Screen ---

function ScreenWelcome({ onStart, onProfile }: { onStart: () => void; onProfile: () => void }) {
  return (
    <div className="relative w-[430px] h-[932px] bg-background shadow-2xl shrink-0 flex flex-col items-center overflow-hidden font-serif">
      <PaperTexture />

      <div className="w-full flex justify-between items-center px-8 pt-12 z-10">
        <div className="flex flex-col gap-1 text-muted-foreground/80">
          <span className="text-[10px] tracking-[0.3em] uppercase">Zhiyin · 古琴疗愈</span>
        </div>
        <button
          onClick={onProfile}
          className="w-8 h-8 rounded-full border-[0.5px] border-border bg-card/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          <User className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>

      <div className="flex-1 w-full flex justify-center items-center relative z-10 mt-4 mb-4">
        <GuqinSVG className="h-[55vh] w-auto max-h-[480px] opacity-90 drop-shadow-lg" />
      </div>

      <div className="w-full px-8 pb-12 flex flex-col items-center z-10 pt-4" style={{ background: "linear-gradient(to top, var(--background) 0%, var(--background) 30%, color-mix(in srgb, var(--background) 60%, transparent) 65%, transparent 100%)" }}>
        <div className="flex items-center gap-6 mb-12 -mt-10">
          <div className="flex flex-col items-center">
            <h1 className="text-[3.5rem] font-medium tracking-[0.2em] text-primary mb-4 font-serif">知音</h1>
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-primary/80" />
              <span className="text-[11px] tracking-[0.2em] text-muted-foreground font-medium uppercase">音乐疗愈</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-foreground/70 leading-loose tracking-[0.1em] max-w-[280px]">
          古琴清音，静心凝神。<br />
          于丝桐之中，寻觅内心的宁静与共鸣。
        </p>

        <button
          onClick={onStart}
          className="mt-8 group relative px-12 py-3.5 overflow-hidden rounded-full border-[0.5px] border-primary/30 bg-primary text-primary-foreground opacity-80 transition-all duration-700 ease-out hover:opacity-100 hover:shadow-[0_14px_24px_rgba(163,53,41,0.18)] backdrop-blur-sm"
        >
          <span className="relative z-10 tracking-[0.3em] text-sm ml-1">开启疗愈</span>
        </button>
      </div>
    </div>
  );
}

// --- Track Card (for prescription) ---

function PrescriptionTrackCard({ track, onPlay }: { track: Track; onPlay: (t: Track) => void }) {
  const elInfo = ELEMENT_TONE_MAP[track.element as keyof typeof ELEMENT_TONE_MAP];
  const elLabels: Record<string, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
  const elLabel = elLabels[track.element] || "木";
  return (
    <div className="border-b-[0.5px] border-border py-5 flex items-center justify-between cursor-pointer hover:bg-card/30 transition-colors" onClick={() => onPlay(track)}>
      <div>
        <div className="font-serif text-xl text-foreground mb-1">{track.title}</div>
        <div className="text-[11px] text-card-foreground tracking-[0.1em]">{track.effect}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 border-[0.5px] rounded-sm" style={{ borderColor: elInfo?.color }}>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: elInfo?.color }} />
          <span className="text-[10px] tracking-widest font-sans" style={{ color: elInfo?.color }}>{elLabel}·{track.mode}调</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-sans tracking-wider">{formatTime(track.durationSec)}</span>
      </div>
    </div>
  );
}

// --- Prescription Screen (redesigned) ---

function ScreenPrescription({ audio, onNext }: { audio: ReturnType<typeof useAudioPlayer>; onNext: () => void }) {
  const nav = useNav();
  const { diagnosis } = useIntake();
  const element = diagnosis?.element || "wood";
  const elInfo = ELEMENT_TONE_MAP[element as keyof typeof ELEMENT_TONE_MAP];
  const tracks = diagnosis?.tracks.length ? diagnosis.tracks : recommendTracks(element, 3);
  const courseTracks = diagnosis?.courseTracks.length ? diagnosis.courseTracks : recommendTracks(element, 7);
  const [showCourse, setShowCourse] = useState(false);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  const generateShareCard = useCallback(() => {
    const canvas = document.createElement("canvas");
    const W = 900, H = 1200;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#F5F0EB";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#D5CFC8";
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.fillStyle = "#3D3530";
    ctx.font = "bold 52px serif";
    ctx.textAlign = "center";
    ctx.fillText("古琴处方笺", W / 2, 140);

    ctx.strokeStyle = "#D5CFC8";
    ctx.beginPath();
    ctx.moveTo(150, 185);
    ctx.lineTo(W - 150, 185);
    ctx.stroke();

    const elColor = elInfo?.color || "#7C9A78";
    ctx.fillStyle = "#B5564A";
    ctx.font = "40px serif";
    ctx.fillText(diagnosis?.syndrome || "气机偏郁", W / 2, 270);

    ctx.fillStyle = "#8A7F75";
    ctx.font = "24px sans-serif";
    ctx.fillText(
      `宜听${elInfo?.tone || "角"}调${diagnosis?.principle || "舒展"}`,
      W / 2, 320
    );

    ctx.strokeStyle = "#D5CFC8";
    ctx.beginPath();
    ctx.moveTo(150, 370);
    ctx.lineTo(W - 150, 370);
    ctx.stroke();

    ctx.textAlign = "left";
    tracks.forEach((track, i) => {
      const y = 450 + i * 140;
      ctx.fillStyle = "#3D3530";
      ctx.font = "36px serif";
      ctx.fillText(track.title, 100, y);

      ctx.fillStyle = "#8A7F75";
      ctx.font = "20px sans-serif";
      ctx.fillText(track.effect, 100, y + 45);

      ctx.fillStyle = elColor;
      ctx.font = "18px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${track.mode}调 · ${formatTime(track.durationSec)}`, W - 100, y);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = "#B0A89E";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("知音 · 古琴疗愈", W / 2, H - 80);

    setShareImageUrl(canvas.toDataURL("image/png"));
  }, [diagnosis, tracks, elInfo]);

  const handleDownloadShare = useCallback(() => {
    if (!shareImageUrl) return;
    const a = document.createElement("a");
    a.href = shareImageUrl;
    a.download = "古琴处方笺.png";
    a.click();
  }, [shareImageUrl]);

  const handlePlayTrack = (track: Track) => {
    audio.play(track);
    onNext();
  };

  return (
    <div className="relative w-[430px] h-[932px] bg-background shadow-2xl shrink-0 flex flex-col px-8 py-16 overflow-hidden font-serif">
      <PaperTexture />
      <div className="z-10 flex flex-col h-full items-center overflow-y-auto hide-scrollbar">

        {/* Header with share */}
        <div className="w-full flex justify-between items-center mb-10 mt-4 text-muted-foreground">
          <button onClick={() => nav.goPrev()} className="flex items-center gap-1 text-foreground hover:text-foreground/70 transition-colors">
            <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase font-sans">Prescription</div>
          <button onClick={generateShareCard} className="w-8 h-8 rounded-full border-[0.5px] border-border bg-card/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="w-full flex-1 bg-card/60 backdrop-blur-sm border-[0.5px] border-border rounded-sm shadow-sm flex flex-col p-8 mb-8 relative">

          <h2 className="text-center font-serif text-3xl text-foreground mb-10 tracking-widest mt-2">古琴处方笺</h2>

          {/* Diagnosis section */}
          <div className="border-y-[0.5px] border-border py-8 mb-8 flex flex-col items-center relative">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-[-12deg] border-[0.5px] border-primary text-primary text-[10px] p-1 font-bold tracking-widest">辨证</div>
            <h3 className="text-xl tracking-[0.2em] mb-4 font-medium text-center" style={{ color: EL_COLORS.fire }}>
              {diagnosis?.syndrome || "气机偏郁"}
            </h3>
            <p className="text-sm text-muted-foreground tracking-[0.15em] text-center">
              宜听{elInfo?.tone || "角"}调{diagnosis?.principle || "舒展"}
            </p>
          </div>

          {/* Track list */}
          <div className="flex flex-col flex-1">
            {tracks.map((track) => (
              <PrescriptionTrackCard
                key={track.id}
                track={track}
                onPlay={handlePlayTrack}
              />
            ))}
          </div>

          {/* Recommended course section */}
          <div className="mt-6 pt-6 border-t-[0.5px] border-border border-dashed w-full">
            <div className="text-xs text-muted-foreground tracking-[0.2em] mb-4 text-center">推荐音愈疗程</div>
            <div
              onClick={() => setShowCourse(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-background/40 border-[0.5px] border-border/50 hover:bg-background/80 transition-colors cursor-pointer"
            >
              <div className="text-left">
                <div className="font-serif text-foreground tracking-widest text-sm mb-1">{elInfo?.label || "肝木疏达"}七日定音</div>
                <div className="text-[10px] text-muted-foreground tracking-wider">包含 7 首曲目 · 每日 15 分钟</div>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground -rotate-90" />
            </div>

            {/* Add to calendar */}
            <button
              onClick={() => setAddedToCalendar(!addedToCalendar)}
              className={cn(
                "w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border-[0.5px] transition-colors text-sm tracking-widest",
                addedToCalendar
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border/50 bg-background/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="w-4 h-4 stroke-[1.5]" />
              <span>{addedToCalendar ? "已加入日历" : "加入日历提醒"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Course popup */}
      {showCourse && (
        <div className="absolute inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full bg-background rounded-t-2xl border-t-[0.5px] border-border shadow-2xl p-8 pb-12 max-h-[70%] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl text-foreground tracking-widest">{elInfo?.label || "肝木疏达"}七日定音</h3>
              <button onClick={() => setShowCourse(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground tracking-[0.1em] mb-6">包含 7 首曲目 · 每日 15 分钟 · 循序渐进调和五脏</p>
            <div className="flex flex-col">
              {courseTracks.map((track, i) => (
                <div
                  key={track.id}
                  onClick={() => { handlePlayTrack(track); setShowCourse(false); }}
                  className="flex items-center justify-between py-4 px-2 cursor-pointer hover:bg-card/50 transition-colors border-b-[0.5px] border-border/30 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground/50 font-sans w-6">第{i + 1}日</span>
                    <div>
                      <span className="text-sm tracking-widest text-foreground">{track.title}</span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{track.effect}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground font-sans">{formatTime(track.durationSec)}</span>
                    <Play className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {shareImageUrl && (
        <div className="absolute inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex flex-col items-center justify-center px-8">
          <div className="bg-background rounded-2xl shadow-2xl p-4 flex flex-col items-center max-w-[340px] w-full">
            <img src={shareImageUrl} alt="处方笺" className="w-full rounded-lg shadow-sm" style={{ aspectRatio: "3/4" }} />
            <div className="flex gap-4 mt-4 w-full">
              <button
                onClick={handleDownloadShare}
                className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm tracking-widest hover:opacity-90 transition-opacity"
              >
                保存图片
              </button>
              <button
                onClick={() => setShareImageUrl(null)}
                className="flex-1 py-3 rounded-full border-[0.5px] border-border text-foreground text-sm tracking-widest hover:bg-card/60 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Player Screen ---

function ScreenPlayer({ audio }: { audio: ReturnType<typeof useAudioPlayer> }) {
  const nav = useNav();
  const track = audio.currentTrack;
  const title = track?.title || "平沙落雁";

  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const wasPlayingRef = useRef(false);

  const handleOpenChat = useCallback(() => {
    wasPlayingRef.current = audio.isPlaying;
    if (audio.isPlaying) audio.togglePlay();
    setShowVoiceChat(true);
  }, [audio]);

  const handleCloseChat = useCallback(() => {
    setShowVoiceChat(false);
    if (wasPlayingRef.current && !audio.isPlaying) audio.togglePlay();
  }, [audio]);

  return (
    <div className="relative w-[430px] h-[932px] bg-background shadow-2xl shrink-0 flex flex-col px-8 py-14 overflow-hidden font-serif">
      <PaperTexture />

      {showVoiceChat && (
        <VoiceChatOverlay onClose={handleCloseChat} currentTrackId={track?.id} />
      )}

      <div className="z-10 flex flex-col items-center h-full">
        <div className="w-full flex justify-between items-center mb-16 mt-2 text-muted-foreground">
          <button onClick={() => nav.goPrev()} className="flex items-center gap-1 text-foreground hover:text-foreground/70 transition-colors">
            <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase font-sans">Playing</div>
          <button
            onClick={() => nav.goTo(PAGES.MY)}
            className="w-8 h-8 rounded-full border-[0.5px] border-border bg-card/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        <style>{`
          @keyframes playerRipple1 { 0% { transform: scale(1); opacity: 0.3; } 100% { transform: scale(1.8); opacity: 0; } }
          @keyframes playerRipple2 { 0% { transform: scale(1); opacity: 0.25; } 100% { transform: scale(2.0); opacity: 0; } }
          @keyframes playerRipple3 { 0% { transform: scale(1); opacity: 0.2; } 100% { transform: scale(2.2); opacity: 0; } }
        `}</style>
        <div className="relative w-60 h-60 flex items-center justify-center mb-10">
          {audio.isPlaying && (
            <>
              <div className="absolute inset-0 rounded-full border-[0.5px] border-primary/40" style={{ animation: "playerRipple1 3s ease-out infinite" }} />
              <div className="absolute inset-0 rounded-full border-[0.5px] border-primary/30" style={{ animation: "playerRipple2 3s ease-out 1s infinite" }} />
              <div className="absolute inset-0 rounded-full border-[0.5px] border-primary/20" style={{ animation: "playerRipple3 3s ease-out 2s infinite" }} />
            </>
          )}
          <div className="absolute inset-0 bg-wood/5 rounded-full blur-2xl scale-[2]" />
          <div className={cn("absolute inset-0 border-[0.5px] border-border rounded-full opacity-20 scale-[1.6]", audio.isPlaying && "animate-pulse")} style={{ animationDuration: "3s" }} />
          <div className="absolute inset-2 border-[0.5px] border-border rounded-full opacity-40 scale-[1.2]" />
          <div className="absolute inset-6 border-[0.5px] border-border/60 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              {title.length <= 3 ? (
                <div className="font-serif text-[2.6rem] text-foreground leading-none drop-shadow-sm tracking-[0.1em]">{title}</div>
              ) : title.length === 4 ? (
                <>
                  <div className="font-serif text-[2.6rem] text-foreground leading-none drop-shadow-sm tracking-[0.1em] -translate-x-1.5">{title.slice(0, 2)}</div>
                  <div className="font-serif text-[2.6rem] text-foreground leading-none drop-shadow-sm tracking-[0.1em] translate-x-1.5 mt-1">{title.slice(2)}</div>
                </>
              ) : (
                <>
                  <div className="font-serif text-[2.2rem] text-foreground leading-none drop-shadow-sm tracking-[0.08em] -translate-x-1">{title.slice(0, Math.ceil(title.length / 2))}</div>
                  <div className="font-serif text-[2.2rem] text-foreground leading-none drop-shadow-sm tracking-[0.08em] translate-x-1 mt-1">{title.slice(Math.ceil(title.length / 2))}</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="absolute right-10 top-[28%] text-muted-foreground/30 text-lg leading-[2.5] tracking-[0.5em]" style={{ writingMode: "vertical-rl" }}>
          大九七 · 勾一 · 历二三
        </div>

        <div className="flex-1" />

        <div className="w-full mb-10">
          <div className="h-[0.5px] w-full bg-border relative cursor-pointer" onClick={(e) => {
            if (!audio.duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            audio.seek(((e.clientX - rect.left) / rect.width) * audio.duration);
          }}>
            <div className="absolute left-0 top-0 h-[1.5px] bg-primary shadow-[0_0_8px_rgba(163,53,41,0.5)]" style={{ width: audio.duration ? `${(audio.currentTime / audio.duration) * 100}%` : "0%" }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" style={{ left: audio.duration ? `${(audio.currentTime / audio.duration) * 100}%` : "0%" }} />
          </div>
          <div className="flex justify-between w-full mt-4 text-[10px] text-muted-foreground font-sans tracking-wider">
            <span>{formatTime(audio.currentTime)}</span>
            <span>{formatTime(audio.duration || track?.durationSec || 0)}</span>
          </div>
        </div>

        <div className="w-full flex justify-center items-center gap-12 mb-8">
          <button className="text-foreground/70 hover:text-foreground transition-colors"><SkipBack className="w-6 h-6 stroke-[1.5]" /></button>
          <button onClick={audio.togglePlay} className="w-16 h-16 rounded-full border-[0.5px] border-primary text-primary flex items-center justify-center hover:bg-primary/5 transition-colors">
            {audio.isPlaying ? <Pause className="w-6 h-6 stroke-[1]" fill="currentColor" fillOpacity={0.1} /> : <Play className="w-6 h-6 stroke-[1] ml-1" fill="currentColor" fillOpacity={0.1} />}
          </button>
          <button className="text-foreground/70 hover:text-foreground transition-colors"><SkipForward className="w-6 h-6 stroke-[1.5]" /></button>
        </div>

        <div className="w-full flex items-center justify-end pt-4 border-t-[0.5px] border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/80 tracking-[0.15em] font-serif">与琴师畅聊更换曲目</span>
            <button
              onClick={handleOpenChat}
              className="w-10 h-10 rounded-full border-[0.5px] border-border bg-card/40 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
                <path d="M12 4v16M8 9v6M16 9v6M4 12v2M20 12v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Voice Chat Overlay ---

function VoiceChatOverlay({ onClose, currentTrackId }: { onClose: () => void; currentTrackId?: string }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "speaking">("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const STEPFUN_API_KEY = import.meta.env.VITE_STEPFUN_API_KEY || "";

  const startConversation = useCallback(async () => {
    setStatus("connecting");
    setTranscript("");
    setReply("");
    setErrorMsg("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      mediaStreamRef.current = stream;

      const wsUrl = `wss://api.stepfun.com/v1/realtime?model=step-audio-2&authorization=${encodeURIComponent("bearer " + STEPFUN_API_KEY)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: `你是知音古琴疗愈的琴师，一位温文尔雅的女生。你正在和用户进行语音对话。
用户正在听古琴音乐进行疗愈。请用温柔、诗意、有共情力的语气和用户交流。
如果用户想换曲目，根据他的情绪推荐合适的古琴曲。
回复简短温暖，不超过50字。`,
            voice: "linjiajiejie",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: { type: "server_vad", silence_duration_ms: 800 },
          },
        }));

        setStatus("listening");

        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(inputData[i] * 32767)));
          }
          const uint8 = new Uint8Array(pcm16.buffer);
          let binary = "";
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: btoa(binary) }));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      const audioChunks: string[] = [];

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "error") {
          console.error("StepFun WS error:", msg);
          setErrorMsg(msg.error?.message || "语音服务异常");
          setStatus("idle");
          return;
        }
        if (msg.type === "input_audio_buffer.speech_started") {
          setStatus("listening");
        }
        if (msg.type === "input_audio_buffer.speech_stopped") {
          setStatus("speaking");
        }
        if (msg.type === "response.text.delta") {
          setReply((prev) => prev + (msg.delta || ""));
        }
        if (msg.type === "response.audio.delta") {
          audioChunks.push(msg.delta);
        }
        if (msg.type === "response.done") {
          setStatus("listening");
          if (audioChunks.length > 0) {
            playAudioChunks(audioChunks.splice(0));
          }
        }
        if (msg.type === "conversation.item.input_audio_transcription.completed") {
          setTranscript(msg.transcript || "");
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMsg("连接语音服务失败");
        setStatus("idle");
      };
      ws.onclose = (e) => {
        if (e.code !== 1000) {
          console.error("WebSocket closed:", e.code, e.reason);
          setErrorMsg(`连接断开 (${e.code})`);
        }
        setStatus("idle");
      };
    } catch (e) {
      console.error("Voice chat error:", e);
      setErrorMsg("无法获取麦克风权限");
      setStatus("idle");
    }
  }, []);

  const playAudioChunks = (chunks: string[]) => {
    try {
      const combined = atob(chunks.join(""));
      const bytes = new Uint8Array(combined.length);
      for (let i = 0; i < combined.length; i++) bytes[i] = combined.charCodeAt(i);
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;

      const ctx = new AudioContext({ sampleRate: 24000 });
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch { /* silent */ }
  };

  const stopConversation = useCallback(() => {
    wsRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    setStatus("idle");
  }, []);

  const handleClose = () => {
    stopConversation();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center px-8">
      <button onClick={handleClose} className="absolute top-16 right-8 text-muted-foreground hover:text-foreground text-sm tracking-widest">
        关闭
      </button>

      <div className="mb-12 text-center">
        <h3 className="font-serif text-2xl text-foreground tracking-widest mb-4">与琴师畅聊</h3>
        <p className="text-xs text-muted-foreground tracking-[0.1em]">
          {status === "idle" && "点击下方按钮开始对话"}
          {status === "connecting" && "正在连接琴师..."}
          {status === "listening" && "琴师在聆听你的声音..."}
          {status === "speaking" && "琴师正在回复..."}
        </p>
      </div>

      <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
        <div className={cn(
          "absolute inset-0 rounded-full border-[0.5px] border-primary/30 transition-all duration-1000",
          status === "listening" && "scale-[1.3] opacity-50 animate-pulse",
          status === "speaking" && "scale-[1.5] opacity-30 animate-ping",
        )} />
        <div className={cn(
          "absolute inset-4 rounded-full border-[0.5px] border-primary/50 transition-all duration-700",
          status === "listening" && "scale-110 animate-pulse",
        )} />
        <button
          onClick={status === "idle" ? startConversation : stopConversation}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all",
            status === "idle" ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-red-500/80 text-white",
          )}
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>
      </div>

      {transcript && (
        <div className="w-full mb-4 p-4 rounded-xl bg-card/40 border-[0.5px] border-border">
          <div className="text-[10px] text-muted-foreground tracking-widest mb-2">你说的</div>
          <div className="text-sm text-foreground tracking-[0.08em] leading-relaxed">{transcript}</div>
        </div>
      )}
      {reply && (
        <div className="w-full p-4 rounded-xl bg-primary/5 border-[0.5px] border-primary/20">
          <div className="text-[10px] text-primary/60 tracking-widest mb-2">琴师</div>
          <div className="text-sm text-foreground tracking-[0.08em] leading-relaxed">{reply}</div>
        </div>
      )}
      {errorMsg && (
        <div className="w-full mt-4 p-3 rounded-xl bg-red-50 border-[0.5px] border-red-200">
          <div className="text-xs text-red-600 tracking-[0.08em] text-center">{errorMsg}</div>
        </div>
      )}
    </div>
  );
}

// --- Main App ---

const MAIN_FLOW_MAX = PAGES.PLAYER;

export default function App() {
  const audio = useAudioPlayer();
  const [page, setPage] = useState(0);

  const goTo = useCallback((target: number) => {
    setPage(target);
  }, []);

  const next = useCallback(() => setPage((p) => Math.min(p + 1, MAIN_FLOW_MAX)), []);
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);

  const navValue = { goNext: next, goPrev: prev, goTo, currentPage: page };

  const isMainFlow = page <= MAIN_FLOW_MAX;

  return (
    <IntakeProvider>
    <AudioProvider value={audio}>
    <NavContext.Provider value={navValue}>
    <div className="min-h-screen bg-[#1F1A17] flex items-center justify-center p-12 overflow-hidden">
      <PageFlip currentPage={page}>
        {/* 0: Welcome */}
        <ScreenWelcome onStart={next} onProfile={() => goTo(PAGES.MY)} />
        {/* 1: 生辰与称呼 */}
        <ScreenIntakeCardD />
        {/* 2: 身体 */}
        <ScreenIntakeCardA />
        {/* 3: 心绪 */}
        <ScreenIntakeCardB />
        {/* 4: 入睡 */}
        <ScreenIntakeCardC />
        {/* 5: 琴师细说 */}
        <ScreenIntakeCardF />
        {/* 6: 回响 */}
        <ScreenIntakeCardE />
        {/* 7: 辨证中 */}
        <ScreenTransition />
        {/* 8: 辨证结果 */}
        <ScreenDiagnosisResult />
        {/* 9: 处方笺 */}
        <ScreenPrescription audio={audio} onNext={() => goTo(PAGES.PLAYER)} />
        {/* 10: 播放器 */}
        <ScreenPlayer audio={audio} />
        {/* 11: 个人中心 */}
        <ScreenMy />
        {/* 12: 历史 */}
        <ScreenHistory />
        {/* 13: 收藏 */}
        <ScreenFavorites />
        {/* 14: 进度 */}
        <ScreenProgress />
        {/* 15: 关怀 */}
        <ScreenCare />
      </PageFlip>

      {/* Navigation arrows — only for main flow */}
      {isMainFlow && page > 0 && (
        <button onClick={prev} className="fixed left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 flex items-center justify-center transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {isMainFlow && page < MAIN_FLOW_MAX && (
        <button onClick={next} className="fixed right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 flex items-center justify-center transition-all">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
      )}

      {/* Page progress bar — only for main flow */}
      {isMainFlow && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-48">
          <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/50 rounded-full transition-all duration-500"
              style={{ width: `${(page / MAIN_FLOW_MAX) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
    </NavContext.Provider>
    </AudioProvider>
    </IntakeProvider>
  );
}
