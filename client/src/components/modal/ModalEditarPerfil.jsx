import React, { useState } from 'react';
import { comprobarUsernameAPI } from '../../api'; 
const CATEGORIAS_AVATARES = [
  {
    id: 'pokemon',
    titulo: 'Pokémon',
    tipo: 'fijo',
    avatares: [
      { id: 'pika', nombre: 'Pikachu', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
      { id: 'gengar', nombre: 'Gengar', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png' },
      { id: 'charizard', nombre: 'Charizard', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },
      { id: 'eevee', nombre: 'Eevee', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
      { id: 'snorlax', nombre: 'Snorlax', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png' },
      { id: 'mewtwo', nombre: 'Mewtwo', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png' },
      { id: 'squirtle', nombre: 'Squirtle', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png' },
      { id: 'bulbasaur', nombre: 'Bulbasaur', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' },
      { id: 'lucario', nombre: 'Lucario', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png' },
      { id: 'jigglypuff', nombre: 'Jigglypuff', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png' },
      { id: 'psyduck', nombre: 'Psyduck', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png' },
      { id: 'dragonite', nombre: 'Dragonite', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png' },
    ]
  },
  {
    id: 'heroes',
    titulo: 'Superhéroes',
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
    id: 'animales',
    titulo: 'Reino Animal',
    tipo: 'fijo',
    avatares: [
      { id: 'zorro', nombre: 'Zorro Rojo', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f98a.png' },
      { id: 'panda', nombre: 'Oso Panda', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f43c.png' },
      { id: 'leon', nombre: 'León', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f981.png' },
      { id: 'oso', nombre: 'Oso Pardo', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f43b.png' },
      { id: 'lobo', nombre: 'Lobo', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f43a.png' },
      { id: 'tigre', nombre: 'Tigre', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f42f.png' },
      { id: 'koala', nombre: 'Koala', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f428.png' },
      { id: 'pinguino', nombre: 'Pingüino', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f427.png' },
      { id: 'buho', nombre: 'Búho', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f989.png' },
      { id: 'mono', nombre: 'Chimpancé', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f435.png' },
      { id: 'mapache', nombre: 'Mapache', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f99d.png' },
      { id: 'nutria', nombre: 'Nutria', url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f9a6.png' },
    ]
  },
  {
    id: 'robots',
    titulo: 'Robots Retro',
    tipo: 'dinamico'
  }
];

export default function ModalEditarPerfil({ usuario, onClose, onGuardar }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [username, setUsername] = useState(usuario?.username || '');
  const [biografia, setBiografia] = useState(usuario?.biografia || '');
  const [error, setError] = useState(null);
const [guardando, setGuardando] = useState(false);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(
    usuario?.avatar_url || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'
  );
  
  const [categoriaActiva, setCategoriaActiva] = useState('pokemon');
  const [paginaOpciones, setPaginaOpciones] = useState(0);
  const [urlPersonalizada, setUrlPersonalizada] = useState('');

  const catActual = CATEGORIAS_AVATARES.find((c) => c.id === categoriaActiva) || CATEGORIAS_AVATARES[0];

  const semillasRobots = [
    ['Gizmo', 'Buster', 'Pepper', 'Bandit'],
    ['Sparky', 'Bolt', 'Chip', 'Rusty'],
    ['Felix', 'Aneka', 'GoldMech', 'Shadow']
  ];

  let avataresAMostrar = [];
  let totalPaginas = 1;

  const [usernameDisponible, setUsernameDisponible] = useState(true);
const [verificandoUsername, setVerificandoUsername] = useState(false);

const handleCambioUsername = (valor) => {
  const limpio = valor.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  setUsername(limpio);
  setError(null);

  // Si es su propio username actual, está disponible de inmediato
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
  
  // Espera 300ms antes de consultar a la base de datos
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

  if (catActual.tipo === 'dinamico') {
    totalPaginas = semillasRobots.length;
    const paginaActual = paginaOpciones % semillasRobots.length;
    avataresAMostrar = semillasRobots[paginaActual].map((seed, idx) => ({
      id: `bot-${paginaActual}-${idx}`,
      nombre: `Robot ${seed}`,
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`
    }));
  } else {
    totalPaginas = Math.ceil(catActual.avatares.length / 4);
    const inicio = (paginaOpciones % totalPaginas) * 4;
    avataresAMostrar = catActual.avatares.slice(inicio, inicio + 4);
  }

  const handleRotarOpciones = () => {
    setPaginaOpciones((prev) => (prev + 1) % totalPaginas);
  };

  const handleCambiarCategoria = (id) => {
    setCategoriaActiva(id);
    setPaginaOpciones(0);
  };

  const handleSeleccionar = (url) => {
    setAvatarSeleccionado(url);
    setUrlPersonalizada('');
  };

  const handleUrlPropia = (e) => {
    const link = e.target.value;
    setUrlPersonalizada(link);
    if (link.trim().startsWith('http')) {
      setAvatarSeleccionado(link.trim());
    }
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
    });
  } catch (err) {
    // En lugar de alert(), guardamos el mensaje para dibujarlo en el modal
    setError(err.message || 'Error al actualizar el perfil');
  } finally {
    setGuardando(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#fbf9f4] dark:bg-[#181820] border-2 border-neutral-300 dark:border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 text-neutral-900 dark:text-white max-h-[92vh] overflow-y-auto">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-neutral-300/80 dark:border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-black text-rose-600 dark:text-rose-400">
              CREDENCIAL DE ESPECTADOR
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Editar Perfil</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* --- PEGALO AQUÍ --- */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-center animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
              Foto de Credencial
            </label>

            {/* Vista previa */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-neutral-300/80 dark:border-white/10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-[#20202a] border-2 border-rose-500/50 p-2 overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center">
                <img
                  src={avatarSeleccionado}
                  alt="Avatar actual"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                    Galería de Personajes
                  </p>
                  
                  {totalPaginas > 1 && (
                    <button
                      type="button"
                      onClick={handleRotarOpciones}
                      className="px-3 py-1 rounded-xl bg-neutral-200/90 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 hover:text-rose-500 dark:hover:text-rose-400 text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
                    >
                      <span>🎲</span> Rotar ({(paginaOpciones % totalPaginas) + 1}/{totalPaginas})
                    </button>
                  )}
                </div>
                
                {/* Pestañas de categorías */}
                <div className="flex gap-1.5 flex-wrap justify-center sm:justify-start pt-1">
                  {CATEGORIAS_AVATARES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCambiarCategoria(cat.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        categoriaActiva === cat.id
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-neutral-200/80 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat.titulo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cuadrícula de 4 avatares rotativos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-neutral-100/70 dark:bg-white/[0.01] border border-neutral-300/80 dark:border-white/10">
              {avataresAMostrar.map((item) => {
                const esSeleccionado = avatarSeleccionado === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSeleccionar(item.url)}
                    className={`p-2.5 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center gap-2 bg-white dark:bg-[#20202a] ${
                      esSeleccionado
                        ? 'border-rose-600 ring-2 ring-rose-500/30 scale-105 shadow-md'
                        : 'border-transparent hover:border-neutral-400 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-2">
                      <img
                        src={item.url}
                        alt={item.nombre}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate w-full text-center">
                      {item.nombre}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* URL directa */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                O escribe la URL directa de cualquier imagen:
              </label>
              <input
                type="url"
                placeholder="https://ejemplo.com/tu-foto.png"
                value={urlPersonalizada}
                onChange={handleUrlPropia}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#20202a] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

{/* Nombre visible y Nombre de usuario */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
        Nombre
      </label>
      <span className="text-[10px] text-neutral-400 font-mono">
        {nombre.length}/20
      </span>
    </div>
    <input
      type="text"
      maxLength={20}
      required
      value={nombre}
      onChange={(e) => setNombre(e.target.value)}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#20202a] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500 font-bold transition"
    />
  </div>

<div className="space-y-1.5">
  <div className="flex justify-between items-center">
    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
      Usuario (@)
    </label>
    
    {/* Cartelito en vivo arriba del campo */}
    {username.length >= 3 && username !== usuario?.username && (
      <span className={`text-[11px] font-black tracking-tight animate-fadeIn ${
        verificandoUsername
          ? 'text-neutral-400'
          : usernameDisponible
            ? 'text-emerald-500'
            : 'text-rose-500'
      }`}>
        {verificandoUsername 
          ? 'Buscando...' 
          : usernameDisponible 
            ? '✓ Disponible' 
            : '✕ Nombre de usuario ocupado'}
      </span>
    )}
  </div>

  <input
    type="text"
    maxLength={20}
    required
    value={username}
    onChange={(e) => handleCambioUsername(e.target.value)}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#20202a] border text-neutral-900 dark:text-white focus:outline-none font-bold transition ${
      username.length >= 3 && username !== usuario?.username && !usernameDisponible && !verificandoUsername
        ? 'border-rose-500 focus:border-rose-600'
        : 'border-neutral-300 dark:border-white/10 focus:border-rose-500'
    }`}
  />
</div>
</div>

          {/* Biografía */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              Biografía de Credencial
            </label>
            <textarea
              rows={2}
              maxLength={120}
              placeholder="Escribe una breve descripción de tus gustos..."
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#20202a] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500 resize-none transition"
            />
            <p className="text-[10px] text-neutral-400 text-right">
              {biografia.length}/120 caracteres
            </p>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2 border-t border-neutral-300/80 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/5 transition cursor-pointer"
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