import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cinerewind_token') || null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('cinerewind_token');
    setToken(null);
    setUsuario(null);
  }, []);

  const iniciarSesion = useCallback((tokenRecibido, usuarioRecibido) => {
    localStorage.setItem('cinerewind_token', tokenRecibido);
    setToken(tokenRecibido);
    setUsuario(usuarioRecibido);
  }, []);

  // Al montar o cambiar el token, validamos la sesión con el backend
  useEffect(() => {
    let cancelado = false;

    const verificarSesion = async () => {
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
          }
        } else {
          // Token expirado o inválido en el servidor
          if (!cancelado) {
            cerrarSesion();
          }
        }
      } catch (err) {
        console.error('Error al validar sesión:', err);
        if (!cancelado) {
          cerrarSesion();
        }
      } finally {
        if (!cancelado) {
          setCargandoAuth(false);
        }
      }
    };

    verificarSesion();
    return () => { cancelado = true; };
  }, [token, cerrarSesion]);

  return (
    <AuthContext.Provider value={{ usuario, token, cargandoAuth, iniciarSesion, cerrarSesion }}>
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