import React from 'react';
import { Calendar, Check, X } from 'lucide-react';
import SelectorCalendarioPopover from './SelectorCalendarioPopover';

export default function PanelAsistenteDistribucion({
  totalItems = 0,
  esModoTemporadas = false,
  fechaInicio,
  setFechaInicio,
  capitulosPorTanda = 1,
  setCapitulosPorTanda,
  diasIntervalo = 1,
  setDiasIntervalo,
  onAplicar,
  onCerrar,
}) {
  const OPCIONES_CANTIDAD = [1, 2, 3, 4, 5];

  const OPCIONES_RITMO = [
    { valor: 1, label: 'Por día (diario)' },
    { valor: 2, label: 'Cada 2 días' },
    { valor: 3, label: 'Cada 3 días' },
    { valor: 7, label: 'Por semana (cada 7 días)' },
    { valor: 14, label: 'Cada 2 semanas (quincenal)' },
    { valor: 30, label: 'Por mes (cada 30 días)' },
  ];

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1c1c24] border border-rose-500/40 shadow-xl space-y-3.5 animate-fadeIn select-none">
      {/* Cabecera del panel */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
            {esModoTemporadas
              ? `Distribuir fechas de emisión para ${totalItems} ${totalItems === 1 ? 'temporada' : 'temporadas'}`
              : `Distribuir fechas para ${totalItems} capítulos seleccionados`}
          </span>
        </div>
        <button 
          type="button"
          onClick={onCerrar}
          className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition rounded-lg"
          title="Cerrar asistente"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* 1. Fecha de inicio con el calendario elegante de CineRewind */}
        <div>
          <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5">
            Fecha de inicio:
          </label>
          <div className="pt-0.5">
            <SelectorCalendarioPopover
              fecha={fechaInicio}
              onSeleccionarFecha={setFechaInicio}
              tamano="normal"
              align="left"
            />
          </div>
        </div>

        {/* 2. ¿Cuántos capítulos por tanda? (1, 2, 3...) */}
        <div>
          <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5">
            Capítulos por tanda:
          </label>
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/5 p-1 rounded-xl border border-neutral-200 dark:border-white/10">
            {OPCIONES_CANTIDAD.map((cant) => (
              <button
                key={cant}
                type="button"
                onClick={() => setCapitulosPorTanda(cant)}
                className={`flex-1 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  capitulosPorTanda === cant
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {cant}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Frecuencia / Intervalo de días */}
        <div>
          <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5">
            Frecuencia / Ritmo:
          </label>
          <select
            value={diasIntervalo}
            onChange={(e) => setDiasIntervalo(Number(e.target.value))}
            className="w-full p-2 rounded-xl border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
          >
            {OPCIONES_RITMO.map((r) => (
              <option key={r.valor} value={r.valor} className="bg-white dark:bg-[#181820]">
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen explicativo y botón aplicar */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-200 dark:border-white/10 flex-wrap">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Asigna <strong>{capitulosPorTanda} {capitulosPorTanda === 1 ? 'capítulo' : 'capítulos'}</strong> cada{' '}
          <strong>
            {diasIntervalo === 1 ? 'día' : diasIntervalo === 7 ? 'semana' : `${diasIntervalo} días`}
          </strong>{' '}
          a partir del día elegido.
        </p>

        <button
          type="button"
          onClick={onAplicar}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5 ml-auto"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Aplicar fechas correlativas</span>
        </button>
      </div>
    </div>
  );
}
