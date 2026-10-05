import React, { useState } from 'react';
import { comprobarUsernameAPI, cambiarPasswordAPI } from '../../api';

// ========================================================
// 1. AVATARES: POKÉMON, SUPERHÉROES Y ROBOTS RETRO
// ========================================================
const CATEGORIAS_AVATARES = [
  {
    id: 'pokemon',
    titulo: '⚡ Pokémon',
    tipo: 'fijo',
    avatares: [
      { id: 'gengar', nombre: 'Gengar', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png' },
      { id: 'pika', nombre: 'Pikachu', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
      { id: 'charizard', nombre: 'Charizard', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },
      { id: 'eevee', nombre: 'Eevee', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
      { id: 'snorlax', nombre: 'Snorlax', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png' },
      { id: 'mewtwo', nombre: 'Mewtwo', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png' },
      { id: 'squirtle', nombre: 'Squirtle', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png' },
      { id: 'bulbasaur', nombre: 'Bulbasaur', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' },
      { id: 'lucario', nombre: 'Lucario', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png' },
      { id: 'dragonite', nombre: 'Dragonite', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png' },
      { id: 'psyduck', nombre: 'Psyduck', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png' },
      { id: 'jigglypuff', nombre: 'Jigglypuff', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png' },
    ]
  },
  {
    id: 'heroes',
    titulo: '🦸 Superhéroes',
    tipo: 'fijo',
    avatares: [
      { id: 'spidey', nombre: 'Spider-Man', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/620-spider-man.jpg' },
      { id: 'batman', nombre: 'Batman', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/70-batman.jpg' },
      { id: 'ironman', nombre: 'Iron Man', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/346-iron-man.jpg' },
      { id: 'deadpool', nombre: 'Deadpool', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/213-deadpool.jpg' },
      { id: 'wolverine', nombre: 'Wolverine', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/717-wolverine.jpg' },
      { id: 'joker', nombre: 'Joker', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/370-joker.jpg' },
      { id: 'thor', nombre: 'Thor', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/659-thor.jpg' },
      { id: 'superman', nombre: 'Superman', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/644-superman.jpg' },
      { id: 'wonderwoman', nombre: 'Wonder Woman', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/720-wonder-woman.jpg' },
      { id: 'venom', nombre: 'Venom', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/687-venom.jpg' },
      { id: 'cap', nombre: 'Capitán América', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/149-captain-america.jpg' },
      { id: 'flash', nombre: 'The Flash', url: 'https://raw.githubusercontent.com/akabab/superhero-api/master/api/images/sm/263-flash.jpg' },
    ]
  },
  {
    id: 'robots',
    titulo: '🤖 Robots Retro',
    tipo: 'dinamico'
  }
];

// ========================================================
// 2. FOTOGRAMAS PANORÁMICOS (CON SUS NOMBRES REALES Y SINCEROS)
// ========================================================
export const PORTADAS_PREDETERMINADAS = [
  {
    id: 'desierto',
    titulo: 'Cielo Gris',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'ciudad',
    titulo: 'Ciudad Nocturna con Rascacielos',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'espacio',
    titulo: 'Planeta Azul y Estrellas',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'fuego',
    titulo: 'Luces de ciudad',
    url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'cyberpunk',
    titulo: 'Montaña',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'sala_cine',
    titulo: 'Sala de Cine con Butacas Rojas',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
  },
];

export default function ModalEditarPerfil({ usuario, subpestanaInicial = 'info', onClose, onGuardar }) {
  const [seccionModal, setSeccionModal] = useState(subpestanaInicial);

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [username, setUsername] = useState(usuario?.username || '');
  const [biografia, setBiografia] = useState(usuario?.biografia || '');
  
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(
    usuario?.avatar_url || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png'
  );

  const [bannerSeleccionado, setBannerSeleccionado] = useState(
    usuario?.banner_url || PORTADAS_PREDETERMINADAS[0].url
  );

  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  
  // Categoría por defecto: Pokémon
  const [categoriaActiva, setCategoriaActiva] = useState('pokemon');
  const [paginaOpciones, setPaginaOpciones] = useState(0);
  const [urlPersonalizadaAvatar, setUrlPersonalizadaAvatar] = useState('');
  const [urlPersonalizadaBanner, setUrlPersonalizadaBanner] = useState('');

  const [usernameDisponible, setUsernameDisponible] = useState(true);
  const [verificandoUsername, setVerificandoUsername] = useState(false);

  const semillasRobots = [
    ['Gizmo', 'Buster', 'Pepper', 'Bandit'],
    ['Sparky', 'Bolt', 'Chip', 'Rusty'],
    ['Felix', 'Aneka', 'GoldMech', 'Shadow']
  ];

  const catActual = CATEGORIAS_AVATARES.find((c) => c.id === categoriaActiva) || CATEGORIAS_AVATARES[0];
  let avataresAMostrar = [];
  let totalPaginas = 1;

  if (catActual.tipo === 'dinamico') {
    totalPaginas = semillasRobots.length;
    const paginaActual = paginaOpciones % semillasRobots.length;
    avataresAMostrar = semillasRobots[paginaActual].map((seed, idx) => ({
      id: `bot-${paginaActual}-${idx}`,
      nombre: `Robot ${seed}`,
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=ff5722,ff7043`
    }));
  } else {
    totalPaginas = Math.ceil(catActual.avatares.length / 4);
    const inicio = (paginaOpciones % totalPaginas) * 4;
    avataresAMostrar = catActual.avatares.slice(inicio, inicio + 4);
  }

  const handleCambioUsername = (valor) => {
    const limpio = valor.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    setUsername(limpio);
    setError(null);

    if (limpio === usuario?.username?.toLowerCase()) {
      setUsernameDisponible(true);
      setVerificandoUsername(false);
      return;
    }

    if (limpio.length < 3) {
      setUsernameDisponible(false);
      return;
    }

    setVerificandoUsername(true);
    const temporizador = setTimeout(async () => {
      try {
        const data = await comprobarUsernameAPI(limpio);
        setUsernameDisponible(data.disponible);
      } catch {
        setUsernameDisponible(false);
      } finally {
        setVerificandoUsername(false);
      }
    }, 300);

    return () => clearTimeout(temporizador);
  };

  const handleRotarOpciones = () => {
    setPaginaOpciones((prev) => (prev + 1) % totalPaginas);
  };

  const handleCambiarCategoria = (id) => {
    setCategoriaActiva(id);
    setPaginaOpciones(0);
  };

  const handleSeleccionarAvatar = (url) => {
    setAvatarSeleccionado(url);
    setUrlPersonalizadaAvatar('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      await onGuardar({
        nombre: nombre.trim(),
        username: username.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, ''),
        biografia: biografia.trim(),
        avatar_url: avatarSeleccionado,
        banner_url: bannerSeleccionado,
      });
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  // Contraseña
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passRepetir, setPassRepetir] = useState('');
  const [mensajePass, setMensajePass] = useState(null);
  const [errorPass, setErrorPass] = useState(null);
  const [guardandoPass, setGuardandoPass] = useState(false);

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPass(null);
    setMensajePass(null);

    if (passNueva.length < 6) {
      setErrorPass('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passNueva !== passRepetir) {
      setErrorPass('Las contraseñas nuevas no coinciden.');
      return;
    }

    setGuardandoPass(true);
    try {
      await cambiarPasswordAPI({
        passwordActual: passActual,
        passwordNueva: passNueva,
      });
      setMensajePass('✓ Contraseña actualizada correctamente.');
      setPassActual('');
      setPassNueva('');
      setPassRepetir('');
    } catch (err) {
      setErrorPass(err.message || 'Error al actualizar contraseña');
    } finally {
      setGuardandoPass(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#111118] border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 text-white max-h-[92vh] overflow-y-auto">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-black text-rose-500">
              CINEREWIND · PERSONALIZACIÓN
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Editar Perfil</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-rose-600 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Pestañas del Modal */}
        <div className="flex items-center gap-1 border-b border-zinc-800/80 pb-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setSeccionModal('info')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              seccionModal === 'info'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            👤 Datos & Bio
          </button>

          <button
            type="button"
            onClick={() => setSeccionModal('portada')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              seccionModal === 'portada'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            🖼️ Portada Panorámica
          </button>

          <button
            type="button"
            onClick={() => setSeccionModal('avatares')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              seccionModal === 'avatares'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            🎭 Avatares de Perfil
          </button>

          <button
            type="button"
            onClick={() => setSeccionModal('seguridad')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              seccionModal === 'seguridad'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            🔒 Contraseña
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. DATOS BÁSICOS */}
          {seccionModal === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nombre</label>
                    <span className="text-[10px] text-zinc-500 font-mono">{nombre.length}/20</span>
                  </div>
                  <input
                    type="text"
                    maxLength={20}
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500 font-bold transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Usuario (@)</label>
                    {username.length >= 3 && username !== usuario?.username && (
                      <span className={`text-[11px] font-black tracking-tight ${
                        verificandoUsername ? 'text-zinc-400' : usernameDisponible ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {verificandoUsername ? 'Buscando...' : usernameDisponible ? '✓ Disponible' : '✕ Ocupado'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={20}
                    required
                    value={username}
                    onChange={(e) => handleCambioUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500 font-bold transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Biografía Cinéfila</label>
                <textarea
                  rows={3}
                  maxLength={160}
                  placeholder="Comparte tus directores, géneros favoritos y qué te apasiona del cine..."
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500 resize-none transition leading-relaxed"
                />
                <p className="text-[10px] text-zinc-500 text-right">{biografia.length}/160 caracteres</p>
              </div>
            </div>
          )}

          {/* 2. PORTADA PANORÁMICA (NOMBRES SINCEROS) */}
          {seccionModal === 'portada' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Selecciona tu Fotograma Panorámico
              </label>

              {/* Vista previa en vivo */}
              <div className="w-full h-40 rounded-2xl overflow-hidden border-2 border-zinc-800 relative bg-zinc-950 shadow-xl">
                <img
                  src={bannerSeleccionado}
                  alt="Vista previa de portada"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-xs font-bold text-white drop-shadow">
                    ✓ Imagen seleccionada para tu cabecera
                  </span>
                </div>
              </div>

              {/* Catálogo con nombres sinceros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {PORTADAS_PREDETERMINADAS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setBannerSeleccionado(item.url);
                      setUrlPersonalizadaBanner('');
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      bannerSeleccionado === item.url
                        ? 'bg-zinc-800 border-rose-500 text-white shadow-md ring-1 ring-rose-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-zinc-700 bg-zinc-950">
                      <img
                        src={item.url}
                        alt={item.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-semibold truncate">{item.titulo}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  O pega el enlace de tu foto panorámica preferida:
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={urlPersonalizadaBanner}
                  onChange={(e) => {
                    const l = e.target.value;
                    setUrlPersonalizadaBanner(l);
                    if (l.trim().startsWith('http')) {
                      setBannerSeleccionado(l.trim());
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500 transition font-mono"
                />
              </div>
            </div>
          )}

          {/* 3. AVATARES: SOLO POKÉMON, SUPERHÉROES Y ROBOTS */}
          {seccionModal === 'avatares' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-950 border-2 border-rose-500 p-2 overflow-hidden shadow-md shrink-0 flex items-center justify-center">
                  <img
                    src={avatarSeleccionado}
                    alt="Avatar seleccionado"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">Galería de Personajes</p>
                    {totalPaginas > 1 && (
                      <button
                        type="button"
                        onClick={handleRotarOpciones}
                        className="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <span>🎲</span> Rotar ({(paginaOpciones % totalPaginas) + 1}/{totalPaginas})
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-wrap justify-center sm:justify-start pt-1">
                    {CATEGORIAS_AVATARES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCambiarCategoria(cat.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          categoriaActiva === cat.id
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat.titulo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cuadrícula de 4 avatares rotativos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                {avataresAMostrar.map((item) => {
                  const esSeleccionado = avatarSeleccionado === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSeleccionarAvatar(item.url)}
                      className={`p-2.5 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center gap-2 bg-zinc-900 ${
                        esSeleccionado
                          ? 'border-rose-600 ring-2 ring-rose-500/30 scale-105 shadow-md'
                          : 'border-transparent hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-xl bg-zinc-950 p-1">
                        <img
                          src={item.url}
                          alt={item.nombre}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-300 truncate w-full text-center">
                        {item.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  O escribe la URL directa de cualquier imagen:
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/tu-foto.png"
                  value={urlPersonalizadaAvatar}
                  onChange={(e) => {
                    const l = e.target.value;
                    setUrlPersonalizadaAvatar(l);
                    if (l.trim().startsWith('http')) {
                      setAvatarSeleccionado(l.trim());
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500 transition font-mono"
                />
              </div>
            </div>
          )}

          {/* 4. CONTRASEÑA */}
          {seccionModal === 'seguridad' && (
            <div className="space-y-4">
              {errorPass && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                  ⚠️ {errorPass}
                </div>
              )}

              {mensajePass && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
                  {mensajePass}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  value={passActual}
                  onChange={(e) => setPassActual(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Nueva Contraseña (mínimo 6)</label>
                  <input
                    type="password"
                    value={passNueva}
                    onChange={(e) => setPassNueva(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Repetir Nueva Contraseña</label>
                  <input
                    type="password"
                    value={passRepetir}
                    onChange={(e) => setPassRepetir(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={guardandoPass || !passActual || !passNueva || !passRepetir}
                  onClick={handleCambiarPassword}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
                >
                  {guardandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !usernameDisponible || verificandoUsername}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-black text-white shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}