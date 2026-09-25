import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function ModalAuth({ isOpen, onClose }) {
  const { iniciarSesion } = useAuth();
  const [esRegistro, setEsRegistro] = useState(false);
  
  // Estados Registro
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [emailRegistro, setEmailRegistro] = useState('');
  const [passwordRegistro, setPasswordRegistro] = useState('');

  // Estados Login
  const [identificadorLogin, setIdentificadorLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Al abrir: limpiar formularios y arrancar en Login
  useEffect(() => {
    if (isOpen) {
      setEsRegistro(false);
      setError(null);
      setNombre('');
      setUsername('');
      setEmailRegistro('');
      setPasswordRegistro('');
      setIdentificadorLogin('');
      setPasswordLogin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cambiarModo = (nuevoModo) => {
    setEsRegistro(nuevoModo);
    setError(null);
    setPasswordLogin('');
    setPasswordRegistro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const endpoint = esRegistro ? '/api/auth/registro' : '/api/auth/login';
    const body = esRegistro 
      ? { 
          nombre: nombre.trim(), 
          username: username.trim(), 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl relative text-neutral-900 dark:text-white">
        
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold hover:bg-rose-600 hover:text-white transition cursor-pointer"
        >
          ✕
        </button>

        {/* Encabezado */}
        <div className="text-center mb-6">
          <span className="text-3xl">🎬</span>
          <h2 className="text-2xl font-black mt-2">
            {esRegistro ? 'Crear cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {esRegistro 
              ? 'Lleva tu registro personalizado' 
              : 'Ingresa para acceder a tu historial'}
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl text-center leading-relaxed animate-fadeIn">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {esRegistro ? (
            <>
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Tu nombre o apodo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 text-neutral-900 dark:text-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Nombre de Usuario (@)</label>
<input
  type="text"
  required
  maxLength={15}
  autoComplete="username"
  placeholder="Elige un usuario único (máx 15)"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  className="w-full bg-neutral-100 dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 text-neutral-900 dark:text-white transition"
/>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  value={emailRegistro}
                  onChange={(e) => setEmailRegistro(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 text-neutral-900 dark:text-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  value={passwordRegistro}
                  onChange={(e) => setPasswordRegistro(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 text-neutral-900 dark:text-white transition"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Usuario o Correo</label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Escribe tu usuario o correo"
                  value={identificadorLogin}
                  onChange={(e) => setIdentificadorLogin(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 text-neutral-900 dark:text-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={passwordLogin}
                  onChange={(e) => setPasswordLogin(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 text-neutral-900 dark:text-white transition"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full mt-2 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {enviando ? 'Cargando...' : (esRegistro ? 'Registrarse' : 'Entrar')}
          </button>
        </form>

        {/* Separador "O" */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-neutral-300 dark:border-white/10 w-full" />
          <span className="bg-[#fcfaf7] dark:bg-[#141418] px-3 text-[11px] text-neutral-400 font-bold uppercase tracking-wider absolute">
            o
          </span>
        </div>

        {/* Botón de Google OAuth */}
        <div className="flex justify-center w-full min-h-[40px]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('No se pudo conectar con los servidores de Google')}
            theme="filled_black"
            shape="pill"
            text="continue_with"
            locale="es"
            width="320"
          />
        </div>

        {/* Alternar modo */}
        <div className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
          {esRegistro ? (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button 
                type="button" 
                onClick={() => cambiarModo(false)}
                className="text-rose-600 dark:text-rose-500 font-black hover:underline cursor-pointer"
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
                className="text-rose-600 dark:text-rose-500 font-black hover:underline cursor-pointer"
              >
                Crea una aquí
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}