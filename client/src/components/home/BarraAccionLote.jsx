import React from 'react';

export default function BarraAccionLote({ 
  cantidadSeleccionada = 0, 
  onEliminar,
  onCancelar 
}) {
  if (cantidadSeleccionada === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 border border-white/20 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-5 backdrop-blur-md animate-fadeIn select-none">
      <span className="text-sm font-bold">
        {cantidadSeleccionada} {cantidadSeleccionada === 1 ? 'seleccionado' : 'seleccionados'}
      </span>

      <div className="flex items-center gap-2">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={onEliminar}
          className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg transition cursor-pointer"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}