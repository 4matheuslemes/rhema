"use client";

/**
 * RhemaMark — símbolo do Rhema sem fundo.
 *
 * As aspas usam `fill="currentColor"` para se adaptar automaticamente
 * ao modo claro/escuro: em light usa --ink (navy escuro), em dark usa --ink (quase branco).
 * O balão usa a cor fixa --verse-accent (bordô) em qualquer tema.
 */
export function RhemaMark({ size = 80 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-label="Rhema"
      role="img"
    >
      {/* Balão de fala — bordô fixo */}
      <path
        d="M256,120
           C334,120 386,164 386,228
           C386,292 334,336 256,336
           C238,336 221,334 206,329
           L162,362
           C156,366 148,362 149,355
           L154,310
           C138,292 126,262 126,228
           C126,164 178,120 256,120 Z"
        fill="var(--verse-accent)"
      />
      {/* Aspa esquerda — branca para contrastar com o balão bordô */}
      <path
        d="M208,206
           C208,192 218,182 231,182
           C231,198 224,208 214,210
           C220,212 224,217 224,224
           C224,233 217,240 208,240
           C199,240 192,233 192,224
           C192,216 197,209 208,206 Z"
        fill="white"
        fillOpacity="0.9"
      />
      {/* Aspa direita — branca para contrastar com o balão bordô */}
      <path
        d="M278,206
           C278,192 288,182 301,182
           C301,198 294,208 284,210
           C290,212 294,217 294,224
           C294,233 287,240 278,240
           C269,240 262,233 262,224
           C262,216 267,209 278,206 Z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}
