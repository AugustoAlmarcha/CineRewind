import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Film, X, Loader2 } from 'lucide-react';

export default function ModalSelectorPeriodoWrapped(props) {
  // ✅ Si el padre lo controla con {selectorWrappedAbierto && ...}, está abierto por defecto
  const estaAbierto = props.isOpen !== undefined 
    ? props.isOpen 
    : props.abierto !== undefined 
    ? props.abierto 
    : true;

  const cerrarModal = props.onClose || props.alCerrar || (() => {});
  const alSeleccionar = props.onSeleccionarPeriodo || props.onSeleccionar || (() => {});
  
  // Si tu timeline viene vacío o sin años, aseguramos los años por defecto
  const aniosDisponibles = (props.aniosDisponibles && props.aniosDisponibles.length > 0)
    ? props.aniosDisponibles
    : [2026, 2025, 2024];

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);

  useEffect(() => {
    setPeriodoSeleccionado(null);
  }, []);

  if (!estaAbierto) return null;

  const estaCargando = Boolean(props.cargando) || periodoSeleccionado !== null;

  const handleSeleccionar = (anio, mesId = null) => {
    if (estaCargando) return;
    setPeriodoSeleccionado({ anio, mesId });
    alSeleccionar(anio, mesId);
  };

  const MESES = [
    { id: 12, n: 'Diciembre' }, { id: 11, n: 'Noviembre' }, { id: 10, n: 'Octubre' },
    { id: 9, n: 'Septiembre' }, { id: 8, n: 'Agosto' }, { id: 7, n: 'Julio' },
    { id: 6, n: 'Junio' }, { id: 5, n: 'Mayo' }, { id: 4, n: 'Abril' },
    { id: 3, n: 'Marzo' }, { id: 2, n: 'Febrero' }, { id: 1, n: 'Enero' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
      onClick={cerrarModal}
    >
      <div
        className="w-full max-w-md bg-[#0f1412] border border-emerald-500/30 rounded-3xl shadow-2xl p-6 space-y-5 text-left relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-black text-emerald-400 block">
                FESTIVAL CINEREWIND
              </span>
              <h3 className="text-base font-black text-white">Elegir Edición Wrapped</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer border border-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Galas Anuales con Loader */}
        <div className="space-y-2.5">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-emerald-400" />
            <span>Selecciona un Año</span>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {aniosDisponibles.map((anio) => {
              const esEste = periodoSeleccionado?.anio === anio && !periodoSeleccionado?.mesId;
              return (
                <button
                  key={anio}
                  type="button"
                  disabled={estaCargando}
                  onClick={() => handleSeleccionar(anio)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center cursor-pointer group text-center active:scale-95 shadow-sm relative ${
                    esEste
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50'
                      : estaCargando
                      ? 'opacity-40 cursor-not-allowed bg-zinc-950/50 border-zinc-900'
                      : 'bg-zinc-950/80 hover:bg-emerald-950/40 border-emerald-500/20 hover:border-emerald-400'
                  }`}
                >
                  {esEste ? (
                    <div className="flex flex-col items-center py-1">
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mb-1" />
                      <span className="text-[10px] font-mono text-emerald-300 font-bold">Cargando...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg mb-0.5">
                        {anio === 2026 ? '🎬' : anio === 2025 ? '🏆' : '⭐'}
                      </span>
                      <span className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                        Gala {anio}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400/80 uppercase mt-0.5">
                        {anio === 2026 ? 'En rodaje' : 'Completo'}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Meses 2026 */}
        <div className="pt-2 border-t border-emerald-500/20 space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Meses 2026</span>
          </p>

          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {MESES.map((m) => {
              const esEsteMes = periodoSeleccionado?.anio === 2026 && periodoSeleccionado?.mesId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={estaCargando}
                  onClick={() => handleSeleccionar(2026, m.id)}
                  className={`py-1.5 px-2 rounded-xl border text-xs font-semibold text-center transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                    esEsteMes
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300 font-black ring-1 ring-emerald-500'
                      : estaCargando
                      ? 'opacity-40 cursor-not-allowed bg-zinc-950 border-zinc-900 text-zinc-600'
                      : m.id === 10
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                      : 'bg-zinc-950 border-zinc-800 hover:border-emerald-500 hover:bg-emerald-950/30 text-zinc-300'
                  }`}
                >
                  {esEsteMes ? (
                    <>
                      <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
                      <span className="text-[10px]">Abriendo...</span>
                    </>
                  ) : (
                    <span>{m.n} {m.id === 10 ? '★' : ''}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {estaCargando && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center flex items-center justify-center gap-2 animate-pulse shadow-lg">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-xs font-mono text-emerald-300 font-bold">
              Calculando CineRewind... ¡Preparando tu Gala! 🍿
            </span>
          </div>
        )}
      </div>
    </div>
  );
}