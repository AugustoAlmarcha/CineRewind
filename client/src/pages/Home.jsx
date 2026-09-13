import React, { useEffect, useState } from 'react';
import ViendoCard from '../components/ViendoCard';
import { 
  obtenerViendoActualmenteAPI, 
  avanzarCapituloAPI, 
  obtenerTimelineAPI, 
  eliminarVisualizacionAPI, 
  descartarViendoAPI
} from '../api';

export default function Home() {
  const [seriesActivas, setSeriesActivas] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [filtro, setFiltro] = useState('');

  const cargarDatos = async () => {
    try {
      const series = await obtenerViendoActualmenteAPI(1);
      setSeriesActivas(series);
      const historial = await obtenerTimelineAPI(1, filtro);
      setTimeline(historial);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtro]);

  const handleAvanzar = async (serie) => {
    try {
      await avanzarCapituloAPI({
        usuario_id: 1,
        obra_id: serie.obra_id,
        temporada: serie.temporada,
        episodio_actual: serie.episodio,
        plataforma: serie.plataforma,
      });
      cargarDatos();
    } catch (err) {
      console.error('Error al avanzar capítulo:', err);
    }
  };

  const handleEliminar = async (id) => {
    const confirmar = window.confirm('¿Deseas eliminar este registro de tu historial?');
    if (!confirmar) return;

    try {
      await eliminarVisualizacionAPI(id);
      cargarDatos();
    } catch (err) {
      console.error('Error al eliminar registro:', err);
    }
  };

  const handleDescartar = async (obraId) => {
  const confirmar = window.confirm('¿Quieres quitar esta serie de tu lista activa?');
  if (!confirmar) return;
  try {
    await descartarViendoAPI(1, obraId);
    cargarDatos();
  } catch (err) {
    console.error(err);
  }
};

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      {/* Sección Viendo Actualmente (HU-02) */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Viendo Actualmente
        </h2>
        <div className="flex gap-5 overflow-x-auto pb-4 pt-1">
          {seriesActivas.length > 0 ? (
            seriesActivas.map((serie) => (
              <ViendoCard key={serie.obra_id} serie={serie} onAvanzar={handleAvanzar} onDescartar={handleDescartar} />
            ))
          ) : (
            <p className="text-sm text-neutral-500 italic">No tienes series activas en curso.</p>
          )}
        </div>
      </section>

      {/* Sección Timeline Cronológico (HU-03) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-300/80 dark:border-white/10 pb-4">
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Mi Timeline
          </h2>
          <div className="flex gap-2 bg-neutral-200/70 dark:bg-[#1a1a1e] p-1.5 rounded-xl border border-neutral-300 dark:border-white/5">
            {['', 'pelicula', 'serie'].map((t) => (
              <button
                key={t}
                onClick={() => setFiltro(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  filtro === t 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t === '' ? 'Todos' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {timeline.length > 0 ? (
            timeline.map((item) => {
              const posterUrl = item.poster_path
                ? (item.poster_path.startsWith('http') 
                    ? item.poster_path 
                    : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
                : null;

              return (
                <div
                  key={item.visualizacion_id}
                  className="bg-white dark:bg-[#1a1a1e] border border-neutral-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-20 bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                      {posterUrl ? (
                        <img src={posterUrl} alt={item.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-semibold">Sin foto</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider">
                        {item.tipo} {item.temporada ? `· T${item.temporada} E${item.episodio}` : ''}
                      </span>
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white">{item.titulo}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        {item.plataforma || 'Sin plataforma'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      {new Date(item.fecha_visto).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleEliminar(item.visualizacion_id)}
                      className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-600/10 rounded-xl transition cursor-pointer"
                      title="Eliminar visualización"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-neutral-500 italic py-4">No hay registros de visualizaciones aún.</p>
          )}
        </div>
      </section>
    </main>
  );
}