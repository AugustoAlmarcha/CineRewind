import React from 'react';

export default function LogoPlataforma({ nombre, className = "h-5 w-5 object-contain rounded" }) {
  const normalizado = (nombre || '').toLowerCase().trim();

  if (normalizado.includes('disney')) {
    return (
      <img 
        src="/logos-plataformas/disney.png" 
        alt="Disney+" 
        className={className} 
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  if (normalizado.includes('netflix')) {
    return (
      <img 
        src="/logos-plataformas/netflix.png" 
        alt="Netflix" 
        className={className} 
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  if (normalizado.includes('max') || normalizado.includes('hbo')) {
    return (
      <img 
        src="/logos-plataformas/max.png" 
        alt="Max" 
        className={className} 
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  if (normalizado.includes('prime') || normalizado.includes('amazon')) {
    return (
      <img 
        src="/logos-plataformas/prime.png" 
        alt="Prime Video" 
        className={className} 
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  if (normalizado.includes('apple')) {
    return (
      <img 
        src="/logos-plataformas/appletv.png" 
        alt="Apple TV" 
        className={className} 
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  if (normalizado.includes('paramount')) {
    return (
      <img 
        src="/logos-plataformas/paramount.png" 
        alt="Paramount+" 
        className={className} 
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  if (normalizado.includes('cine')) {
    return (
      <img 
        src="/logos-plataformas/popcorn.png" 
        alt="Cine" 
        className={className} 
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  if (normalizado.includes('stremio')) {
    return (
      <img 
        src="/logos-plataformas/stremio.png" 
        alt="Stremio" 
        className={className} 
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  // Para 'otro', 'tv', 'tele' o cualquier otra pantalla: tele 3D moderna
  return (
    <img 
      src="/logos-plataformas/tv.png" 
      alt={nombre || 'Otro'} 
      className={className} 
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}