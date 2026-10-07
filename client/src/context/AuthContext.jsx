import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('cinerewind_token') || null);
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('cinerewind_usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  // Si ya tenemos token y usuario cacheados localmente, no bloqueamos la interfaz con pantalla de carga
  const [cargandoAuth, setCargandoAuth] = useState(
    () => !localStorage.getItem('cinerewind_usuario') && !!localStorage.getItem('cinerewind_token')
  );

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('cinerewind_token');
    localStorage.removeItem('cinerewind_usuario');
    localStorage.removeItem('cinerewind_banner');
    setToken(null);
    setUsuario(null);
  }, []);

  const iniciarSesion = useCallback((tokenRecibido, usuarioRecibido) => {
    localStorage.removeItem('cinerewind_banner');
    localStorage.setItem('cinerewind_token', tokenRecibido);
    if (usuarioRecibido) {
      try {
        localStorage.setItem('cinerewind_usuario', JSON.stringify(usuarioRecibido));
      } catch {}
    }
    setToken(tokenRecibido);
    setUsuario(usuarioRecibido || null);
  }, []);

  // Actualiza el perfil activo en memoria y en localStorage al guardar cambios
  const actualizarUsuario = useCallback((nuevosDatos) => {
    setUsuario((prev) => {
      const actualizado = prev ? { ...prev, ...nuevosDatos } : nuevosDatos;
      try {
        localStorage.setItem('cinerewind_usuario', JSON.stringify(actualizado));
      } catch {}
      return actualizado;
    });
  }, []);

  // Al montar o cambiar el token, validamos la sesión con el backend
  useEffect(() => {
    let cancelado = false;
    let timerReintento = null;

    const verificarSesion = async (intento = 1) => {
      if (!token) {
        setCargandoAuth(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/perfil', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const datosUsuario = await res.json();
          if (!cancelado) {
            setUsuario(datosUsuario);
            try {
              localStorage.setItem('cinerewind_usuario', JSON.stringify(datosUsuario));
            } catch {}
          }
        } else if (res.status === 401 || res.status === 403) {
          // Token genuinamente expirado o revocado por el backend
          if (!cancelado) {
            console.warn('Sesión expirada o token inválido:', res.status);
            cerrarSesion();
          }
        } else {
          // 500, 502, 503, 504: El backend en Render está arrancando (cold start).
          // ¡NO cerramos la sesión! Mantenemos los datos locales intactos.
          console.warn(`Servidor temporalmente no disponible (status ${res.status}). Manteniendo sesión.`);
          if (!cancelado && intento < 3) {
            timerReintento = setTimeout(() => verificarSesion(intento + 1), 6000);
          }
        }
      } catch (err) {
        // Error de red (Failed to fetch, conexión caída o servidor iniciando)
        // ¡NO cerramos la sesión!
        console.warn('Error de red al conectar con el backend (servidor iniciando):', err.message);
        if (!cancelado && intento < 3) {
          timerReintento = setTimeout(() => verificarSesion(intento + 1), 6000);
        }
      } finally {
        if (!cancelado) {
          setCargandoAuth(false);
        }
      }
    };

    verificarSesion();
    return () => {
      cancelado = true;
      if (timerReintento) clearTimeout(timerReintento);
    };
  }, [token, cerrarSesion]);

  // Keep-alive silencioso cada 10 minutos para evitar que el servidor gratuito de Render se apague por inactividad
  useEffect(() => {
    const pingKeepAlive = () => {
      fetch('/api/health').catch(() => {});
    };
    const intervalo = setInterval(pingKeepAlive, 10 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, token, cargandoAuth, iniciarSesion, cerrarSesion, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};