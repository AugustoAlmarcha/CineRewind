import React from 'react';
import { Film, Tv, Sparkles, Ticket, Play, Clapperboard, Monitor, Flame } from 'lucide-react';
import LogoPlataforma from '../../common/LogoPlataforma';

export default function SlidePlataformas({ stats, onSiguiente }) {
  const anio = stats?.anio || new Date().getFullYear();
  const vecesAlCine = stats?.vecesAlCine || stats?.veces_al_cine || 0;
  const plataformasStats = stats?.plataformasStats || stats?.plataformas_stats || [];

  // Función para obtener color según la plataforma
  const getPlataformaStyle = (nombre = '') => {
    const n = nombre.toLowerCase();
    if (n.includes('cine')) {
      return {
        badgeBg: 'bg-amber-400 text-black',
        barColor: 'from-amber-400 to-yellow-500',
        borderColor: 'border-amber-400/50',
        textColor: 'text-amber-300',
        glowColor: 'rgba(251,191,36,0.3)'
      };
    }
    if (n.includes('netflix')) {
      return {
        badgeBg: 'bg-red-600 text-white',
        barColor: 'from-red-600 to-rose-600',
        borderColor: 'border-red-500/50',
        textColor: 'text-red-300',
        glowColor: 'rgba(239,68,68,0.3)'
      };
    }
    if (n.includes('disney')) {
      return {
        badgeBg: 'bg-blue-600 text-white',
        barColor: 'from-blue-500 to-indigo-600',
        borderColor: 'border-blue-400/50',
        textColor: 'text-blue-300',
        glowColor: 'rgba(59,130,246,0.3)'
      };
    }
    if (n.includes('max') || n.includes('hbo')) {
      return {
        badgeBg: 'bg-purple-600 text-white',
        barColor: 'from-purple-500 to-violet-700',
        borderColor: 'border-purple-400/50',
        textColor: 'text-purple-300',
        glowColor: 'rgba(168,85,247,0.3)'
      };
    }
    if (n.includes('prime') || n.includes('amazon')) {
      return {
        badgeBg: 'bg-sky-500 text-black',
        barColor: 'from-sky-400 to-cyan-600',
        borderColor: 'border-sky-400/50',
        textColor: 'text-sky-300',
        glowColor: 'rgba(56,189,248,0.3)'
      };
    }
    return {
      badgeBg: 'bg-emerald-500 text-black',
      barColor: 'from-emerald-400 to-teal-600',
      borderColor: 'border-emerald-400/50',
      textColor: 'text-emerald-300',
      glowColor: 'rgba(16,185,129,0.3)'
    };
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center rounded-3xl p-3 xs:p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none bg-gradient-to-b from-[#170a29] via-[#090214] to-[#040108]">
      {/* 🌟 EFECTOS DE FONDO Y ORBES DINÁMICOS */}
      <style>{`
        @keyframes platGlow1 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          50% { transform: scale(1.15) translate(15px, 15px); opacity: 0.85; }
        }
        @keyframes platGlow2 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50% { transform: scale(1.2) translate(-15px, -10px); opacity: 0.8; }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.85) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
        }
      `}</style>

      {/* Orbe superior violeta / índigo */}
      <div 
        className="absolute -top-16 -left-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-[85px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(147,51,234,0.6) 0%, rgba(79,70,229,0.3) 60%, transparent 100%)',
          animation: 'platGlow1 9s ease-in-out infinite'
        }}
      />

      {/* Orbe inferior dorado / rojo cálido */}
      <div 
        className="absolute -bottom-20 -right-16 w-88 h-88 sm:w-104 sm:h-104 rounded-full blur-[95px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.55) 0%, rgba(225,29,72,0.3) 70%, transparent 100%)',
          animation: 'platGlow2 11s ease-in-out infinite'
        }}
      />

      {/* Estrellas vectoriales brillantes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
        <svg viewBox="0 0 24 24" className="absolute top-[10%] right-[12%] w-4.5 h-4.5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ animation: 'sparkleTwinkle 3.2s ease-in-out infinite' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute top-[28%] left-[8%] w-4 h-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" style={{ animation: 'sparkleTwinkle 4.5s ease-in-out infinite 1s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute bottom-[24%] right-[8%] w-5 h-5 text-purple-300 drop-shadow-[0_0_9px_rgba(216,180,254,0.8)]" style={{ animation: 'sparkleTwinkle 3.8s ease-in-out infinite 0.7s' }}>
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
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-200 text-[10px] xs:text-xs font-mono font-bold uppercase shadow-sm">
          <Monitor className="w-3.5 h-3.5 text-amber-300" />
          <span>Tus Pantallas & Plataformas</span>
        </div>
      </div>

      {/* 2. CUERPO CENTRAL */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col items-center my-auto min-h-0 py-1 space-y-2.5">
        
        {/* TITULAR MONUMENTAL */}
        <div className="text-center px-2">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(251,191,36,0.5)]">
            ¿Dónde Viste Tus Obras?
          </h2>
          <p className="text-xs xs:text-sm text-zinc-300 font-medium mt-1">
            Tu año entre salas de cine y sesiones de sillón
          </p>
        </div>

        {/* HERO CARD: VISITAS AL CINE */}
        <div className="w-full max-w-[290px] xs:max-w-[320px] p-3 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-600/20 to-orange-600/20 border-2 border-amber-400/60 backdrop-blur-md shadow-[0_10px_30px_rgba(245,158,11,0.25)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shrink-0 shadow-inner">
              <img src="/logos-plataformas/popcorn.png" alt="Pochoclos" className="w-9 h-9 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 block">
                La Gran Pantalla
              </span>
              <span className="text-xs font-black text-white leading-tight block">
                Salas de Cine
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl xs:text-4xl font-black text-amber-300 drop-shadow leading-none block tracking-tight">
              {vecesAlCine}
            </span>
            <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider block mt-0.5">
              {vecesAlCine === 1 ? 'visita' : 'visitas'} al cine
            </span>
          </div>
        </div>

        {/* LISTA / BARRAS DE STREAMING */}
        <div className="w-full max-w-[290px] xs:max-w-[320px] p-3 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-md shadow-xl space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-[10px] font-mono font-black uppercase text-zinc-400 tracking-wider">
              Tus Servicios Favoritos
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-400">
              Obras
            </span>
          </div>

          {plataformasStats.length > 0 ? (
            plataformasStats.slice(0, 5).map((plat, idx) => {
              const st = getPlataformaStyle(plat.nombre);
              return (
                <div key={`plat-${idx}-${plat.nombre}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5.5 h-5.5 rounded overflow-hidden bg-zinc-900 border border-white/15 flex items-center justify-center shrink-0 shadow">
                        <LogoPlataforma nombre={plat.nombre} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-black uppercase text-white tracking-wide truncate">
                        {plat.nombre}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {plat.porcentaje}%
                      </span>
                    </div>
                    <span className="text-xs font-black text-white shrink-0">
                      {plat.cantidad} {plat.cantidad === 1 ? 'título' : 'títulos'}
                    </span>
                  </div>
                  {/* Barra de progreso */}
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${st.barColor} transition-all duration-700`}
                      style={{ width: `${Math.max(plat.porcentaje, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-3 text-center text-xs text-zinc-400">
              Sin registros de plataformas
            </div>
          )}
        </div>

        {/* Mensaje de cierre */}
        <div className="text-center text-[10px] font-mono text-zinc-400">
          <span>{vecesAlCine > 0 ? '✨ Amante del cine en sala y maratonista en streaming' : '✨ El streaming fue tu templo este año'}</span>
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
          <span>Tus Géneros & Meses Récord →</span>
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
