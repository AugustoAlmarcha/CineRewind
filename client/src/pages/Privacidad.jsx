import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Database, EyeOff, FileText, Film } from 'lucide-react';

export default function Privacidad() {
  const navigate = useNavigate();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 animate-fadeIn text-neutral-900 dark:text-white">
      
      {/* Botón Volver */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-rose-600 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

      {/* Cabecera */}
      <div className="space-y-3 border-b border-neutral-200 dark:border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/10 text-rose-600 dark:text-rose-400 font-mono text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>TRANSPARENCIA Y PRIVACIDAD</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Política de Privacidad y Términos
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
          Última actualización: Octubre de 2026 · CineRewind
        </p>
      </div>

      {/* Secciones en Tarjetas */}
      <div className="grid gap-6">

        {/* 1. Datos que recopilamos */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#141419] border border-neutral-300 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/10 flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">
              Información que recopilamos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Para que CineRewind funcione como tu diario personal de cine y series, recopilamos únicamente los datos necesarios:
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 pl-2">
            <li><strong>Cuenta de usuario:</strong> Nombre, nombre de usuario y correo electrónico al registrarte con contraseña o mediante Google OAuth.</li>
            <li><strong>Tu actividad cinéfila:</strong> Películas y episodios que marcas como vistos, calificaciones (1 a 5 estrellas), reseñas personales, fechas y plataformas seleccionadas.</li>
            <li><strong>Interacciones sociales:</strong> Solicitudes de amistad aceptadas y nombres de acompañantes registrados para co-visualizaciones.</li>
          </ul>
        </section>

        {/* 2. Uso y no venta de datos */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#141419] border border-neutral-300 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">
              Cero venta o cesión de datos a terceros
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <strong>Nunca vendemos, alquilamos ni comercializamos tu información personal ni tus hábitos de consumo con anunciantes, empresas de big data ni terceros.</strong> Tus registros existen exclusivamente para brindarte tus estadísticas, tu diario y tu experiencia CineRewind Wrapped.
          </p>
        </section>

        {/* 3. Atribución a TMDb */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#141419] border border-neutral-300 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/10 flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">
              Catálogo y Atribución a TMDb
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            CineRewind utiliza la API pública de <strong>The Movie Database (TMDb)</strong> para consultar pósters, títulos, sinopsis y fichas técnicas de actores y directores.
          </p>
          <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 text-xs text-neutral-500 font-mono">
            "Este producto utiliza la API de TMDb pero no está respaldado ni certificado por TMDb."
          </div>
        </section>

        {/* 4. Cookies y Almacenamiento local */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#141419] border border-neutral-300 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">
              Cookies y Almacenamiento Técnico
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            No utilizamos cookies de seguimiento publicitario (como píxeles de Facebook ni trackers invasivos). Utilizamos únicamente almacenamiento local (LocalStorage) en tu navegador para resguardar tu token de sesión seguro (JWT) y tu preferencia de tema visual (modo claro u oscuro).
          </p>
        </section>

        {/* 5. Control y eliminación de cuenta */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#141419] border border-neutral-300 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/10 flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">
              Control total de tu información
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Eres el único dueño de tu diario. Puedes editar o borrar tus reseñas y calificaciones en cualquier momento. Si deseas dar de baja tu cuenta y borrar la totalidad de tus datos de la base de datos de forma definitiva, puedes solicitarlo desde la configuración o a la administración de CineRewind.
          </p>
        </section>

      </div>

    </main>
  );
}
