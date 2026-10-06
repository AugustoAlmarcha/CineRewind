import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Shield, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-300 dark:border-white/10 bg-white/70 dark:bg-[#0c0c0f]/80 backdrop-blur-md mt-20 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8">
        
        {/* Fila Principal */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          
          {/* Marca CineRewind */}
          <div className="space-y-3 max-w-sm">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30 group-hover:scale-105 transition">
                <span className="font-black text-xs font-mono">&lt;&lt;</span>
              </div>
              <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
                Cine<span className="text-rose-600">Rewind</span>
              </span>
            </Link>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Tu diario cinematográfico y de series. Registra lo que ves, califica episodios, comparte con amigos y revive tu año en pantalla.
            </p>
          </div>

          {/* Enlaces de Navegación */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div className="space-y-2.5">
              <span className="font-black uppercase tracking-wider text-neutral-900 dark:text-white text-[11px] font-mono">
                Explorar
              </span>
              <ul className="space-y-2 text-neutral-500 dark:text-neutral-400 font-medium">
                <li>
                  <Link to="/" className="hover:text-rose-600 transition">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link to="/tendencias" className="hover:text-rose-600 transition">
                    Tendencias
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-black uppercase tracking-wider text-neutral-900 dark:text-white text-[11px] font-mono">
                Legal & Info
              </span>
              <ul className="space-y-2 text-neutral-500 dark:text-neutral-400 font-medium">
                <li>
                  <Link to="/privacidad" className="hover:text-rose-600 transition">
                    Privacidad y Términos
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-black uppercase tracking-wider text-neutral-900 dark:text-white text-[11px] font-mono">
                Atribución
              </span>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                Datos y pósters cortesía de <span className="font-bold text-neutral-700 dark:text-neutral-300">TMDb</span>.
              </p>
            </div>
          </div>

        </div>

        {/* Fila Inferior con Copyright y Atribución TMDb */}
        <div className="pt-6 border-t border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-neutral-400 font-mono">
          <p>
            © {new Date().getFullYear()} CineRewind. Todos los derechos reservados.
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 max-w-md">
            Este producto utiliza la API de TMDb pero no está respaldado ni certificado por TMDb.
          </p>
        </div>

      </div>
    </footer>
  );
}
