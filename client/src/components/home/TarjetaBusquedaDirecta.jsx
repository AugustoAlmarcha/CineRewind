import React, { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { buscarPeliculasAPI } from '../../api';

export default function TarjetaBusquedaDirecta({ busqueda, onAbrirRegistrar }) {
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const textoBusqueda = (busqueda || '').trim();
  if (!textoBusqueda) return null;

  const handleBuscarTMDb = async () => {
    setCargando(true);
    setErrorMsg(null);
    try {
      const data = await buscarPeliculasAPI(textoBusqueda);
      if (Array.isArray(data) && data.length > 0) {
        if (onAbrirRegistrar) {
          onAbrirRegistrar(data[0]);
        }
      } else {
        setErrorMsg(`No se encontró «${textoBusqueda}» en el catálogo de TMDb.`);
      }
    } catch (err) {
      console.error('Error buscando en TMDb:', err);
      setErrorMsg('Error de conexión al buscar en TMDb. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="py-16 sm:py-20 px-4 text-center max-w-md mx-auto space-y-4 animate-fadeIn">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-sm">
        <Search className="w-6 h-6 stroke-[2.2]" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
          ¿Buscabas «{textoBusqueda}»?
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
          Aún no tienes registros de esta obra en este período de tu diario.
        </p>
      </div>

      <div className="pt-1">
        <button
          type="button"
          disabled={cargando}
          onClick={handleBuscarTMDb}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-950/20 transition cursor-pointer disabled:opacity-50"
        >
          {cargando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Buscando en TMDb...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Buscar y Registrar «{textoBusqueda}» ahora</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-bold">{errorMsg}</p>
      )}
    </div>
  );
}
