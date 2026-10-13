/** Render the actual Brote mascot and brand typography into shareable PNGs. */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import Plant, { LeafLogo } from '../src/components/Plant';

const variants = {
  es: { lines: ['El dinero', 'se aprende.', 'En equipo.'], sub: 'Practica. Juega. Crece.', tag: 'JUEGA Y CRECE', wallet: 'WALLET DE PRÁCTICA', balance: 'Saldo ficticio', goal: 'Mi primera meta', footer: 'Una aventura compartida en Solana' },
  en: { lines: ['Learn about', 'money.', 'Together.'], sub: 'Learn. Play. Grow.', tag: 'PLAY & GROW', wallet: 'PRACTICE WALLET', balance: 'Pretend balance', goal: 'My first goal', footer: 'A shared adventure on Solana' },
  pt: { lines: ['Aprenda sobre', 'dinheiro.', 'Em equipe.'], sub: 'Pratique. Jogue. Cresça.', tag: 'JOGUE E CRESÇA', wallet: 'CARTEIRA DE PRÁTICA', balance: 'Saldo fictício', goal: 'Minha primeira meta', footer: 'Uma aventura compartilhada na Solana' },
};
const fontDir = resolve('docs/og/fonts');
const levels = { es: '+1 NIVEL', en: '+1 LEVEL UP', pt: '+1 NÍVEL' };
await mkdir('public/og', { recursive: true });
await mkdir('docs/og', { recursive: true });
for (const [language, copy] of Object.entries(variants)) {
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
      <defs>
        <linearGradient id="platform" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#396af4" /><stop offset="1" stopColor="#6c4bff" /></linearGradient>
        <filter id="soft" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#22264a" floodOpacity=".12" /></filter>
      </defs>
      <rect width="1200" height="630" fill="#f5f6ff" />
      <circle cx="1050" cy="120" r="260" fill="#edf0ff" />
      <circle cx="897" cy="323" r="256" stroke="#e1e4f7" strokeWidth="2" />
      <circle cx="897" cy="323" r="222" stroke="#e1e4f7" strokeWidth="2" />
      <g transform="translate(64 50)">
        <rect width="62" height="62" rx="19" fill="#6c4bff" />
        <g transform="translate(11 9)" color="#d7ff5c"><LeafLogo size={40} /></g>
        <text x="78" y="49" fontFamily="Outfit" fontWeight="800" fontSize="57" letterSpacing="-2" fill="#22264a">brote<tspan fill="#6c4bff">.</tspan></text>
      </g>
      {copy.lines.map((line, index) => <text key={line} x="64" y={219 + index * 83} fontFamily="Outfit" fontWeight="800" fontSize={language === 'pt' ? 70 : 78} letterSpacing="-2.6" fill={index === 2 ? '#6c4bff' : '#22264a'}>{line}</text>)}
      <text x="67" y="449" fontFamily="Nunito Sans" fontWeight="700" fontSize="27" fill="#626881">{copy.sub}</text>
      <g transform="translate(745 106) rotate(-6 176 196)">
        <rect width="352" height="394" rx="58" fill="url(#platform)" />
        <rect x="163" y="28" width="164" height="35" rx="17.5" fill="#d7ff5c" />
        <text x="245" y="51" textAnchor="middle" fontFamily="Outfit" fontWeight="800" fontSize="13" letterSpacing=".7" fill="#22264a">{copy.tag}</text>
        <svg x="-17" y="77" width="386" height="257" viewBox="0 0 360 240"><Plant /></svg>
        <text x="176" y="357" textAnchor="middle" fontFamily="Outfit" fontWeight="800" fontSize="22" fill="#fff">{levels[language as keyof typeof levels]}</text>
      </g>
      <g transform="translate(648 96) rotate(-9 112 80)" filter="url(#soft)">
        <rect width="224" height="166" rx="24" fill="#fff" />
        <rect x="18" y="17" width="33" height="29" rx="9" fill="#eee9ff" />
        <path d="M27 25h15v13H27zm0 0v-3h12v3m-5 6h8" stroke="#6c4bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="21" y="70" fontFamily="Nunito Sans" fontWeight="700" fontSize="11" letterSpacing=".6" fill="#626881">{copy.wallet}</text>
        <text x="20" y="108" fontFamily="Outfit" fontWeight="800" fontSize="35" fill="#22264a">240<tspan fontSize="18"> Brotes</tspan></text>
        <text x="21" y="137" fontFamily="Nunito Sans" fontWeight="700" fontSize="13" fill="#626881">{copy.balance}</text>
      </g>
      <g transform="translate(842 495) rotate(5 126 40)" filter="url(#soft)">
        <rect width="274" height="88" rx="22" fill="#d7ff5c" />
        <circle cx="34" cy="35" r="12" stroke="#22264a" strokeWidth="2.3" />
        <circle cx="34" cy="35" r="6" stroke="#22264a" strokeWidth="2.3" />
        <path d="m33 36 12-13" stroke="#22264a" strokeWidth="2.3" strokeLinecap="round" />
        <text x="56" y="41" fontFamily="Outfit" fontWeight="800" fontSize="20" fill="#22264a">{copy.goal}</text>
        <rect x="23" y="60" width="229" height="7" rx="3.5" fill="#bddb5e" />
        <rect x="23" y="60" width="91" height="7" rx="3.5" fill="#6c4bff" />
      </g>
      <g stroke="#6c4bff" strokeWidth="3" strokeLinecap="round" transform="translate(1125 77)"><path d="M0-15V15m-15-15h30m-25-10 20 20m0-20-20 20" /></g>
      <path d="m671 385 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z" fill="#ff926b" />
      <circle cx="713" cy="462" r="6" fill="#6c4bff" />
      <rect x="64" y="546" width="34" height="4" rx="2" fill="#6c4bff" />
      <text x="111" y="555" fontFamily="Nunito Sans" fontWeight="700" fontSize="18" fill="#626881">{copy.footer}</text>
    </svg>,
  );
  await writeFile(`docs/og/brote-${language}.svg`, svg);
  const png = new Resvg(svg, { font: { fontFiles: [resolve(fontDir, 'Outfit-ExtraBold.ttf'), resolve(fontDir, 'NunitoSans-Bold.ttf')], loadSystemFonts: false }, fitTo: { mode: 'original' } }).render().asPng();
  await writeFile(`public/og/brote-${language}.png`, png);
  console.log(`public/og/brote-${language}.png (${png.length} bytes, 1200×630)`);
}
