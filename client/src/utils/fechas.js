export const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Retorna la fecha actual en formato local YYYY-MM-DD para inputs de tipo date
 */
export const obtenerFechaHoyLocal = () => {
  const d = new Date();
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

/**
 * Formatea una fecha ISO o string (YYYY-MM-DD) a DD/MM/YYYY sin desfasajes de zona horaria UTC
 */
export const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const partes = String(fechaStr).split('T')[0].split('-');
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }
  return new Date(fechaStr).toLocaleDateString();
};

/**
 * Descompone de forma segura una fecha en [anio, mesIndex, diaNumero]
 */
export const descomponerFecha = (fechaStr) => {
  if (!fechaStr) return { anio: null, mes: null, dia: null };
  const partes = String(fechaStr).split('T')[0].split('-');
  if (partes.length === 3) {
    return {
      anio: parseInt(partes[0], 10),
      mes: parseInt(partes[1], 10) - 1,
      dia: parseInt(partes[2], 10)
    };
  }
  const f = new Date(fechaStr);
  return {
    anio: f.getFullYear(),
    mes: f.getMonth(),
    dia: f.getDate()
  };
};