import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { formatearFecha } from '../../utils/fechas';

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function SelectorCalendarioPopover({
  fecha,
  onSeleccionarFecha,
  align = 'right',
  posicionVert = 'auto', // 'auto', 'abajo' o 'arriba'
  labelPersonalizado = null,
  tamano = 'normal', // 'compacto' o 'normal'
  deshabilitado = false,
  className = '',
  botonClassName = '',
  esActivo = false,
  renderTrigger = null,
  onOpenChange = null,
}) {
  const [abierto, setAbierto] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const contenedorRef = useRef(null);
  const popoverRef = useRef(null);

  const cambiarAbierto = (nuevoEstado) => {
    setAbierto(nuevoEstado);
    if (onOpenChange) {
      onOpenChange(nuevoEstado);
    }
  };

  const fechaObj = useMemo(() => {
    if (!fecha) return new Date();
    const partes = String(fecha).split('-').map(Number);
    if (partes.length === 3 && !isNaN(partes[0])) {
      return new Date(partes[0], partes[1] - 1, partes[2]);
    }
    return new Date();
  }, [fecha]);

  const [mesNavegacion, setMesNavegacion] = useState(fechaObj.getMonth());
  const [anioNavegacion, setAnioNavegacion] = useState(fechaObj.getFullYear());

  useEffect(() => {
    setMesNavegacion(fechaObj.getMonth());
    setAnioNavegacion(fechaObj.getFullYear());
  }, [fechaObj]);

  const actualizarCoords = () => {
    if (!contenedorRef.current) return;
    const rect = contenedorRef.current.getBoundingClientRect();
    const anchoPopover = 260;
    const altoPopover = 300;

    let posX = rect.left;
    if (align === 'right') {
      posX = rect.right - anchoPopover;
    } else if (align === 'center') {
      posX = rect.left + (rect.width / 2) - (anchoPopover / 2);
    }
    // Asegurar que no se desborde fuera de la pantalla
    posX = Math.max(8, Math.min(window.innerWidth - anchoPopover - 8, posX));

    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioArriba = rect.top;

    let posY = rect.bottom + 6;
    if (posicionVert === 'arriba') {
      posY = Math.max(8, rect.top - altoPopover - 6);
    } else if (posicionVert === 'abajo') {
      posY = rect.bottom + 6;
    } else {
      // Auto: si no entra abajo pero sí arriba, colocar arriba
      if (espacioAbajo < altoPopover && espacioArriba > altoPopover) {
        posY = Math.max(8, rect.top - altoPopover - 6);
      } else {
        posY = rect.bottom + 6;
      }
    }

    setCoords({ top: posY, left: posX });
  };

  useEffect(() => {
    if (!abierto) return;
    actualizarCoords();

    const handleScrollOrResize = () => {
      actualizarCoords();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [abierto, posicionVert, align]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    if (!abierto) return;
    const handleClickAfuera = (e) => {
      if (
        contenedorRef.current && !contenedorRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        cambiarAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    document.addEventListener('touchstart', handleClickAfuera);
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('touchstart', handleClickAfuera);
    };
  }, [abierto]);

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

  const seleccionarDia = (dia) => {
    const mesStr = String(mesNavegacion + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    const fechaResult = `${anioNavegacion}-${mesStr}-${diaStr}`;
    onSeleccionarFecha(fechaResult);
    cambiarAbierto(false);
  };

  const primerDiaSemana = new Date(anioNavegacion, mesNavegacion, 1).getDay();
  const diasEnElMes = new Date(anioNavegacion, mesNavegacion + 1, 0).getDate();

  const textoFechaMostrar = labelPersonalizado || (fecha ? formatearFecha(fecha) : 'Elegir fecha');

  const popoverElement = abierto ? (
    <div 
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      className="z-[10050] p-3 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-300 dark:border-white/15 shadow-2xl animate-fadeIn space-y-2.5 w-64 select-none"
    >
      {/* Cabecera del mes y año */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-2 gap-1">
        <button
          type="button"
          onClick={() => cambiarMes(-1)}
          className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white flex items-center justify-center font-black transition cursor-pointer text-xs"
        >
          ‹
        </button>

        <div className="flex items-center gap-1">
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
            className="bg-neutral-100 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-lg px-1.5 py-1 outline-none border border-neutral-200 dark:border-white/10 cursor-pointer"
          >
            {Array.from({ length: (new Date().getFullYear() - 1950) + 2 }, (_, i) => (new Date().getFullYear() + 1) - i).map((y) => (
              <option key={y} value={y} className="bg-[#fcfaf7] dark:bg-[#181820]">
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => cambiarMes(1)}
          className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white flex items-center justify-center font-black transition cursor-pointer text-xs"
        >
          ›
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-neutral-400">
        <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: primerDiaSemana }).map((_, idx) => (
          <div key={`esp-${idx}`} />
        ))}
        {Array.from({ length: diasEnElMes }).map((_, idx) => {
          const dia = idx + 1;
          const mesStr = String(mesNavegacion + 1).padStart(2, '0');
          const diaStr = String(dia).padStart(2, '0');
          const fechaStrIter = `${anioNavegacion}-${mesStr}-${diaStr}`;
          const esSeleccionado = fecha === fechaStrIter;

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
  ) : null;

  return (
    <div ref={contenedorRef} className={`relative inline-block select-none ${className}`}>
      {/* Botón Disparador o custom renderTrigger */}
      {renderTrigger ? (
        renderTrigger({
          abierto,
          toggle: (e) => {
            if (e) e.stopPropagation();
            cambiarAbierto(!abierto);
          },
          texto: textoFechaMostrar,
          esActivo,
        })
      ) : (
        <button
          type="button"
          disabled={deshabilitado}
          onClick={(e) => {
            e.stopPropagation();
            cambiarAbierto(!abierto);
          }}
          className={
            botonClassName
              ? `${botonClassName} ${abierto || esActivo ? 'border-rose-500 ring-1 ring-rose-500/30' : ''}`
              : `flex items-center gap-1.5 rounded-xl transition cursor-pointer border shadow-xs ${
                  tamano === 'compacto'
                    ? 'px-2 py-1 text-[11px] font-bold bg-white dark:bg-black/40 border-neutral-300 dark:border-white/10 hover:border-rose-500 text-neutral-800 dark:text-neutral-200'
                    : 'px-3 py-1.5 text-xs font-bold bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10 hover:border-rose-500 text-neutral-800 dark:text-neutral-200'
                } ${abierto || esActivo ? 'border-rose-500 ring-1 ring-rose-500/30' : ''}`
          }
        >
          <Calendar className={`text-rose-500 shrink-0 ${tamano === 'compacto' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          <span className="font-mono truncate">{textoFechaMostrar}</span>
          {abierto ? (
            <ChevronUp className="w-3 h-3 text-neutral-400 shrink-0" />
          ) : (
            <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
          )}
        </button>
      )}

      {/* Renderizado mediante Portal en body para evitar recortes */}
      {typeof document !== 'undefined' && abierto && createPortal(popoverElement, document.body)}
    </div>
  );
}