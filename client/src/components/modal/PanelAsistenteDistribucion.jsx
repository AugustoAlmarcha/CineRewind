import React, { useMemo } from 'react';
import { Calendar, CalendarRange, Check, X, SkipForward } from 'lucide-react';
import SelectorCalendarioPopover from './SelectorCalendarioPopover';

export default function PanelAsistenteDistribucion({
  totalItems = 0,
  esModoTemporadas = false,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  capitulosPorTanda = 1,
  setCapitulosPorTanda,
  diasIntervalo = 1,
  setDiasIntervalo,
  modoDistribucion = 'ritmo',   // 'ritmo' | 'rango'
  setModoDistribucion,
  omitirYaVistos = true,
  setOmitirYaVistos,
  totalCapitulosEstimados = 0,  // para calcular el resumen cuando esModoTemporadas
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

  // Cálculo del resumen para modo rango
  const resumenRango = useMemo(() => {
    if (modoDistribucion !== 'rango' || !fechaInicio || !fechaFin) return null;
    const [y1, m1, d1] = String(fechaInicio).substring(0, 10).split('-').map(Number);
    const [y2, m2, d2] = String(fechaFin).substring(0, 10).split('-').map(Number);
    const inicio = new Date(y1, m1 - 1, d1);
    const fin = new Date(y2, m2 - 1, d2);
    const diffMs = fin.getTime() - inicio.getTime();
    if (diffMs < 0) return { error: true };
    const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diasCalendario = dias + 1;
    const caps = esModoTemporadas ? totalCapitulosEstimados : totalItems;
    if (caps <= 0) return { dias: diasCalendario, textoRitmo: null };
    const textoRitmo = caps >= diasCalendario
      ? `${(caps / diasCalendario).toFixed(1)} capítulos por día`
      : `1 capítulo cada ${(diasCalendario / caps).toFixed(1)} días`;
    return { dias: diasCalendario, caps, textoRitmo };
  }, [modoDistribucion, fechaInicio, fechaFin, totalItems, totalCapitulosEstimados, esModoTemporadas]);

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1c1c24] border border-rose-500/40 shadow-xl space-y-3.5 animate-fadeIn select-none">
      {/* Cabecera del panel */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
            {esModoTemporadas
              ? `Distribuir fechas para ${totalItems} ${totalItems === 1 ? 'temporada' : 'temporadas'}`
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

      {/* Pestañas: Por ritmo / Entre dos fechas */}
      <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => setModoDistribucion('ritmo')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            modoDistribucion === 'ritmo'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>Por ritmo</span>
        </button>
        <button
          type="button"
          onClick={() => setModoDistribucion('rango')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            modoDistribucion === 'rango'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5 shrink-0" />
          <span>Entre dos fechas</span>
        </button>
      </div>

      {/* Contenido según modo */}
      {modoDistribucion === 'ritmo' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* 1. Fecha de inicio */}
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

          {/* 2. Capítulos por tanda */}
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

          {/* 3. Frecuencia */}
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
      ) : (
        /* Modo Rango: dos selectores de fecha */
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5">
              Fecha de inicio:
            </label>
            <SelectorCalendarioPopover
              fecha={fechaInicio}
              onSeleccionarFecha={setFechaInicio}
              tamano="normal"
              align="left"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5">
              Fecha de fin:
            </label>
            <SelectorCalendarioPopover
              fecha={fechaFin}
              onSeleccionarFecha={setFechaFin}
              tamano="normal"
              align="right"
            />
          </div>
        </div>
      )}

      {/* Resumen explicativo y botón aplicar */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-200 dark:border-white/10 flex-wrap">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          {modoDistribucion === 'ritmo' ? (
            <>
              Asigna <strong>{capitulosPorTanda} {capitulosPorTanda === 1 ? 'capítulo' : 'capítulos'}</strong> cada{' '}
              <strong>
                {diasIntervalo === 1 ? 'día' : diasIntervalo === 7 ? 'semana' : `${diasIntervalo} días`}
              </strong>{' '}
              a partir del día elegido.
            </>
          ) : resumenRango?.error ? (
            <span className="text-rose-500 font-bold">La fecha de fin debe ser posterior a la de inicio.</span>
          ) : resumenRango ? (
            <>
              <strong>{resumenRango.dias} días</strong> en total
              {resumenRango.textoRitmo && (
                <> · aprox. <strong>{resumenRango.textoRitmo}</strong></>
              )}
            </>
          ) : (
            'Selecciona fecha de inicio y fin para distribuir.'
          )}
        </p>

        <button
          type="button"
          onClick={onAplicar}
          disabled={modoDistribucion === 'rango' && Boolean(resumenRango?.error)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>
            {modoDistribucion === 'ritmo' ? 'Aplicar fechas correlativas' : 'Aplicar distribución por rango'}
          </span>
        </button>
      </div>
    </div>
  );
}
