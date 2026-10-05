import React, { useState, useEffect } from 'react';
import { obtenerAmigosAPI } from '../../api';

export default function SelectorAmigosEtiquetar({
  amigosSeleccionados = [],
  setAmigosSeleccionados,
  vistoConTexto = '',
  setVistoConTexto,
}) {
  const [amigosDisponibles, setAmigosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    obtenerAmigosAPI()
      .then((data) => {
        if (!cancelado && Array.isArray(data)) {
          setAmigosDisponibles(data);
        }
      })
      .catch((err) => {
        console.warn('Error cargando amigos para etiquetar:', err.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const alternarAmigo = (id) => {
    if (!setAmigosSeleccionados) return;
    setAmigosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((amigoId) => amigoId !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 bg-white/50 dark:bg-[#181820]/70 border border-neutral-200 dark:border-white/10 rounded-2xl space-y-3.5">
      {/* Título de la sección */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
          <span>👥</span> ¿Con quién lo viste?
        </label>
        {(amigosSeleccionados.length > 0 || vistoConTexto) && (
          <button
            type="button"
            onClick={() => {
              if (setAmigosSeleccionados) setAmigosSeleccionados([]);
              if (setVistoConTexto) setVistoConTexto('');
            }}
            className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
          >
            Limpiar compañía
          </button>
        )}
      </div>

      {/* 1. Amigos registrados en la app */}
      {cargando ? (
        <p className="text-[11px] text-neutral-400 italic">Cargando amigos...</p>
      ) : amigosDisponibles.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {amigosDisponibles.map((amigo) => {
            const seleccionado = amigosSeleccionados.includes(amigo.id);
            return (
              <button
                key={amigo.id}
                type="button"
                onClick={() => alternarAmigo(amigo.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 border ${
                  seleccionado
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm scale-[1.02]'
                    : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                }`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] flex-shrink-0">
                  {amigo.avatar_url ? (
                    <img src={amigo.avatar_url} alt={amigo.username} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(amigo.nombre || amigo.username || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span>@{amigo.username}</span>
                {seleccionado && <span className="text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-neutral-400 italic">No tienes amigos agregados en la app.</p>
      )}

      {/* 2. Campo para personas sin cuenta ("Mamá", "Hermana", etc.) */}
      <div className="pt-2 border-t border-neutral-200/80 dark:border-white/5 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
            Acompañantes sin cuenta:
          </span>
          {/* Chips de atajos rápidos sugeridos */}
          {setVistoConTexto && (
            <div className="flex items-center gap-1 flex-wrap">
              {['Mamá', 'Papá', 'Hermana', 'Pareja', 'Familia'].map((sugerencia) => (
                <button
                  key={sugerencia}
                  type="button"
                  onClick={() => {
                    if (!vistoConTexto) {
                      setVistoConTexto(sugerencia);
                    } else if (!vistoConTexto.includes(sugerencia)) {
                      setVistoConTexto(`${vistoConTexto}, ${sugerencia}`);
                    }
                  }}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer text-neutral-600 dark:text-neutral-400"
                >
                  +{sugerencia}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            value={vistoConTexto}
            onChange={(e) => setVistoConTexto && setVistoConTexto(e.target.value)}
            placeholder="Escribe un nombre (ej: Mamá)..."
            className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#121216] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-rose-500 transition"
          />
          {vistoConTexto && (
            <button
              type="button"
              onClick={() => setVistoConTexto && setVistoConTexto('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Vista previa inmediata de la carita que quedará en la foto */}
        {vistoConTexto?.trim() && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 animate-fadeIn">
            <div className="flex -space-x-1.5 overflow-hidden flex-shrink-0">
              {vistoConTexto.split(',').map((s) => s.trim()).filter(Boolean).map((nombre, idx) => (
                <div 
                  key={idx} 
                  className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-black/40 bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 flex items-center justify-center shadow-xs"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nombre)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                    alt={nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="text-[11px] font-semibold truncate">
              Carita lista en la foto: <span className="font-black text-rose-500">{vistoConTexto}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}