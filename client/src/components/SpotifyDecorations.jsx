import React, { useMemo } from 'react';

// Emojis flotantes grandes y dinámicos
export const FloatingEmojis = ({ emojis = ['🍿', '🎬', '🎟️', '⚡', '✨', '🏆', '🔥'], count = 12 }) => {
  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: `${(i * 19 + 7) % 90}%`,
      top: `${(i * 23 + 11) % 85}%`,
      size: `${2.2 + (i % 3) * 0.8}rem`,
      duration: `${3.2 + (i % 4) * 0.8}s`,
      delay: `${(i % 5) * 0.4}s`
    }));
  }, [emojis, count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      <style>{`
        @keyframes floatLively {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-24px) rotate(14deg) scale(1.18); }
        }
      `}</style>
      {items.map((item) => (
        <span
          key={item.id}
          className="absolute opacity-60 hover:opacity-100 transition-opacity"
          style={{
            left: item.left,
            top: item.top,
            fontSize: item.size,
            filter: 'drop-shadow(0 0 16px rgba(250, 204, 21, 0.6))',
            animation: `floatLively ${item.duration} ease-in-out infinite`,
            animationDelay: item.delay
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
};

// Patrón de puntos estilo Spotify
export const PolkaDotsOverlay = ({ color = '#facc15', opacity = 0.22 }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `radial-gradient(${color} 3.5px, transparent 3.5px)`,
        backgroundSize: '36px 36px',
        opacity,
      }}
    />
  );
};

// Estrella de explosión gráfica estilo Spotify ("Dejémonos de tanto...")
export const SpotifyStarburst = ({
  text,
  subtext,
  bgFill = '#f97316',
  textColor = '#ffffff',
  className = '',
  tamano = 'lg',
}) => {
  const svgClass = tamano === 'xl' 
    ? 'w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80' 
    : 'w-52 h-52 sm:w-64 sm:h-64';

  return (
    <div className={`relative flex items-center justify-center p-2 sm:p-4 ${className}`}>
      <style>{`
        @keyframes spinVerySlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <svg
        viewBox="0 0 200 200"
        className={`${svgClass} filter drop-shadow-2xl pointer-events-none transition-all`}
        style={{ animation: 'spinVerySlow 45s linear infinite' }}
      >
        <polygon
          points="
            100,0 120,40 160,25 155,70 195,80 170,120 195,160 150,165 
            140,205 100,180 60,205 50,165 5,160 30,120 5,80 45,70 
            40,25 80,40
          "
          fill={bgFill}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        <span
          className="font-black text-base sm:text-xl md:text-2xl uppercase tracking-tight leading-snug max-w-[200px] sm:max-w-[240px] drop-shadow-lg"
          style={{ color: textColor }}
        >
          {text}
        </span>
        {subtext && (
          <span className="text-xs sm:text-sm md:text-base font-extrabold mt-1 text-white max-w-[220px] sm:max-w-[260px] drop-shadow">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

// Números apilados
export const SpotifyStackedNumbers = ({ number, label }) => {
  return (
    <div className="flex flex-col items-center justify-center my-2">
      <span className="text-6xl sm:text-8xl font-black tracking-tighter text-black font-mono leading-none drop-shadow-md">
        {number}
      </span>
      {label && (
        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-800 mt-1">
          {label}
        </span>
      )}
    </div>
  );
};