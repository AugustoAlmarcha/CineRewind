import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ModalRegistrar from './components/ModalRegistrar';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [actualizarTrigger, setActualizarTrigger] = useState(0);

  // Sincronizar la clase 'dark' en el elemento html raíz
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
      <Home key={actualizarTrigger} />

      {obraSeleccionada && (
        <ModalRegistrar
          obra={obraSeleccionada}
          onClose={() => setObraSeleccionada(null)}
          onRegistroCompletado={() => setActualizarTrigger((prev) => prev + 1)}
        />
      )}
    </div>
  );
}