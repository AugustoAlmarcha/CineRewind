import React from 'react';
import { Camera, Users, Sparkles, Tv, Film, Clock, Play, BookOpen } from 'lucide-react';

export default function HeroPerfil({
  usuario,
  stats,
  totalResenias,
  bannerVisual,
  avatarVisual,
  fechaAlta,
  cargandoWrapped,
  onAbrirEditar,
  onAbrirAmigos,
  onAbrirWrapped
}) {
  return (
    <section className="w-full rounded-3xl overflow-hidden relative border border-zinc-800 bg-[#0d0d12] shadow-2xl group">
      {/* Banner Panorámico con degradado */}
      <div className="h-60 sm:h-80 w-full relative overflow-hidden bg-gradient-to-r from-zinc-950 via-[#1a1215] to-zinc-950">
        <img
          src={bannerVisual}
          alt="Portada de cine"
          onError={(e) => {
            e.target.src = 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg';
          }}
          className="w-full h-full object-cover object-center filter brightness-[0.75] transition-transform duration-700 group-hover:scale-102"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d12]/80 via-transparent to-[#0d0d12]/80" />

        <button
          type="button"
          onClick={() => onAbrirEditar('portada')}
          className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-lg hover:scale-105 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>Cambiar Portada</span>
        </button>
      </div>

      {/* Identidad de Usuario */}
      <div className="px-6 sm:px-10 pb-6 -mt-16 sm:-mt-20 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-[#0d0d12] shadow-2xl bg-orange-600 shrink-0 relative group">
            <img
              src={avatarVisual}
              alt={usuario.nombre}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0d0d12]" />
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {usuario.nombre}
              </h1>
              <span className="bg-rose-600/20 text-rose-400 border border-rose-600/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                {usuario.rol === 'admin' ? 'Admin' : usuario.rol === 'moderador' ? 'Mod' : 'Usuario'}
              </span>
            </div>

            <div className="text-xs font-mono text-zinc-400 mt-0.5">
              @{usuario.username} · Miembro desde {fechaAlta}
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 mt-2 max-w-lg leading-relaxed font-normal">
              {usuario.biografia || 'Cinéfilo apasionado. Registrando cada noche de películas y series en CineRewind.'}
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onAbrirAmigos}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-700 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span>Amigos</span>
          </button>

          <button
            type="button"
            onClick={() => onAbrirEditar('info')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 cursor-pointer"
          >
            Editar Perfil
          </button>

          <button
            type="button"
            onClick={onAbrirWrapped}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>{cargandoWrapped ? 'Cargando...' : 'CineRewind Wrapped'}</span>
          </button>
        </div>
      </div>

      {/* Franja de Estadísticas (Series primero) */}
      <div className="border-t border-zinc-800/80 bg-zinc-900/40 px-6 sm:px-10 py-3.5 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
          <Tv className="w-4 h-4 text-rose-400" />
          <span><strong className="text-white font-bold">{stats.total_series || 0}</strong> Series</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
          <Film className="w-4 h-4 text-amber-400" />
          <span><strong className="text-white font-bold">{stats.total_peliculas || 0}</strong> Películas</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span><strong className="text-white font-bold">{stats.horas_totales || 0}h</strong> en pantalla</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
          <Play className="w-4 h-4 text-emerald-400" />
          <span><strong className="text-white font-bold">{stats.total_episodios || 0}</strong> Capítulos</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-300 col-span-2 sm:col-span-1">
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span><strong className="text-white font-bold">{totalResenias}</strong> Reseñas</span>
        </div>
      </div>
    </section>
  );
}