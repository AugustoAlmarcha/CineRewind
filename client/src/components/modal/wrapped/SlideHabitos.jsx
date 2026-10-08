import React from 'react';
import { Calendar, Monitor, Flame, Sparkles, Clock, Crown, ArrowRight } from 'lucide-react';

export default function SlideHabitos({ stats, onSiguiente }) {
  const anio = stats?.anio || new Date().getFullYear();
  const diaSagrado = stats?.diaSagrado || 'Domingo';
  const plataforma = stats?.plataforma || 'Cine & Streaming';

  // Días de la semana para el visualizador
  const diasSemana = [
    { clave: 'Lunes', corto: 'LUN' },
    { clave: 'Martes', corto: 'MAR' },
    { clave: 'Miércoles', corto: 'MIÉ' },
    { clave: 'Jueves', corto: 'JUE' },
    { clave: 'Viernes', corto: 'VIE' },
    { clave: 'Sábado', corto: 'SÁB' },
    { clave: 'Domingo', corto: 'DOM' }
  ];

  const normalizar = (txt) => (txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const diaNormalizado = normalizar(diaSagrado);

  return (
    <div className="w-full h-full flex flex-col justify-between items-center rounded-3xl p-3 xs:p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none bg-gradient-to-b from-[#1b082e] via-[#0d0319] to-[#05010c]">
      {/* 🌟 KEYFRAMES Y FONDOS AMBIENTALES DEEZER */}
      <style>{`
        @keyframes habitosGlow1 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          50% { transform: scale(1.18) translate(15px, 15px); opacity: 0.85; }
        }
        @keyframes habitosGlow2 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50% { transform: scale(1.15) translate(-15px, -15px); opacity: 0.8; }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 0.95; transform: scale(1.2) rotate(15deg); }
        }
      `}</style>

      {/* Orbe superior violeta/índigo */}
      <div 
        className="absolute -top-16 -right-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-[85px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(147,51,234,0.65) 0%, rgba(99,102,241,0.3) 65%, transparent 100%)',
          animation: 'habitosGlow1 9s ease-in-out infinite'
        }}
      />

      {/* Orbe inferior fucsia/ámbar */}
      <div 
        className="absolute -bottom-20 -left-16 w-88 h-88 sm:w-104 sm:h-104 rounded-full blur-[95px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.55) 0%, rgba(245,158,11,0.3) 70%, transparent 100%)',
          animation: 'habitosGlow2 10s ease-in-out infinite'
        }}
      />

      {/* Estrellas vectoriales brillantes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
        <svg viewBox="0 0 24 24" className="absolute top-[14%] left-[10%] w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ animation: 'sparkleTwinkle 3.2s ease-in-out infinite' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute top-[20%] right-[10%] w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" style={{ animation: 'sparkleTwinkle 4.2s ease-in-out infinite 1s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute bottom-[22%] left-[8%] w-4.5 h-4.5 text-purple-300 drop-shadow-[0_0_9px_rgba(216,180,254,0.8)]" style={{ animation: 'sparkleTwinkle 3.6s ease-in-out infinite 0.5s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* 1. CABECERA EDITORIAL */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1">
        <span className="text-sm xs:text-base font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewindAño
        </span>
        <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-200 text-[10px] xs:text-xs font-mono font-bold uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>RITUALES & SESIONES · {anio}</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-300 font-semibold tracking-wider mt-0.5">
          cinerewind.com.ar
        </span>
      </div>

      {/* 2. CUERPO CENTRAL: BENTO GRID MODERNO Y FACHERO */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col items-center my-auto min-h-0 py-1">
        
        {/* Título de sección */}
        <div className="text-center mb-3">
          <h3 className="text-2xl xs:text-3xl font-black uppercase tracking-tight text-white leading-none drop-shadow-md">
            Tus Hábitos Cinéfilos
          </h3>
          <p className="text-[11px] xs:text-xs text-zinc-300 font-medium mt-1">
            Los patrones que definieron cada una de tus sesiones
          </p>
        </div>

        {/* BENTO GRID */}
        <div className="w-full space-y-2.5">
          
          {/* TARJETA 1: DÍA SAGRADO (CON CALENDARIO SEMANAL INTERACTIVO) */}
          <div className="p-3 xs:p-3.5 rounded-2xl bg-zinc-950/70 backdrop-blur-md border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-400 tracking-wider uppercase">
                <Calendar className="w-3.5 h-3.5" />
                <span>Día Sagrado</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Pico de visualizaciones
              </span>
            </div>

            {/* Fila semanal destacando el día sagrado */}
            <div className="grid grid-cols-7 gap-1 my-1.5">
              {diasSemana.map((d) => {
                const esElDia = normalizar(d.clave) === diaNormalizado;
                return (
                  <div
                    key={d.clave}
                    className={`py-1.5 rounded-lg flex flex-col items-center justify-center transition-all ${
                      esElDia
                        ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-black font-black shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-105 border border-white/50'
                        : 'bg-white/5 text-zinc-400 font-semibold border border-white/5 text-[9px]'
                    }`}
                  >
                    <span className="text-[10px] leading-none">{d.corto}</span>
                    {esElDia && <Crown className="w-2.5 h-2.5 mt-0.5 text-black" />}
                  </div>
                );
              })}
            </div>

            <div className="mt-2 text-left">
              <span className="text-lg xs:text-xl font-black text-white capitalize block leading-none">
                {diaSagrado}
              </span>
              <p className="text-[10px] xs:text-[11px] text-zinc-300 mt-1">
                El día con más reproducciones en tu historial. Tu cita fija frente a la pantalla.
              </p>
            </div>
          </div>

          {/* TARJETA 2 & 3: GRID 2 COLUMNAS (PANTALLA HOGAR + RITMO) */}
          <div className="grid grid-cols-2 gap-2.5">
            
            {/* PANTALLA HOGAR */}
            <div className="p-3 rounded-2xl bg-zinc-950/70 backdrop-blur-md border border-cyan-400/30 shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-black text-cyan-300 uppercase tracking-wider mb-1">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Pantalla Hogar</span>
                </div>
                <strong className="text-base xs:text-lg font-black text-white block truncate leading-tight mt-1">
                  {plataforma}
                </strong>
              </div>
              <p className="text-[9px] xs:text-[10px] text-zinc-300 mt-2 leading-tight">
                Tu plataforma de streaming más sintonizada.
              </p>
            </div>

            {/* RITMO / TIEMPO EN PANTALLA */}
            <div className="p-3 rounded-2xl bg-zinc-950/70 backdrop-blur-md border border-purple-400/30 shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-black text-purple-300 uppercase tracking-wider mb-1">
                  <Flame className="w-3.5 h-3.5 text-pink-400" />
                  <span>Tiempo Total</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <strong className="text-base xs:text-lg font-black text-white leading-tight">
                    {stats?.totalHoras || 0}h
                  </strong>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    ({stats?.totalMinutos?.toLocaleString() || 0}m)
                  </span>
                </div>
              </div>
              <p className="text-[9px] xs:text-[10px] text-zinc-300 mt-2 leading-tight">
                {stats?.totalEpisodios || 0} caps · {stats?.totalPeliculas || 0} pelis
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* 3. BOTÓN SIGUIENTE (FACHERO Y MODERNO) */}
      <div className="relative z-10 shrink-0 pb-1 xs:pb-2 pt-1 w-full max-w-xs" data-no-capture="true">
        <button 
          onClick={onSiguiente} 
          data-no-capture="true"
          className="w-full py-2.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-200 text-black font-black text-xs sm:text-sm uppercase cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2"
        >
          <span>Descubrir Mi Arquetipo</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}
