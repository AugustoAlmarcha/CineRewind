import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Flame, 
  FileSpreadsheet, 
  Users, 
  Sparkles, 
  Film, 
  Tv, 
  Plus, 
  ArrowRight,
  Clapperboard,
  CheckCircle2
} from 'lucide-react';
import { buscarPeliculasAPI } from '../../api';

// Selección de obras icónicas y populares para inicio rápido de 1 clic
const OBRAS_INICIO_RAPIDO = [
  {
    tmdb_id: 693134,
    tipo: 'pelicula',
    titulo: 'Dune: Parte Dos',
    anio: '2024',
    poster_path: 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
    sinopsis: 'Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.'
  },
  {
    tmdb_id: 872585,
    tipo: 'pelicula',
    titulo: 'Oppenheimer',
    anio: '2023',
    poster_path: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    sinopsis: 'La historia del científico estadounidense J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.'
  },
  {
    tmdb_id: 1396,
    tipo: 'serie',
    titulo: 'Breaking Bad',
    anio: '2008',
    poster_path: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    sinopsis: 'Un profesor de química con cáncer terminal se asocia con un exalumno para fabricar y vender metanfetamina.'
  },
  {
    tmdb_id: 66732,
    tipo: 'serie',
    titulo: 'Stranger Things',
    anio: '2016',
    poster_path: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    sinopsis: 'Un grupo de niños investiga la desaparición de su amigo y descubre fuerzas sobrenaturales y experimentos secretos.'
  },
  {
    tmdb_id: 136315,
    tipo: 'serie',
    titulo: 'The Bear',
    anio: '2022',
    poster_path: 'https://image.tmdb.org/t/p/w500/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg',
    sinopsis: 'Un joven chef de alta cocina regresa a Chicago para administrar el negocio de sándwiches de su familia tras una tragedia.'
  },
  {
    tmdb_id: 569094,
    tipo: 'pelicula',
    titulo: 'Spider-Man: A través del Spider-Verso',
    anio: '2023',
    poster_path: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    sinopsis: 'Miles Morales es catapultado a través del Multiverso, donde se encuentra con un equipo de Spider-People.'
  }
];

export default function OnboardingBienvenida({
  usuario,
  onSeleccionarObra,
  onAbrirImportarNetflix,
  onAbrirModalAmigos
}) {
  const navigate = useNavigate();

  // Buscador integrado dentro del banner de bienvenida
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const buscadorRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResultados([]);
      setMenuAbierto(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const data = await buscarPeliculasAPI(query.trim());
        setResultados(Array.isArray(data) ? data : []);
        setMenuAbierto(true);
      } catch (err) {
        console.error('Error al buscar en onboarding:', err);
      } finally {
        setCargando(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar resultados al hacer clic afuera
  useEffect(() => {
    const clickAfuera = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', clickAfuera);
    return () => document.removeEventListener('mousedown', clickAfuera);
  }, []);

  const nombreUsuario = usuario?.nombre || usuario?.username || 'Cinéfilo';

  return (
    <div className="space-y-8 sm:space-y-10 animate-fadeIn">
      {/* 1. HERO PRINCIPAL DE BIENVENIDA */}
      <div className="relative rounded-3xl bg-gradient-to-b from-white via-white to-neutral-50 dark:from-[#151520] dark:via-[#13131c] dark:to-[#0f0f15] border border-neutral-200 dark:border-white/10 p-6 sm:p-10 shadow-xl dark:shadow-2xl transition-colors z-20">
        
        {/* Glow ambiental superior encapsulado para no cortar el dropdown */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          {/* Badge de bienvenida */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>¡Tu diario cinéfilo está listo!</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
            Te damos la bienvenida,{' '}
            <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              {nombreUsuario}
            </span> 🍿
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Aquí podrás registrar lo que ves, calificar capítulos, hacer seguimiento a tus series y compartir recomendaciones con amigos.
          </p>

          {/* BUSCADOR HERO INTEGRADO */}
          <div ref={buscadorRef} className="pt-2 max-w-xl mx-auto relative text-left z-30">
            <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-neutral-300 dark:border-white/15 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 transition bg-neutral-50 dark:bg-[#1a1a24]">
              <Search className="w-5 h-5 text-neutral-400 dark:text-neutral-500 ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim().length >= 2 && setMenuAbierto(true)}
                placeholder="Busca una película o serie para registrarla ahora..."
                className="w-full px-3.5 py-3.5 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none bg-transparent"
              />
              {cargando && (
                <span className="text-[11px] font-mono text-zinc-400 mr-4 animate-pulse">
                  Buscando...
                </span>
              )}
            </div>

            {/* Dropdown de resultados del buscador integrado */}
            {menuAbierto && resultados.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#161622] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl max-h-80 overflow-y-auto z-50 p-2 space-y-1 animate-fadeIn scrollbar-thin">
                {resultados.slice(0, 8).map((obra) => (
                  <div
                    key={`${obra.tipo}-${obra.tmdb_id}`}
                    onClick={() => {
                      setMenuAbierto(false);
                      setQuery('');
                      onSeleccionarObra(obra);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer transition select-none group"
                  >
                    <div className="w-9 h-13 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                      {obra.poster_path ? (
                        <img src={obra.poster_path} alt={obra.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <Film className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-rose-500 transition">
                        {obra.titulo}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <span className="capitalize">{obra.tipo}</span>
                        {obra.anio && <span>· {obra.anio}</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] shrink-0 group-hover:scale-105 transition"
                    >
                      + Registrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. TRES TARJETAS DE ACCIÓN RÁPIDA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Tarjeta 1: Tendencias */}
        <div 
          onClick={() => navigate('/tendencias')}
          className="group rounded-3xl p-6 bg-white dark:bg-[#13131c] border border-neutral-200 dark:border-white/10 hover:border-amber-500/50 hover:shadow-xl dark:hover:shadow-2xl transition duration-300 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition duration-300">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-amber-500 transition">
              Explorar Tendencias
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Descubre lo más popular y comentado de la semana en cines y streaming. Conoce trailers y guarda películas en tu lista.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">
            <span>Ver cartelera y ruleta</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Tarjeta 2: Importar Netflix */}
        <div 
          onClick={onAbrirImportarNetflix}
          className="group rounded-3xl p-6 bg-white dark:bg-[#13131c] border border-neutral-200 dark:border-white/10 hover:border-rose-500/50 hover:shadow-xl dark:hover:shadow-2xl transition duration-300 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:scale-110 transition duration-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-rose-500 transition">
              ¿Vienes de Netflix?
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Descarga tu historial oficial desde tu cuenta de Netflix y súbelo en segundos para llenar tu diario sin cargar una por una.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-rose-500 group-hover:translate-x-1 transition-transform">
            <span>Importar archivo CSV</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Tarjeta 3: Amigos y Co-visiones */}
        <div 
          onClick={onAbrirModalAmigos}
          className="group rounded-3xl p-6 bg-white dark:bg-[#13131c] border border-neutral-200 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-xl dark:hover:shadow-2xl transition duration-300 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition duration-300">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-emerald-500 transition">
              Red de Amigos
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Conecta con amigos para etiquetarlos en lo que ven juntos, ver qué opinan y compartir co-visiones en tu perfil.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-500 group-hover:translate-x-1 transition-transform">
            <span>Buscar cinéfilos</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. VITRINA DE INICIO RÁPIDO (1 CLIC PARA REGISTRAR) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-rose-500" />
              <span>¿Viste alguna de estas obras recientemente?</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Toca cualquier título para registrarlo al instante con tu fecha y calificación.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4">
          {OBRAS_INICIO_RAPIDO.map((obra) => (
            <div
              key={obra.tmdb_id}
              onClick={() => onSeleccionarObra(obra)}
              className="group relative rounded-2xl overflow-hidden bg-neutral-100 dark:bg-[#14141d] border border-neutral-300/80 dark:border-white/10 hover:border-rose-500 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col select-none"
            >
              {/* Póster con aspecto 2:3 */}
              <div className="w-full aspect-[2/3] overflow-hidden bg-neutral-200 dark:bg-neutral-800 relative">
                <img
                  src={obra.poster_path}
                  alt={obra.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-black/75 text-white backdrop-blur-sm">
                  {obra.tipo === 'serie' ? 'Serie' : 'Película'}
                </span>
              </div>

              {/* Pie de tarjeta */}
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-rose-500 transition" title={obra.titulo}>
                    {obra.titulo}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    {obra.anio}
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 group-hover:bg-rose-600 text-neutral-800 dark:text-white group-hover:text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>Registrar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
