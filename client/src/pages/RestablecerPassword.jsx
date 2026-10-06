import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { restablecerPasswordAPI } from '../api';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('El enlace es inválido o no contiene un token de recuperación.');
      return;
    }

    if (passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      setError('Las contraseñas no coinciden. Por favor, revísalas.');
      return;
    }

    setCargando(true);
    try {
      await restablecerPasswordAPI(token, passwordNueva);
      setExito(true);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#0a0a0f]">
      <div className="max-w-md w-full bg-[#13131c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-fadeIn">
        
        {/* Cabecera con Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-500 mb-2">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Restablecer Contraseña
          </h1>
          <p className="text-xs text-zinc-400">
            {exito 
              ? 'Tu cuenta ha sido actualizada con éxito'
              : 'Ingresa una nueva contraseña segura para tu cuenta'}
          </p>
        </div>

        {/* Sin token en URL */}
        {!token && !exito && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Enlace inválido</span>
            </div>
            <p>
              No se encontró un código de recuperación en este enlace. Por favor, solicita uno nuevo desde la ventana de Iniciar Sesión.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition cursor-pointer"
            >
              Volver al Inicio
            </button>
          </div>
        )}

        {/* Mensaje de Error */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pantalla de Éxito */}
        {exito ? (
          <div className="space-y-4 animate-fadeIn text-center">
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-300">
                ¡Contraseña restablecida!
              </h3>
              <p className="text-xs text-emerald-400/90 leading-relaxed">
                Tu clave ha sido actualizada de forma segura. Ya puedes acceder a CineRewind con tu nueva contraseña.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-950/30 transition cursor-pointer"
            >
              Ir a Iniciar Sesión en el Inicio
            </button>
          </div>
        ) : (
          token && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nueva Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    className="w-full bg-[#181824] border border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Confirmar Contraseña
                </label>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="w-full bg-[#181824] border border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
                />
              </div>

              <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-center gap-2 text-[11px] text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>La contraseña se cifra inmediatamente con algoritmo bcrypt.</span>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-950/20 transition cursor-pointer disabled:opacity-50"
              >
                {cargando ? 'Actualizando...' : 'Guardar nueva contraseña'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Inicio</span>
                </button>
              </div>
            </form>
          )
        )}

      </div>
    </div>
  );
}
