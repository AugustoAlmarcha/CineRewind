import React, { useState, useEffect } from 'react';
import { obtenerAmigosAPI } from '../../api';

export default function SelectorAmigosEtiquetar({ amigosSeleccionados, setAmigosSeleccionados }) {
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const cargarAmigos = async () => {
      setCargando(true);
      try {
        const data = await obtenerAmigosAPI();
        if (!cancelado) setAmigos(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelado) setAmigos([]);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };
    cargarAmigos();
    return () => { cancelado = true; };
  }, []);

  const alternarAmigo = (amigoId) => {
    setAmigosSeleccionados((prev) =>
      prev.includes(amigoId) ? prev.filter((id) => id !== amigoId) : [...prev, amigoId]
    );
  };

  if (amigos.length === 0 && !cargando) return null;

  return (
    <div className="px-6 py-2 border-b border-neutral-200 dark:border-white/10 bg-[#f7f4ed]/50 dark:bg-[#181820]/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs">👥</span>
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Visto con...
          </span>
          {amigosSeleccionados.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {amigosSeleccionados.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="text-xs font-bold text-rose-600 dark:text-rose-500 hover:underline cursor-pointer"
        >
          {abierto ? 'Ocultar' : amigosSeleccionados.length > 0 ? 'Editar etiquetas' : '+ Etiquetar amigos'}
        </button>
      </div>

      {/* Lista desplegable de amigos */}
      {abierto && (
        <div className="pt-3 pb-1 flex flex-wrap gap-2 animate-fadeIn">
          {amigos.map((amigo) => {
            const estaSeleccionado = amigosSeleccionados.includes(amigo.id);
            return (
              <button
                type="button"
                key={amigo.id}
                onClick={() => alternarAmigo(amigo.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  estaSeleccionado
                    ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                    : 'bg-white dark:bg-[#202028] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-rose-500/50'
                }`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px]">
                  {amigo.avatar_url ? (
                    <img src={amigo.avatar_url} alt={amigo.username} className="w-full h-full object-cover" />
                  ) : (
                    amigo.nombre?.charAt(0) || '?'
                  )}
                </div>
                <span>@{amigo.username}</span>
                {estaSeleccionado && <span className="text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}