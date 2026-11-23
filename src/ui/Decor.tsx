/**
 * K13 Halloween v2 (Kiro). Decoration only.
 *
 * Every element here is inline SVG or plain markup, hidden from assistive technology,
 * unfocusable, and ignored by the pointer. None of it carries meaning: the word labels,
 * glyphs and verdicts elsewhere in the app say everything. No ids are used inside the
 * SVGs, so the same component can be mounted more than once without duplicate ids.
 * Motion is defined in src/styles.css and is always finite.
 */

const SVG_HIDDEN = { 'aria-hidden': true, focusable: 'false' } as const;

const BAT_PATH =
  'M32 10 C30 6 28 6 27 3 L26 9 C22 6 14 4 2 8 C8 10 10 14 9 20 C13 16 17 16 20 20 ' +
  'C22 17 26 17 28 20 L32 26 L36 20 C38 17 42 17 44 20 C47 16 51 16 55 20 ' +
  'C54 14 56 10 62 8 C50 4 42 6 38 9 L37 3 C36 6 34 6 32 10 Z';

function Bat({ n }: { n: number }) {
  return (
    <svg className={`haunt-bat haunt-bat-${n}`} viewBox="0 0 64 32" {...SVG_HIDDEN}>
      <path d={BAT_PATH} fill="#0c0612" stroke="#b79ad6" strokeOpacity="0.6" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

const TOMBSTONE_FILL = '#07040a';

export function Decor() {
  return (
    <div className="haunt-decor" aria-hidden="true">
      <svg className="haunt-moon" viewBox="0 0 240 240" {...SVG_HIDDEN}>
        <circle cx="120" cy="120" r="118" fill="#fff3c8" fillOpacity="0.06" />
        <circle cx="120" cy="120" r="100" fill="#fff3c8" fillOpacity="0.1" />
        <circle cx="120" cy="120" r="80" fill="#f4ecd0" />
        <circle cx="98" cy="98" r="14" fill="#cfc39a" fillOpacity="0.5" />
        <circle cx="140" cy="142" r="18" fill="#cfc39a" fillOpacity="0.45" />
        <circle cx="152" cy="92" r="9" fill="#cfc39a" fillOpacity="0.5" />
        <circle cx="94" cy="148" r="8" fill="#cfc39a" fillOpacity="0.45" />
        <circle cx="122" cy="114" r="5" fill="#cfc39a" fillOpacity="0.4" />
      </svg>

      <div className="haunt-bats">
        <Bat n={1} />
        <Bat n={2} />
        <Bat n={3} />
        <Bat n={4} />
      </div>

      <svg
        className="haunt-graves"
        viewBox="0 0 1200 160"
        preserveAspectRatio="xMidYMax slice"
        {...SVG_HIDDEN}
      >
        <path d="M0 160 V138 Q150 126 300 136 T600 133 T900 138 T1200 130 V160 Z" fill={TOMBSTONE_FILL} />
        {/* Tombstones */}
        <path d="M60 142 V106 a18 18 0 0 1 36 0 V142 Z" fill={TOMBSTONE_FILL} />
        <path d="M130 140 V112 a14 14 0 0 1 28 0 V140 Z" fill={TOMBSTONE_FILL} />
        <path d="M340 138 V100 a20 20 0 0 1 40 0 V138 Z" fill={TOMBSTONE_FILL} />
        <path d="M420 138 V118 a12 12 0 0 1 24 0 V138 Z" fill={TOMBSTONE_FILL} />
        <path d="M530 136 V104 a16 16 0 0 1 32 0 V136 Z" fill={TOMBSTONE_FILL} />
        <path d="M600 134 V96 h10 V84 h12 v12 h10 v12 h-10 V134 Z" fill={TOMBSTONE_FILL} />
        <path d="M690 136 V108 a15 15 0 0 1 30 0 V136 Z" fill={TOMBSTONE_FILL} />
        <path d="M780 138 V100 a19 19 0 0 1 38 0 V138 Z" fill={TOMBSTONE_FILL} />
        <path d="M1060 136 V106 a17 17 0 0 1 34 0 V136 Z" fill={TOMBSTONE_FILL} />
        <path d="M1130 134 V110 a13 13 0 0 1 26 0 V134 Z" fill={TOMBSTONE_FILL} />
        {/* Bare trees */}
        <g fill="none" stroke={TOMBSTONE_FILL} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M250 138 L250 70 M250 100 L226 78 M250 88 L276 62 M250 112 L274 96 M226 78 L214 60 M276 62 L290 50 M276 62 L264 46" />
          <path d="M480 136 L482 78 M482 104 L462 86 M482 92 L504 70 M462 86 L452 70 M504 70 L516 58" />
          <path d="M900 136 L900 64 M900 96 L874 74 M900 84 L928 56 M900 110 L926 94 M874 74 L862 54 M928 56 L944 46 M928 56 L918 40" />
          <path d="M980 136 L978 90 M978 112 L958 98 M978 102 L998 84" />
        </g>
      </svg>

      <div className="haunt-fog">
        <span className="haunt-fog-band haunt-fog-band-1" />
        <span className="haunt-fog-band haunt-fog-band-2" />
      </div>
    </div>
  );
}

/** A friendly cartoon ghost. Decorative only. */
export function GhostMascot() {
  return (
    <svg className="haunt-ghost" viewBox="0 0 80 96" aria-hidden="true" focusable="false">
      <path
        d="M10 90 V40 C10 18 24 6 40 6 C56 6 70 18 70 40 V90 L60 80 L50 90 L40 80 L30 90 L20 80 Z"
        fill="#f6f2ff"
        stroke="#5a3d66"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="30" cy="38" rx="5" ry="7" fill="#2a1436" />
      <ellipse cx="50" cy="38" rx="5" ry="7" fill="#2a1436" />
      <circle cx="22" cy="50" r="4" fill="#f4a6c0" fillOpacity="0.6" />
      <circle cx="58" cy="50" r="4" fill="#f4a6c0" fillOpacity="0.6" />
      <ellipse cx="40" cy="56" rx="5" ry="6" fill="#2a1436" />
    </svg>
  );
}

/** A jack-o-lantern with a warm inner glow. Decorative only. */
export function Pumpkin() {
  return (
    <svg className="haunt-pumpkin" viewBox="0 0 80 72" aria-hidden="true" focusable="false">
      <path d="M38 16 C38 8 40 6 46 4 L48 8 C44 10 44 12 44 16 Z" fill="#4f7a2a" stroke="#2f4a18" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="40" cy="42" rx="36" ry="27" fill="#e8731f" stroke="#7a3508" strokeWidth="2" />
      <ellipse cx="22" cy="42" rx="14" ry="26" fill="#f08a2c" fillOpacity="0.8" />
      <ellipse cx="58" cy="42" rx="14" ry="26" fill="#f08a2c" fillOpacity="0.8" />
      <ellipse cx="40" cy="42" rx="12" ry="27" fill="#e8731f" fillOpacity="0.9" />
      <ellipse cx="40" cy="44" rx="26" ry="19" fill="#ffd25a" fillOpacity="0.3" />
      <polygon points="21,32 34,32 27,45" fill="#ffe08a" />
      <polygon points="46,32 59,32 53,45" fill="#ffe08a" />
      <polygon points="40,44 35,52 45,52" fill="#ffe08a" />
      <path d="M22 54 Q40 70 58 54 L52 54 L48 59 L44 54 L36 54 L32 59 L28 54 Z" fill="#ffe08a" />
    </svg>
  );
}
