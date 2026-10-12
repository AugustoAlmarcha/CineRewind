import { useRef, useEffect } from 'react';

export function useDragScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    const onMouseDown = (e) => {
      // Solo botón primario (izquierdo)
      if (e.button !== 0) return;
      // No activar drag si se hace clic en botones, inputs o enlaces interactivos
      if (e.target.closest('button, input, a, select, textarea, [data-no-drag]')) return;

      isDown = true;
      hasDragged = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.4;

      if (Math.abs(walk) > 6) {
        hasDragged = true;
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
      }

      el.scrollLeft = scrollLeft - walk;
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = '';
      el.style.removeProperty('user-select');

      // Si hubo arrastre real, evitar que se dispare el evento 'click' accidental en la tarjeta
      if (hasDragged) {
        const preventClickCapture = (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        el.addEventListener('click', preventClickCapture, { capture: true, once: true });
        setTimeout(() => {
          el.removeEventListener('click', preventClickCapture, { capture: true });
        }, 100);
      }
    };

    const onMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = '';
      el.style.removeProperty('user-select');
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return ref;
}

export default useDragScroll;
