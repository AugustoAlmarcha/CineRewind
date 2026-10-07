import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook reutilizable para simular una ruleta / selector aleatorio
 * que recorre visualmente los elementos de una lista antes de frenar en un ganador.
 */
export function useRuletaSorteo(items = []) {
  const [estaGirando, setEstaGirando] = useState(false);
  const [indiceResaltado, setIndiceResaltado] = useState(-1);
  const [ganador, setGanador] = useState(null);
  const [modalGanadorAbierto, setModalGanadorAbierto] = useState(false);

  const timerRef = useRef(null);
  const elementoRefs = useRef({});

  const registrarRef = useCallback((indice, el) => {
    if (el) {
      elementoRefs.current[indice] = el;
    } else {
      delete elementoRefs.current[indice];
    }
  }, []);

  const iniciarGiro = useCallback(() => {
    if (!items || items.length === 0 || estaGirando) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setEstaGirando(true);
    setGanador(null);
    setModalGanadorAbierto(false);

    const total = items.length;

    // Caso de 1 solo item: animación corta directa
    if (total === 1) {
      setIndiceResaltado(0);
      elementoRefs.current[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      timerRef.current = setTimeout(() => {
        setEstaGirando(false);
        setGanador(items[0]);
        setModalGanadorAbierto(true);
      }, 700);
      return;
    }

    // Elegir ganador al azar
    const indiceGanador = Math.floor(Math.random() * total);
    let indiceActual = indiceResaltado >= 0 ? indiceResaltado : 0;

    // Calcular pasos para que termine exactamente en el ganador
    const offset = (indiceGanador - (indiceActual % total) + total) % total;
    let totalPasos = offset;
    // Buscamos que dé entre 16 y 24 pasos para una duración óptima y visible
    while (totalPasos < 16) {
      totalPasos += total;
    }
    if (totalPasos > 26) {
      totalPasos = offset + total;
      if (totalPasos < 14) totalPasos += total;
    }

    let paso = 0;

    // Curva de velocidad: inicia a ~95ms para que el ojo humano y las pantallas móviles distingan
    // el recuadro dorado y desacelera progresivamente para dar suspenso
    const calcularIntervalo = (p, t) => {
      const progreso = p / t;
      if (progreso < 0.45) return 95;
      if (progreso < 0.7) return 95 + Math.round((progreso - 0.45) * 280);
      if (progreso < 0.85) return 165 + Math.round((progreso - 0.7) * 600);
      if (progreso < 0.95) return 255 + Math.round((progreso - 0.85) * 1400);
      return 395 + Math.round((progreso - 0.95) * 2200);
    };

    const siguientePaso = () => {
      indiceActual = (indiceActual + 1) % total;
      setIndiceResaltado(indiceActual);

      // Auto scroll inteligente para móvil y PC:
      // Evita acumular transiciones suaves de scroll ('smooth') que retrasan la pantalla en celulares
      const el = elementoRefs.current[indiceActual];
      if (el) {
        const rect = el.getBoundingClientRect();
        const estaEnPantalla = (
          rect.top >= 80 && 
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 80
        );

        if (!estaEnPantalla) {
          // Si está en la etapa rápida inicial, usamos 'auto' instantáneo para no ir persiguiendo con lag
          if (paso < totalPasos * 0.7) {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (paso >= totalPasos * 0.7) {
          // En la desaceleración final hacia el ganador, centramos suavemente
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      paso++;

      if (paso < totalPasos) {
        const ms = calcularIntervalo(paso, totalPasos);
        timerRef.current = setTimeout(siguientePaso, ms);
      } else {
        // Fin del sorteo: llegamos al ganador
        setEstaGirando(false);
        const itemElegido = items[indiceGanador];
        setGanador(itemElegido);

        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Breve pausa para contemplar el resultado antes de abrir el modal
        timerRef.current = setTimeout(() => {
          setModalGanadorAbierto(true);
        }, 700);
      }
    };

    siguientePaso();
  }, [items, estaGirando, indiceResaltado]);

  const cerrarModal = useCallback(() => {
    setModalGanadorAbierto(false);
  }, []);

  const resetear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setEstaGirando(false);
    setIndiceResaltado(-1);
    setGanador(null);
    setModalGanadorAbierto(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    estaGirando,
    indiceResaltado,
    ganador,
    modalGanadorAbierto,
    iniciarGiro,
    cerrarModal,
    resetear,
    registrarRef,
  };
}
