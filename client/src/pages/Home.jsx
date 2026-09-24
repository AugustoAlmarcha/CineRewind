import React, { useEffect, useState, useMemo, useCallback } from 'react';
import CarruselViendo from '../components/home/CarruselViendo';
import HeaderHistorial from '../components/home/HeaderHistorial';
import GrillaHistorial from '../components/home/GrillaHistorial';
import BarraAccionLote from '../components/home/BarraAccionLote';

// Modales modulares
import ModalRegistrar from '../components/modal/ModalRegistrar';
import ModalConfirmar from '../components/modal/ModalConfirmar';
import ModalDetalleTimeline from '../components/modal/ModalDetalleTimeline';
import ModalDetalleEpisodioViendo from '../components/modal/ModalDetalleEpisodioViendo';

import { useAuth } from '../context/AuthContext';

import { 
  obtenerViendoActualmenteAPI, 
  avanzarCapituloAPI, 
  obtenerTimelineAPI, 
  eliminarLoteAPI,
  descartarViendoAPI 
} from '../api';

export default function Home({ actualizarTrigger }) {
  const { usuario } = useAuth();

  // 1. Datos del backend
  const [seriesActivas, setSeriesActivas] = useState([]);
  const [timeline, setTimeline] = useState([]);

  // 2. Filtros y Búsqueda
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [vistaTotal, setVistaTotal] = useState(false);
  const [serieSeleccionadaTotal, setSerieSeleccionadaTotal] = useState(null);

  // 3. Navegación temporal
  const [anioSeleccionado, setAnioSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);

  // 4. Modales
  const [serieParaEditar, setSerieParaEditar] = useState(null);
  const [itemDetalle, setItemDetalle] = useState(null);
  const [serieParaDetalleXRay, setSerieParaDetalleXRay] = useState(null);

  // 5. Borrado masivo
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionadosParaBorrar, setSeleccionadosParaBorrar] = useState([]);

  // 6. Diálogo de confirmación
  const [dialogoConfirmar, setDialogoConfirmar] = useState({
    abierto: false,
    titulo: '',
    mensaje: '',
    onConfirm: null,
  });

const cargarDatos = useCallback(async () => {
    if (!usuario?.id) {
      setSeriesActivas([]);
      setTimeline([]);
      return;
    }

    try {
      const [series, historial] = await Promise.all([
        obtenerViendoActualmenteAPI(usuario.id),
        obtenerTimelineAPI(usuario.id, filtroTipo)
      ]);
      
      setSeriesActivas(Array.isArray(series) ? series : []);
      
      // Si el historial llega vacío pero ya teníamos datos previos, mantenemos los anteriores
      // evitando que el árbol colapse a "No hay registros"
      setTimeline((prev) => {
        const nuevoHistorial = Array.isArray(historial) ? historial : [];
        if (nuevoHistorial.length === 0 && prev.length > 0 && !filtroTipo) {
          return prev;
        }
        return nuevoHistorial;
      });
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  }, [usuario, filtroTipo]);

useEffect(() => {
  cargarDatos();
}, [cargarDatos, actualizarTrigger]); // <-- Agrega actualizarTrigger aquí

  const arbolHistorial = useMemo(() => {
    const mapa = {};
    timeline.forEach((item) => {
      if (!item.fecha_visto) return;
      const partes = String(item.fecha_visto).split('T')[0].split('-');
      if (partes.length === 3) {
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        if (!mapa[anio]) mapa[anio] = {};
        if (!mapa[anio][mes]) mapa[anio][mes] = [];
        mapa[anio][mes].push(item);
      } else {
        const f = new Date(item.fecha_visto);
        const anio = f.getFullYear();
        const mes = f.getMonth();
        if (!mapa[anio]) mapa[anio] = {};
        if (!mapa[anio][mes]) mapa[anio][mes] = [];
        mapa[anio][mes].push(item);
      }
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
    if (!usuario?.id) return;
    try {
      // Determinamos si la tarjeta ya está proponiendo una nueva temporada
      const pasaDeTemporada = serie.siguiente_temporada && Number(serie.siguiente_temporada) > Number(serie.temporada);

      await avanzarCapituloAPI({
        usuario_id: usuario.id,
        obra_id: serie.obra_id,
        temporada: serie.siguiente_temporada ?? serie.temporada,
        episodio_actual: pasaDeTemporada ? 0 : (serie.episodio_actual ?? serie.episodio),
        plataforma: serie.plataforma,
      });
      await cargarDatos();
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
        const idsABorrar = [...seleccionadosParaBorrar];

        // 1. CERRAR EL CARTEL Y LA SELECCIÓN AL INSTANTE (0 ms)
        setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));
        setModoSeleccion(false);
        setSeleccionadosParaBorrar([]);

        // 2. Filtro visual inmediato de la serie en Total Histórico
        setSerieSeleccionadaTotal((prev) => {
          if (!prev) return null;
          const nuevosRegistros = prev.registros.filter((reg) => {
            const regId = reg.id !== undefined ? reg.id : reg.historial_id;
            return !idsABorrar.includes(regId);
          });
          if (nuevosRegistros.length === 0) return null;
          return { ...prev, registros: nuevosRegistros };
        });

        // 3. Petición en segundo plano al backend y recarga
        try {
          await eliminarLoteAPI(idsABorrar);
          await cargarDatos();
        } catch (err) {
          console.error('Error al eliminar en lote:', err);
          alert('Hubo un problema al eliminar los registros en el servidor.');
          cargarDatos(); // Restaurar el estado real si falló la red
        }
      },
    });
  };

  const solicitarDescartarViendo = (obraId) => {
    if (!usuario?.id) return;
    setDialogoConfirmar({
      abierto: true,
      titulo: '¿Quitar de Viendo Actualmente?',
      mensaje: 'La serie se ocultará del carrusel superior, pero todo tu historial se conservará.',
      onConfirm: async () => {
        try {
          await descartarViendoAPI(usuario.id, obraId);
          cargarDatos();
        } finally {
          setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));
        }
      },
    });
  };

  // Bienvenida limpia si no ha iniciado sesión
  if (!usuario) {
    return (
      <main className="max-w-7xl mx-auto px-8 py-10 space-y-12">
        <div className="flex justify-center">
          <img 
            src="/logo.png" 
            alt="CineRewind Logo" 
            className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(225,29,72,0.45)] transition-transform duration-300 hover:scale-105" 
          />
        </div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-white">
          Lleva tu diario de cine y series
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md mx-auto">
          Inicia sesión o crea una cuenta para registrar lo que vas viendo, calcular tus horas totales y descubrir tendencias globales.
        </p>
      </main>
    );
  }

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
            setSerieSeleccionadaTotal(null);
          }}
          onVolverMeses={() => {
            setMesSeleccionado(null);
            setSerieSeleccionadaTotal(null);
          }}
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
          onCancelar={() => {
            setModoSeleccion(false);
            setSeleccionadosParaBorrar([]);
          }}
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