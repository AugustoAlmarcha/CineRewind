import React from 'react';

export default function LogoCineRewind({ className = '', tamano = 'md', conTexto = true }) {
  const altura = 
    tamano === 'sm' ? 'h-6' : 
    tamano === 'md' ? 'h-8 sm:h-9' : 
    tamano === 'lg' ? 'h-10 sm:h-12' : 
    tamano === 'xl' ? 'h-12 sm:h-14' : 
    tamano === '2xl' ? 'h-16 sm:h-20' : 'h-8';

  const fontSize = 
    tamano === 'sm' ? 'text-xs sm:text-sm' : 
    tamano === 'md' ? 'text-base sm:text-lg' : 
    tamano === 'lg' ? 'text-xl sm:text-2xl' : 
    tamano === 'xl' ? 'text-2xl sm:text-3xl' : 
    tamano === '2xl' ? 'text-3xl sm:text-5xl' : 'text-base';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <img
          src="/logo.svg"
          alt="CineRewind"
          className={`${altura} object-contain filter drop-shadow-md`}
          onError={(e) => {
            if (!e.target.dataset.tried2) {
              e.target.dataset.tried2 = 'true';
              e.target.src = '/logo2.svg';
            } else if (!e.target.dataset.tried3) {
              e.target.dataset.tried3 = 'true';
              e.target.src = '/logo3.svg';
            } else {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
        {/* Fallback vectorial fiel al logo de CineRewind */}
        <div style={{ display: 'none' }} className={`${altura} aspect-square rounded-2xl bg-[#141419] border border-white/10 flex items-center justify-center p-1.5`}>
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
            <path d="M11 18V6l-7 6 7 6zm8 0V6l-7 6 7 6z" fill="url(#crGradient)" />
            <defs>
              <linearGradient id="crGradient" x1="4" y1="6" x2="19" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ff4b6e" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {conTexto && (
        <span className={`font-black tracking-tight font-sans ${fontSize} drop-shadow-sm`}>
          <span className="text-[#ff4b6e]">Cine</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4a] via-[#f59e0b] to-[#fbbf24]">Rewind</span>
        </span>
      )}
    </div>
  );
}