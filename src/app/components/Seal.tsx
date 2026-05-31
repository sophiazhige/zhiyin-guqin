import React from "react";
import { cn } from "../../lib/utils";

interface SealProps {
  text: string;
  className?: string;
}

export function Seal({ text, className }: SealProps) {
  // Assuming 2 characters for "知音"
  const chars = text.split("");

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-3 w-16 h-24 bg-transparent border-4 border-primary rounded-sm overflow-hidden",
        "after:content-[''] after:absolute after:inset-0 after:border-[1px] after:border-primary/50 after:m-1 after:rounded-sm",
        className
      )}
      style={{
        // Using a combination of fonts to try and get a traditional feel
        fontFamily: '"Ma Shan Zheng", "Noto Serif SC", "STZhongsong", serif',
        // Slight rotation for that hand-stamped look
        transform: "rotate(-2deg)",
        boxShadow: "0 0 0 1px rgba(200, 54, 46, 0.2) inset, 0 0 5px rgba(200, 54, 46, 0.4)",
      }}
    >
      {/* Textured background overlay to simulate ink/paper interaction */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />
      <div className="flex flex-col gap-1 z-10 text-primary font-bold tracking-widest text-2xl" style={{ writingMode: 'vertical-rl' }}>
        {chars.map((char, i) => (
          <span key={i} className="block leading-none" style={{ transform: "scaleY(1.2)" }}>
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
