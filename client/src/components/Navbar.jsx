import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModalAuth from './auth/ModalAuth';
import BuscadorNavbar from './navbar/BuscadorNavbar';

export default function Navbar({ onSeleccionarObra, darkMode, onToggleTheme }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const userMenuRef = useRef(null);

  // Cerrar menú del usuario al hacer clic afuera
  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setMenuUsuarioAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#f7f4ed]/90 dark:bg-[#0f0f12]/95 backdrop-blur-md border-b border-neutral-300/80 dark:border-white/10 px-8 py-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          
          {/* Identidad con Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <img 
              src="/logo.png" 
              alt="CineRewind Logo" 
              className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(225,29,72,0.4)] transition-transform group-hover:scale-105" 
            />
            <span className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
              Cine<span className="text-rose-600">Rewind</span>
            </span>
          </Link>

          {/* Subcomponente de Búsqueda */}
          <BuscadorNavbar onSeleccionarObra={onSeleccionarObra} />

          {/* Navegación y Login / Usuario */}
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6 text-sm font-semibold">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive ? 'text-rose-600 font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-rose-600 transition'
                }
              >
                Inicio
              </NavLink>
              <NavLink 
                to="/tendencias" 
                className={({ isActive }) => 
                  isActive ? 'text-rose-600 font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-rose-600 transition'
                }
              >
                Tendencias
              </NavLink>
            </nav>

            {/* Alternar Tema */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#18181c] text-neutral-700 dark:text-amber-400 hover:border-rose-500/40 cursor-pointer transition-all duration-200"
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Bloque de Usuario / Login */}
            {usuario ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
                  className="flex items-center gap-3 p-1.5 pl-2 pr-3 rounded-full border border-neutral-300 dark:border-white/10 hover:border-rose-500 bg-neutral-100/60 dark:bg-white/5 transition cursor-pointer select-none group"
                >
                  <img
                    src={usuario.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={usuario.nombre || 'Usuario'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                    }}
                    className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-white/10"
                  />
                  <span className="text-sm font-black text-neutral-800 dark:text-neutral-100 group-hover:text-rose-600 transition truncate max-w-[140px]">
                    {usuario.nombre || usuario.username}
                  </span>
                </button>

                {menuUsuarioAbierto && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#fbf9f5] dark:bg-[#16161a] border border-neutral-300 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-neutral-200 dark:border-white/5">
                      <p className="text-sm font-black text-neutral-900 dark:text-white truncate">{usuario.nombre}</p>
                      <p className="text-xs text-neutral-400">@{usuario.username}</p>
                    </div>

                    <button
                      onClick={() => {
                        cerrarSesion();
                        setMenuUsuarioAbierto(false);
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition flex items-center gap-2 cursor-pointer mt-1"
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setModalAuthAbierto(true)}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
              >
                Iniciar Sesión
              </button>
            )}

          </div>

        </div>
      </header>

      <ModalAuth
        isOpen={modalAuthAbierto}
        onClose={() => setModalAuthAbierto(false)}
      />
    </>
  );
}