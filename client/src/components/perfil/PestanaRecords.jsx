import React from 'react';

export default function PestanaRecords({ records = {} }) {
  const { maratonSerie, rewatchPelicula } = records;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Récords de Espectador
        </h3>
        <span className="text-[11px] font-mono text-neutral-400">ESTADÍSTICAS MÁXIMAS</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. SERIE MARATÓN */}
        <div className="group relative rounded-3xl overflow-hidden border border-neutral-300 dark:border-white/10 shadow-xl min-h-[350px] sm:min-h-[380px] flex flex-col justify-between p-6 sm:p-8 bg-[#141419] transition-all duration-300 cursor-pointer">
          {maratonSerie?.poster_path && (
            <img
              src={
                maratonSerie.poster_path.startsWith('http')
                  ? maratonSerie.poster_path
                  : `https://image.tmdb.org/t/p/w780${maratonSerie.poster_path}`
              }
              alt={maratonSerie.titulo}
              className="absolute inset-0 w-full h-full object-cover object-top filter brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ease-out"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 group-hover:from-black/70 group-hover:via-black/20 group-hover:to-transparent transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md group-hover:bg-rose-500 transition-colors">
              MARATÓN
            </span>
            <span className="text-[11px] font-mono text-neutral-300 font-bold uppercase tracking-wider drop-shadow-sm">
              MÁS EPISODIOS VISTOS
            </span>
          </div>

          <div className="relative z-10 pt-16 flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-lg">
                {maratonSerie ? maratonSerie.titulo : 'Sin registros'}
              </h4>
            </div>

            <div className="flex flex-col items-center justify-center flex-shrink-0 min-w-[70px]">
              <span className="text-4xl sm:text-5xl font-black font-mono text-rose-500 drop-shadow-lg leading-none">
                {maratonSerie ? maratonSerie.total_capitulos : 0}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold drop-shadow-sm mt-1 text-center">
                Capítulos
              </span>
            </div>
          </div>
        </div>

        {/* 2. PELÍCULA REWATCH */}
        <div className="group relative rounded-3xl overflow-hidden border border-neutral-300 dark:border-white/10 shadow-xl min-h-[350px] sm:min-h-[380px] flex flex-col justify-between p-6 sm:p-8 bg-[#141419] transition-all duration-300 cursor-pointer">
          {rewatchPelicula?.poster_path && (
            <img
              src={
                rewatchPelicula.poster_path.startsWith('http')
                  ? rewatchPelicula.poster_path
                  : `https://image.tmdb.org/t/p/w780${rewatchPelicula.poster_path}`
              }
              alt={rewatchPelicula.titulo}
              className="absolute inset-0 w-full h-full object-cover object-top filter brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ease-out"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 group-hover:from-black/70 group-hover:via-black/20 group-hover:to-transparent transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md group-hover:bg-amber-400 transition-colors">
              REWATCH
            </span>
            <span className="text-[11px] font-mono text-neutral-300 font-bold uppercase tracking-wider drop-shadow-sm">
              PELÍCULA MÁS REPETIDA
            </span>
          </div>

          <div className="relative z-10 pt-16 flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-lg">
                {rewatchPelicula ? rewatchPelicula.titulo : 'Sin repeticiones'}
              </h4>
            </div>

            <div className="flex flex-col items-center justify-center flex-shrink-0 min-w-[70px]">
              <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400 drop-shadow-lg leading-none">
                {rewatchPelicula ? rewatchPelicula.veces_vista : 0}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold drop-shadow-sm mt-1 text-center">
                Veces Vista
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}