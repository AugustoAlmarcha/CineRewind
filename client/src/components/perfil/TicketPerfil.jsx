import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TicketPerfil({
  usuario,
  stats,
  avatarVisual,
  fechaAlta,
  selectorWrappedAbierto,
  setSelectorWrappedAbierto,
  abrirWrapped,
  cargandoWrapped,
  setModalEditarAbierto,
  setModalAmigosAbierto,
  datosWrapped,
}) {
  const navigate = useNavigate();

  return (
    <section className="relative rounded-3xl overflow-hidden bg-[#fbf9f4] dark:bg-[#181820] border-2 border-neutral-300 dark:border-white/15 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col md:flex-row transition-colors">
      
      {/* Marca de agua vintage */}
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.04] dark:opacity-[0.06] text-8xl md:text-9xl font-black font-mono rotate-12 text-black dark:text-white">
        ADMIT ONE
      </div>

      {/* Troquelados laterales exteriores */}
      <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f7f4ed] dark:bg-[#0f0f11] border-r-2 border-neutral-300 dark:border-white/15 shadow-inner z-20" />
      <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f7f4ed] dark:bg-[#0f0f11] border-l-2 border-neutral-300 dark:border-white/15 shadow-inner z-20" />

      {/* Troquelados en la línea de corte del talón */}
      <div className="hidden md:block absolute -top-4 right-56 translate-x-1/2 w-8 h-8 rounded-full bg-[#f7f4ed] dark:bg-[#0f0f11] border-b-2 border-neutral-300 dark:border-white/15 shadow-inner z-20" />
      <div className="hidden md:block absolute -bottom-4 right-56 translate-x-1/2 w-8 h-8 rounded-full bg-[#f7f4ed] dark:bg-[#0f0f11] border-t-2 border-neutral-300 dark:border-white/15 shadow-inner z-20" />

      {/* Cuerpo principal del ticket */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-300/80 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] font-black text-rose-600 dark:text-rose-400">
              CINEREWIND · ENTRADA GENERAL
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 font-bold">
            BUTACA: SALA 01 · FILA VIP
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-[#20202a] border-2 border-neutral-300 dark:border-white/20 p-1 overflow-hidden shadow-md">
              <img
                src={avatarVisual}
                alt={usuario.username}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
              CR-PASS
            </span>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
              {usuario.nombre || usuario.username}
            </h1>
            <p className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">
              @{usuario.username} · REGISTRO: {fechaAlta.toUpperCase()}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 pt-1 leading-relaxed max-w-lg">
              {usuario.biografia || "Diario personal de cine, maratones de series y obras vistas."}
            </p>
          </div>
        </div>

        {/* Marcadores analógicos de celuloide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-300/80 dark:border-white/10">
          <div 
            onClick={() => navigate('/', { state: { vistaTotal: true, filtroTipo: 'serie' } })}
            className="bg-white/90 dark:bg-[#22222c] p-3 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs cursor-pointer hover:border-rose-500/50 hover:scale-[1.02] transition-all group"
            title="Ver series en el Total Histórico"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black font-mono text-neutral-500 dark:text-neutral-400 uppercase">SERIES</p>
              <span className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition font-mono">Ver →</span>
            </div>
            <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
              {stats.total_series}
            </span>
          </div>

          <div 
            onClick={() => navigate('/', { state: { vistaTotal: true, filtroTipo: 'serie' } })}
            className="bg-white/90 dark:bg-[#22222c] p-3 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs cursor-pointer hover:border-rose-500/50 hover:scale-[1.02] transition-all group"
            title="Ver episodios en el Total Histórico"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black font-mono text-neutral-500 dark:text-neutral-400 uppercase">EPISODIOS</p>
              <span className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition font-mono">Ver →</span>
            </div>
            <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
              {stats.total_episodios}
            </span>
          </div>

          <div 
            onClick={() => navigate('/', { state: { vistaTotal: true, filtroTipo: 'pelicula' } })}
            className="bg-white/90 dark:bg-[#22222c] p-3 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs cursor-pointer hover:border-rose-500/50 hover:scale-[1.02] transition-all group"
            title="Ver películas en el Total Histórico"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black font-mono text-neutral-500 dark:text-neutral-400 uppercase">PELÍCULAS</p>
              <span className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition font-mono">Ver →</span>
            </div>
            <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
              {stats.total_peliculas}
            </span>
          </div>

          <div className="bg-white/90 dark:bg-[#22222c] p-3 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs">
            <p className="text-[10px] font-black font-mono text-neutral-500 dark:text-neutral-400 uppercase">HORAS TOTALES</p>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {stats.horas_totales}<span className="text-xs font-normal">h</span>
            </span>
          </div>
        </div>
      </div>

      {/* Talón troquelado lateral */}
      <div className="relative border-t md:border-t-0 md:border-l-2 border-dashed border-neutral-300 dark:border-white/20 bg-neutral-100/70 dark:bg-[#14141a] w-full md:w-56 p-6 flex flex-col justify-between items-center text-center space-y-6">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500">
            SERIAL NO.
          </span>
          <p className="font-mono text-sm font-black text-neutral-800 dark:text-neutral-200 tracking-wider">
            CR-{usuario.id ? String(usuario.id).padStart(6, '0') : '000003'}
          </p>
        </div>

        {/* Código de barras del boleto */}
        <div className="w-full flex justify-center py-2 text-neutral-800 dark:text-neutral-200">
          <div className="flex gap-1 h-12 items-end">
            <span className="w-1.5 h-full bg-current" /><span className="w-0.5 h-full bg-current" /><span className="w-2 h-full bg-current" />
            <span className="w-0.5 h-full bg-current" /><span className="w-1 h-full bg-current" /><span className="w-2.5 h-full bg-current" />
            <span className="w-0.5 h-full bg-current" /><span className="w-1 h-full bg-current" /><span className="w-2 h-full bg-current" />
            <span className="w-0.5 h-full bg-current" /><span className="w-1.5 h-full bg-current" />
          </div>
        </div>

        {/* Botonera de acciones */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          <div className="flex items-center justify-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalEditarAbierto(true)}
              className="flex-1 max-w-[110px] py-1.5 px-3 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-all shadow-sm cursor-pointer text-center"
            >
              Editar Perfil
            </button>

            <button
              type="button"
              onClick={() => setModalAmigosAbierto(true)}
              className="flex-1 max-w-[110px] py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Gestionar lista de amigos y comunidad"
            >
              <span>👥</span> Amigos
            </button>
          </div>

          <div className="relative w-full flex justify-center">
            <button
              type="button"
              onClick={() => setSelectorWrappedAbierto(!selectorWrappedAbierto)}
              className="px-4 py-1.5 rounded-xl border border-rose-500/30 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 text-xs font-black transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
              title="Revivir estadísticas en historias interactivas"
            >
              <span>✨</span> Wrapped
            </button>

            {/* Modal flotante de selección de período */}
            {selectorWrappedAbierto && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
                onClick={() => setSelectorWrappedAbierto(false)}
              >
                <div 
                  className="w-full max-w-xs bg-[#fbf9f5] dark:bg-[#16161a] border border-neutral-300 dark:border-white/10 rounded-3xl shadow-2xl p-5 space-y-4 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/5 pb-2">
                    <p className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <span>✨</span> Elegir Wrapped
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectorWrappedAbierto(false)}
                      className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Wrapped anual dinámico según años con historial real */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 mb-2">
                      Wrapped Anual
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                      {datosWrapped?.aniosDisponibles && datosWrapped.aniosDisponibles.length > 0 ? (
                        datosWrapped.aniosDisponibles.map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => abrirWrapped(yr)}
                            disabled={cargandoWrapped}
                            className="py-1.5 px-3 rounded-xl bg-neutral-200/70 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-xs font-bold transition cursor-pointer text-center"
                          >
                            {yr}
                          </button>
                        ))
                      ) : (
                        // Años de respaldo si aún no se abrió ningún wrapped
                        [2025, 2024, 2020].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => abrirWrapped(yr)}
                            disabled={cargandoWrapped}
                            className="py-1.5 px-3 rounded-xl bg-neutral-200/70 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-xs font-bold transition cursor-pointer text-center"
                          >
                            {yr}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Meses cerrados */}
                  <div className="pt-2 border-t border-neutral-200 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 mb-2">
                      Meses 2026
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {[
                        { id: 9, n: 'Septiembre' },
                        { id: 8, n: 'Agosto' },
                        { id: 7, n: 'Julio' },
                        { id: 6, n: 'Junio' },
                        { id: 5, n: 'Mayo' },
                        { id: 4, n: 'Abril' },
                        { id: 3, n: 'Marzo' },
                        { id: 2, n: 'Febrero' },
                        { id: 1, n: 'Enero' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => abrirWrapped(2026, m.id)}
                          disabled={cargandoWrapped}
                          className="py-2 px-3 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-xs font-bold text-left transition cursor-pointer truncate"
                        >
                          {m.n}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}