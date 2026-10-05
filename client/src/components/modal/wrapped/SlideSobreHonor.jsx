import React from 'react';
import { Film, Award, RotateCcw, Sparkles } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideSobreHonor({
  sobre,
  sobreAbierto,
  onAbrirSobre,
  onCerrarSobre,
  onConfetti,
  onSiguiente,
  obtenerUrlImagenSegura
}) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br ${sobre.bgGradient} rounded-3xl p-3 sm:p-5 relative overflow-hidden text-white shadow-2xl`}>
      <FloatingEmojis emojis={['🏆', '✨', '🎬', '👑', '🍿', '🔥', '💎']} count={12} />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        <div className="mb-2">
          <LogoCineRewind tamano="md" />
        </div>

        <span 
          className="px-4 py-1 rounded-full text-black text-xs font-black uppercase mb-1 shadow-lg"
          style={{ backgroundColor: sobre.bordeColor }}
        >
          {sobre.titulo}
        </span>
        <p className="text-xs text-zinc-200">{sobre.subtitulo}</p>
      </div>

      {/* Sobre 3D animado */}
      <div 
        className="relative w-full max-w-sm sm:max-w-xl lg:max-w-2xl h-[400px] sm:h-[470px] lg:h-[500px] flex items-end justify-center cursor-pointer" 
        onClick={() => !sobreAbierto && onAbrirSobre()}
      >
        {sobreAbierto && (
          <div 
            className="absolute z-25 w-[94%] sm:w-[96%] p-4 sm:p-6 rounded-3xl bg-zinc-950 border-3 text-left shadow-2xl animate-bounce-subtle" 
            style={{ 
              transform: 'translateY(-95px)',
              borderColor: sobre.bordeColor,
              boxShadow: `0 0 45px ${sobre.bordeColor}90`
            }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: sobre.bordeColor }} />
                <span className="text-[10px] sm:text-xs font-mono font-black tracking-widest uppercase" style={{ color: sobre.bordeColor }}>
                  {sobre.dato}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-bold bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                VEREDICTO OFICIAL
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {sobre.foto ? (
                <div 
                  className="w-22 h-26 sm:w-30 sm:h-34 rounded-2xl overflow-hidden border-2 shrink-0 bg-black shadow-xl"
                  style={{ borderColor: sobre.bordeColor }}
                >
                  <img 
                    src={obtenerUrlImagenSegura(sobre.foto)} 
                    alt={sobre.ganador} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ) : sobre.esRobot ? (
                <div className="w-22 h-26 sm:w-30 sm:h-34 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-cyan-500 border-2 border-white flex flex-col items-center justify-center shrink-0 shadow-xl relative overflow-hidden">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-950 border-2 border-cyan-300 flex flex-col items-center justify-center p-2 shadow-inner">
                    <div className="flex gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-pulse" />
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-pulse" />
                    </div>
                    <div className="w-6 h-1 rounded-full bg-pink-400" />
                  </div>
                  <span className="text-[9px] font-mono text-white font-black mt-1 uppercase">🤖 BOT COPILOTO</span>
                </div>
              ) : (
                <div 
                  className="w-22 h-26 sm:w-30 sm:h-34 rounded-2xl border-2 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${sobre.bordeColor}20`, borderColor: sobre.bordeColor }}
                >
                  <Award className="w-12 h-12" style={{ color: sobre.bordeColor }} />
                </div>
              )}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h4 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight truncate">{sobre.ganador}</h4>
                <p className="text-xs sm:text-sm text-zinc-300 italic mt-1.5 font-serif leading-relaxed">"{sobre.frase}"</p>
              </div>
            </div>

            {sobre.titulos_destacados && sobre.titulos_destacados.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-white/10">
                <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">
                  TÍTULOS DESTACADOS EN TU AÑO:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sobre.titulos_destacados.map((item, idx) => {
                    const titulo = typeof item === 'string' ? item : item.titulo;
                    const poster = typeof item === 'object' ? item.poster_path : null;
                    return (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/80 border border-white/15 shadow-sm">
                        {poster ? (
                          <img 
                            src={obtenerUrlImagenSegura(poster)} 
                            alt="" 
                            className="w-5 h-7 rounded object-cover" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Film className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="text-xs font-bold text-white max-w-[160px] truncate">{titulo}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div 
          className="relative w-[94%] sm:w-[96%] h-52 sm:h-64 lg:h-70 rounded-3xl border-3 flex flex-col items-center justify-center shadow-2xl overflow-hidden"
          style={{ 
            borderColor: sobre.bordeColor,
            background: `linear-gradient(180deg, #181438 0%, #0d0a21 100%)`
          }}
        >
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polygon points="0,0 50,52 100,0" fill="rgba(255,255,255,0.06)" />
            <line x1="0" y1="0" x2="50" y2="52" stroke={sobre.bordeColor} strokeWidth="1.2" strokeOpacity="0.8" />
            <line x1="100" y1="0" x2="50" y2="52" stroke={sobre.bordeColor} strokeWidth="1.2" strokeOpacity="0.8" />
            <line x1="0" y1="100" x2="40" y2="58" stroke={sobre.bordeColor} strokeWidth="0.8" strokeOpacity="0.4" />
            <line x1="100" y1="100" x2="60" y2="58" stroke={sobre.bordeColor} strokeWidth="0.8" strokeOpacity="0.4" />
          </svg>

          {!sobreAbierto ? (
            <div className="relative z-10 flex flex-col items-center gap-2.5 p-4">
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-white flex flex-col items-center justify-center animate-bounce-subtle shadow-xl"
                style={{ backgroundColor: sobre.bordeColor }}
              >
                <Film className="w-7 h-7 sm:w-9 sm:h-9 text-black" />
                <span className="text-[8px] sm:text-[9px] font-black text-black font-mono tracking-tighter">REWIND</span>
              </div>
              <span 
                className="text-xs sm:text-sm font-black text-black px-4 py-1.5 rounded-full shadow-xl border border-black animate-pulse"
                style={{ backgroundColor: sobre.bordeColor }}
              >
                Toca para abrir sobre ✉️
              </span>
            </div>
          ) : (
            <span className="relative z-10 text-xs sm:text-sm font-mono font-black uppercase tracking-wider" style={{ color: sobre.bordeColor }}>
              ★ VEREDICTO DE LA GALA REVELADO
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-md mx-auto pt-2 z-30">
        {sobreAbierto && (
          <button
            onClick={onCerrarSobre}
            className="px-3.5 py-2 rounded-xl bg-black/70 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-lg transition-transform hover:scale-105"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Volver a abrir</span>
          </button>
        )}
        <button
          onClick={onConfetti}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-black font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>¡Lanzar Confetti! 🎉</span>
        </button>
        <button
          onClick={onSiguiente}
          className="px-5 py-2 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs flex items-center gap-1 shadow-lg cursor-pointer transition-transform hover:scale-105"
        >
          <span>Siguiente &gt;</span>
        </button>
      </div>
    </div>
  );
}