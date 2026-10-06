import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Home, TrendingUp, Clapperboard, Sparkles } from 'lucide-react';

export default function Pagina404() {
  const navigate = useNavigate();

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 text-center animate-fadeIn">
      <div className="max-w-md w-full bg-white dark:bg-[#141419] border border-neutral-300 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Adorno sutil de fondo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Ícono de Claqueta Cinéfila */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-600/10 border border-rose-500/20 text-rose-600 dark:text-rose-500 flex items-center justify-center shadow-inner relative">
          <Clapperboard className="w-10 h-10 animate-pulse" />
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-neutral-900 text-white font-mono text-[10px] font-black border border-white/20">
            TAKE 404
          </span>
        </div>

        {/* Textos */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-mono text-xs font-black uppercase tracking-wider">
            ESCENA ELIMINADA
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight pt-1">
            404 · Fuera de Cartelera
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed pt-2">
            La página que buscas no existe o fue recortada en la sala de edición cinematográfica.
          </p>
        </div>

        {/* Frase cinéfila divertida */}
        <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 italic">
          "Houston, parece que nos equivocamos de sala de cine..."
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>
          <button
            onClick={() => navigate('/tendencias')}
            className="flex-1 py-3 px-4 rounded-2xl bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 font-bold text-xs uppercase tracking-wider transition border border-neutral-300 dark:border-white/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tendencias</span>
          </button>
        </div>

      </div>
    </main>
  );
}
