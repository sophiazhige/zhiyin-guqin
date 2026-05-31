export function GuqinSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 800" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="guqin-body" x1="0" y1="0" x2="200" y2="800" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3d3426" />
          <stop offset="1" stopColor="#1a1510" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="10" dy="15" stdDeviation="15" floodColor="#2d2416" floodOpacity="0.4"/>
        </filter>
      </defs>

      {/* Main Body */}
      <path 
        d="M 60 120 
           C 60 90, 80 70, 100 70 
           C 120 70, 140 90, 140 120 
           L 140 400 
           C 140 420, 135 430, 135 450 
           L 135 700 
           C 135 730, 120 750, 100 750 
           C 80 750, 65 730, 65 700 
           L 65 450 
           C 65 430, 60 420, 60 400 
           Z" 
        fill="url(#guqin-body)" 
        filter="url(#shadow)"
      />

      {/* Inner Resonance Board */}
      <path 
        d="M 70 130 
           C 70 100, 85 85, 100 85 
           C 115 85, 130 100, 130 130 
           L 130 395 
           C 130 415, 125 425, 125 445 
           L 125 690 
           C 125 710, 115 725, 100 725 
           C 85 725, 75 710, 75 690 
           L 75 445 
           C 75 425, 70 415, 70 395 
           Z" 
        fill="#2d2416" 
      />

      {/* Yue Shan (Bridge) */}
      <rect x="65" y="140" width="70" height="8" rx="2" fill="#1a1510" />
      {/* Long Yin (Tail Bridge) */}
      <rect x="70" y="680" width="60" height="6" rx="2" fill="#1a1510" />

      {/* Strings (7 strings) */}
      {[...Array(7)].map((_, i) => {
        // Strings get closer together at the tail
        const xHead = 75 + i * 8.3;
        const xTail = 82 + i * 6;
        return (
          <line 
            key={`string-${i}`} 
            x1={xHead} 
            y1="144" 
            x2={xTail} 
            y2="680" 
            stroke="#e8dcc8" 
            strokeWidth={1.5 - i*0.1} 
            opacity={0.7} 
          />
        );
      })}

      {/* Hui (13 dots - arranged proportionally) */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num, i) => {
        // Approximate positions for the 13 hui
        const spacing = 38;
        const y = 200 + i * spacing;
        return (
          <circle 
            key={`hui-${i}`} 
            cx="135" 
            cy={y} 
            r="2.5" 
            fill="#d4a574" 
            opacity={num === 7 ? 1 : 0.6} // 7th hui is usually the center and most prominent
          />
        );
      })}

    </svg>
  );
}
