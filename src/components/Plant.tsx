export function LeafLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 35V19"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M19 24C6 24 4 12 6 7c11-1 17 7 13 17Z" fill="currentColor" />
      <path d="M21 18C19 7 29 3 35 5c2 10-5 16-14 13Z" fill="currentColor" />
      <path
        d="m10 11 7 8m9-9-3 5"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity=".45"
      />
    </svg>
  );
}
export default function Plant() {
  return (
    <svg
      className="hero-plant"
      viewBox="0 0 360 240"
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="plant-leaf" x1=".1" y1="0" x2=".85" y2="1">
          <stop stopColor="#c8ff69" />
          <stop offset=".55" stopColor="#6be985" />
          <stop offset="1" stopColor="#20bcae" />
        </linearGradient>
        <linearGradient id="plant-leaf-alt" x1=".1" y1="0" x2=".9" y2="1">
          <stop stopColor="#73ffe0" />
          <stop offset="1" stopColor="#28c9c0" />
        </linearGradient>
        <linearGradient id="plant-pot" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ff9c7e" />
          <stop offset=".48" stopColor="#ff6f75" />
          <stop offset="1" stopColor="#e84472" />
        </linearGradient>
        <linearGradient id="plant-rim" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffe477" />
          <stop offset="1" stopColor="#ffae55" />
        </linearGradient>
        <linearGradient id="plant-pack" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#38dce2" />
          <stop offset="1" stopColor="#438cff" />
        </linearGradient>
        <filter id="plant-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="4"
            floodColor="#251d56"
            floodOpacity=".3"
          />
        </filter>
      </defs>

      {/* A bright little loot-star and coin frame the sprout without crowding it. */}
      <ellipse
        cx="177"
        cy="218"
        rx="117"
        ry="13"
        fill="#211b54"
        opacity=".24"
      />
      <g transform="translate(72 77) rotate(-12)">
        <path
          d="m0-19 6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2Z"
          fill="#ffdf58"
          stroke="#3c2c74"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="m-2-11 3-5 2 5"
          stroke="#fff7b7"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(283 64) rotate(14)" filter="url(#plant-shadow)">
        <circle r="24" fill="#ffdc4d" stroke="#34265f" strokeWidth="4" />
        <circle r="17" fill="#ffb949" stroke="#fff09a" strokeWidth="2" />
        <path
          d="M-4-9q6-4 12 0l-4 6 3 12H-7l3-12Z"
          fill="#fff178"
          opacity=".9"
        />
        <path
          d="M-12-13q4-5 9-5"
          stroke="#fff9bc"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Leaves and stem */}
      <g
        stroke="#30245b"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M171 133q-59-5-68-59 54-17 77 41" fill="url(#plant-leaf)" />
        <path
          d="M177 119q-1-63 54-79 23 51-37 87"
          fill="url(#plant-leaf-alt)"
        />
        <path
          d="M173 128q-8-38-44-48m48 29q15-39 39-53"
          fill="none"
          stroke="#efffa1"
          strokeWidth="3"
        />
        <path d="M175 132V94" fill="none" stroke="#36c99c" strokeWidth="7" />
      </g>
      <path
        d="M119 75q13-6 22-4"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".55"
      />
      <path
        d="M206 61q8-7 15-8"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".58"
      />

      {/* Backpack peeking around the pot */}
      <g
        filter="url(#plant-shadow)"
        stroke="#30245b"
        strokeWidth="4"
        strokeLinejoin="round"
      >
        <path
          d="M247 138q2-13 16-14l20 7q12 5 9 19l-8 39-38-10Z"
          fill="url(#plant-pack)"
        />
        <path d="m249 151 37 10-4 17-37-10Z" fill="#86f5ef" />
        <path
          d="m260 141 12 4m-2 24 4 1"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M251 139q-7 7-6 16"
          fill="none"
          stroke="#b5fff3"
          strokeWidth="3"
        />
      </g>

      {/* Pot body doubles as the mascot's suit */}
      <g
        filter="url(#plant-shadow)"
        stroke="#30245b"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path
          d="m117 142 122 0-12 59q-5 18-48 18-43 0-49-18Z"
          fill="url(#plant-pot)"
        />
        <path
          d="m130 155-8 39q-2 8 4 13"
          fill="none"
          stroke="#ffb59a"
          strokeWidth="5"
        />
        <path
          d="M111 135q0-7 8-7h118q8 0 8 7v15q0 7-8 7H119q-8 0-8-7Z"
          fill="url(#plant-rim)"
        />
        <path d="M119 134h117" stroke="#fff2a4" strokeWidth="3" />
      </g>
      <g fill="#28214e">
        <ellipse cx="157" cy="174" rx="4" ry="5" />
        <ellipse cx="199" cy="174" rx="4" ry="5" />
      </g>
      <circle cx="158" cy="172" r="1.5" fill="#fff" />
      <circle cx="200" cy="172" r="1.5" fill="#fff" />
      <path
        d="M169 183q9 10 18 0"
        stroke="#30245b"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <ellipse cx="143" cy="184" rx="7" ry="4" fill="#ffb2a0" />
      <ellipse cx="213" cy="184" rx="7" ry="4" fill="#ffb2a0" />
      <path
        d="m177 162 3 5 6 .8-4.5 4.3 1 6-5.5-2.8-5.5 2.8 1-6-4.5-4.3 6-.8Z"
        fill="#fff078"
        stroke="#5b348c"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Sparkles */}
      <path
        d="m103 126 2 5 5 2-5 2-2 5-2-5-5-2 5-2Zm179 72 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5Z"
        fill="#c7ff72"
      />
      <circle cx="95" cy="160" r="3" fill="#72f6de" />
      <circle cx="269" cy="114" r="3" fill="#ff798c" />
    </svg>
  );
}
