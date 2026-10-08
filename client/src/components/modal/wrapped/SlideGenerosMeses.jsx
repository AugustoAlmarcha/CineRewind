import React from 'react';
import { Film, Tv, Sparkles, Flame, Calendar, Award, Compass } from 'lucide-react';

export default function SlideGenerosMeses({ stats, onSiguiente }) {
  const anio = stats?.anio || new Date().getFullYear();
  const topGeneros = stats?.topGeneros || stats?.top_generos || [];
  const mesPeli = stats?.mesPicoPeliculas || stats?.mes_pico_peliculas || null;
  const mesSerie = stats?.mesPicoSeries || stats?.mes_pico_series || null;

  // Paleta de gradientes para géneros
  const coloresGeneros = [
    { bar: 'from-purple-500 to-indigo-600', text: 'text-purple-300' },
    { bar: 'from-amber-400 to-orange-500', text: 'text-amber-300' },
    { bar: 'from-rose-500 to-pink-600', text: 'text-rose-300' },
    { bar: 'from-cyan-400 to-teal-500', text: 'text-cyan-300' },
    { bar: 'from-emerald-400 to-green-600', text: 'text-emerald-300' }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between items-center rounded-3xl p-3 xs:p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none bg-gradient-to-b from-[#1c0828] via-[#0b0213] to-[#040108]">
      {/* 🌟 EFECTOS DE FONDO Y ORBES DINÁMICOS */}
      <style>{`
        @keyframes genGlow1 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          50% { transform: scale(1.15) translate(15px, -10px); opacity: 0.85; }
        }
        @keyframes genGlow2 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50% { transform: scale(1.2) translate(-15px, 15px); opacity: 0.8; }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.85) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
        }
      `}</style>

      {/* Orbe superior fucsia/magenta */}
      <div 
        className="absolute -top-16 -right-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-[85px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.6) 0%, rgba(168,85,247,0.3) 60%, transparent 100%)',
          animation: 'genGlow1 9s ease-in-out infinite'
        }}
      />

      {/* Orbe inferior violeta/azul profundo */}
      <div 
        className="absolute -bottom-20 -left-16 w-88 h-88 sm:w-104 sm:h-104 rounded-full blur-[95px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(217,70,239,0.3) 70%, transparent 100%)',
          animation: 'genGlow2 11s ease-in-out infinite'
        }}
      />

      {/* Estrellas vectoriales brillantes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
        <svg viewBox="0 0 24 24" className="absolute top-[12%] left-[10%] w-4.5 h-4.5 text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]" style={{ animation: 'sparkleTwinkle 3.2s ease-in-out infinite' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute top-[28%] right-[8%] w-4 h-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" style={{ animation: 'sparkleTwinkle 4.5s ease-in-out infinite 1s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute bottom-[24%] left-[8%] w-5 h-5 text-amber-300 drop-shadow-[0_0_9px_rgba(251,191,36,0.8)]" style={{ animation: 'sparkleTwinkle 3.8s ease-in-out infinite 0.7s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* 1. CABECERA EDITORIAL */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-0.5 w-full">
        <span className="text-sm xs:text-base font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewindAño
        </span>
        <span className="text-[10px] font-mono text-zinc-300 font-semibold tracking-wider mt-0.5">
          cinerewind.com.ar · {anio}
        </span>
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full border border-pink-400/40 bg-pink-500/15 text-pink-200 text-[10px] xs:text-xs font-mono font-bold uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-pink-300" />
          <span>Géneros & Meses Récord</span>
        </div>
      </div>

      {/* 2. CUERPO CENTRAL */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col items-center my-auto min-h-0 py-1 space-y-2.5">
        
        {/* TITULAR MONUMENTAL */}
        <div className="text-center px-2">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(236,72,153,0.5)]">
            Tus Géneros & Picos
          </h2>
          <p className="text-xs xs:text-sm text-zinc-300 font-medium mt-0.5">
            Las historias que dominaron tu pantalla y tus meses más cinéfilos
          </p>
        </div>

        {/* BLOQUE A: BARRAS DE GÉNEROS */}
        <div className="w-full max-w-[290px] xs:max-w-[320px] p-3 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-md shadow-xl space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-[10px] font-mono font-black uppercase text-zinc-400 tracking-wider">
              Top Géneros Favoritos
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-400">
              Presencia
            </span>
          </div>

          {topGeneros.length > 0 ? (
            topGeneros.slice(0, 5).map((gen, idx) => {
              const paleta = coloresGeneros[idx % coloresGeneros.length];
              return (
                <div key={`gen-${idx}-${gen.nombre}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black font-mono text-zinc-500">
                        0{idx + 1}
                      </span>
                      <span className={`text-[11px] font-black uppercase tracking-wide ${paleta.text}`}>
                        {gen.nombre}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-white">
                      {gen.porcentaje}%
                    </span>
                  </div>
                  {/* Barra */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${paleta.bar} transition-all duration-700`}
                      style={{ width: `${Math.max(gen.porcentaje, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-2 text-center text-xs text-zinc-400">
              Variedad total de géneros
            </div>
          )}
        </div>

        {/* BLOQUE B: TARJETAS DÚO DE MESES RÉCORD (PELÍCULAS & SERIES) */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-[290px] xs:max-w-[320px]">
          
          {/* Mes Récord Películas */}
          <div className="p-2.5 rounded-2xl bg-gradient-to-b from-orange-500/20 to-amber-950/40 border border-orange-400/50 backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-orange-300">
                <Film className="w-3 h-3 text-orange-400" />
                <span>Récord Pelis</span>
              </div>
              <span className="text-base xs:text-lg font-black uppercase text-white block mt-1 leading-tight">
                {mesPeli ? mesPeli.mes : 'Octubre'}
              </span>
            </div>
            <div className="mt-2 pt-1 border-t border-orange-400/20 flex items-baseline justify-between">
              <span className="text-2xl xs:text-3xl font-black text-orange-300 leading-none tracking-tight">
                {mesPeli ? mesPeli.cantidad : stats?.totalPeliculas || 0}
              </span>
              <span className="text-[8.5px] font-bold text-zinc-300 uppercase tracking-wider">
                películas
              </span>
            </div>
          </div>

          {/* Mes Récord Series */}
          <div className="p-2.5 rounded-2xl bg-gradient-to-b from-purple-500/20 to-indigo-950/40 border border-purple-400/50 backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-purple-300">
                <Tv className="w-3 h-3 text-purple-400" />
                <span>Récord Series</span>
              </div>
              <span className="text-base xs:text-lg font-black uppercase text-white block mt-1 leading-tight">
                {mesSerie ? mesSerie.mes : 'Agosto'}
              </span>
            </div>
            <div className="mt-2 pt-1 border-t border-purple-400/20 flex items-baseline justify-between">
              <span className="text-2xl xs:text-3xl font-black text-purple-300 leading-none tracking-tight">
                {mesSerie ? mesSerie.cantidad : stats?.totalEpisodios || 0}
              </span>
              <span className="text-[8.5px] font-bold text-zinc-300 uppercase tracking-wider">
                capítulos
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. BOTÓN SIGUIENTE */}
      <div 
        data-no-capture="true"
        className="relative z-30 flex items-center justify-center shrink-0 pb-1 pt-1 w-full max-w-xs mt-auto"
      >
        <button
          onClick={onSiguiente}
          data-no-capture="true"
          className="w-full py-2.5 px-5 rounded-full bg-white hover:bg-zinc-100 text-black font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-98"
        >
          <span>Sobres de Honor →</span>
        </button>
      </div>

      {/* 4. FOOTER */}
      <div className="relative z-10 shrink-0 w-full text-center pb-1">
        <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
          cinerewind.com.ar
        </span>
      </div>
    </div>
  );
}
