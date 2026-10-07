import React, { useState, useRef } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Film, 
  Sparkles, 
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

export default function ModalImportarNetflix({ abierto, alCerrar, alCompletar }) {
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [itemActual, setItemActual] = useState('');
  
  // Contadores en vivo para la pantalla de carga
  const [contadorImportados, setContadorImportados] = useState(0);
  const [contadorOmitidos, setContadorOmitidos] = useState(0);
  const [itemsOmitidos, setItemsOmitidos] = useState([]);

  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);
  const [mostrarDetalleOmitidos, setMostrarDetalleOmitidos] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const inputRef = useRef(null);

  const handleCerrarModal = () => {
    setArchivo(null);
    setProcesando(false);
    setProgreso(0);
    setItemActual('');
    setContadorImportados(0);
    setContadorOmitidos(0);
    setItemsOmitidos([]);
    setResumen(null);
    setError(null);
    setMostrarDetalleOmitidos(false);
    setMostrarGuia(false);
    if (alCerrar) alCerrar();
  };

  const handleArchivoSeleccionado = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.csv') || file.type.includes('csv'))) {
      setArchivo(file);
      setError(null);
      setResumen(null);
      setItemsOmitidos([]);
      setMostrarDetalleOmitidos(false);
    } else {
      setError('Por favor selecciona un archivo .csv válido');
    }
  };

  const procesarCSV = async () => {
    if (!archivo) return;
    setProcesando(true);
    setProgreso(0);
    setContadorImportados(0);
    setContadorOmitidos(0);
    setItemsOmitidos([]);
    setMostrarDetalleOmitidos(false);
    setError(null);

    try {
      const texto = await archivo.text();
      const lineas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const datos = lineas[0].toLowerCase().includes('title') ? lineas.slice(1) : lineas;

      const token = localStorage.getItem('cinerewind_token');
      const tamanoLote = 15;
      const totalLotes = Math.ceil(datos.length / tamanoLote);

      let totalImportados = 0;
      let totalOmitidos = 0;
      let noEncontrados = [];
      let listaOmitidosTotal = [];

      for (let i = 0; i < totalLotes; i++) {
        const bloque = datos.slice(i * tamanoLote, (i + 1) * tamanoLote);
        const primerTitulo = bloque[0].split(',')[0].replace(/"/g, '');
        setItemActual(primerTitulo);

        const res = await fetch('/api/historial/importar-lote-csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ lineas: bloque })
        });

        if (res.ok) {
          const data = await res.json();
          totalImportados += data.importados || 0;
          totalOmitidos += data.omitidos || 0;

          if (data.listaOmitidos && Array.isArray(data.listaOmitidos)) {
            listaOmitidosTotal.push(...data.listaOmitidos);
            setItemsOmitidos([...listaOmitidosTotal]);
          } else if (data.fallidos && Array.isArray(data.fallidos)) {
            data.fallidos.forEach((f) => {
              listaOmitidosTotal.push({
                titulo: f,
                motivo: 'No encontrado en TMDb',
                tipo: 'no_encontrado'
              });
            });
            setItemsOmitidos([...listaOmitidosTotal]);
          }

          // Se actualizan los casilleros en tiempo real
          setContadorImportados(totalImportados);
          setContadorOmitidos(totalOmitidos);

          if (data.fallidos) noEncontrados.push(...data.fallidos);
        }

        setProgreso(Math.round(((i + 1) / totalLotes) * 100));
      }

      setResumen({
        total: datos.length,
        importados: totalImportados,
        omitidos: totalOmitidos,
        noEncontrados: Array.from(new Set(noEncontrados)),
        listaOmitidos: listaOmitidosTotal
      });

      if (alCompletar) alCompletar();

    } catch (err) {
      setError('Error durante la importación: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (!abierto) return null;

  const listaOmitidosFinal = resumen?.listaOmitidos && resumen.listaOmitidos.length > 0
    ? resumen.listaOmitidos
    : (resumen?.noEncontrados || []).map((t) => ({
        titulo: t,
        motivo: 'No encontrado en TMDb',
        tipo: 'no_encontrado'
      }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#141419] rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-white/10 shadow-2xl space-y-6 scrollbar-thin">
        
        {/* Cabecera Principal */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-red-600/10 text-red-600 dark:text-red-500 font-mono text-[10px] font-black uppercase tracking-wider">
              SINCRONIZACIÓN CSV
            </span>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-1 flex items-center gap-2">
              <span>🍿</span>
              <span>Importar Historial</span>
            </h3>
          </div>
          {!procesando && (
            <button
              onClick={handleCerrarModal}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Estado 1: Carga y Selección de Archivo */}
        {!resumen && !procesando && (
          <div className="space-y-5">
            <input
              type="file"
              accept=".csv"
              ref={inputRef}
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />

            <div
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                archivo 
                  ? 'border-red-500 bg-red-500/5' 
                  : 'border-neutral-300 dark:border-white/15 hover:border-red-500'
              }`}
            >
              <div className="text-3xl mb-2">📁</div>
              {archivo ? (
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {archivo.name}
                  </p>
                  <p className="text-xs font-mono text-neutral-400 mt-1">
                    {(archivo.size / 1024).toFixed(1)} KB listo para importar
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Selecciona tu archivo <span className="text-red-500">.csv</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Exportado desde Netflix o plataformas compatibles
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs font-mono text-red-500 bg-red-500/10 p-2.5 rounded-xl text-center">
                {error}
              </p>
            )}

            <button
              onClick={procesarCSV}
              disabled={!archivo}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-sm transition shadow-lg shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Iniciar Importación</span>
            </button>

            {/* Guía Desplegable: Cómo obtener el archivo */}
            <div className="pt-1 border-t border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setMostrarGuia(!mostrarGuia)}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200/70 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-all flex items-center justify-between text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer active:scale-98"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span>¿Cómo descargo mi historial de Netflix?</span>
                </span>
                <span className="text-neutral-400">
                  {mostrarGuia ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {/* Contenido desplegable con pasos y enlace directo */}
              {mostrarGuia && (
                <div className="mt-3 p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181f] border border-neutral-200 dark:border-white/10 space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-200/80 dark:border-white/5">
                    <span className="font-mono text-[10px] uppercase font-bold text-neutral-400">
                      Acceso Rápido
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      1 Clic
                    </span>
                  </div>

                  <a
                    href="https://www.netflix.com/viewingactivity"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-xs transition shadow-md shadow-red-600/20 cursor-pointer"
                  >
                    <span>Abrir mi Actividad en Netflix</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-[11px] mt-0.5">
                        1
                      </span>
                      <p className="leading-relaxed">
                        Tocá el botón rojo de arriba o abrí <strong className="text-neutral-900 dark:text-white">netflix.com</strong> en tu navegador (en PC o celular).
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-[11px] mt-0.5">
                        2
                      </span>
                      <p className="leading-relaxed">
                        Si lo hacés manual: andá a tu foto de <strong className="text-neutral-900 dark:text-white">perfil ➔ Cuenta</strong>, seleccioná tu perfil y tocá <strong className="text-neutral-900 dark:text-white">«Actividad de visualización»</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-[11px] mt-0.5">
                        3
                      </span>
                      <p className="leading-relaxed">
                        Bajá hasta el final de la página y hacé clic en el enlace <strong className="text-neutral-900 dark:text-white">«Descargarla toda»</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-[11px] mt-0.5">
                        4
                      </span>
                      <p className="leading-relaxed">
                        Se descargará el archivo <code className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10 font-mono text-[10px] text-neutral-800 dark:text-neutral-200">NetflixViewingHistory.csv</code>. Subilo acá arriba y tocá Iniciar.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-200/80 dark:border-white/5 flex items-center gap-1.5 leading-normal">
                    <span className="shrink-0 text-xs">🔒</span>
                    <span>100% privado: tu archivo solo se analiza para registrar títulos en tu diario.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado 2: Barra de Progreso y Contadores en Vivo */}
        {procesando && (
          <div className="py-4 space-y-4 text-center">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="truncate max-w-[220px] text-left">Procesando: {itemActual}</span>
              <span className="font-bold text-red-500">{progreso}%</span>
            </div>

            {/* Barra */}
            <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 rounded-full"
                style={{ width: `${progreso}%` }}
              />
            </div>

            {/* Marcadores en tiempo real lote a lote */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 transition-all">
                <span className="text-2xl font-black text-emerald-500">{contadorImportados}</span>
                <span className="block text-[10px] font-mono text-neutral-400 uppercase font-bold mt-1">
                  ✓ Guardados
                </span>
              </div>
              <button
                type="button"
                onClick={() => itemsOmitidos.length > 0 && setMostrarDetalleOmitidos(!mostrarDetalleOmitidos)}
                disabled={itemsOmitidos.length === 0}
                className={`p-3 rounded-2xl border transition-all text-center ${
                  itemsOmitidos.length > 0
                    ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 opacity-70 cursor-default'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-black text-amber-500">{contadorOmitidos}</span>
                  {itemsOmitidos.length > 0 && (
                    <span className="text-amber-500">
                      {mostrarDetalleOmitidos ? <ChevronUp className="w-3.5 h-3.5 inline" /> : <ChevronDown className="w-3.5 h-3.5 inline" />}
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-mono text-neutral-400 uppercase font-bold mt-1">
                  ⚠ Omitidos {itemsOmitidos.length > 0 ? '(Ver)' : ''}
                </span>
              </button>
            </div>

            {/* Desplegable en vivo si se hace clic durante la carga */}
            {mostrarDetalleOmitidos && itemsOmitidos.length > 0 && (
              <div className="max-h-36 overflow-y-auto p-2.5 rounded-2xl bg-neutral-100 dark:bg-black/40 text-left border border-neutral-200 dark:border-white/10 space-y-1.5 scrollbar-thin animate-fadeIn">
                <p className="text-[10px] font-mono text-neutral-400 uppercase font-bold px-1 pb-1 border-b border-neutral-200 dark:border-white/5">
                  Omitidos detectados hasta ahora ({itemsOmitidos.length})
                </p>
                {itemsOmitidos.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-neutral-200/40 dark:border-white/5 last:border-none">
                    <span className="truncate text-neutral-800 dark:text-neutral-200 font-medium">
                      • {item.titulo}
                    </span>
                    <span className="text-[9px] font-mono shrink-0 text-neutral-400 bg-neutral-200 dark:bg-white/10 px-1.5 py-0.5 rounded">
                      {item.motivo}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-neutral-500 font-mono animate-pulse">
              Sincronizando bilingüe con catálogo TMDb y aplicando Fuzzy Matching...
            </p>
          </div>
        )}

        {/* Estado 3: Resumen Final y Resultados */}
        {resumen && (
          <div className="py-2 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20 shadow">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-neutral-900 dark:text-white">
                ¡Sincronización Completada!
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Tu historial de Netflix ha sido integrado en tu diario cinéfilo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-emerald-500">{resumen.importados}</span>
                <span className="block text-[10px] font-mono text-neutral-400 uppercase font-bold mt-1">
                  ✓ Guardados
                </span>
              </div>

              {/* Botón interactivo de Omitidos */}
              <button
                type="button"
                onClick={() => {
                  if (resumen.omitidos > 0) {
                    setMostrarDetalleOmitidos(!mostrarDetalleOmitidos);
                  }
                }}
                disabled={resumen.omitidos === 0}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                  resumen.omitidos > 0
                    ? 'cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 active:scale-98'
                    : 'cursor-default opacity-60'
                } ${
                  mostrarDetalleOmitidos
                    ? 'bg-amber-500/15 border-amber-500/40 ring-2 ring-amber-500/30'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-3xl font-black text-amber-500">{resumen.omitidos}</span>
                  {resumen.omitidos > 0 && (
                    <span className="text-amber-500">
                      {mostrarDetalleOmitidos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-bold mt-1">
                  ⚠ Omitidos {resumen.omitidos > 0 ? '(Ver lista)' : ''}
                </span>
              </button>
            </div>

            {/* Desplegable interactivo al tocar el botón de Omitidos */}
            {mostrarDetalleOmitidos && (
              <div className="space-y-2 pt-1 animate-fadeIn">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 font-bold uppercase flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Títulos no guardados ({listaOmitidosFinal.length})</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {listaOmitidosFinal.length > 4 ? 'Desliza para ver todos' : ''}
                  </span>
                </div>

                {listaOmitidosFinal.length === 0 ? (
                  <p className="text-xs text-neutral-400 font-mono text-center py-2">
                    No hubo títulos omitidos en esta importación.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto p-2 rounded-2xl bg-neutral-100 dark:bg-[#111116] border border-neutral-200 dark:border-white/10 space-y-1.5 scrollbar-thin">
                    {listaOmitidosFinal.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/5 flex items-start justify-between gap-2.5 text-left transition hover:border-neutral-300 dark:hover:border-white/20"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                            {item.titulo}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 font-medium ${
                            item.tipo === 'ya_visto'
                              ? 'bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10'
                              : item.tipo === 'no_encontrado'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}
                        >
                          {item.motivo}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                handleCerrarModal();
                if (window.location.pathname.includes('/perfil') || window.location.pathname.includes('/historial')) {
                  window.location.reload();
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black text-xs uppercase tracking-wider transition hover:opacity-90 cursor-pointer shadow-lg active:scale-98"
            >
              Cerrar y Ver Mi Diario
            </button>
          </div>
        )}

      </div>
    </div>
  );
}