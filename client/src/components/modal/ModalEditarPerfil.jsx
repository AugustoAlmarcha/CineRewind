import React, { useState } from 'react';
import { comprobarUsernameAPI, cambiarPasswordAPI, asignarPasswordAPI } from '../../api';
import {
  User,
  Image as ImageIcon,
  Smile,
  Lock,
  X,
  Check,
  RotateCw,
  Sparkles,
  Link,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

// ========================================================
// 1. FOTOGRAMAS PANORÁMICOS (CON NOMBRES SINCEROS Y REALES)
// ========================================================
export const PORTADAS_PREDETERMINADAS = [
  {
    id: 'sala_cine',
    titulo: 'Sala de Cine con Butacas Rojas',
    categoria: 'Cine Clásico',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'neon_cinema',
    titulo: 'Entrada de Cine con Neón Rojo',
    categoria: 'Cine Retro',
    url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'espacio',
    titulo: 'Planeta Azul y Estrellas',
    categoria: 'Espacio Exterior',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'ciudad_rascacielos',
    titulo: 'Ciudad Nocturna con Rascacielos',
    categoria: 'Metrópolis',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'luces_ciudad',
    titulo: 'Luces Bokeh de Tráfico y Ciudad',
    categoria: 'Urbano Nocturno',
    url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'montana',
    titulo: 'Montaña',
    categoria: 'Naturaleza',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'cielo_gris',
    titulo: 'Cielo Gris y Árboles',
    categoria: 'Naturaleza',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
  },
];

// ========================================================
// 2. AVATARES: CINEREWIND EXCLUSIVOS, POKÉMON, SUPERHÉROES Y ROBOTS
// ========================================================
export const CATEGORIAS_AVATARES = [
  {
    id: 'cinerewind',
    titulo: '🎬 CineRewind (Exclusivos)',
    tipo: 'fijo',
    avatares: [
      { id: 'cine_panda', nombre: 'Panda con Pochoclos', url: '/avatares/Avatar_1.png' },
      { id: 'cine_perro3d', nombre: 'Perro Cinéfilo 3D', url: '/avatares/Avatar_2.png' },
      { id: 'cine_zorro', nombre: 'Zorro Director', url: '/avatares/Avatar_3.png' },
      { id: 'cine_gato', nombre: 'Gato Acomodador', url: '/avatares/Avatar_4.png' },
      { id: 'cine_mapache', nombre: 'Mapache Maratón', url: '/avatares/Avatar_5.png' },
      { id: 'cine_oso', nombre: 'Oso con Snacks', url: '/avatares/Avatar_6.png' },
      { id: 'cine_ardilla', nombre: 'Ardilla Directora', url: '/avatares/Avatar_7.png' },
      { id: 'cine_celuloide', nombre: 'Cachorro en Celuloide', url: '/avatares/Avatar_8.png' },
      { id: 'cine_lobo', nombre: 'Lobo Espacial Jedi', url: '/avatares/Avatar_9.png' },
      { id: 'cine_buho', nombre: 'Búho Reseñador', url: '/avatares/Avatar_10.png' },
      { id: 'cine_cocodrilo', nombre: 'Cocodrilo Espectador', url: '/avatares/Avatar_11.png' },
      { id: 'cine_leon', nombre: 'León con Óscar', url: '/avatares/Avatar_12.png' },
    ],
  },
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
    ],
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
    ],
  },
  {
    id: 'robots',
    titulo: '🤖 Robots Retro',
    tipo: 'dinamico',
    semillas: [
      ['Gizmo', 'Buster', 'Pepper', 'Bandit'],
      ['Sparky', 'Bolt', 'Chip', 'Rusty'],
      ['Felix', 'Aneka', 'GoldMech', 'Shadow'],
    ],
  },
];

export default function ModalEditarPerfil({ usuario, subpestanaInicial = 'info', onClose, onGuardar }) {
  const [seccionModal, setSeccionModal] = useState(subpestanaInicial); // 'info' | 'portada' | 'avatares' | 'seguridad'

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [username, setUsername] = useState(usuario?.username || '');
  const [biografia, setBiografia] = useState(usuario?.biografia || '');

  const [avatarSeleccionado, setAvatarSeleccionado] = useState(
    usuario?.avatar_url || '/avatares/Avatar_1.png'
  );

  const [bannerSeleccionado, setBannerSeleccionado] = useState(
    usuario?.banner_url || PORTADAS_PREDETERMINADAS[0].url
  );

  const [privacidadPerfil, setPrivacidadPerfil] = useState(
    usuario?.privacidad_perfil || 'publico'
  );
  const [privacidadResenias, setPrivacidadResenias] = useState(
    usuario?.privacidad_resenias || 'publico'
  );

  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Categorías de Avatares
  const [categoriaAvatarActiva, setCategoriaAvatarActiva] = useState('cinerewind');
  const [paginaAvatar, setPaginaAvatar] = useState(0);
  const [urlPersonalizadaAvatar, setUrlPersonalizadaAvatar] = useState('');
  const [urlPersonalizadaBanner, setUrlPersonalizadaBanner] = useState('');

  // Validación de Username
  const [usernameDisponible, setUsernameDisponible] = useState(true);
  const [verificandoUsername, setVerificandoUsername] = useState(false);

  const catActual =
    CATEGORIAS_AVATARES.find((c) => c.id === categoriaAvatarActiva) || CATEGORIAS_AVATARES[0];

  let avataresAMostrar = [];
  let totalPaginasAvatar = 1;

  if (catActual.tipo === 'dinamico') {
    totalPaginasAvatar = catActual.semillas.length;
    const paginaActual = paginaAvatar % catActual.semillas.length;
    avataresAMostrar = catActual.semillas[paginaActual].map((seed, idx) => ({
      id: `bot-${paginaActual}-${idx}`,
      nombre: `Robot ${seed}`,
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=1c1c24`,
    }));
  } else {
    totalPaginasAvatar = Math.ceil(catActual.avatares.length / 4);
    const inicio = (paginaAvatar % totalPaginasAvatar) * 4;
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

  const handleRotarAvatares = () => {
    setPaginaAvatar((prev) => (prev + 1) % totalPaginasAvatar);
  };

  const handleCambiarCategoriaAvatar = (id) => {
    setCategoriaAvatarActiva(id);
    setPaginaAvatar(0);
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
        privacidad_perfil: privacidadPerfil,
        privacidad_resenias: privacidadResenias,
      });
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  // Contraseña
  const [modoPass, setModoPass] = useState(usuario?.tiene_password === false ? 'asignar' : 'cambiar');
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

  const handleAsignarPassword = async (e) => {
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
      const res = await asignarPasswordAPI({
        passwordNueva: passNueva,
      });
      setMensajePass(res.mensaje || '✓ Contraseña asignada correctamente a tu cuenta.');
      setPassNueva('');
      setPassRepetir('');
    } catch (err) {
      setErrorPass(err.message || 'Error al asignar contraseña');
    } finally {
      setGuardandoPass(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none">
      <div className="bg-[#141419] border border-white/10 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-5 text-white max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 shadow-sm">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-black text-rose-500 block">
                CineRewind · Ajustes
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                Editar Perfil
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* VISTA PREVIA EN VIVO DE CABECERA (ESTILO TWITTER / DISCORD) */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-neutral-950 flex-shrink-0">
          {/* Banner */}
          <div className="w-full h-24 sm:h-28 relative overflow-hidden bg-neutral-900">
            <img
              src={bannerSeleccionado}
              alt="Portada de perfil"
              className="w-full h-full object-cover transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <span className="absolute top-2 right-2 text-[10px] font-mono bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-neutral-300 font-bold border border-white/10">
              Vista previa
            </span>
          </div>

          {/* Avatar sobrepuesto + Datos en vivo */}
          <div className="p-3 sm:p-3.5 pt-0 flex items-end gap-3 -mt-7 sm:-mt-8 relative z-10">
            <div className="w-15 h-15 sm:w-17 sm:h-17 rounded-2xl bg-[#141419] border-2 border-rose-500 overflow-hidden shadow-2xl shrink-0 p-1 flex items-center justify-center">
              <img
                src={avatarSeleccionado}
                alt="Avatar"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <h3 className="text-sm sm:text-base font-black truncate drop-shadow">
                {nombre || 'Tu Nombre'}
              </h3>
              <p className="text-xs text-rose-400 font-mono truncate font-bold">
                @{username || 'usuario'}
              </p>
            </div>
          </div>
        </div>

        {/* Pestañas Segmentadas Tipo Píldora (Modern UI) */}
        <div className="bg-black/40 p-1 rounded-2xl flex gap-1 border border-white/5 flex-shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSeccionModal('info')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              seccionModal === 'info'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Datos & Bio</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionModal('avatares')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              seccionModal === 'avatares'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Avatares</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionModal('portada')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              seccionModal === 'portada'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Portada</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionModal('seguridad')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              seccionModal === 'seguridad'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Seguridad</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionModal('privacidad')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              seccionModal === 'privacidad'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacidad</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Contenedor scrolleable del formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">

          {/* 1. SECCIÓN: DATOS BÁSICOS & BIO */}
          {seccionModal === 'info' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Nombre
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">{nombre.length}/20</span>
                  </div>
                  <input
                    type="text"
                    maxLength={20}
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre cinéfilo..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-neutral-900 border border-white/10 text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-bold transition"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Usuario (@)
                    </label>
                    {username.length >= 3 && username !== usuario?.username && (
                      <span className={`text-[11px] font-black tracking-tight ${
                        verificandoUsername ? 'text-neutral-400' : usernameDisponible ? 'text-emerald-400' : 'text-rose-400'
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
                    placeholder="ej: augusto_cine"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-neutral-900 border border-white/10 text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-bold transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Biografía Cinéfila
                  </label>
                  <span className="text-[10px] text-neutral-500 font-mono">{biografia.length}/160</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={160}
                  placeholder="Comparte tus directores, géneros favoritos y qué te apasiona del cine..."
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-neutral-900 border border-white/10 text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none transition leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* 2. SECCIÓN: AVATARES DE PERFIL (POKÉMON, SUPERHÉROES, ROBOTS) */}
          {seccionModal === 'avatares' && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Selector de Colección y Botón Rotar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-neutral-900/60 p-2.5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {CATEGORIAS_AVATARES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCambiarCategoriaAvatar(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                        categoriaAvatarActiva === cat.id
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat.titulo}
                    </button>
                  ))}
                </div>

                {totalPaginasAvatar > 1 && (
                  <button
                    type="button"
                    onClick={handleRotarAvatares}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 shadow-xs"
                    title="Ver más personajes de esta categoría"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Rotar ({(paginaAvatar % totalPaginasAvatar) + 1}/{totalPaginasAvatar})</span>
                  </button>
                )}
              </div>

              {/* Grilla de 4 personajes rotativos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                {avataresAMostrar.map((item) => {
                  const esSeleccionado = avatarSeleccionado === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSeleccionarAvatar(item.url)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center gap-2 bg-neutral-900/80 relative group ${
                        esSeleccionado
                          ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30 scale-105 shadow-md'
                          : 'border-white/10 hover:border-white/30 hover:scale-102'
                      }`}
                      title={item.nombre}
                    >
                      <div className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center overflow-hidden rounded-xl bg-neutral-950 p-1">
                        <img
                          src={item.url}
                          alt={item.nombre}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-neutral-200 truncate w-full text-center">
                        {item.nombre}
                      </span>
                      {esSeleccionado && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Opción de foto personalizada con URL libre */}
              <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                  <Link className="w-3 h-3 text-rose-500" />
                  <span>O pega el enlace de tu propia foto favorita:</span>
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/tu-foto.jpg (o enlace de Imgur / Pinterest / Discord)"
                  value={urlPersonalizadaAvatar}
                  onChange={(e) => {
                    const l = e.target.value;
                    setUrlPersonalizadaAvatar(l);
                    if (l.trim().startsWith('http')) {
                      setAvatarSeleccionado(l.trim());
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition font-mono"
                />
              </div>
            </div>
          )}

          {/* 3. SECCIÓN: PORTADAS PANORÁMICAS CON NOMBRES SINCEROS */}
          {seccionModal === 'portada' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Fotogramas Panorámicos
                </label>
                <span className="text-[10px] font-mono text-neutral-500">
                  {PORTADAS_PREDETERMINADAS.length} fotos disponibles
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {PORTADAS_PREDETERMINADAS.map((item) => {
                  const esSeleccionado = bannerSeleccionado === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setBannerSeleccionado(item.url);
                        setUrlPersonalizadaBanner('');
                      }}
                      className={`p-2 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                        esSeleccionado
                          ? 'bg-rose-500/10 border-rose-500 text-white shadow-md ring-1 ring-rose-500'
                          : 'bg-neutral-900/60 border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-neutral-950 relative">
                        <img
                          src={item.url}
                          alt={item.titulo}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {esSeleccionado && (
                          <div className="absolute inset-0 bg-rose-600/30 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-rose-400 block font-bold leading-tight">
                          {item.categoria}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate leading-tight mt-0.5">
                          {item.titulo}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                  <Link className="w-3 h-3 text-rose-500" />
                  <span>O pega el enlace de tu portada personalizada:</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... o enlace de tu fotograma preferido"
                  value={urlPersonalizadaBanner}
                  onChange={(e) => {
                    const l = e.target.value;
                    setUrlPersonalizadaBanner(l);
                    if (l.trim().startsWith('http')) {
                      setBannerSeleccionado(l.trim());
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition font-mono"
                />
              </div>
            </div>
          )}

          {/* 4. SECCIÓN: SEGURIDAD & CONTRASEÑA */}
          {seccionModal === 'seguridad' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Selector de modo de contraseña */}
              <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setModoPass('cambiar');
                    setErrorPass(null);
                    setMensajePass(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer text-center ${
                    modoPass === 'cambiar'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Cambiar Contraseña
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoPass('asignar');
                    setErrorPass(null);
                    setMensajePass(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    modoPass === 'asignar'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Asignar Contraseña (Google)</span>
                </button>
              </div>

              {errorPass && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                  ⚠️ {errorPass}
                </div>
              )}

              {mensajePass && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{mensajePass}</span>
                </div>
              )}

              {modoPass === 'asignar' ? (
                /* MODO ASIGNAR (GOOGLE O SIN CLAVE) */
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed">
                    <p className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                      <span>🔑</span> ¿Iniciaste sesión con Google?
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      Asignale una contraseña a tu cuenta para poder ingresar también con tu usuario (<strong>@{usuario?.username}</strong>) o tu correo electrónico sin depender exclusivamente de Google. Puede ser diferente a tu clave de Google.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-400">
                        Nueva Contraseña (mínimo 6)
                      </label>
                      <input
                        type="password"
                        value={passNueva}
                        onChange={(e) => setPassNueva(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-white/10 text-white outline-none focus:border-rose-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-400">
                        Repetir Contraseña
                      </label>
                      <input
                        type="password"
                        value={passRepetir}
                        onChange={(e) => setPassRepetir(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-white/10 text-white outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={guardandoPass || !passNueva || !passRepetir}
                      onClick={handleAsignarPassword}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer disabled:opacity-40 shadow-md active:scale-95"
                    >
                      {guardandoPass ? 'Asignando...' : 'Asignar Contraseña a mi Cuenta'}
                    </button>
                  </div>
                </div>
              ) : (
                /* MODO MODIFICAR CLAVE ACTUAL */
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-neutral-400">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      value={passActual}
                      onChange={(e) => setPassActual(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-white/10 text-white outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-400">
                        Nueva Contraseña (mínimo 6)
                      </label>
                      <input
                        type="password"
                        value={passNueva}
                        onChange={(e) => setPassNueva(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-white/10 text-white outline-none focus:border-rose-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-400">
                        Repetir Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={passRepetir}
                        onChange={(e) => setPassRepetir(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-white/10 text-white outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={guardandoPass || !passActual || !passNueva || !passRepetir}
                      onClick={handleCambiarPassword}
                      className="px-4 py-2.5 bg-neutral-800 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition cursor-pointer disabled:opacity-40 shadow-sm active:scale-95"
                    >
                      {guardandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. SECCIÓN: PRIVACIDAD */}
          {seccionModal === 'privacidad' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Opción 1: Visibilidad del Perfil General */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Visibilidad de tu Perfil</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Define quién puede explorar tu perfil, tus estadísticas, tus favoritos y lo que estás mirando.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPrivacidadPerfil('publico')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                      privacidadPerfil === 'publico'
                        ? 'bg-rose-600/15 border-rose-500 text-white ring-1 ring-rose-500/50'
                        : 'bg-black/30 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">🌐</span>
                      {privacidadPerfil === 'publico' && <Check className="w-4 h-4 text-rose-500 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-black">Público</p>
                      <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                        Cualquier persona con tu link puede ver tu perfil, favoritos y series que miras.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacidadPerfil('amigos')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                      privacidadPerfil === 'amigos'
                        ? 'bg-rose-600/15 border-rose-500 text-white ring-1 ring-rose-500/50'
                        : 'bg-black/30 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">🔒</span>
                      {privacidadPerfil === 'amigos' && <Check className="w-4 h-4 text-rose-500 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-black">Solo Amigos (Privado)</p>
                      <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                        Los no-amigos verán un candado de perfil privado y deberán solicitar tu amistad.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Opción 2: Visibilidad de Reseñas y Opiniones */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Visibilidad de tus Reseñas y Opiniones</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    ¿Quién tiene permiso para leer los veredictos y notas escritas que dejas en tus obras?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPrivacidadResenias('publico')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                      privacidadResenias === 'publico'
                        ? 'bg-rose-600/15 border-rose-500 text-white ring-1 ring-rose-500/50'
                        : 'bg-black/30 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">💬</span>
                      {privacidadResenias === 'publico' && <Check className="w-4 h-4 text-rose-500 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-black">Reseñas Públicas</p>
                      <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                        Cualquier cinéfilo puede leer tus críticas y opiniones de películas y series.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacidadResenias('amigos')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                      privacidadResenias === 'amigos'
                        ? 'bg-rose-600/15 border-rose-500 text-white ring-1 ring-rose-500/50'
                        : 'bg-black/30 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">👥</span>
                      {privacidadResenias === 'amigos' && <Check className="w-4 h-4 text-rose-500 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-black">Solo Mis Amigos</p>
                      <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                        Tus opiniones solo las podrán leer tus amigos; a otros les saldrá aviso de privacidad.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Botones de acción inferiores */}
          <div className="flex gap-2.5 pt-3 border-t border-white/10 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-neutral-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !usernameDisponible || verificandoUsername}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-black text-white shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}