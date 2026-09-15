import React, { useRef } from 'react';

const PLATAFORMAS = [
  { id: 'Netflix', nombre: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
  { id: 'Max', nombre: 'Max', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg' },
  { id: 'Disney+', nombre: 'Disney+', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
  { id: 'Prime Video', nombre: 'Prime Video', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg' },
  { id: 'Apple TV+', nombre: 'Apple TV+', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg' },
  { 
    id: 'Cine', 
    nombre: 'Cine', 
    icono: (
      <span className="flex items-center gap-1.5 text-neutral-900 font-extrabold text-xs">
        <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
        </svg>
        CINE
      </span>
    )
  },
];

export default function SelectorPlataformaFecha({
  plataforma,
  setPlataforma,
  fechaVisto,
  setFechaVisto,
  noRecuerdaFecha,
  onToggleNoRecuerda
}) {
  const inputFechaRef = useRef(null);

  return (
    <div className="px-6 py-4 bg-neutral-100/80 dark:bg-white/5 flex flex-wrap gap-6 items-center justify-between border-b border-neutral-200 dark:border-white/5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">¿Dónde la viste?</label>
        <div className="flex items-center gap-2.5 flex-wrap">
          {PLATAFORMAS.map((p) => {
            const activa = plataforma === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlataforma(p.id)}
                title={p.nombre}
                className={`h-10 px-3.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer bg-white shadow-sm ${
                  activa
                    ? 'ring-2 ring-rose-500 border-rose-500 scale-105 shadow-md'
                    : 'border-neutral-300 opacity-80 hover:opacity-100'
                }`}
              >
                {p.logo ? (
                  <img src={p.logo} alt={p.nombre} className="h-4 w-auto max-w-[65px] object-contain pointer-events-none" />
                ) : (
                  p.icono
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Fecha de visualización</label>
          <button
            type="button"
            onClick={onToggleNoRecuerda}
            className={`text-[11px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
              noRecuerdaFecha 
                ? 'bg-rose-600 text-white' 
                : 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {noRecuerdaFecha ? '✓ Sin fecha exacta' : 'No recuerdo cuándo la vi'}
          </button>
        </div>

        <input 
          ref={inputFechaRef}
          type="date" 
          value={fechaVisto}
          disabled={noRecuerdaFecha}
          onChange={(e) => setFechaVisto(e.target.value)}
          onClick={() => inputFechaRef.current?.showPicker?.()}
          className={`bg-white dark:bg-[#1e1e24] border border-neutral-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 cursor-pointer w-48 shadow-sm ${
            noRecuerdaFecha ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        />
      </div>
    </div>
  );
}