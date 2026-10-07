import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { UserX, Loader2 } from 'lucide-react';
import { desvincularAcompananteCovisionesAPI } from '../../api';

export default function PestanaCovisiones({ 
  covisiones = [], 
  onAbrirModalAmigos,
  esMiPerfil = false,
  onActualizado,
  dispararToast,
}) {
  const navigate = useNavigate();
  const [acompananteADesvincular, setAcompananteADesvincular] = useState(null);
  const [desvinculando, setDesvinculando] = useState(false);

  const handleConfirmarDesvinculacion = async () => {
    if (!acompananteADesvincular) return;
    setDesvinculando(true);
    try {
      const res = await desvincularAcompananteCovisionesAPI({
        amigoId: acompananteADesvincular.id,
        username: acompananteADesvincular.rawUsername || (acompananteADesvincular.username?.replace('@', '')),
        tipo: acompananteADesvincular.tipo,
        nombreManual: acompananteADesvincular.nombre,
      });

      if (dispararToast) {
        dispararToast(
          res.mensaje || `Se desvincularon las co-visiones con ${acompananteADesvincular.nombre}`,
          'exito'
        );
      }
      setAcompananteADesvincular(null);
      if (onActualizado) {
        await onActualizado();
      }
    } catch (err) {
      console.error('Error al desvincular co-visiones:', err);
      if (dispararToast) {
        dispararToast(err.message || 'No se pudieron desvincular las co-visiones', 'error');
      }
    } finally {
      setDesvinculando(false);
    }
  };

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
        {covisiones.map((co, idx) => {
          const esClickeable = co.tipo === 'registrado' && co.username;
          const targetUser = esClickeable ? co.username.replace('@', '') : null;

          return (
            <div 
              key={idx} 
              onClick={() => {
                if (targetUser) navigate(`/perfil/${targetUser}`);
              }}
              className={`p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5 group transition ${
                esClickeable ? 'hover:border-rose-500/50 hover:bg-zinc-900/60 cursor-pointer' : ''
              }`}
            >
              <img 
                src={co.avatar} 
                alt={co.nombre} 
                className="w-11 h-11 rounded-2xl object-cover border border-zinc-700 shadow-sm shrink-0 group-hover:scale-105 transition" 
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition">
                    {co.nombre}
                  </h4>
                  {co.tipo === 'texto' ? (
                    <span className="text-[9px] font-mono text-zinc-500 uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      En Sala
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                      Ver Perfil →
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 font-mono truncate">{co.username}</p>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] font-bold text-rose-400 block">
                    🍿 {co.totalObras} {co.totalObras === 1 ? 'obra vista juntos' : 'obras vistas juntos'}
                  </span>
                  {esMiPerfil && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAcompananteADesvincular(co);
                      }}
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                      title={`Desvincular todas las co-visiones con ${co.nombre}`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Desvincular</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA DESVINCULAR CO-VISIONES */}
      {acompananteADesvincular && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => !desvinculando && setAcompananteADesvincular(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#12121a] border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <UserX className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-white leading-tight">
                  ¿Desvincular co-visiones con {acompananteADesvincular.nombre}?
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {acompananteADesvincular.username} · {acompananteADesvincular.totalObras} compartidas
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2.5 text-zinc-300">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong className="text-white">Tus registros quedan guardados:</strong> Tus {acompananteADesvincular.totalObras} episodios o películas seguirán intactos en tu historial.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong className="text-white">La cuenta de {acompananteADesvincular.nombre} queda intacta:</strong> Todo lo que ya haya aceptado seguirá intacto en su cuenta sin borrarse.
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800 leading-relaxed">
                Solo se quitará la etiqueta de "visto juntos" entre ambos para que no figuren vinculados.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={desvinculando}
                onClick={() => setAcompananteADesvincular(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={desvinculando}
                onClick={handleConfirmarDesvinculacion}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
              >
                {desvinculando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Desvinculando...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Desvincular todas ({acompananteADesvincular.totalObras})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}