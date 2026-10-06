/**
 * Módulo de utilidades de seguridad para CineRewind
 */

// Dominios permitidos para el proxy de imágenes (Protección Anti-SSRF)
const DOMINIOS_PERMITIDOS_PROXY = [
  'image.tmdb.org',
  'images.unsplash.com',
  'raw.githubusercontent.com',
  'api.dicebear.com',
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
  'm.media-amazon.com',
  'img.youtube.com'
];

/**
 * Valida si una URL es segura para ser consumida por el proxy del servidor.
 * Previene ataques SSRF (Server-Side Request Forgery).
 * @param {string} urlString
 * @returns {boolean}
 */
const esUrlImagenPermitida = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return false;

  try {
    const parsed = new URL(urlString.trim());

    // 1. Solo protocolos HTTP y HTTPS seguros
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // 2. Bloquear accesos a localhost, loopback, o direcciones IP privadas
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.') ||
      host.startsWith('169.254.')
    ) {
      return false;
    }

    // 3. Verificar contra la lista blanca de dominios multimedia confiables
    const coincide = DOMINIOS_PERMITIDOS_PROXY.some(
      (dom) => host === dom || host.endsWith(`.${dom}`)
    );

    return coincide;
  } catch {
    return false;
  }
};

module.exports = {
  DOMINIOS_PERMITIDOS_PROXY,
  esUrlImagenPermitida
};
