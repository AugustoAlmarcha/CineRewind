import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModalAuth from './auth/ModalAuth';
import BuscadorNavbar from './navbar/BuscadorNavbar';
import ModalImportarNetflix from './modal/ModalImportarNetflix';
import ModalAmigos from './modal/ModalAmigos';
import { obtenerSolicitudesPendientesAPI, obtenerInvitacionesCovisionAPI } from '../api';
import { 
  Flame, 
  Users, 
  Sun, 
  Moon, 
  Film, 
  Home as HomeIcon, 
  ShieldCheck, 
  DownloadCloud, 
  LogOut, 
  User as UserIcon,
  ChevronDown 
} from 'lucide-react';

export default function Navbar({ onSeleccionarObra, darkMode, onToggleTheme, onActualizarDatos }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const [modalNetflixAbierto, setModalNetflixAbierto] = useState(false);
  const [modalAmigosAbierto, setModalAmigosAbierto] = useState(false);
  const [cantidadPendientes, setCantidadPendientes] = useState(0);

  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const userMenuRef = useRef(null);

  const revisarSolicitudes = async () => {
    if (!usuario) {
      setCantidadPendientes(0);
      return;
    }
    try {
      const [resAmigos, resCovisiones] = await Promise.all([
        obtenerSolicitudesPendientesAPI(),
        obtenerInvitacionesCovisionAPI(),
      ]);
      const totalPendientes = 
        (Array.isArray(resAmigos) ? resAmigos.length : 0) + 
        (Array.isArray(resCovisiones) ? resCovisiones.length : 0);

      setCantidadPendientes(totalPendientes);
    } catch {
      setCantidadPendientes(0);
    }
  };

  useEffect(() => {
    revisarSolicitudes();
  }, [usuario]);

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
      {/* Barra de navegación */}
      <header className="sticky top-0 z-40 w-full bg-[#f7f4ed]/90 dark:bg-[#0f0f11]/90 backdrop-blur-md border-b border-neutral-300/80 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 h-20 flex items-center justify-between gap-2.5 sm:gap-6">
          
          {/* Logo y Nombre */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer select-none group"
          >
            <img 
              src="/logo.svg" 
              alt="CineRewind" 
              className="w-9 h-9 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform" 
            />
            <span className="hidden sm:inline-block font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              CineRewind
            </span>
          </Link>

          {/* Campo de búsqueda */}
          <div className="flex-1 max-w-xl min-w-0">
            <BuscadorNavbar onSeleccionarObra={onSeleccionarObra} />
          </div>

          {/* Acciones y Navegación */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            
            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center gap-2 text-sm font-bold">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                    isActive 
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
                  }`
                }
              >
                <HomeIcon className="w-4 h-4" />
                <span>Inicio</span>
              </NavLink>

              <NavLink 
                to="/tendencias" 
                className={({ isActive }) => 
                  `px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                    isActive 
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
                  }`
                }
              >
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Tendencias</span>
              </NavLink>
            </nav>

            {/* Botón Tendencias en Móvil */}
            <NavLink
              to="/tendencias"
              className={({ isActive }) =>
                `md:hidden w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'border-rose-500/50 bg-rose-500/15 text-rose-500'
                    : 'border-neutral-300/80 dark:border-white/10 bg-neutral-200/70 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:border-rose-500/40 hover:text-rose-500'
                }`
              }
              title="Tendencias"
              aria-label="Tendencias"
            >
              <Flame className="w-4 h-4 text-rose-500 flex-shrink-0" />
            </NavLink>

            {/* Notificaciones / Amigos */}
            {usuario && (
              <button
                type="button"
                onClick={() => setModalAmigosAbierto(true)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-neutral-300/80 dark:border-white/10 bg-neutral-200/70 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:border-rose-500/40 hover:bg-rose-500/10 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                title="Red y Amigos"
                aria-label="Red y Amigos"
              >
                <Users className="w-4 h-4" />
                {cantidadPendientes > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-md">
                    {cantidadPendientes}
                  </span>
                )}
              </button>
            )}

            {/* Alternar Tema */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-neutral-300/80 dark:border-white/10 bg-neutral-200/70 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40 hover:text-amber-500 flex items-center justify-center transition cursor-pointer flex-shrink-0"
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>

            {/* Usuario logueado o Botón de Login */}
            {usuario ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
                  className="flex items-center gap-1.5 sm:gap-2.5 h-9 sm:h-10 px-1.5 sm:px-3 rounded-xl border border-neutral-300/80 dark:border-white/10 bg-neutral-200/70 dark:bg-white/5 hover:border-rose-500/40 transition cursor-pointer select-none group flex-shrink-0"
                >
                  <img
                    src={usuario.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={usuario.nombre || 'Usuario'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                    }}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover shadow-xs"
                  />
                  <span className="hidden sm:inline text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-rose-500 transition truncate max-w-[120px]">
                    {usuario.nombre || usuario.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-rose-500 transition" />
                </button>

                {menuUsuarioAbierto && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#fbf9f5] dark:bg-[#16161a] border border-neutral-300 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-white/5">
                      <p className="text-xs font-black text-neutral-900 dark:text-white truncate">{usuario.nombre}</p>
                      <p className="text-[11px] text-neutral-500 truncate">@{usuario.username}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuUsuarioAbierto(false);
                        navigate(`/perfil/${usuario.username}`);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-rose-500/10 hover:text-rose-600 transition flex items-center gap-2.5 cursor-pointer text-neutral-700 dark:text-neutral-300"
                    >
                      <UserIcon className="w-4 h-4 text-rose-500" />
                      <span>Mi Perfil</span>
                    </button>

                    {usuario.rol === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuUsuarioAbierto(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition flex items-center gap-2.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Panel Admin</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setMenuUsuarioAbierto(false); 
                        setModalNetflixAbierto(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-rose-500/10 hover:text-rose-500 transition text-left cursor-pointer"
                    >
                      <DownloadCloud className="w-4 h-4 text-red-500" />
                      <span>Importar Netflix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        cerrarSesion();
                        setMenuUsuarioAbierto(false);
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition flex items-center gap-2.5 cursor-pointer border-t border-neutral-200 dark:border-white/5 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setModalAuthAbierto(true)}
                className="h-9 sm:h-10 px-3 sm:px-6 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs sm:text-sm font-black shadow-md shadow-rose-950/20 transition cursor-pointer flex items-center justify-center flex-shrink-0"
              >
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Entrar</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Modales Globales */}
      <ModalImportarNetflix
        abierto={modalNetflixAbierto}
        alCerrar={() => setModalNetflixAbierto(false)}
      />

      {modalAmigosAbierto && (
        <ModalAmigos 
          onClose={() => {
            setModalAmigosAbierto(false);
            revisarSolicitudes();
          }}
          onActualizado={() => {
            if (onActualizarDatos) onActualizarDatos();
          }} 
        />
      )}

      <ModalAuth
        isOpen={modalAuthAbierto}
        onClose={() => setModalAuthAbierto(false)}
      />
    </>
  );
}