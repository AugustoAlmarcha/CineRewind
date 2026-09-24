import React from 'react';

export default function LogoPlataforma({ nombre }) {
  const normalizado = (nombre || '').toLowerCase();

  if (normalizado.includes('netflix')) {
    return <span className="bg-[#E50914] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tighter">NETFLIX</span>;
  }
  if (normalizado.includes('max') || normalizado.includes('hbo')) {
    return <span className="bg-[#002BE7] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-wider">MAX</span>;
  }
  if (normalizado.includes('disney')) {
    return <span className="bg-[#113CCF] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tight">Disney+</span>;
  }
  if (normalizado.includes('prime') || normalizado.includes('amazon')) {
    return <span className="bg-[#00A8E1] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tight">prime</span>;
  }
  if (normalizado.includes('apple')) {
    return <span className="bg-neutral-900 text-white font-bold text-[10px] px-2 py-0.5 rounded border border-white/20 shadow">tv+</span>;
  }
  if (normalizado.includes('cine')) {
    return <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-wider">CINE</span>;
  }
  return (
    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
      {nombre || 'Streaming'}
    </span>
  );
}