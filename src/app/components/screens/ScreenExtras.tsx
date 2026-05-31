import React, { useState } from "react";
import { ScreenWrapper } from "../SharedElements";
import { ChevronLeft, Heart, Play, Pause, Clock, Search, CheckCircle2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { TRACK_LIBRARY, formatTime, useSharedAudio } from "../../store";
import type { Track } from "../../store";
import { useNav, PAGES } from "../../navigation";

// --- History Screen ---

interface HistoryEntry {
  id: string;
  track: Track;
  playedAt: string;
  listenedSec: number;
}

function generateHistory(): HistoryEntry[] {
  const now = new Date();
  return TRACK_LIBRARY.slice(0, 8).map((track, i) => {
    const d = new Date(now.getTime() - i * 86400000 * (1 + Math.random()));
    const hours = 8 + Math.floor(Math.random() * 14);
    const mins = Math.floor(Math.random() * 60);
    return {
      id: `hist-${i}`,
      track,
      playedAt: i === 0
        ? `今天 ${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
        : i === 1
          ? `昨天 ${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
          : `${d.getMonth() + 1}月${d.getDate()}日 ${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`,
      listenedSec: Math.floor(track.durationSec * (0.3 + Math.random() * 0.7)),
    };
  });
}

export function ScreenHistory() {
  const nav = useNav();
  const [history] = useState(generateHistory);
  const audio = useSharedAudio();

  const handlePlay = (track: Track) => {
    audio.play(track);
    nav.goTo(PAGES.PLAYER);
  };

  return (
    <ScreenWrapper className="bg-background flex flex-col">
      <div className="z-10 flex flex-col h-full overflow-y-auto hide-scrollbar pb-12">
        <div className="w-full flex justify-between items-center px-8 pt-16 pb-8 sticky top-0 bg-background/90 backdrop-blur-sm z-20">
          <button onClick={() => nav.goTo(PAGES.MY)} className="text-foreground hover:text-foreground/70">
            <ChevronLeft className="w-6 h-6 stroke-[1.5]" />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase font-sans text-muted-foreground">History</div>
          <Search className="w-5 h-5 stroke-[1.5] text-foreground" />
        </div>

        <div className="px-8 mb-8">
          <h2 className="font-serif text-3xl text-foreground tracking-widest mb-2">历史播放</h2>
          <p className="text-xs text-muted-foreground tracking-[0.1em]">
            累计 {history.length} 次聆听 · 余音绕梁，昨日重现
          </p>
        </div>

        <div className="px-8 flex flex-col gap-6">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => handlePlay(entry.track)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full border-[0.5px] border-border flex items-center justify-center transition-colors",
                  audio.currentTrack?.id === entry.track.id && audio.isPlaying
                    ? "bg-primary/10 text-primary"
                    : "bg-card/60 text-muted-foreground group-hover:text-primary"
                )}>
                  {audio.currentTrack?.id === entry.track.id && audio.isPlaying
                    ? <Pause className="w-4 h-4" />
                    : <Play className="w-4 h-4 ml-0.5 fill-foreground/20 stroke-[1.5]" />
                  }
                </div>
                <div>
                  <div className="font-serif text-[15px] tracking-wider text-foreground mb-1">{entry.track.title}</div>
                  <div className="text-[10px] text-muted-foreground tracking-[0.1em]">{entry.track.effect}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-foreground/60 tracking-wider mb-1 font-sans">{entry.playedAt}</div>
                <div className="text-[10px] text-muted-foreground/50 tracking-wider font-sans flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" /> {formatTime(entry.listenedSec)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenWrapper>
  );
}

// --- Favorites Screen ---

export function ScreenFavorites() {
  const nav = useNav();
  const [favorites, setFavorites] = useState<Track[]>(() => TRACK_LIBRARY.slice(0, 5));
  const audio = useSharedAudio();

  const handlePlay = (track: Track) => {
    audio.play(track);
    nav.goTo(PAGES.PLAYER);
  };

  const removeFavorite = (trackId: string) => {
    setFavorites((prev) => prev.filter((t) => t.id !== trackId));
  };

  return (
    <ScreenWrapper className="bg-background flex flex-col">
      <div className="z-10 flex flex-col h-full overflow-y-auto hide-scrollbar pb-12">
        <div className="w-full flex justify-between items-center px-8 pt-16 pb-8 sticky top-0 bg-background/90 backdrop-blur-sm z-20">
          <button onClick={() => nav.goTo(PAGES.MY)} className="text-foreground hover:text-foreground/70">
            <ChevronLeft className="w-6 h-6 stroke-[1.5]" />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase font-sans text-muted-foreground">Favorites</div>
          <div className="w-5" />
        </div>

        <div className="px-8 mb-8">
          <h2 className="font-serif text-3xl text-foreground tracking-widest mb-2">我的收藏</h2>
          <p className="text-xs text-muted-foreground tracking-[0.1em]">
            {favorites.length} 首 · 心之所向，皆在此处
          </p>
        </div>

        <div className="px-8 flex flex-col gap-4">
          {favorites.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-4 rounded-xl border-[0.5px] border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-colors cursor-pointer"
              onClick={() => handlePlay(track)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full border-[0.5px] border-border flex items-center justify-center transition-colors",
                  audio.currentTrack?.id === track.id && audio.isPlaying ? "text-primary" : "text-muted-foreground"
                )}>
                  {audio.currentTrack?.id === track.id && audio.isPlaying
                    ? <Pause className="w-3.5 h-3.5" />
                    : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  }
                </div>
                <div>
                  <div className="font-serif text-lg tracking-widest text-foreground mb-1">{track.title}</div>
                  <div className="text-[11px] text-muted-foreground tracking-[0.1em]">{track.effect} · {formatTime(track.durationSec)}</div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFavorite(track.id); }}
                className="p-2 -mr-2 rounded-full hover:bg-background transition-colors"
              >
                <Heart className="w-5 h-5 fill-primary stroke-primary text-primary" />
              </button>
            </div>
          ))}

          {favorites.length === 0 && (
            <div className="text-center py-20 text-muted-foreground/60 text-sm tracking-widest">
              暂无收藏
            </div>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );
}

// --- Progress Screen ---

export function ScreenProgress() {
  const nav = useNav();
  const STAGES = [
    { id: 1, title: "初识 · 疏解", desc: "以角音疏肝理气，缓解表层烦躁。配曲：流水、庄周梦蝶、醉渔唱晚。", date: "10.15 - 10.28", status: "completed" as const, tracks: TRACK_LIBRARY.filter(t => t.element === "wood").slice(0, 3) },
    { id: 2, title: "渐入 · 平复", desc: "佐以羽调安抚心神，改善睡眠质量。配曲：乌夜啼、太古引、雉朝飞。", date: "10.29 - 11.12", status: "current" as const, tracks: TRACK_LIBRARY.filter(t => t.element === "water").slice(0, 3) },
    { id: 3, title: "深融 · 固本", desc: "宫音培土，固本培元，达到长期平和。配曲：梅花三弄、山居吟、阳春。", date: "11.13 - 11.27", status: "upcoming" as const, tracks: TRACK_LIBRARY.filter(t => t.element === "earth").slice(0, 3) },
  ];

  const [expandedStage, setExpandedStage] = useState<number | null>(2);
  const audio = useSharedAudio();
  const totalSessions = 26;
  const completedSessions = 14;

  return (
    <ScreenWrapper className="bg-background flex flex-col">
      <div className="z-10 flex flex-col h-full overflow-y-auto hide-scrollbar pb-12">
        <div className="w-full flex justify-between items-center px-8 pt-16 pb-8 sticky top-0 bg-background/90 backdrop-blur-sm z-20">
          <button onClick={() => nav.goTo(PAGES.MY)} className="text-foreground hover:text-foreground/70">
            <ChevronLeft className="w-6 h-6 stroke-[1.5]" />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase font-sans text-muted-foreground">Progress</div>
          <div className="w-6 h-6" />
        </div>

        <div className="px-8 mb-6">
          <h2 className="font-serif text-3xl text-foreground tracking-widest mb-2">疗程进度</h2>
          <p className="text-xs text-muted-foreground tracking-[0.1em]">
            累计 {completedSessions}/{totalSessions} 次 · 七弦为药，循序渐进
          </p>
        </div>

        {/* Overall progress */}
        <div className="px-8 mb-8">
          <div className="flex justify-between text-[10px] text-foreground/60 mb-2 font-sans tracking-widest">
            <span>总体进度</span>
            <span className="text-primary font-medium">{Math.round((completedSessions / totalSessions) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${(completedSessions / totalSessions) * 100}%` }} />
          </div>
        </div>

        <div className="px-8 relative">
          <div className="absolute left-[45px] top-4 bottom-8 w-[1px] bg-border/50" />

          <div className="flex flex-col gap-10">
            {STAGES.map((stage) => {
              const isCompleted = stage.status === "completed";
              const isCurrent = stage.status === "current";
              const isUpcoming = stage.status === "upcoming";
              const isExpanded = expandedStage === stage.id;

              return (
                <div key={stage.id} className="relative flex items-start gap-6">
                  <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center bg-background shrink-0 mt-0.5">
                    {isCompleted && <CheckCircle2 className="w-6 h-6 text-primary/60" />}
                    {isCurrent && (
                      <div className="w-6 h-6 rounded-full border border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                    {isUpcoming && <div className="w-4 h-4 rounded-full border-[1.5px] border-border" />}
                  </div>

                  <div className={cn("flex-1 flex flex-col pt-1", isUpcoming ? "opacity-50" : "opacity-100")}>
                    <div
                      className="flex items-end justify-between mb-2 cursor-pointer"
                      onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                    >
                      <h3 className="font-serif text-[15px] tracking-wider text-foreground font-medium">{stage.title}</h3>
                      <span className="text-[9px] text-muted-foreground tracking-widest font-sans">{stage.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/80 tracking-[0.1em] leading-relaxed">{stage.desc}</p>

                    {isCurrent && (
                      <div className="mt-5 mb-2">
                        <div className="flex justify-between text-[10px] text-foreground/60 mb-2 font-sans tracking-widest">
                          <span>阶段进度</span>
                          <span className="text-primary font-medium">60%</span>
                        </div>
                        <div className="h-1 w-full bg-border/40 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full w-[60%]" />
                        </div>
                      </div>
                    )}

                    {/* Expanded track list */}
                    {isExpanded && stage.tracks.length > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        {stage.tracks.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => { audio.play(track); nav.goTo(PAGES.PLAYER); }}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-card/30 hover:bg-card/60 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Play className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs tracking-widest text-foreground">{track.title}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-sans">{formatTime(track.durationSec)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
}
