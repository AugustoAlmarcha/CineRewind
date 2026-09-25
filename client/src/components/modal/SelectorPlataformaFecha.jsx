import React, { useState, useRef, useEffect, useMemo } from 'react';

const PLATAFORMAS = [
  { id: 'Netflix', nombre: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
  { id: 'Max', nombre: 'Max', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg' },
  { id: 'Disney+', nombre: 'Disney+', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
  { id: 'Prime Video', nombre: 'Prime Video', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg' },
  { id: 'Apple TV+', nombre: 'Apple TV+', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg', invertDark: true },
  { 
    id: 'Cine', 
    nombre: 'Cine', 
    icono: (
      <span className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-100 font-extrabold text-xs">
        <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
        </svg>
        CINE
      </span>
    )
  },
];

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function SelectorPlataformaFecha({
  plataforma,
  setPlataforma,
  fechaVisto,
  setFechaVisto,
  noRecuerdaFecha,
  onToggleNoRecuerda
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [vistaModo, setVistaModo] = useState('dias'); // 'dias' | 'meses' | 'anios'
  const contenedorRef = useRef(null);

  // Parsear la fecha actual seleccionada
  const fechaActualObj = useMemo(() => {
    if (!fechaVisto) return new Date();
    const partes = String(fechaVisto).split('-').map(Number);
    if (partes.length === 3 && !isNaN(partes[0])) {
      return new Date(partes[0], partes[1] - 1, partes[2]);
    }
    return new Date();
  }, [fechaVisto]);

  const [mesNavegacion, setMesNavegacion] = useState(fechaActualObj.getMonth());
  const [anioNavegacion, setAnioNavegacion] = useState(fechaActualObj.getFullYear());

  // Rango de años seleccionables (desde 1970 hasta el año actual)
  const listaAnios = useMemo(() => {
    const anioActual = new Date().getFullYear();
    const lista = [];
    for (let a = anioActual; a >= 1970; a--) {
      lista.push(a);
    }
    return lista;
  }, []);

  // Sincronizar navegación al abrir o cambiar fecha
  useEffect(() => {
    setMesNavegacion(fechaActualObj.getMonth());
    setAnioNavegacion(fechaActualObj.getFullYear());
  }, [fechaActualObj]);

  // Cerrar el popup si se hace clic afuera
  useEffect(() => {
    const clickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setMenuAbierto(false);
        setVistaModo('dias');
      }
    };
    document.addEventListener('mousedown', clickAfuera);
    return () => document.removeEventListener('mousedown', clickAfuera);
  }, []);

  const handleSeleccionarPlataforma = (id) => {
    setPlataforma(plataforma === id ? null : id);
  };

  const cambiarMes = (direccion) => {
    let nuevoMes = mesNavegacion + direccion;
    let nuevoAnio = anioNavegacion;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }

    setMesNavegacion(nuevoMes);
    setAnioNavegacion(nuevoAnio);
  };

  const seleccionarDia = (dia) => {
    const mesStr = String(mesNavegacion + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    setFechaVisto(`${anioNavegacion}-${mesStr}-${diaStr}`);
    setMenuAbierto(false);
    setVistaModo('dias');
  };

  const seleccionarMesDirecto = (indiceMes) => {
    setMesNavegacion(indiceMes);
    setVistaModo('dias');
  };

  const seleccionarAnioDirecto = (anio) => {
    setAnioNavegacion(anio);
    setVistaModo('meses');
  };

  const primerDiaSemana = new Date(anioNavegacion, mesNavegacion, 1).getDay(); // 0 = Domingo
  const diasEnElMes = new Date(anioNavegacion, mesNavegacion + 1, 0).getDate();

  const formatearFechaBoton = () => {
    if (!fechaVisto) return 'Elegir fecha';
    const partes = String(fechaVisto).split('-');
    if (partes.length === 3) {
      const fechaBase = `${partes[2]}/${partes[1]}/${partes[0]}`;
      return noRecuerdaFecha ? `${fechaBase} (Estreno)` : fechaBase;
    }
    return fechaVisto;
  };

  return (
    <div className="px-6 py-4 bg-neutral-100/80 dark:bg-white/5 flex flex-wrap gap-6 items-center justify-between border-b border-neutral-200 dark:border-white/5">
      {/* 1. SECCIÓN PLATAFORMAS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">¿Dónde la viste?</label>
          {plataforma && (
            <button
              type="button"
              onClick={() => setPlataforma(null)}
              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Desmarcar plataforma
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setPlataforma(null)}
            className={`h-10 px-3 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-sm ${
              plataforma === null
                ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 border-transparent ring-2 ring-rose-500 scale-105 shadow-md'
                : 'bg-white dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-white/10 opacity-80 hover:opacity-100'
            }`}
          >
            Sin plataforma
          </button>

          {PLATAFORMAS.map((p) => {
            const activa = plataforma === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSeleccionarPlataforma(p.id)}
                title={p.nombre}
                className={`h-10 px-3.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer bg-white dark:bg-[#1a1a20] shadow-sm ${
                  activa
                    ? 'ring-2 ring-rose-500 border-rose-500 scale-105 shadow-md'
                    : 'border-neutral-300 dark:border-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                {p.logo ? (
                  <img 
                    src={p.logo} 
                    alt={p.nombre} 
                    className={`h-4 w-auto max-w-[65px] object-contain pointer-events-none ${
                      p.invertDark ? 'dark:invert' : ''
                    }`} 
                  />
                ) : (
                  p.icono
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SECCIÓN FECHA CON SELECCIÓN RÁPIDA DE AÑO Y MES */}
      <div className="space-y-1.5 relative" ref={contenedorRef}>
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Fecha de visualización</label>
          <button
            type="button"
            onClick={onToggleNoRecuerda}
            className={`text-[11px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
              noRecuerdaFecha 
                ? 'bg-rose-600 text-white' 
                : 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-white'
            }`}
          >
            {noRecuerdaFecha ? '✓ Usando fecha de estreno' : 'No recuerdo cuándo la vi'}
          </button>
        </div>

        {/* Botón que muestra la fecha exacta seleccionada */}
        <button
          type="button"
          onClick={() => {
            setMenuAbierto(!menuAbierto);
            setVistaModo('dias');
          }}
          className={`h-10 min-w-48 px-3 rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white text-xs font-bold flex items-center justify-between shadow-sm transition hover:border-rose-500/60 cursor-pointer ${
            noRecuerdaFecha ? 'ring-1 ring-amber-500/40 text-amber-500 dark:text-amber-400' : ''
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="text-rose-500 text-sm">📅</span>
            {formatearFechaBoton()}
          </span>
          <span className="text-[10px] text-neutral-400 ml-2">▼</span>
        </button>

        {/* Desplegable interactivo */}
        {menuAbierto && (
          <div className="absolute top-full right-0 mt-2 z-50 w-72 bg-white dark:bg-[#18181e] border border-neutral-300 dark:border-white/15 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-fadeIn">
            
            {/* Cabecera con selector de modo (Mes / Año) */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-2">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white flex items-center justify-center text-sm font-black transition cursor-pointer"
              >
                ‹
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setVistaModo(vistaModo === 'meses' ? 'dias' : 'meses')}
                  className="px-2 py-1 rounded-md hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-black text-neutral-900 dark:text-white transition cursor-pointer"
                >
                  {NOMBRES_MESES[mesNavegacion]}
                </button>
                <button
                  type="button"
                  onClick={() => setVistaModo(vistaModo === 'anios' ? 'dias' : 'anios')}
                  className="px-2 py-1 rounded-md hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-black text-rose-500 transition cursor-pointer"
                >
                  {anioNavegacion}
                </button>
              </div>

              <button
                type="button"
                onClick={() => cambiarMes(1)}
                className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white flex items-center justify-center text-sm font-black transition cursor-pointer"
              >
                ›
              </button>
            </div>

            {/* VISTA 1: GRILLA DE DÍAS */}
            {vistaModo === 'dias' && (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-neutral-400">
                  <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: primerDiaSemana }).map((_, idx) => (
                    <div key={`espacio-${idx}`} />
                  ))}
                  {Array.from({ length: diasEnElMes }).map((_, idx) => {
                    const dia = idx + 1;
                    const mesStr = String(mesNavegacion + 1).padStart(2, '0');
                    const diaStr = String(dia).padStart(2, '0');
                    const fechaIteracion = `${anioNavegacion}-${mesStr}-${diaStr}`;
                    const esSeleccionado = fechaVisto === fechaIteracion;

                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => seleccionarDia(dia)}
                        className={`h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                          esSeleccionado
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VISTA 2: SELECCIÓN RÁPIDA DE MESES */}
            {vistaModo === 'meses' && (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {NOMBRES_MESES.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => seleccionarMesDirecto(idx)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      mesNavegacion === idx
                        ? 'bg-rose-600 text-white'
                        : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* VISTA 3: SELECCIÓN RÁPIDA DE AÑOS CON SCROLL */}
            {vistaModo === 'anios' && (
              <div className="max-h-48 overflow-y-auto grid grid-cols-3 gap-1.5 pr-1 scrollbar-thin">
                {listaAnios.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => seleccionarAnioDirecto(a)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      anioNavegacion === a
                        ? 'bg-rose-600 text-white'
                        : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}