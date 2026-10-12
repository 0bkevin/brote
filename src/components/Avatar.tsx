import { useId } from "react";
import type { AvatarKind, ColorKind } from "../types";

const palettes = {
  fox: {
    fur: "#ff8a47",
    shade: "#df4f49",
    light: "#ffc16b",
    cream: "#fff0d4",
    ink: "#30234e",
    eye: "#202344",
  },
  bear: {
    fur: "#b879ff",
    shade: "#794ee4",
    light: "#e0a8ff",
    cream: "#ffe7a9",
    ink: "#29234d",
    eye: "#202344",
  },
  rabbit: {
    fur: "#67e8d0",
    shade: "#26aeca",
    light: "#b4fff0",
    cream: "#f4ffec",
    ink: "#183b5a",
    eye: "#172c4b",
  },
  owl: {
    fur: "#ffc85a",
    shade: "#f17a5f",
    light: "#ffe991",
    cream: "#f8f3ff",
    ink: "#34234d",
    eye: "#18294d",
  },
};

const cards = {
  mint: ["#80f5d2", "#28b9c1"],
  peach: ["#ffb58c", "#f36f7d"],
  lavender: ["#c39aff", "#765be9"],
  yellow: ["#ffe476", "#ffad54"],
} as const;

export default function Avatar({
  kind,
  color = "mint",
  size = 52,
}: {
  kind: AvatarKind;
  color?: ColorKind;
  size?: number;
}) {
  const p = palettes[kind];
  const [cardTop, cardBottom] = cards[color];
  const id = useId().replace(/:/g, "");

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className="avatar-art"
    >
      <defs>
        <linearGradient id={`card-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={cardTop} />
          <stop offset="1" stopColor={cardBottom} />
        </linearGradient>
        <linearGradient id={`fur-${id}`} x1=".12" y1="0" x2=".88" y2="1">
          <stop stopColor={p.light} />
          <stop offset=".48" stopColor={p.fur} />
          <stop offset="1" stopColor={p.shade} />
        </linearGradient>
        <linearGradient id={`cream-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fffdf2" />
          <stop offset="1" stopColor={p.cream} />
        </linearGradient>
        <filter id={`lift-${id}`} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="1.6"
            floodColor="#281c56"
            floodOpacity=".26"
          />
        </filter>
      </defs>

      <rect x="2" y="2" width="76" height="76" rx="24" fill="#29234d" />
      <rect
        x="4"
        y="4"
        width="72"
        height="72"
        rx="22"
        fill={`url(#card-${id})`}
      />
      <path
        d="M9 25Q17 8 34 7"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".38"
      />
      <path
        d="m65 15 1.5 4.5L71 21l-4.5 1.5L65 27l-1.5-4.5L59 21l4.5-1.5Z"
        fill="#fff6b5"
      />
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="#24204a" opacity=".24" />

      <g
        stroke={p.ink}
        strokeWidth="2.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#lift-${id})`}
      >
        {kind === "fox" ? (
          <>
            <path
              d="m14 33 5-23q1-4 5-1l17 16 16-16q4-3 5 2l5 23Z"
              fill={`url(#fur-${id})`}
            />
            <path
              d="m20 17 5 17 11-8Zm40 0-5 17-11-8Z"
              fill="#ffb0a0"
              strokeWidth="1.8"
            />
            <path
              d="M13 39q0-17 27-17t27 17q0 23-27 28Q13 62 13 39Z"
              fill={`url(#fur-${id})`}
            />
            <path
              d="M18 43q10 7 22 7t22-7q-3 18-22 23-19-5-22-23Z"
              fill={`url(#cream-${id})`}
              strokeWidth="1.8"
            />
            <path
              d="m32 48 8 6 8-6q-1 9-8 9t-8-9Z"
              fill="#fff8e5"
              strokeWidth="1.7"
            />
            <path d="m36 49 4-3 4 3-4 4Z" fill="#39294d" strokeWidth="1.5" />
          </>
        ) : kind === "bear" ? (
          <>
            <circle cx="21" cy="28" r="12" fill={`url(#fur-${id})`} />
            <circle cx="59" cy="28" r="12" fill={`url(#fur-${id})`} />
            <circle cx="21" cy="28" r="6" fill="#ffb6b7" strokeWidth="1.8" />
            <circle cx="59" cy="28" r="6" fill="#ffb6b7" strokeWidth="1.8" />
            <path
              d="M14 44q0-22 26-22t26 22q0 21-26 23-26-2-26-23Z"
              fill={`url(#fur-${id})`}
            />
            <ellipse
              cx="40"
              cy="51"
              rx="16"
              ry="13"
              fill={`url(#cream-${id})`}
              strokeWidth="1.8"
            />
            <path d="m35 47 5-3 5 3-5 4Z" fill="#39294d" strokeWidth="1.5" />
            <path
              d="M40 51v4m0 0q-4 5-8 0m8 0q4 5 8 0"
              fill="none"
              strokeWidth="1.8"
            />
          </>
        ) : kind === "rabbit" ? (
          <>
            <path
              d="M23 37Q10 13 20 9q11-4 18 25Zm34 0Q70 13 60 9q-11-4-18 25Z"
              fill={`url(#fur-${id})`}
            />
            <path
              d="M23 28q-7-17-1-17 7-2 11 17Zm34 0q7-17 1-17-7-2-11 17Z"
              fill="#ff8fae"
              strokeWidth="1.5"
            />
            <path
              d="M14 46q0-23 26-23t26 23q0 20-26 21-26-1-26-21Z"
              fill={`url(#fur-${id})`}
            />
            <path
              d="M27 50q3-9 13-9t13 9q-2 10-13 11-11-1-13-11Z"
              fill={`url(#cream-${id})`}
              strokeWidth="1.7"
            />
            <path d="m37 49 3-3 3 3-3 3Z" fill="#f28098" strokeWidth="1.4" />
            <path
              d="M40 52v3m0 0q-4 4-7 0m7 0q4 4 7 0"
              fill="none"
              strokeWidth="1.7"
            />
          </>
        ) : (
          <>
            <path
              d="m16 29 3-17 15 12q6-2 12 0l15-12 3 18Z"
              fill={`url(#fur-${id})`}
            />
            <path
              d="m22 17 10 9-13-2Zm36 0-10 9 13-2Z"
              fill="#ff9b86"
              strokeWidth="1.5"
            />
            <path
              d="M14 43q0-23 26-23t26 23q0 22-26 23-26-1-26-23Z"
              fill={`url(#fur-${id})`}
            />
            <ellipse
              cx="29"
              cy="44"
              rx="12"
              ry="14"
              fill={`url(#cream-${id})`}
              strokeWidth="1.8"
            />
            <ellipse
              cx="51"
              cy="44"
              rx="12"
              ry="14"
              fill={`url(#cream-${id})`}
              strokeWidth="1.8"
            />
            <path d="m36 48 4-5 4 5-4 4Z" fill="#ff795e" strokeWidth="1.5" />
          </>
        )}
      </g>

      {kind === "owl" ? (
        <g fill={p.eye}>
          <circle cx="29" cy="42" r="3.1" />
          <circle cx="51" cy="42" r="3.1" />
          <circle cx="30" cy="41" r="1" fill="white" />
          <circle cx="52" cy="41" r="1" fill="white" />
        </g>
      ) : (
        <g fill={p.eye}>
          <ellipse
            cx="29"
            cy={kind === "rabbit" ? "40" : "39"}
            rx="2.7"
            ry="3.5"
          />
          <ellipse
            cx="51"
            cy={kind === "rabbit" ? "40" : "39"}
            rx="2.7"
            ry="3.5"
          />
          <circle cx="30" cy="38" r="1" fill="white" />
          <circle cx="52" cy="38" r="1" fill="white" />
        </g>
      )}
      <circle cx="20" cy="50" r="3.5" fill="#ff7286" opacity=".72" />
      <circle cx="60" cy="50" r="3.5" fill="#ff7286" opacity=".72" />
      <g transform="translate(54 57) rotate(10)">
        <path
          d="m0-6 2.2 4.2L7 0l-4.8 1.8L0 7l-2.1-5.2L-7 0l4.9-1.8Z"
          fill="#fff179"
          stroke="#6a42c7"
          strokeWidth="1.4"
        />
      </g>
    </svg>
  );
}

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
        d="M20 34V19"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M19 23C8 25 4 16 6 7c10-1 16 4 15 14" fill="currentColor" />
      <path d="M21 18C20 8 28 3 36 5c1 9-5 15-15 14" fill="currentColor" />
      <path
        d="M10 13q5 1 8 6m14-9q-6 2-10 7"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".65"
      />
      <circle cx="20" cy="34" r="2" fill="#ffbd54" />
    </svg>
  );
}
