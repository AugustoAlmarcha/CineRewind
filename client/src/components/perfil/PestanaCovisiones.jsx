import React from 'react';

export default function PestanaCovisiones({ covisiones = [], onAbrirModalAmigos }) {
  if (covisiones.length === 0) {
    return (
      <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 animate-fadeIn">
        <p className="text-base font-bold text-zinc-200">Aún no has registrado co-visiones.</p>
        <p className="text-xs text-zinc-500 mt-1">Al registrar una película, escribe con quién la viste (ej: "Mamá") o etiqueta amigos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Cinéfilos y acompañantes con los que compartiste pantalla
        </p>
        <button
          type="button"
          onClick={onAbrirModalAmigos}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl border border-zinc-800 cursor-pointer"
        >
          + Conectar con Amigos
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {covisiones.map((co, idx) => (
          <div key={idx} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5 group hover:border-zinc-700 transition">
            <img 
              src={co.avatar} 
              alt={co.nombre} 
              className="w-11 h-11 rounded-2xl object-cover border border-zinc-700 shadow-sm shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white truncate">{co.nombre}</h4>
                {co.tipo === 'texto' && (
                  <span className="text-[9px] font-mono text-zinc-500 uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    En Sala
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 font-mono truncate">{co.username}</p>
              <span className="text-[10px] font-bold text-rose-400 block pt-0.5">
                🍿 {co.totalObras} {co.totalObras === 1 ? 'obra vista juntos' : 'obras vistas juntos'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}