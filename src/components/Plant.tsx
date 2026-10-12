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
        d="M20 34V18"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path d="M20 22C7 24 5 12 6 7c12-1 16 7 14 15Z" fill="currentColor" />
      <path d="M21 16C20 7 29 3 35 5c1 9-6 14-14 11Z" fill="currentColor" />
    </svg>
  );
}
export default function Plant() {
  return (
    <svg className="hero-plant" viewBox="0 0 340 220" aria-hidden="true">
      <ellipse
        cx="184"
        cy="195"
        rx="109"
        ry="14"
        fill="#a6c497"
        opacity=".25"
      />
      <circle cx="267" cy="54" r="30" fill="#f2dfa1" />
      <path
        d="M250 66q-7-11-13-1"
        fill="none"
        stroke="#efe4bc"
        strokeWidth="2"
      />
      <path d="M102 181q-34-38-3-67 29 14 24 52" fill="#b5d09e" />
      <path d="m105 178-5-37" stroke="#75946a" strokeWidth="2" />
      <path
        d="M161 129V64"
        stroke="#436d4c"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M161 103q-55 4-56-43 54-8 56 43" fill="#518652" />
      <path d="M163 84q-4-56 52-62 9 48-52 62" fill="#7ea86c" />
      <path
        d="M161 95q-15-22-34-22M164 78q20-29 34-35"
        stroke="#bdd6a4"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="m118 124 88 0-10 53q-3 18-33 18-29 0-35-18Z" fill="#d68f62" />
      <rect x="112" y="115" width="100" height="18" rx="7" fill="#e5a77a" />
      <circle cx="147" cy="149" r="3.5" fill="#4b4732" />
      <circle cx="180" cy="149" r="3.5" fill="#4b4732" />
      <path
        d="M155 159q9 9 18 0"
        stroke="#4b4732"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="136" cy="159" rx="7" ry="4" fill="#edb98e" />
      <ellipse cx="190" cy="159" rx="7" ry="4" fill="#edb98e" />
      <path d="m233 166 14-35 17 8-7 35" fill="#d7bc72" />
      <path d="M232 168q-3 14 14 18l13-4 2-12Z" fill="#e9cc83" />
      <path
        d="m246 132 8-11 13 8-4 12"
        stroke="#8a8855"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="m218 106 8-4m-6-10 4 1M85 56l6 2m-2-9-1 5"
        stroke="#6b9160"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="285" cy="136" r="3" fill="#9aba83" />
      <path d="m67 180 12-19 10 24" fill="#a2be8e" />
    </svg>
  );
}
