import React from 'react';

export default function CalificadorEstrellas({ valor, onChange }) {
  const handleStarClick = (e, index) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - left;
    const isHalf = clickX < width / 2;
    const nuevoValor = isHalf ? index - 0.5 : index;
    onChange(nuevoValor === valor ? 0 : nuevoValor);
  };

  return (
    <div className="space-y-3 bg-neutral-100 dark:bg-white/5 p-4 rounded-2xl border border-neutral-200 dark:border-white/5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Tu Puntuación
        </label>
        <span className="text-lg font-black text-amber-500">
          ★ {valor > 0 ? valor.toFixed(1) : '0.0'} / 5.0
        </span>
      </div>

      {/* 5 Estrellas clickeables por mitades */}
      <div className="flex justify-center gap-2 py-1">
        {[1, 2, 3, 4, 5].map((index) => {
          const fillPercentage = Math.min(100, Math.max(0, (valor - (index - 1)) * 100));
          return (
            <div
              key={index}
              onClick={(e) => handleStarClick(e, index)}
              className="relative text-3xl select-none cursor-pointer transition-transform hover:scale-110"
              title={`Seleccionar ${index - 0.5} o ${index}`}
            >
              <span className="text-neutral-300 dark:text-neutral-700">★</span>
              <span 
                className="absolute top-0 left-0 overflow-hidden text-amber-400 whitespace-nowrap"
                style={{ width: `${fillPercentage}%` }}
              >
                ★
              </span>
            </div>
          );
        })}
      </div>

      {/* Slider para ajuste fino con decimales */}
      <input 
        type="range" 
        min="0" 
        max="5" 
        step="0.1"
        value={valor} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-rose-600 cursor-pointer"
      />
    </div>
  );
}