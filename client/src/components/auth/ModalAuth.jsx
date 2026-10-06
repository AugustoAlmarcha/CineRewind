import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Mail, 
  KeyRound, 
  Loader2 
} from 'lucide-react';
import { solicitarRecuperacionAPI, comprobarUsernameAPI } from '../../api';

export default function ModalAuth({ isOpen, onClose }) {
  const { iniciarSesion } = useAuth();
  const [esRegistro, setEsRegistro] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  
  // Estados Registro
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [emailRegistro, setEmailRegistro] = useState('');
  const [passwordRegistro, setPasswordRegistro] = useState('');

  // Validación de Username en tiempo real
  const [usernameDisponible, setUsernameDisponible] = useState(null); // null | true | false
  const [verificandoUsername, setVerificandoUsername] = useState(false);
  const [mensajeUsername, setMensajeUsername] = useState('');

  // Estados Login
  const [identificadorLogin, setIdentificadorLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  // Estados Recuperación de Contraseña
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [mensajeExitoRecuperacion, setMensajeExitoRecuperacion] = useState(null);
  const [enlacePruebaRecuperacion, setEnlacePruebaRecuperacion] = useState(null);

  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Al abrir: limpiar formularios y arrancar en Login
  useEffect(() => {
    if (isOpen) {
      setEsRegistro(false);
      setModoRecuperar(false);
      setError(null);
      setNombre('');
      setUsername('');
      setEmailRegistro('');
      setPasswordRegistro('');
      setUsernameDisponible(null);
      setVerificandoUsername(false);
      setMensajeUsername('');
      setIdentificadorLogin('');
      setPasswordLogin('');
      setEmailRecuperacion('');
      setMensajeExitoRecuperacion(null);
      setEnlacePruebaRecuperacion(null);
    }
  }, [isOpen]);

  // Comprobar disponibilidad de username en tiempo real con debounce
  useEffect(() => {
    if (!esRegistro) return;

    const limpio = username.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '');

    if (!limpio) {
      setUsernameDisponible(null);
      setVerificandoUsername(false);
      setMensajeUsername('');
      return;
    }

    if (limpio.length < 3) {
      setUsernameDisponible(false);
      setVerificandoUsername(false);
      setMensajeUsername('Mínimo 3 caracteres');
      return;
    }

    setVerificandoUsername(true);
    const temporizador = setTimeout(async () => {
      try {
        const data = await comprobarUsernameAPI(limpio);
        if (data.disponible) {
          setUsernameDisponible(true);
          setMensajeUsername(`✓ @${limpio} está disponible`);
        } else {
          setUsernameDisponible(false);
          setMensajeUsername(`✗ @${limpio} ya está en uso`);
        }
      } catch {
        setUsernameDisponible(null);
        setMensajeUsername('');
      } finally {
        setVerificandoUsername(false);
      }
    }, 350);

    return () => clearTimeout(temporizador);
  }, [username, esRegistro]);

  if (!isOpen) return null;

  const cambiarModo = (nuevoModo) => {
    setEsRegistro(nuevoModo);
    setModoRecuperar(false);
    setError(null);
    setPasswordLogin('');
    setPasswordRegistro('');
    setUsernameDisponible(null);
    setVerificandoUsername(false);
    setMensajeUsername('');
    setMensajeExitoRecuperacion(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (esRegistro && usernameDisponible === false) {
      setError('Por favor, elige un nombre de usuario que esté disponible.');
      return;
    }

    setEnviando(true);

    const endpoint = esRegistro ? '/api/auth/registro' : '/api/auth/login';
    const body = esRegistro 
      ? { 
          nombre: nombre.trim(), 
          username: username.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, ''), 
          email: emailRegistro.trim(), 
          password: passwordRegistro 
        }
      : { 
          identificador: identificadorLogin.trim(), 
          password: passwordLogin 
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar la solicitud');
      }

      iniciarSesion(data.token, data.usuario);
      onClose();
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  // Manejador de Solicitud de Recuperación
  const handleSolicitarRecuperacion = async (e) => {
    e.preventDefault();
    if (!emailRecuperacion || !emailRecuperacion.trim()) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }

    setError(null);
    setEnviando(true);
    setMensajeExitoRecuperacion(null);
    setEnlacePruebaRecuperacion(null);

    try {
      const data = await solicitarRecuperacionAPI(emailRecuperacion.trim());
      setMensajeExitoRecuperacion(data.mensaje);
      if (data.enlacePrueba) {
        setEnlacePruebaRecuperacion(data.enlacePrueba);
      }
    } catch (err) {
      setError(err.message || 'No se pudo enviar el correo de recuperación');
    } finally {
      setEnviando(false);
    }
  };

  // Manejador de Google OAuth
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setEnviando(true);
      setError(null);

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Error al autenticar con Google');
      }

      iniciarSesion(data.token, data.usuario);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al conectar con Google');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-neutral-900 dark:text-white transition-colors max-h-[92vh] overflow-y-auto">
        
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-neutral-200/80 dark:bg-white/10 flex items-center justify-center text-neutral-500 hover:bg-rose-600 hover:text-white transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado con Logo Oficial */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center">
            <img 
              src="/logo2.svg" 
              alt="CineRewind" 
              className="w-11 h-14"
            />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {modoRecuperar 
              ? 'Recuperar contraseña' 
              : esRegistro 
              ? 'Crear cuenta' 
              : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {modoRecuperar
              ? 'Ingresa tu correo para recibir las instrucciones'
              : esRegistro 
              ? 'Lleva tu registro cinematográfico personalizado' 
              : 'Ingresa para acceder a tu diario e historial'}
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn leading-relaxed">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================
            MODO 1: RECUPERACIÓN DE CONTRASEÑA
           ======================================================== */}
        {modoRecuperar ? (
          <div className="space-y-4">
            {mensajeExitoRecuperacion ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-2xl space-y-2 leading-relaxed">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>¡Correo enviado con éxito!</span>
                  </div>
                  <p>{mensajeExitoRecuperacion}</p>
                </div>

                {/* Enlace de prueba si estamos en desarrollo local */}
                {enlacePruebaRecuperacion && (
                  <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl space-y-1.5">
                    <p className="text-[11px] font-bold text-amber-400">
                      🛠️ Modo Pruebas Local:
                    </p>
                    <a
                      href={enlacePruebaRecuperacion}
                      onClick={onClose}
                      className="block text-xs text-rose-400 hover:text-rose-300 underline font-bold break-all"
                    >
                      Abrir pantalla de restablecimiento ahora →
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setModoRecuperar(false);
                    setMensajeExitoRecuperacion(null);
                    setError(null);
                  }}
                  className="w-full py-3 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white font-bold text-xs rounded-2xl transition cursor-pointer"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleSolicitarRecuperacion} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Correo Electrónico Registrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      value={emailRecuperacion}
                      onChange={(e) => setEmailRecuperacion(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-neutral-900 dark:text-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full mt-3 py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-950/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{enviando ? 'Enviando correo...' : 'Enviar enlace de recuperación'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoRecuperar(false);
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a Iniciar Sesión</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ========================================================
             MODO 2: LOGIN O REGISTRO NORMAL
             ======================================================== */
          <>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {esRegistro ? (
                <>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Tu nombre o apodo"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-neutral-900 dark:text-white transition"
                    />
                  </div>

                  {/* Nombre de Usuario con Comprobación en Tiempo Real */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Nombre de Usuario (@)
                      </label>
                      {mensajeUsername && (
                        <span className={`text-[10px] font-bold ${
                          usernameDisponible ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {mensajeUsername}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={15}
                        autoComplete="username"
                        placeholder="Elige un usuario único (máx 15)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                        className={`w-full bg-neutral-100 dark:bg-white/5 border rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none transition pr-10 text-neutral-900 dark:text-white ${
                          usernameDisponible === true
                            ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                            : usernameDisponible === false
                            ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-neutral-300 dark:border-white/10 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        }`}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                        {verificandoUsername && (
                          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                        )}
                        {!verificandoUsername && usernameDisponible === true && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                        {!verificandoUsername && usernameDisponible === false && (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      value={emailRegistro}
                      onChange={(e) => setEmailRegistro(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-neutral-900 dark:text-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Contraseña (mínimo 6 caracteres)"
                      value={passwordRegistro}
                      onChange={(e) => setPasswordRegistro(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-neutral-900 dark:text-white transition"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Usuario o Correo
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="Escribe tu usuario o correo"
                      value={identificadorLogin}
                      onChange={(e) => setIdentificadorLogin(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-neutral-900 dark:text-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setModoRecuperar(true);
                          setError(null);
                          setMensajeExitoRecuperacion(null);
                        }}
                        className="text-[11px] text-rose-500 hover:text-rose-400 font-bold hover:underline cursor-pointer"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="Tu contraseña"
                      value={passwordLogin}
                      onChange={(e) => setPasswordLogin(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-neutral-900 dark:text-white transition"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={enviando || (esRegistro && usernameDisponible === false) || (esRegistro && verificandoUsername)}
                className="w-full mt-3 py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-950/20 transition cursor-pointer disabled:opacity-50"
              >
                {enviando 
                  ? 'Cargando...' 
                  : (esRegistro ? 'Registrarse' : 'Entrar')}
              </button>
            </form>

            {/* Separador Editorial */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="border-t border-neutral-200 dark:border-white/10 w-full" />
              <span className="bg-[#fcfaf7] dark:bg-[#141418] px-3 text-[10px] text-neutral-400 font-black uppercase tracking-widest absolute">
                o
              </span>
            </div>

            {/* Botón Google OAuth */}
            <div className="flex justify-center w-full min-h-[44px]">
              {isOpen && (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('No se pudo conectar con los servidores de Google')}
                  theme="filled_black"
                  shape="pill"
                  text="continue_with"
                  locale="es"
                  width="320"
                />
              )}
            </div>

            {/* Alternar modo */}
            <div className="mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
              {esRegistro ? (
                <p>
                  ¿Ya tienes una cuenta?{' '}
                  <button 
                    type="button" 
                    onClick={() => cambiarModo(false)}
                    className="text-rose-600 dark:text-rose-500 font-black hover:underline cursor-pointer ml-1"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              ) : (
                <p>
                  ¿No tienes cuenta todavía?{' '}
                  <button 
                    type="button" 
                    onClick={() => cambiarModo(true)}
                    className="text-rose-600 dark:text-rose-500 font-black hover:underline cursor-pointer ml-1"
                  >
                    Crea una aquí
                  </button>
                </p>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}