import React from 'react';
import { Film, Award, RotateCcw, Sparkles, ArrowRight, Mail, Crown } from 'lucide-react';

export default function SlideSobreHonor({
  sobre,
  sobreAbierto,
  onAbrirSobre,
  onCerrarSobre,
  onConfetti,
  onSiguiente,
  obtenerUrlImagenSegura
}) {
  const bordeColor = sobre.bordeColor || '#fbbf24';

  // Paletas de color alegres y festivas por categoría de sobre
  const temaPorTipo = {
    actor: {
      bgGradient: 'from-[#331c05] via-[#1c0e02] to-[#0c0501]',
      orb1: 'rgba(251, 191, 36, 0.55)',
      orb2: 'rgba(245, 158, 11, 0.4)',
      accentRgb: '251, 191, 36',
      cardBg: 'from-[#1f1910] via-[#14100a] to-[#0a0805]',
      starColor: 'text-amber-300'
    },
    actriz: {
      bgGradient: 'from-[#3a0924] via-[#210414] to-[#0e0208]',
      orb1: 'rgba(244, 114, 182, 0.55)',
      orb2: 'rgba(225, 29, 72, 0.4)',
      accentRgb: '244, 114, 182',
      cardBg: 'from-[#22101b] via-[#160a11] to-[#0c0509]',
      starColor: 'text-pink-300'
    },
    director: {
      bgGradient: 'from-[#062c1b] via-[#03180f] to-[#010b07]',
      orb1: 'rgba(52, 211, 153, 0.55)',
      orb2: 'rgba(16, 185, 129, 0.4)',
      accentRgb: '52, 211, 153',
      cardBg: 'from-[#0e1f17] via-[#09150f] to-[#040c08]',
      starColor: 'text-emerald-300'
    },
    copiloto: {
      bgGradient: 'from-[#06243d] via-[#031422] to-[#010910]',
      orb1: 'rgba(56, 189, 248, 0.55)',
      orb2: 'rgba(99, 102, 241, 0.4)',
      accentRgb: '56, 189, 248',
      cardBg: 'from-[#0c1a26] via-[#081119] to-[#04080d]',
      starColor: 'text-sky-300'
    }
  };

  const tema = temaPorTipo[sobre.tipo] || temaPorTipo.actor;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b ${tema.bgGradient} rounded-3xl p-3 xs:p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none`}>
      <style>{`
        @keyframes orbFestivo1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.6; }
          50% { transform: translate(-20px, 25px) scale(1.22); opacity: 0.85; }
        }
        @keyframes orbFestivo2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.55; }
          50% { transform: translate(25px, -20px) scale(1.25); opacity: 0.8; }
        }
        @keyframes starGleam {
          0%, 100% { opacity: 0.3; transform: scale(0.85) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.25) rotate(15deg); }
        }
        @keyframes sealPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 25px rgba(${tema.accentRgb}, 0.5); }
          50% { transform: scale(1.06); box-shadow: 0 0 45px rgba(${tema.accentRgb}, 0.85); }
        }
      `}</style>

      {/* 🌟 1. FONDO FESTIVO Y LLENO DE COLOR (ORBES Y ESTRELLAS VECTORIALES) */}
      {/* Orbe superior con color de la categoría */}
      <div 
        className="absolute -top-16 -right-12 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-[80px] pointer-events-none -z-0"
        style={{
          background: `radial-gradient(circle, ${tema.orb1} 0%, transparent 70%)`,
          animation: 'orbFestivo1 8s ease-in-out infinite'
        }}
      />

      {/* Orbe inferior festivo */}
      <div 
        className="absolute -bottom-20 -left-16 w-80 h-80 sm:w-104 sm:h-104 rounded-full blur-[90px] pointer-events-none -z-0"
        style={{
          background: `radial-gradient(circle, ${tema.orb2} 0%, transparent 75%)`,
          animation: 'orbFestivo2 9s ease-in-out infinite'
        }}
      />

      {/* ✨ ESTRELLAS HERMOSAS DE 4 PUNTAS TITILANDO (VECTORIALES DE GALA) */}
      <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden">
        {/* Estrella 1 (Superior izquierda) */}
        <svg viewBox="0 0 24 24" className={`absolute top-[14%] left-[12%] w-5 h-5 ${tema.starColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`} style={{ animation: 'starGleam 3s ease-in-out infinite' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>

        {/* Estrella 2 (Superior derecha) */}
        <svg viewBox="0 0 24 24" className={`absolute top-[22%] right-[14%] w-6 h-6 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.95)]`} style={{ animation: 'starGleam 4s ease-in-out infinite 0.8s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>

        {/* Estrella 3 (Centro derecha) */}
        <svg viewBox="0 0 24 24" className={`absolute top-[48%] right-[8%] w-4 h-4 ${tema.starColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]`} style={{ animation: 'starGleam 3.5s ease-in-out infinite 1.5s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>

        {/* Estrella 4 (Inferior izquierda) */}
        <svg viewBox="0 0 24 24" className={`absolute bottom-[28%] left-[10%] w-5 h-5 ${tema.starColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`} style={{ animation: 'starGleam 4.2s ease-in-out infinite 0.4s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>

        {/* Estrella 5 (Inferior derecha) */}
        <svg viewBox="0 0 24 24" className={`absolute bottom-[20%] right-[12%] w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]`} style={{ animation: 'starGleam 3.2s ease-in-out infinite 2s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* 2. CABECERA EDITORIAL ELEGANTE */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1">
        <span className="text-sm xs:text-base font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewindAño
        </span>
        <div 
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-0.5 rounded-full border text-[10px] xs:text-xs font-mono font-black uppercase shadow-lg backdrop-blur-md"
          style={{ 
            backgroundColor: `${bordeColor}25`, 
            borderColor: `${bordeColor}60`,
            color: bordeColor 
          }}
        >
          <Award className="w-3.5 h-3.5" style={{ color: bordeColor }} />
          <span>{sobre.titulo}</span>
        </div>
        <p className="text-[11px] xs:text-xs text-zinc-200 mt-1 max-w-xs font-medium drop-shadow-sm">
          {sobre.subtitulo}
        </p>
      </div>

      {/* 3. SOBRE DE GALA 3D CON APERTURA ULTRA SUAVE */}
      <div 
        className="relative z-20 w-full max-w-sm sm:max-w-md h-[340px] xs:h-[370px] sm:h-[410px] flex items-end justify-center cursor-pointer my-auto"
        onClick={() => !sobreAbierto && onAbrirSobre()}
      >
        {/* TARJETA DEL GANADOR (DISEÑO DIPLOMA DE GALA, NO TODO NEGRO) */}
        <div 
          className={`absolute z-30 w-[94%] sm:w-[96%] p-3.5 xs:p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${tema.cardBg} border-2 text-left shadow-2xl backdrop-blur-2xl transition-all duration-750 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            sobreAbierto 
              ? 'translate-y-[-65px] xs:translate-y-[-78px] sm:translate-y-[-90px] opacity-100 pointer-events-auto' 
              : 'translate-y-[15px] opacity-0 pointer-events-none'
          }`}
          style={{ 
            borderColor: bordeColor,
            boxShadow: `0 0 50px rgba(${tema.accentRgb}, 0.4), inset 0 0 30px rgba(255,255,255,0.03)`
          }}
        >
          {/* Filete fino dorado interior estilo diploma */}
          <div 
            className="absolute inset-1.5 rounded-xl border pointer-events-none"
            style={{ borderColor: `${bordeColor}35` }}
          />

          {/* Marca de agua sutil de laureles de gala en el fondo */}
          <div className="absolute right-2 bottom-2 opacity-5 pointer-events-none">
            <Crown className="w-36 h-36" style={{ color: bordeColor }} />
          </div>

          {/* Cinta superior de la tarjeta */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: bordeColor, color: bordeColor }} />
              <span className="text-[10px] sm:text-xs font-mono font-black tracking-widest uppercase" style={{ color: bordeColor }}>
                {sobre.dato}
              </span>
            </div>
            <span 
              className="text-[9px] sm:text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border shadow-sm"
              style={{
                backgroundColor: `${bordeColor}20`,
                borderColor: `${bordeColor}40`,
                color: bordeColor
              }}
            >
              ★ DIPLOMA DE HONOR ★
            </span>
          </div>

          {/* Contenido: Foto y Nombre */}
          <div className="relative z-10 flex items-center gap-3 xs:gap-4 sm:gap-5">
            {sobre.foto ? (
              <div 
                className="w-20 h-24 xs:w-22 xs:h-26 sm:w-24 sm:h-28 rounded-xl overflow-hidden border-2 shrink-0 bg-black shadow-[0_10px_20px_rgba(0,0,0,0.8)] relative group"
                style={{ borderColor: bordeColor }}
              >
                <img 
                  src={obtenerUrlImagenSegura(sobre.foto)} 
                  alt={sobre.ganador} 
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : sobre.esSolitario ? (
              <div 
                className="w-20 h-24 xs:w-22 xs:h-26 sm:w-24 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center shrink-0 p-1.5 text-center bg-gradient-to-b from-[#181a38] to-[#0c0d1f] shadow-xl"
                style={{ borderColor: bordeColor }}
              >
                <span className="text-2xl xs:text-3xl mb-0.5 filter drop-shadow">🛋️</span>
                <span className="text-[8px] font-mono font-black uppercase text-cyan-300">CINE ÍNTIMO</span>
                <span className="text-[6.5px] font-mono text-zinc-400">100% PERSONAL</span>
              </div>
            ) : sobre.esAmigoTexto ? (
              <div 
                className="w-20 h-24 xs:w-22 xs:h-26 sm:w-24 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center shrink-0 p-1.5 text-center bg-gradient-to-b from-[#2e1026] to-[#160613] shadow-xl"
                style={{ borderColor: bordeColor }}
              >
                <span className="text-2xl xs:text-3xl mb-0.5 filter drop-shadow">🍿</span>
                <span className="text-[8px] font-mono font-black uppercase text-pink-300">EN EL SOFÁ</span>
                <span className="text-[6.5px] font-mono text-zinc-400">EN COMPAÑÍA</span>
              </div>
            ) : (
              <div 
                className="w-20 h-24 xs:w-22 xs:h-26 sm:w-24 sm:h-28 rounded-xl border-2 flex items-center justify-center shrink-0 bg-black/60 shadow-xl"
                style={{ borderColor: bordeColor }}
              >
                <Award className="w-10 h-10" style={{ color: bordeColor }} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-lg xs:text-xl sm:text-2xl font-black text-white uppercase tracking-tight truncate leading-tight drop-shadow-md">
                {sobre.ganador}
              </h4>
              <p className="text-[11px] xs:text-xs sm:text-sm text-zinc-200 italic mt-1 font-serif leading-snug line-clamp-3">
                "{sobre.frase}"
              </p>
            </div>
          </div>

          {/* Obras destacadas si las hay */}
          {sobre.titulos_destacados && sobre.titulos_destacados.length > 0 && (
            <div className="relative z-10 mt-2.5 pt-2 border-t border-white/10">
              <span className="text-[8.5px] font-mono text-zinc-300 font-bold uppercase tracking-wider block mb-1">
                TÍTULOS DESTACADOS EN TU AÑO:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sobre.titulos_destacados.slice(0, 3).map((item, idx) => {
                  const tit = typeof item === 'string' ? item : item.titulo;
                  const poster = typeof item === 'object' ? item.poster_path : null;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border shadow-sm backdrop-blur-md"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderColor: `${bordeColor}35`
                      }}
                    >
                      {poster ? (
                        <img 
                          src={obtenerUrlImagenSegura(poster)} 
                          alt="" 
                          crossOrigin="anonymous" 
                          className="w-4 h-5.5 rounded object-cover" 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Film className="w-3 h-3 text-amber-400" />
                      )}
                      <span className="text-[10px] font-bold text-white max-w-[130px] truncate">{tit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CUERPO DEL SOBRE DE GALA (SATINADO DE ALTA COSTURA CON LÍNEAS DE CORTE METÁLICAS) */}
        <div 
          className="relative z-10 w-[94%] sm:w-[96%] h-44 xs:h-48 sm:h-52 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl overflow-hidden transition-all duration-500"
          style={{ 
            borderColor: bordeColor,
            background: 'linear-gradient(180deg, #18122c 0%, #0c0817 100%)',
            boxShadow: `0 15px 35px rgba(0,0,0,0.8), 0 0 25px rgba(${tema.accentRgb}, 0.25)`
          }}
        >
          {/* Solapa triangular superior del sobre con bordes biselados */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polygon points="0,0 50,48 100,0" fill={`rgba(${tema.accentRgb}, 0.08)`} />
            <line x1="0" y1="0" x2="50" y2="48" stroke={bordeColor} strokeWidth="1.4" strokeOpacity="0.8" />
            <line x1="100" y1="0" x2="50" y2="48" stroke={bordeColor} strokeWidth="1.4" strokeOpacity="0.8" />
            <line x1="0" y1="100" x2="42" y2="52" stroke={bordeColor} strokeWidth="0.8" strokeOpacity="0.35" />
            <line x1="100" y1="100" x2="58" y2="52" stroke={bordeColor} strokeWidth="0.8" strokeOpacity="0.35" />
          </svg>

          {/* Sello de Lacre central de Gala */}
          {!sobreAbierto ? (
            <div className="relative z-10 flex flex-col items-center gap-2 p-3">
              <div 
                className="w-14 h-14 xs:w-16 xs:h-16 rounded-full border-2 border-white/90 flex flex-col items-center justify-center shadow-2xl cursor-pointer transition-transform hover:scale-110 active:scale-95"
                style={{ 
                  backgroundColor: bordeColor,
                  animation: 'sealPulse 3s ease-in-out infinite'
                }}
              >
                <Crown className="w-6 h-6 xs:w-7 xs:h-7 text-black fill-black" />
                <span className="text-[7.5px] font-black text-black font-mono tracking-tighter">REWIND</span>
              </div>
              <div 
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-black font-black text-[11px] xs:text-xs uppercase tracking-wide shadow-xl cursor-pointer transition-transform hover:scale-105"
                style={{ backgroundColor: bordeColor }}
              >
                <Mail className="w-3.5 h-3.5 text-black" />
                <span>Toca para abrir sobre</span>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex items-center gap-1.5 opacity-85">
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                ★ Sobre abierto · Honor revelado
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTONES INFERIORES ARMONIZADOS (ESTILO SPOTIFY/DEEZER) */}
      <div className="relative z-30 flex items-center justify-center gap-2 sm:gap-2.5 w-full max-w-md mx-auto pt-1 pb-1">
        {sobreAbierto && (
          <button
            onClick={onCerrarSobre}
            className="px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95"
            title="Guardar veredicto en sobre"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Cerrar</span>
          </button>
        )}

        <button
          onClick={onConfetti}
          className="px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-black text-xs flex items-center gap-1.5 border border-white/25 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>¡Confetti! 🎉</span>
        </button>

        <button
          onClick={onSiguiente}
          className="group px-6 py-2.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
          style={{ 
            backgroundColor: bordeColor,
            color: '#000000'
          }}
        >
          <span>Siguiente</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}