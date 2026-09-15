import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Tendencias from './pages/Tendencias';
import ModalRegistrar from './components/ModalRegistrar';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [actualizarTrigger, setActualizarTrigger] = useState(0);

  // Sincronizar tema oscuro global
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <div className="min-h-screen bg-[#f7f4ed] dark:bg-[#0f0f11] text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300">
      <Navbar 
        darkMode={darkMode} 
        onToggleTheme={toggleTheme} 
        onSeleccionarObra={(obra) => setObraSeleccionada(obra)} 
      />

      <Routes>
        <Route path="/" element={<Home key={actualizarTrigger} />} />
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