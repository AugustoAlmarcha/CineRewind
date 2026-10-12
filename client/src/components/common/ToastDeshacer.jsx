import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, RotateCcw, X, Loader2 } from 'lucide-react';

export default function ToastDeshacer({ toast, onCerrar, duracion = 4500 }) {
  const [deshaciendo, setDeshaciendo] = useState(false);
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;

  useEffect(() => {
    if (!toast) return;
    setDeshaciendo(false);

    const timer = setTimeout(() => {
      if (onCerrarRef.current) {
        onCerrarRef.current();
      }
    }, duracion);

    return () => clearTimeout(timer);
  }, [toast, duracion]);

  if (!toast) return null;

  const handleDeshacerClick = async (e) => {
    e.stopPropagation();
    if (deshaciendo) return;
    setDeshaciendo(true);
    try {
      if (toast.onDeshacer) {
        await toast.onDeshacer();
      }
    } catch (err) {
      console.error('Error al deshacer:', err);
    } finally {
      setDeshaciendo(false);
      if (onCerrarRef.current) onCerrarRef.current();
    }
  };

  if (typeof document === 'undefined') return null;

  const keyId = toast.id || String(toast.mensaje);

  return createPortal(
    <div className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-[9999] pointer-events-none flex justify-center sm:justify-end animate-slideUp">
      <div className="pointer-events-auto w-full sm:w-auto max-w-md bg-[#16161c]/95 dark:bg-[#121216]/95 backdrop-blur-xl border border-white/20 dark:border-white/15 text-white rounded-2xl shadow-2xl overflow-hidden p-3 sm:p-3.5 space-y-2 relative">
        <style>{`
          @keyframes toastDrenarAnim {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {toast.mensaje || 'Capítulo marcado como visto'}
            </p>
            {toast.subtexto && (
              <p className="text-[10px] text-neutral-400 truncate mt-0.5 font-medium">
                {toast.subtexto}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={deshaciendo}
              onClick={handleDeshacerClick}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
              title="Revertir este registro"
            >
              {deshaciendo ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deshaciendo...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Deshacer</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onCerrarRef.current && onCerrarRef.current()}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Barra de tiempo regresiva fluida con animación CSS */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            key={keyId}
            className="h-full bg-rose-500 rounded-full"
            style={{
              animation: `toastDrenarAnim ${duracion}ms linear forwards`
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
