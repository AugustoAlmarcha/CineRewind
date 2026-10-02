import React, { useState, useEffect, useMemo } from 'react';

const NOMBRES_MESES = [
  '', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

export default function ModalWrapped({ abierto, alCerrar, datosWrapped }) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  const historias = useMemo(() => {
    if (!datosWrapped) return [];
    const { metricas, topSerie, topPelicula, plataformaTop, diaTop, periodo, actorReal, directorReal, veredictoIA } = datosWrapped;
    const lista = [];

    // 1. STORY: TOTAL DE HORAS (Estilo Neón Grande)
    lista.push({
      id: 'horas',
      bg: 'bg-[#d8ff00] text-black',
      barraColor: 'bg-black',
      render: () => (
        <div className="flex flex-col justify-between h-full p-8 select-none animate-fadeIn">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase bg-black text-[#d8ff00] px-3 py-1 rounded-md">
              CINEREWIND • {periodo.esAnual ? periodo.anio : NOMBRES_MESES[periodo.mes]}
            </span>
          </div>

          <div className="my-auto leading-none tracking-tighter">
            <p className="text-7xl sm:text-8xl font-black text-black">{metricas.horasTotales}</p>
            <p className="text-3xl font-black text-black/80 mt-2">HORAS DE PANTALLA</p>
            <div className="mt-8 space-y-2 text-sm font-black text-black/75">
              <p>— {metricas.totalEpisodios} episodios maratoneados</p>
              <p>— {metricas.totalPeliculas} largometrajes disfrutados</p>
              <p>— {metricas.diasActivos} días con el reproductor encendido</p>
            </div>
          </div>

          <p className="text-xs font-black uppercase tracking-wider text-black/60">
            Tu viaje cinematográfico resumido.
          </p>
        </div>
      ),
    });

    // 2. STORY: SERIE REINA (EMMY)
    if (topSerie) {
      lista.push({
        id: 'serie',
        bg: 'bg-[#5117d9] text-white',
        barraColor: 'bg-[#d8ff00]',
        render: () => (
          <div className="flex flex-col justify-between h-full p-8 select-none text-center animate-fadeIn">
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-[#d8ff00]">
                PREMIO EMMY DE LA AUDIENCIA
              </span>
              <h2 className="text-2xl font-black uppercase mt-1">Serie del Año</h2>
            </div>

            <div className="relative mx-auto my-auto w-56 aspect-[2/3] flex items-center justify-center">
              <div className="absolute -inset-3 bg-gradient-to-tr from-amber-400 via-rose-500 to-[#d8ff00] rounded-3xl blur-xs animate-pulse opacity-80" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/80 shadow-2xl">
                <img src={topSerie.poster_path} alt={topSerie.titulo} className="w-full h-full object-cover" />
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-black tracking-tight leading-tight uppercase">
                {topSerie.titulo}
              </h3>
              <p className="text-sm font-bold text-[#d8ff00] mt-1">
                {topSerie.episodios_vistos} capítulos devorados
              </p>
            </div>
          </div>
        ),
      });
    }

    // 3. STORY: ACTOR PRINCIPAL REAL (De TMDb con foto real de perfil)
    if (actorReal) {
      lista.push({
        id: 'actor',
        bg: 'bg-[#ff1744] text-white',
        barraColor: 'bg-white',
        render: () => (
          <div className="flex flex-col justify-between h-full p-8 select-none text-center animate-fadeIn">
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-amber-200">
                MEJOR INTERPRETACIÓN PROTAGÓNICA
              </span>
              <h2 className="text-2xl font-black uppercase mt-1">Tu Actor Fetiche</h2>
            </div>

            <div className="my-auto space-y-5">
              {actorReal.foto ? (
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  <img src={actorReal.foto} alt={actorReal.nombre} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-4xl font-mono font-black">
                  CR
                </div>
              )}

              <div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-white">
                  {actorReal.nombre}
                </h3>
                <p className="text-base font-bold text-amber-200 mt-1">
                  En el papel de "{actorReal.personaje}"
                </p>
                <p className="text-xs font-medium text-white/80 mt-1 uppercase tracking-wider">
                  Por su papel en {actorReal.obra}
                </p>
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
              Datos oficiales de elenco vía TMDb
            </p>
          </div>
        ),
      });
    }

    // 4. STORY: MEJOR PELÍCULA (Solo si vio películas)
    if (topPelicula && metricas.totalPeliculas > 0) {
      lista.push({
        id: 'peli',
        bg: 'bg-[#ff8f00] text-black',
        barraColor: 'bg-black',
        render: () => (
          <div className="flex flex-col justify-between h-full p-8 select-none text-center animate-fadeIn">
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-black/70">
                PREMIO OSCAR DE TU CARTELERA
              </span>
              <h2 className="text-2xl font-black uppercase mt-1 text-black">Película del Año</h2>
            </div>

            <div className="relative mx-auto my-auto w-56 aspect-[2/3] flex items-center justify-center">
              <div className="absolute -inset-3 bg-black/20 rounded-3xl blur-xs" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-black/80 shadow-2xl">
                <img src={topPelicula.poster_path} alt={topPelicula.titulo} className="w-full h-full object-cover" />
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-black tracking-tight leading-tight uppercase text-black">
                {topPelicula.titulo}
              </h3>
              <p className="text-sm font-bold text-black/80 mt-1">
                La gran protagonista de tus noches de cine
              </p>
            </div>
          </div>
        ),
      });
    }

    // 5. STORY: HÁBITOS DE REPRODUCCIÓN (Letterboxd)
    lista.push({
      id: 'habitos',
      bg: 'bg-[#003820] text-white',
      barraColor: 'bg-[#00e676]',
      render: () => (
        <div className="flex flex-col justify-between h-full p-8 select-none text-left animate-fadeIn">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase bg-[#00e676] text-[#003820] px-3 py-1 rounded-md">
              HÁBITOS DE ESPECTADOR
            </span>
            <h2 className="text-3xl font-black uppercase mt-3">Tu Ritual</h2>
          </div>

          <div className="space-y-6 my-auto">
            {plataformaTop && (
              <div className="border-b border-white/20 pb-4">
                <p className="text-xs uppercase font-bold text-[#00e676]">Plataforma Fetiche</p>
                <p className="text-4xl font-black tracking-tight">{plataformaTop.plataforma}</p>
                <p className="text-xs text-white/70 mt-1">{plataformaTop.cantidad} reproducciones registradas</p>
              </div>
            )}

            {diaTop && (
              <div className="border-b border-white/20 pb-4">
                <p className="text-xs uppercase font-bold text-[#00e676]">Día Sagrado</p>
                <p className="text-4xl font-black tracking-tight">Los {diaTop}</p>
                <p className="text-xs text-white/70 mt-1">El día que más disfrutaste tus historias</p>
              </div>
            )}

            {directorReal && (
              <div>
                <p className="text-xs uppercase font-bold text-[#00e676]">{directorReal.rol} Destacado</p>
                <p className="text-2xl font-black tracking-tight">{directorReal.nombre}</p>
                <p className="text-xs text-white/70 mt-1">Por {directorReal.obra}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-white/50 uppercase font-black tracking-wider">
            Siguiente: El Veredicto Final →
          </p>
        </div>
      ),
    });

    // 6. STORY: EL VEREDICTO DE LA INTELIGENCIA ARTIFICIAL
    if (veredictoIA) {
      lista.push({
        id: 'veredicto',
        bg: 'bg-[#121217] text-white border-4 border-amber-400',
        barraColor: 'bg-amber-400',
        render: () => (
          <div className="flex flex-col justify-between h-full p-8 select-none text-left animate-fadeIn">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase bg-amber-400 text-black px-3 py-1 rounded-md">
                DIAGNÓSTICO OFICIAL CINEREWIND
              </span>
              <p className="text-xs font-bold text-neutral-400 mt-2 uppercase tracking-wider">
                Veredicto del Jurado
              </p>
            </div>

            <div className="my-auto space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                  ARQUETIPO CINÉFILO
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                  {veredictoIA.arquetipo}
                </h2>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-sm font-medium text-neutral-200 leading-relaxed italic">
                  "{veredictoIA.discurso}"
                </p>
              </div>

              <p className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
                — {veredictoIA.fraseCierre}
              </p>
            </div>

            <button
              type="button"
              onClick={alCerrar}
              className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-xl transition cursor-pointer active:scale-95 text-center"
            >
              Cerrar CineRewind
            </button>
          </div>
        ),
      });
    }

    return lista;
  }, [datosWrapped, alCerrar]);

  const totalHistorias = historias.length;

  useEffect(() => {
    if (!abierto) {
      setIndiceActual(0);
      return;
    }
    if (pausado || totalHistorias === 0) return;

    const timer = setTimeout(() => {
      if (indiceActual < totalHistorias - 1) {
        setIndiceActual((prev) => prev + 1);
      } else {
        alCerrar();
      }
    }, 6500);

    return () => clearTimeout(timer);
  }, [abierto, indiceActual, pausado, totalHistorias, alCerrar]);

  if (!abierto || !datosWrapped || totalHistorias === 0) return null;

  const historiaActiva = historias[indiceActual];

  const avanzar = () => {
    if (indiceActual < totalHistorias - 1) setIndiceActual((prev) => prev + 1);
    else alCerrar();
  };

  const retroceder = () => {
    if (indiceActual > 0) setIndiceActual((prev) => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div 
        className={`relative w-full max-w-sm h-[680px] rounded-[36px] overflow-hidden shadow-2xl flex flex-col justify-between transition-colors duration-500 ${historiaActiva.bg}`}
        onMouseDown={() => setPausado(true)}
        onMouseUp={() => setPausado(false)}
        onTouchStart={() => setPausado(true)}
        onTouchEnd={() => setPausado(false)}
      >
        <div className="absolute top-4 left-4 right-4 z-30 flex gap-1.5">
          {historias.map((h, idx) => (
            <div key={idx} className="h-1 flex-1 bg-black/30 rounded-full overflow-hidden">
              <div
                className={`h-full ${h.barraColor || 'bg-white'} rounded-full transition-all ${
                  idx < indiceActual 
                    ? 'w-full' 
                    : idx === indiceActual 
                      ? 'w-full duration-[6500ms] ease-linear' 
                      : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <button
          onClick={alCerrar}
          className="absolute top-7 right-4 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center text-xs transition cursor-pointer"
        >
          ✕
        </button>

        <div className="absolute inset-y-14 left-0 w-1/3 z-20 cursor-pointer" onClick={retroceder} />
        <div className="absolute inset-y-14 right-0 w-2/3 z-20 cursor-pointer" onClick={avanzar} />

        <div className="relative z-10 flex-1 pt-8 pb-4">
          {historiaActiva.render()}
        </div>

        <div className="pb-3 text-center z-10 opacity-50">
          <p className="text-[10px] uppercase font-bold tracking-widest">
            Toca a los lados para saltar • Mantén para pausar
          </p>
        </div>
      </div>
    </div>
  );
}