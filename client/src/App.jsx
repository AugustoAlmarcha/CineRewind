import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Tendencias from './pages/Tendencias';
import ModalRegistrar from './components/modal/ModalRegistrar';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const guardado = localStorage.getItem('cinerewind_theme');
    if (guardado !== null) return guardado === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [actualizarTrigger, setActualizarTrigger] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('cinerewind_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('cinerewind_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <div className="min-h-screen bg-[#f7f4ed] dark:bg-[#0f0f11] text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      <Navbar 
        darkMode={darkMode} 
        onToggleTheme={toggleTheme} 
        onSeleccionarObra={(obra) => setObraSeleccionada(obra)} 
      />

      <Routes>
        <Route path="/" element={<Home actualizarTrigger={actualizarTrigger} />} />
        <Route 
          path="/tendencias" 
          element={
            <Tendencias 
              onSeleccionarObra={(obra) => setObraSeleccionada(obra)} 
              actualizarTrigger={actualizarTrigger} 
            />
          } 
        />
      </Routes>

      {obraSeleccionada && (
        <ModalRegistrar
          key={obraSeleccionada.tmdb_id || obraSeleccionada.id}
          obra={obraSeleccionada}
          onClose={() => setObraSeleccionada(null)}
          onRegistroCompletado={() => setActualizarTrigger((prev) => prev + 1)}
          onCambiarObra={(nuevaObra) => setObraSeleccionada(nuevaObra)}
        />
      )}
    </div>
  );
}