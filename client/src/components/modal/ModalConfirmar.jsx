import React from 'react';

export default function ModalConfirmar({ 
  isOpen, 
  titulo = '¿Estás seguro?', 
  mensaje = 'Esta acción no se puede deshacer.', 
  textoConfirmar = 'Eliminar',
  textoCancelar = 'Cancelar',
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#fcfaf7] dark:bg-[#16161a] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-neutral-900 dark:text-white space-y-5">
        
        {/* Ícono de alerta */}
        <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20 shadow-inner">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        {/* Textos */}
        <div className="text-center space-y-1.5">
          <h3 className="text-lg font-black tracking-tight">{titulo}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {mensaje}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-white/5 transition cursor-pointer"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition cursor-pointer"
          >
            {textoConfirmar}
          </button>
        </div>

      </div>
    </div>
  );
}