import React from "react";

export const EL_COLORS = {
  wood: '#7C9A78',
  fire: '#B5564A',
  earth: '#BE9A4F',
  metal: '#D8CDB5',
  water: '#5B6E7A',
  mood: {
    happy: '#D9A441',
    anxious: '#7C9A78',
    depressed: '#5B6E7A',
    peaceful: '#E6DCC6'
  }
} as const;

export function PaperTexture() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-multiply" 
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat'
      }}
    />
  );
}

// Wrapper for typical screen setup
export function ScreenWrapper({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative w-[430px] h-[932px] bg-background shadow-2xl shrink-0 flex flex-col overflow-hidden font-serif ${className}`}>
      <PaperTexture />
      {children}
    </div>
  );
}
