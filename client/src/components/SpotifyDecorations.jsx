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
}) => {
  return (
    <div className={`relative flex items-center justify-center p-6 ${className}`}>
      <style>{`
        @keyframes spinVerySlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <svg
        viewBox="0 0 200 200"
        className="w-48 h-48 sm:w-56 sm:h-56 filter drop-shadow-xl pointer-events-none"
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
          className="font-black text-sm sm:text-base uppercase tracking-tight leading-tight max-w-[140px] drop-shadow-md"
          style={{ color: textColor }}
        >
          {text}
        </span>
        {subtext && (
          <span className="text-[10px] sm:text-xs font-semibold mt-1 opacity-90 text-white max-w-[150px]">
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