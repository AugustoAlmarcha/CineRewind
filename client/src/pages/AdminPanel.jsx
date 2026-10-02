import React, { useEffect, useState } from 'react';
import { obtenerMetricasAdminAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Helper para convertir rutas relativas de TMDb en URLs completas
const resolverImagen = (ruta) => {
  if (!ruta) return null;
  if (ruta.startsWith('http')) return ruta;
  return `https://image.tmdb.org/t/p/w500${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
};

export default function AdminPanel() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    obtenerMetricasAdminAPI()
      .then((res) => {
        if (!cancelado) setDatos(res);
      })
      .catch((err) => {
        if (!cancelado) setError(err.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Redirección si no es admin
  if (!usuario || usuario.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (cargando) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-neutral-400 text-sm font-bold">
        Cargando estadísticas globales...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <p className="text-rose-500 font-bold">⚠️ {error}</p>
      </div>
    );
  }

  const { resumen, topObras, usuarios } = datos || {};

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-fadeIn">
      {/* Título de Cabecera */}
      <div className="border-b border-neutral-200 dark:border-white/10 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>🛡️</span> Panel de Administración
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Supervisión y métricas generales del ecosistema CineRewind.
          </p>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-600/10 text-rose-600 border border-rose-600/20">
          Admin: @{usuario.username}
        </span>
      </div>

      {/* Tarjetas de Métricas Generales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Usuarios</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white">{resumen?.totalUsuarios || 0}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Visualizaciones Registradas</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-500">{resumen?.totalVistos || 0}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Obras en Catálogo</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white">{resumen?.totalObras || 0}</p>
        </div>
      </div>

      {/* Top 5 Obras Más Populares */}
      <section className="space-y-4">
        <h2 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <span>🔥</span> Obras más vistas por la comunidad
        </h2>
        {topObras?.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">No hay registros de visualizaciones aún.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {topObras?.map((obra) => {
              const imagenUrl = resolverImagen(obra.poster_path);
              return (
                <div
                  key={obra.id}
                  className="bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden p-2 flex flex-col justify-between shadow-sm"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 mb-2">
                    {imagenUrl ? (
                      <img 
                        src={imagenUrl} 
                        alt={obra.titulo} 
                        loading="lazy"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 p-2 text-center font-bold">
                        {obra.titulo}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-white truncate" title={obra.titulo}>
                      {obra.titulo}
                    </h3>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-0.5">
                      <span className="uppercase font-semibold">{obra.tipo}</span>
                      <span className="font-bold text-rose-500">{obra.veces_vista} vistas</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Listado de Usuarios */}
      <section className="space-y-4">
        <h2 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <span>👥</span> Directorio de Usuarios
        </h2>
        <div className="border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#181820] shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-white/10 text-neutral-400 uppercase font-black tracking-wider text-[10px] bg-neutral-50 dark:bg-white/[0.02]">
                <th className="p-3">Usuario</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3 text-right">Registros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {usuarios?.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition">
                  <td className="p-3 font-bold text-neutral-900 dark:text-white">@{u.username}</td>
                  <td className="p-3 text-neutral-500 dark:text-neutral-400">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        u.rol === 'admin'
                          ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                          : 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="p-3 text-right font-black text-rose-600 dark:text-rose-500">
                    {u.cantidad_vistos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}