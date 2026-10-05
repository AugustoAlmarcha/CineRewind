import React from 'react';

export default function LogoCineRewind({ className = '', tamano = 'md', conTexto = true }) {
  const altura = tamano === 'sm' ? 'h-6' : tamano === 'lg' ? 'h-10' : 'h-8';
  const fontSize = tamano === 'sm' ? 'text-xs' : tamano === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <img
          src="/logo.svg"
          alt="CineRewind"
          className={`${altura} object-contain`}
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
        <div style={{ display: 'none' }} className="w-8 h-8 rounded-xl bg-[#141419] border border-white/10 flex items-center justify-center p-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
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
        <span className={`font-black tracking-tight font-sans ${fontSize}`}>
          <span className="text-[#ff4b6e]">Cine</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4a] to-[#f59e0b]">Rewind</span>
        </span>
      )}
    </div>
  );
}