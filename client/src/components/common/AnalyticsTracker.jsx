import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Rastreador de rutas para Single Page Application (SPA) con Google Analytics 4 (GA4).
 * Carga el script oficial de gtag únicamente si existe VITE_GA_MEASUREMENT_ID en .env.
 * Registra cada cambio de página (Home, Tendencias, Perfil, etc.) automáticamente.
 */
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID) return;

    // Inicializar el script de Google Analytics si aún no está presente en el DOM
    if (!window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;

      window.gtag('js', new Date());
      window.gtag('config', GA_ID, {
        send_page_view: false // Controlado manualmente por ruta SPA
      });
    }

    // Enviar evento de vista de página en cada navegación del usuario
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location]);

  return null;
}
