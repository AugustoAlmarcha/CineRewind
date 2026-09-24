import React from 'react';

export default function VistaRegistroPelicula({ sinopsis, guardando, onGuardar }) {
  return (
    <div className="text-center py-10 space-y-5">
      <p className="text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto text-sm leading-relaxed">
        {sinopsis}
      </p>
      <button 
        type="button" 
        disabled={guardando}
        onClick={onGuardar} 
        className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : '✓ Registrar Película en Mi Timeline'}
      </button>
    </div>
  );
}