import React, { useEffect, useState, useMemo } from 'react';
import CarruselViendo from '../components/home/CarruselViendo';
import HeaderHistorial from '../components/home/HeaderHistorial';
import GrillaHistorial from '../components/home/GrillaHistorial';
import BarraAccionLote from '../components/home/BarraAccionLote';
import ModalRegistrar from '../components/ModalRegistrar';
import ModalConfirmar from '../components/ModalConfirmar';
import ModalDetalleTimeline from '../components/ModalDetalleTimeline';
import ModalDetalleEpisodioViendo from '../components/ModalDetalleEpisodioViendo';
import ModalResumenTemporada from '../components/ModalResumenTemporada';

import { 
  obtenerViendoActualmenteAPI, 
  avanzarCapituloAPI, 
  obtenerTimelineAPI, 
  eliminarVisualizacionAPI, 
  eliminarLoteAPI,
  descartarViendoAPI 
} from '../api';

export default function Home() {
  
  // 1. Datos del backend
  const [seriesActivas, setSeriesActivas] = useState([]);
  const [timeline, setTimeline] = useState([]);

  // 2. Filtros y Búsqueda
  const [filtroTipo, setFiltroTipo] = useState(''); // '' (todos) | 'pelicula' | 'serie'
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [vistaTotal, setVistaTotal] = useState(false); // true: Total Histórico | false: Diario por Fechas
  const [serieSeleccionadaTotal, setSerieSeleccionadaTotal] = useState(null); // <-- Agregar este estado
  // 3. Navegación temporal (para el Diario por Fechas)
  const [anioSeleccionado, setAnioSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);

  // 4. Modales
  const [serieParaEditar, setSerieParaEditar] = useState(null);
  const [itemDetalle, setItemDetalle] = useState(null);
  const [serieParaDetalleXRay, setSerieParaDetalleXRay] = useState(null);
  const [temporadaParaResumen, setTemporadaParaResumen] = useState(null);

  // 5. Borrado masivo (Selección múltiple)
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionadosParaBorrar, setSeleccionadosParaBorrar] = useState([]);

  // 6. Diálogo de confirmación
  const [dialogoConfirmar, setDialogoConfirmar] = useState({
    abierto: false,
    titulo: '',
    mensaje: '',
    onConfirm: null,
  });

  const cargarDatos = async () => {
    try {
      const [series, historial] = await Promise.all([
        obtenerViendoActualmenteAPI(1),
        obtenerTimelineAPI(1, filtroTipo)
      ]);
      setSeriesActivas(series);
      setTimeline(historial);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroTipo]);

  const arbolHistorial = useMemo(() => {
    const mapa = {};
    timeline.forEach((item) => {
      const f = new Date(item.fecha_visto);
      const anio = f.getFullYear();
      const mes = f.getMonth();
      if (!mapa[anio]) mapa[anio] = {};
      if (!mapa[anio][mes]) mapa[anio][mes] = [];
      mapa[anio][mes].push(item);
    });
    return mapa;
  }, [timeline]);

  const listaAnios = Object.keys(arbolHistorial).sort((a, b) => b - a);
  const toggleSeleccionItem = (id) => {
      if (id === undefined || id === null) return;
      setSeleccionadosParaBorrar((prev) => 
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    };

  const handleAvanzar = async (serie) => {
    try {
      await avanzarCapituloAPI({
        usuario_id: 1,
        obra_id: serie.obra_id,
        temporada: serie.temporada,
        episodio_actual: serie.episodio,
        plataforma: serie.plataforma,
      });
      cargarDatos();
    } catch (err) {
      console.error('Error al avanzar capítulo:', err);
    }
  };

  const solicitarEliminarLote = () => {
    if (seleccionadosParaBorrar.length === 0) return;
    setDialogoConfirmar({
      abierto: true,
      titulo: `¿Eliminar ${seleccionadosParaBorrar.length} registros?`,
      mensaje: 'Los registros seleccionados se quitarán permanentemente de tu cuenta.',
      onConfirm: async () => {
        try {
          await eliminarLoteAPI(seleccionadosParaBorrar);
          setSeleccionadosParaBorrar([]);
          setModoSeleccion(false);
          cargarDatos();
        } finally {
          setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));
        }
      },
    });
  };

  const solicitarDescartarViendo = (obraId) => {
    setDialogoConfirmar({
      abierto: true,
      titulo: '¿Quitar de Viendo Actualmente?',
      mensaje: 'La serie se ocultará del carrusel superior, pero todo tu historial se conservará.',
      onConfirm: async () => {
        try {
          await descartarViendoAPI(1, obraId);
          cargarDatos();
        } finally {
          setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));
        }
      },
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-8 py-10 space-y-12">
      {/* 1. Carrusel de Series Activas */}
      <CarruselViendo 
        seriesActivas={seriesActivas}
        onAvanzar={handleAvanzar}
        onDescartar={solicitarDescartarViendo}
        onVerInfoEpisodio={(item) => setSerieParaDetalleXRay(item)}
        onAbrirDetalle={(item) => {
          setSerieParaEditar({
            tmdb_id: item.tmdb_id,
            titulo: item.titulo,
            poster_path: item.poster_path,
            tipo: 'serie',
          });
        }}
      />

{/* 2. Mi Diario Cinemático y Total Histórico */}
      <section className="space-y-6">
        <HeaderHistorial 
          vistaTotal={vistaTotal}
          setVistaTotal={setVistaTotal}
          serieSeleccionadaTotal={serieSeleccionadaTotal}
          setSerieSeleccionadaTotal={setSerieSeleccionadaTotal}
          anioSeleccionado={anioSeleccionado}
          mesSeleccionado={mesSeleccionado}
          onVolverAnios={() => { 
            setAnioSeleccionado(null); 
            setMesSeleccionado(null); 
          }}
          onVolverMeses={() => setMesSeleccionado(null)}
          modoSeleccion={modoSeleccion}
          setModoSeleccion={setModoSeleccion}
          setSeleccionadosParaBorrar={setSeleccionadosParaBorrar}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          busquedaHistorial={busquedaHistorial}
          setBusquedaHistorial={setBusquedaHistorial}
        />

        <GrillaHistorial 
          vistaTotal={vistaTotal}
          serieSeleccionadaTotal={serieSeleccionadaTotal}
          setSerieSeleccionadaTotal={setSerieSeleccionadaTotal}
          anioSeleccionado={anioSeleccionado}
          mesSeleccionado={mesSeleccionado}
          arbolHistorial={arbolHistorial}
          listaAnios={listaAnios}
          timelineCompleto={timeline}
          onSeleccionarAnio={(anio) => setAnioSeleccionado(anio)}
          onSeleccionarMes={(mes) => setMesSeleccionado(mes)}
          modoSeleccion={modoSeleccion}
          seleccionadosParaBorrar={seleccionadosParaBorrar}
          onToggleItem={toggleSeleccionItem}
          onAbrirDetalleTimeline={(item) => setItemDetalle(item)}
          busquedaHistorial={busquedaHistorial}
        />
      </section>

      {/* 3. Barra Flotante de Borrado Masivo */}
      {modoSeleccion && (
        <BarraAccionLote 
          cantidadSeleccionada={seleccionadosParaBorrar.length}
          onEliminar={solicitarEliminarLote}
        />
      )}

      {/* 4. Modales Globales */}
      {serieParaEditar && (
        <ModalRegistrar 
          obra={serieParaEditar} 
          onClose={() => setSerieParaEditar(null)} 
          onRegistroCompletado={() => { cargarDatos(); setSerieParaEditar(null); }} 
        />
      )}

      {serieParaDetalleXRay && (
        <ModalDetalleEpisodioViendo 
          serie={serieParaDetalleXRay}
          onClose={() => setSerieParaDetalleXRay(null)}
          onMarcarVisto={handleAvanzar}
        />
      )}

      {itemDetalle && (
        <ModalDetalleTimeline 
          item={itemDetalle}
          onClose={() => setItemDetalle(null)}
          onActualizado={() => { cargarDatos(); setItemDetalle(null); }}
        />
      )}

      {temporadaParaResumen && (
        <ModalResumenTemporada
          data={temporadaParaResumen}
          onClose={() => setTemporadaParaResumen(null)}
        />
      )}

      <ModalConfirmar
        isOpen={dialogoConfirmar.abierto}
        titulo={dialogoConfirmar.titulo}
        mensaje={dialogoConfirmar.mensaje}
        onConfirm={dialogoConfirmar.onConfirm}
        onCancel={() => setDialogoConfirmar((prev) => ({ ...prev, abierto: false }))}
      />
    </main>
  );
}