import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerFilmografiaActorAPI, obtenerTimelineAPI } from '../../api';
import TarjetaFilmografia from './TarjetaFilmografia';

export default function ModalFilmografiaActor({ actor, onClose, onSeleccionarObra }) {
  const { usuario } = useAuth();
  const [obras, setObras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [idsVistos, setIdsVistos] = useState(new Set());

  const actorId = actor?.id;
  const usuarioId = usuario?.id;

  useEffect(() => {
    if (!actorId) return;
    let cancelado = false;

    const cargarDatos = async () => {
      setCargando(true);
      try {
        const peticionHistorial = usuarioId 
          ? obtenerTimelineAPI(usuarioId) 
          : Promise.resolve([]);

        const [historial, filmografia] = await Promise.all([
          peticionHistorial,
          obtenerFilmografiaActorAPI(actorId)
        ]);

        if (!cancelado) {
          if (Array.isArray(historial) && historial.length > 0) {
            setIdsVistos(new Set(historial.map((h) => Number(h.tmdb_id))));
          } else {
            setIdsVistos(new Set());
          }
          setObras(Array.isArray(filmografia) ? filmografia : []);
        }
      } catch (err) {
        if (!cancelado) {
          console.error('Error al cargar filmografía:', err);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarDatos();
    return () => { cancelado = true; };
  }, [actorId, usuarioId]); // <-- Solo IDs primitivos, evita los renders repetidos triples

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto animate-fadeIn">
        
        {/* Cabecera */}
        <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-800 border-2 border-rose-600 shadow-md">
              {actor.foto ? (
                <img src={actor.foto} alt={actor.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🎭</div>
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Filmografía destacada</span>
              <h2 className="text-2xl font-black">{actor.nombre}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Grilla con scroll */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {cargando ? (
            <div className="py-20 text-center text-sm text-neutral-400 animate-pulse">
              Cargando catálogo del actor...
            </div>
          ) : obras.length === 0 ? (
            <div className="py-20 text-center text-sm text-neutral-400">
              No se encontraron obras disponibles.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {obras.map((obra) => (
                <TarjetaFilmografia
                  key={obra.tmdb_id || obra.id}
                  obra={obra}
                  yaVista={idsVistos.has(Number(obra.tmdb_id || obra.id))}
                  onSeleccionar={onSeleccionarObra}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}