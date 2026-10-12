import React, { useState, useRef, useEffect, useMemo } from 'react';
import SelectorAmigosEtiquetar from './SelectorAmigosEtiquetar';
import GaleriaRepartoPrincipal from './GaleriaRepartoPrincipal';
import { Calendar, Tv, Users, Clapperboard, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { obtenerFechaHoyLocal, obtenerFechaAyerLocal, formatearFecha } from '../../utils/fechas';

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

export default function BarraConfiguracionRegistro({
  esSerie = false,
  plataforma,
  setPlataforma,
  fechaVisto,
  setFechaVisto,
  noRecuerdaFecha,
  onToggleNoRecuerda,
  amigosSeleccionados = [],
  setAmigosSeleccionados,
  vistoConTexto = '',
  setVistoConTexto,
  repartoActores = [],
  onSeleccionarActor
}) {
  const [panelActivo, setPanelActivo] = useState(null);
  const barraRef = useRef(null);

  const fechaObj = useMemo(() => {
    if (!fechaVisto) return new Date();
    const partes = String(fechaVisto).split('-').map(Number);
    if (partes.length === 3 && !isNaN(partes[0])) {
      return new Date(partes[0], partes[1] - 1, partes[2]);
    }
    return new Date();
  }, [fechaVisto]);

  const [mesNavegacion, setMesNavegacion] = useState(fechaObj.getMonth());
  const [anioNavegacion, setAnioNavegacion] = useState(fechaObj.getFullYear());

  useEffect(() => {
    setMesNavegacion(fechaObj.getMonth());
    setAnioNavegacion(fechaObj.getFullYear());
  }, [fechaObj]);

  const togglePanel = (tipo) => {
    setPanelActivo(panelActivo === tipo ? null : tipo);
  };

  const textoFechaChip = useMemo(() => {
    if (!fechaVisto) return 'Elegir fecha';
    const partes = String(fechaVisto).split('-');
    if (partes.length === 3) {
      const hoy = new Date();
      const esHoy = 
        hoy.getFullYear() === Number(partes[0]) &&
        hoy.getMonth() + 1 === Number(partes[1]) &&
        hoy.getDate() === Number(partes[2]);
      if (esHoy) return 'Hoy';
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaVisto;
  }, [fechaVisto]);

  const textoPlataformaChip = useMemo(() => {
    if (!plataforma) return 'Sin plataforma';
    return plataforma;
  }, [plataforma]);

  const textoAmigosChip = useMemo(() => {
    const total = amigosSeleccionados.length + (vistoConTexto?.trim() ? 1 : 0);
    if (total === 0) return 'Acompañantes';
    if (vistoConTexto?.trim() && amigosSeleccionados.length === 0) {
      return `Con: ${vistoConTexto.split(',')[0].trim()}`;
    }
    return `Con: ${total} ${total === 1 ? 'persona' : 'personas'}`;
  }, [amigosSeleccionados, vistoConTexto]);

  const seleccionarDia = (dia) => {
    const mesStr = String(mesNavegacion + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    setFechaVisto(`${anioNavegacion}-${mesStr}-${diaStr}`);
    if (noRecuerdaFecha && onToggleNoRecuerda) onToggleNoRecuerda(false);
    setPanelActivo(null);
  };

  const cambiarMes = (dir) => {
    let nuevoMes = mesNavegacion + dir;
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

  const primerDiaSemana = new Date(anioNavegacion, mesNavegacion, 1).getDay();
  const diasEnElMes = new Date(anioNavegacion, mesNavegacion + 1, 0).getDate();

  const fechaHoy = obtenerFechaHoyLocal();
  const fechaAyer = obtenerFechaAyerLocal();
  const esHoy = fechaVisto === fechaHoy && !noRecuerdaFecha;
  const esAyer = fechaVisto === fechaAyer && !noRecuerdaFecha;
  const esOtraFecha = !esHoy && !esAyer && !noRecuerdaFecha;

  return (
    <div ref={barraRef} className="space-y-3 bg-neutral-100/70 dark:bg-white/[0.03] p-3.5 sm:p-4 rounded-2xl border border-neutral-200 dark:border-white/10 select-none">
      
      {/* 1. SECCIÓN DE FECHA CONTEXTUAL COMPACTA */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-start flex-wrap gap-2.5 sm:gap-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {esSerie ? '¿Cuándo lo viste?:' : '¿Cuándo la viste?:'}
          </span>

          {/* Opciones directas: Hoy / Ayer / Calendario / Estreno TMDb */}
          <div className="flex items-center gap-1 bg-neutral-200/80 dark:bg-white/5 p-1 rounded-xl border border-neutral-300/80 dark:border-white/10 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setFechaVisto(fechaHoy);
                if (noRecuerdaFecha && onToggleNoRecuerda) onToggleNoRecuerda(false);
                setPanelActivo(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                esHoy
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-rose-600'
              }`}
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() => {
                setFechaVisto(fechaAyer);
                if (noRecuerdaFecha && onToggleNoRecuerda) onToggleNoRecuerda(false);
                setPanelActivo(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                esAyer
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-rose-600'
              }`}
            >
              Ayer
            </button>

            <button
              type="button"
              onClick={() => togglePanel('fecha')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                panelActivo === 'fecha' || esOtraFecha
                  ? 'bg-rose-600 text-white shadow-xs font-black'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-rose-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{esOtraFecha ? textoFechaChip : 'Otra fecha'}</span>
              {panelActivo === 'fecha' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {onToggleNoRecuerda && (
              <button
                type="button"
                onClick={() => {
                  onToggleNoRecuerda();
                  setPanelActivo(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  noRecuerdaFecha
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-amber-500'
                }`}
                title={
                  esSerie
                    ? 'Usar la fecha oficial de emisión de cada capítulo (TMDb)'
                    : 'Usar la fecha oficial de estreno de la película (TMDb)'
                }
              >
                <span>Estreno TMDb</span>
              </button>
            )}
          </div>
        </div>

        {noRecuerdaFecha && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pl-0.5 animate-fadeIn">
            {esSerie
              ? 'Usando la fecha oficial de emisión de cada capítulo (TMDb).'
              : 'Usando la fecha oficial de estreno (TMDb).'}
          </p>
        )}
      </div>

      {/* 2. CHIPS DE PLATAFORMA, ACOMPAÑANTES Y REPARTO */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-neutral-200/80 dark:border-white/10">
        {/* Chip Plataforma */}
        <button
          type="button"
          onClick={() => togglePanel('plataforma')}
          className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
            panelActivo === 'plataforma'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : plataforma
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-black'
                : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>{textoPlataformaChip}</span>
          {panelActivo === 'plataforma' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Chip Acompañantes */}
        <button
          type="button"
          onClick={() => togglePanel('amigos')}
          className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
            panelActivo === 'amigos'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : (amigosSeleccionados.length > 0 || vistoConTexto?.trim())
                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-black'
                : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{textoAmigosChip}</span>
          {panelActivo === 'amigos' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Chip Reparto */}
        {repartoActores && repartoActores.length > 0 && (
          <button
            type="button"
            onClick={() => togglePanel('reparto')}
            className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              panelActivo === 'reparto'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Reparto ({repartoActores.length})</span>
            {panelActivo === 'reparto' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* 3. PANEL DESPLEGABLE */}
      {panelActivo && (
        <div className="p-3.5 sm:p-4 rounded-2xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#181820] shadow-xl animate-fadeIn space-y-3">
          
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
              {panelActivo === 'fecha' && 'Elegir Fecha en Calendario'}
              {panelActivo === 'plataforma' && 'Elegir Plataforma'}
              {panelActivo === 'amigos' && 'Acompañantes'}
              {panelActivo === 'reparto' && 'Elenco Principal'}
            </span>
            <button
              type="button"
              onClick={() => setPanelActivo(null)}
              className="text-xs font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Listo</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PANEL FECHA */}
          {panelActivo === 'fecha' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => cambiarMes(-1)}
                    className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white flex items-center justify-center font-black transition cursor-pointer"
                  >
                    ‹
                  </button>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={mesNavegacion}
                      onChange={(e) => setMesNavegacion(Number(e.target.value))}
                      className="bg-neutral-100 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-lg px-2 py-1 outline-none border border-neutral-200 dark:border-white/10 cursor-pointer"
                    >
                      {NOMBRES_MESES.map((nombre, idx) => (
                        <option key={nombre} value={idx} className="bg-[#fcfaf7] dark:bg-[#181820]">
                          {nombre}
                        </option>
                      ))}
                    </select>

                    <select
                      value={anioNavegacion}
                      onChange={(e) => setAnioNavegacion(Number(e.target.value))}
                      className="bg-neutral-100 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-lg px-2 py-1 outline-none border border-neutral-200 dark:border-white/10 cursor-pointer"
                    >
                      {Array.from({ length: (new Date().getFullYear() - 1950) + 1 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y} className="bg-[#fcfaf7] dark:bg-[#181820]">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => cambiarMes(1)}
                    className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white flex items-center justify-center font-black transition cursor-pointer"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-neutral-400">
                  <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: primerDiaSemana }).map((_, idx) => (
                    <div key={`esp-${idx}`} />
                  ))}
                  {Array.from({ length: diasEnElMes }).map((_, idx) => {
                    const dia = idx + 1;
                    const mesStr = String(mesNavegacion + 1).padStart(2, '0');
                    const diaStr = String(dia).padStart(2, '0');
                    const fechaStrIter = `${anioNavegacion}-${mesStr}-${diaStr}`;
                    const esSeleccionado = fechaVisto === fechaStrIter;

                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => seleccionarDia(dia)}
                        className={`h-7 rounded-lg text-xs font-bold flex items-center justify-center transition cursor-pointer ${
                          esSeleccionado
                            ? 'bg-rose-600 text-white font-black shadow-md'
                            : 'hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PANEL PLATAFORMA */}
          {panelActivo === 'plataforma' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => {
                    setPlataforma(null);
                    setPanelActivo(null);
                  }}
                  className={`h-9 px-3 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                    plataforma === null
                      ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 border-neutral-800 dark:border-white shadow-xs font-black'
                      : 'bg-white dark:bg-[#1e1e24] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:border-neutral-300'
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
                      onClick={() => {
                        setPlataforma(activa ? null : p.id);
                        setPanelActivo(null);
                      }}
                      title={p.nombre}
                      className={`h-9 px-3.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 bg-white dark:bg-[#1e1e24] ${
                        activa
                          ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/30 ring-1 ring-rose-500 shadow-xs scale-[1.02]'
                          : 'border-neutral-200 dark:border-white/10 opacity-75 hover:opacity-100 hover:border-neutral-300'
                      }`}
                    >
                      {p.logo ? (
                        <img 
                          src={p.logo} 
                          alt={p.nombre} 
                          className={`h-3.5 w-auto max-w-[60px] object-contain pointer-events-none ${
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
          )}

          {/* PANEL ACOMPAÑANTES */}
          {panelActivo === 'amigos' && (
            <SelectorAmigosEtiquetar
              amigosSeleccionados={amigosSeleccionados}
              setAmigosSeleccionados={setAmigosSeleccionados}
              vistoConTexto={vistoConTexto}
              setVistoConTexto={setVistoConTexto}
            />
          )}

          {/* PANEL REPARTO */}
          {panelActivo === 'reparto' && (
            <GaleriaRepartoPrincipal
              reparto={repartoActores}
              mostrar={true}
              onToggleMostrar={() => setPanelActivo(null)}
              onSeleccionarActor={onSeleccionarActor}
            />
          )}
        </div>
      )}
    </div>
  );
}