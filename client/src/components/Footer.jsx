import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Shield, Sparkles, Coffee } from 'lucide-react';

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

        {/* Banner de Apoyo / Donaciones: Cafecito & Buy Me a Coffee */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border border-amber-500/20 dark:border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                ¿Te gusta CineRewind? Apoyá el proyecto <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Tu aporte nos ayuda a cubrir los costos de los servidores y a seguir sumando nuevas funciones para la comunidad.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center">
            {/* Cafecito (Argentina - Mercado Pago) */}
            <a
              href="https://cafecito.app/cinerewind"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-[#00C9FF] hover:bg-[#00b2e3] text-black shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Invitá un Cafecito en Pesos Argentinos (Mercado Pago)"
            >
              <span>☕</span>
              <span>Cafecito (Arg)</span>
            </a>

            {/* PayPal (Internacional - USD / EUR) */}
            <a
              href="https://paypal.me/augustoas09"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-[#0070BA] hover:bg-[#005ea6] text-white shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Donar con PayPal (Donaciones internacionales en USD / EUR)"
            >
              <span className="font-serif italic font-extrabold text-sm">P</span>
              <span>PayPal (USD)</span>
            </a>
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
