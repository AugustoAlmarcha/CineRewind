import React, { useState, useRef } from 'react';

export default function ModalImportarNetflix({ abierto, alCerrar, alCompletar }) {
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [itemActual, setItemActual] = useState('');
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  if (!abierto) return null;

  const handleArchivoSeleccionado = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.csv') || file.type.includes('csv'))) {
      setArchivo(file);
      setError(null);
      setResumen(null);
    } else {
      setError('Por favor selecciona un archivo .csv válido');
    }
  };

  const procesarCSV = async () => {
    if (!archivo) return;
    setProcesando(true);
    setProgreso(0);
    setError(null);

    try {
      const texto = await archivo.text();
      const lineas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const datos = lineas[0].toLowerCase().includes('title') ? lineas.slice(1) : lineas;

      const token = localStorage.getItem('cinerewind_token');
      const tamanoLote = 15; // Lotes de 15 para actualización fluida de la barra
      const totalLotes = Math.ceil(datos.length / tamanoLote);

      let totalImportados = 0;
      let totalOmitidos = 0;
      let noEncontrados = [];

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
          if (data.fallidos) noEncontrados.push(...data.fallidos);
        }

        setProgreso(Math.round(((i + 1) / totalLotes) * 100));
      }

      setResumen({
        total: datos.length,
        importados: totalImportados,
        omitidos: totalOmitidos,
        noEncontrados
      });

      // if (alCompletar) alCompletar();
    } catch (err) {
      setError('Error durante la importación: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#141419] rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-white/10 shadow-2xl space-y-6">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-red-600/10 text-red-600 dark:text-red-500 font-mono text-[10px] font-black uppercase tracking-wider">
              SINCRONIZACIÓN CSV
            </span>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-1">
              Importar Historial
            </h3>
          </div>
          {!procesando && (
            <button
              onClick={alCerrar}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Estado 1: Carga y selección */}
        {!resumen && !procesando && (
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              ref={inputRef}
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />

            <div
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
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
                    {(archivo.size / 1024).toFixed(1)} KB listo
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
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/20"
            >
              Iniciar Importación
            </button>
          </div>
        )}

        {/* Estado 2: Barra de Progreso en Vivo */}
        {procesando && (
          <div className="py-6 space-y-4 text-center">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="truncate max-w-[200px] text-left">Procesando: {itemActual}</span>
              <span className="font-bold text-red-500">{progreso}%</span>
            </div>

            {/* Barra */}
            <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 rounded-full"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500">Consultando catálogos y registrando fechas...</p>
          </div>
        )}

        {/* Estado 3: Resumen Detallado */}
        {resumen && (
          <div className="py-2 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-2xl font-black text-emerald-500">{resumen.importados}</span>
                <span className="block text-[10px] font-mono text-neutral-400 uppercase font-bold mt-1">Importados</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-2xl font-black text-amber-500">{resumen.omitidos}</span>
                <span className="block text-[10px] font-mono text-neutral-400 uppercase font-bold mt-1">Omitidos</span>
              </div>
            </div>

            {resumen.noEncontrados.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-neutral-400 uppercase font-bold">No encontrados en TMDb:</span>
                <div className="max-h-24 overflow-y-auto p-2 rounded-xl bg-neutral-100 dark:bg-white/5 text-[11px] font-mono text-neutral-400 space-y-1">
                  {resumen.noEncontrados.map((t, idx) => (
                    <p key={idx} className="truncate">• {t}</p>
                  ))}
                </div>
              </div>
            )}

<button
  onClick={() => {
    alCerrar();
    // Recarga recién cuando tú haces clic en cerrar
    if (window.location.pathname.includes('/perfil') || window.location.pathname.includes('/historial')) {
      window.location.reload();
    }
  }}
  className="w-full py-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs uppercase tracking-wider transition-opacity hover:opacity-90 cursor-pointer"
>
  Cerrar y ver historial
</button>
          </div>
        )}

      </div>
    </div>
  );
}