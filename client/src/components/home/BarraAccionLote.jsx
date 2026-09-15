import React from 'react';

export default function BarraAccionLote({ cantidadSeleccionada, onEliminar }) {
  if (cantidadSeleccionada === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 border border-white/20 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-6 backdrop-blur-md animate-fadeIn">
      <span className="text-sm font-bold">{cantidadSeleccionada} seleccionados</span>
      <button
        onClick={onEliminar}
        className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow cursor-pointer"
      >
        Eliminar
      </button>
    </div>
  );
}