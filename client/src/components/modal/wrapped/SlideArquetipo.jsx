import React from 'react';
import { Award, Sparkles, Crown, ArrowRight, Shield, Ghost, Rocket, Search, Heart, Zap, Film, Stethoscope, Smile, BookOpen, Star, Flame, Tv } from 'lucide-react';

export default function SlideArquetipo({ stats, onSiguiente }) {
  const anio = stats?.anio || new Date().getFullYear();
  const arquetipo = stats?.arquetipo || {
    titulo: 'El Jurado de Cannes',
    lema: 'Analizas cada plano con pasión y devoras historias con auténtico criterio de festival.',
    categoria: 'Cinefilia Selecta',
    motivo: 'Tu selección diversa y equilibrada demostró un paladar cinematográfico exigente.'
  };

  // Selector de ícono dinámico según la temática del arquetipo
  const renderIcono = () => {
    const props = { className: "w-10 h-10 xs:w-12 xs:h-12 text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" };
    switch (arquetipo.icono) {
      case 'Stethoscope': return <Stethoscope {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Ghost': return <Ghost {...props} />;
      case 'Rocket': return <Rocket {...props} />;
      case 'Search': return <Search {...props} />;
      case 'Smile': return <Smile {...props} />;
      case 'Heart': return <Heart {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Film': return <Film {...props} />;
      case 'BookOpen': return <BookOpen {...props} />;
      case 'Star': return <Star {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Tv': return <Tv {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center rounded-3xl p-3 xs:p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none bg-gradient-to-b from-[#1b082e] via-[#0d0319] to-[#05010c]">
      {/* 🌟 KEYFRAMES Y FONDOS AMBIENTALES DE GALA */}
      <style>{`
        @keyframes arquetipoGlow1 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.65; }
          50% { transform: scale(1.2) translate(20px, -15px); opacity: 0.9; }
        }
        @keyframes arquetipoGlow2 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.55; }
          50% { transform: scale(1.18) translate(-20px, 20px); opacity: 0.85; }
        }
        @keyframes pulseBadge {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(250,204,21,0.5)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(250,204,21,0.85)); }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 0.95; transform: scale(1.2) rotate(15deg); }
        }
      `}</style>

      {/* Orbe superior dorado / ámbar de gala */}
      <div 
        className="absolute -top-16 -left-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-[85px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.6) 0%, rgba(225,29,72,0.3) 65%, transparent 100%)',
          animation: 'arquetipoGlow1 9s ease-in-out infinite'
        }}
      />

      {/* Orbe inferior violeta / púrpura */}
      <div 
        className="absolute -bottom-20 -right-16 w-88 h-88 sm:w-104 sm:h-104 rounded-full blur-[95px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.65) 0%, rgba(147,51,234,0.35) 70%, transparent 100%)',
          animation: 'arquetipoGlow2 11s ease-in-out infinite'
        }}
      />

      {/* Estrellas vectoriales brillantes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
        <svg viewBox="0 0 24 24" className="absolute top-[12%] right-[10%] w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ animation: 'sparkleTwinkle 3.2s ease-in-out infinite' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute top-[25%] left-[8%] w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" style={{ animation: 'sparkleTwinkle 4.2s ease-in-out infinite 0.8s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute bottom-[20%] right-[12%] w-4.5 h-4.5 text-yellow-300 drop-shadow-[0_0_9px_rgba(253,224,71,0.8)]" style={{ animation: 'sparkleTwinkle 3.6s ease-in-out infinite 0.4s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* 1. CABECERA EDITORIAL */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1">
        <span className="text-sm xs:text-base font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewindAño
        </span>
        <div className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-200 text-[10px] xs:text-xs font-mono font-bold uppercase shadow-sm">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>DIAGNÓSTICO OFICIAL · {anio}</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-300 font-semibold tracking-wider mt-0.5">
          cinerewind.com.ar
        </span>
      </div>

      {/* 2. CUERPO CENTRAL: MEDALLÓN Y TARJETA DE ARQUETIPO */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col items-center my-auto min-h-0 py-1">
        
        {/* Título de la diapositiva */}
        <div className="text-center mb-3">
          <h3 className="text-2xl xs:text-3xl font-black uppercase tracking-tight text-white leading-none drop-shadow-md">
            Tu Arquetipo Cinéfilo
          </h3>
          <p className="text-[11px] xs:text-xs text-zinc-300 font-medium mt-1">
            El veredicto final de tu personalidad en pantalla
          </p>
        </div>

        {/* TARJETA DE GALA DEL ARQUETIPO */}
        <div className="w-full p-4 xs:p-5 sm:p-6 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border-2 border-amber-400/40 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Resplandor interior dorado */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Insignia / Medallón pulsante */}
          <div 
            className="w-16 h-16 xs:w-20 xs:h-20 rounded-2xl bg-gradient-to-br from-amber-400/30 to-purple-600/30 border-2 border-amber-400/60 flex items-center justify-center mb-3 shadow-inner"
            style={{ animation: 'pulseBadge 4s ease-in-out infinite' }}
          >
            {renderIcono()}
          </div>

          {/* Categoría pill */}
          {arquetipo.categoria && (
            <span className="px-3 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/20 text-[9px] xs:text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              {arquetipo.categoria}
            </span>
          )}

          {/* TÍTULO MONUMENTAL */}
          <h4 className="text-xl xs:text-2xl sm:text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 drop-shadow-md leading-tight">
            "{arquetipo.titulo}"
          </h4>

          {/* LEMA POÉTICO */}
          <p className="text-xs xs:text-sm text-zinc-200 italic mt-2.5 font-serif max-w-xs mx-auto leading-relaxed">
            "{arquetipo.lema}"
          </p>

          {/* EXPLICACIÓN DEL CRITERIO (En qué se basó para asignarlo) */}
          <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-center gap-2 text-[10px] xs:text-[11px] text-amber-300 font-medium px-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="leading-snug">
              {arquetipo.motivo || 'Calculado según tus obras más vistas y hábitos del año.'}
            </span>
          </div>

        </div>
      </div>

      {/* 3. BOTÓN SIGUIENTE */}
      <div className="relative z-10 shrink-0 pb-1 xs:pb-2 pt-1 w-full max-w-xs" data-no-capture="true">
        <button 
          onClick={onSiguiente} 
          data-no-capture="true"
          className="w-full py-2.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-200 text-black font-black text-xs sm:text-sm uppercase cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2"
        >
          <span>Ver Cartelera Final VIP</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}