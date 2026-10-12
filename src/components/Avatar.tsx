import type { AvatarKind, ColorKind } from "../types";
export default function Avatar({
  kind,
  color = "mint",
  size = 52,
}: {
  kind: AvatarKind;
  color?: ColorKind;
  size?: number;
}) {
  const bg = {
    mint: "#d5ebcd",
    peach: "#f3d7bd",
    lavender: "#e3d7f3",
    yellow: "#f4e3a6",
  }[color];
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className="avatar-art"
    >
      <rect width="80" height="80" rx="26" fill={bg} />
      {kind === "fox" ? (
        <>
          <path d="M16 34 20 12 38 28 58 12 64 36Z" fill="#bd693d" />
          <path d="m22 20 3 14 9-6m22-8-3 14-9-6" fill="#f6c395" />
          <path
            d="M15 37q0-19 25-17t25 17q0 25-25 29Q15 62 15 37"
            fill="#cf8050"
          />
          <path d="m17 41 23 6 23-6q-3 21-23 25-20-4-23-25" fill="#fff3de" />
          <path d="m34 47 6 7 6-7Z" fill="#36423b" />
        </>
      ) : kind === "bear" ? (
        <>
          <circle cx="22" cy="23" r="12" fill="#a67c52" />
          <circle cx="58" cy="23" r="12" fill="#a67c52" />
          <circle cx="22" cy="23" r="7" fill="#e9bf98" />
          <circle cx="58" cy="23" r="7" fill="#e9bf98" />
          <ellipse cx="40" cy="44" rx="27" ry="26" fill="#b78c62" />
          <ellipse cx="40" cy="53" rx="14" ry="12" fill="#f2d8b5" />
          <ellipse cx="40" cy="49" rx="5" ry="4" fill="#36423b" />
        </>
      ) : kind === "rabbit" ? (
        <>
          <ellipse cx="28" cy="24" rx="8" ry="21" fill="#f6eddb" />
          <ellipse cx="51" cy="24" rx="8" ry="21" fill="#f6eddb" />
          <ellipse cx="28" cy="23" rx="3" ry="13" fill="#e7bba9" />
          <ellipse cx="51" cy="23" rx="3" ry="13" fill="#e7bba9" />
          <ellipse cx="40" cy="48" rx="25" ry="24" fill="#f6eddb" />
          <path d="m36 53 4 4 4-4Z" fill="#ae796d" />
        </>
      ) : (
        <>
          <path
            d="m17 21 12 7 22-1 13-8-1 26q0 27-23 27-25-1-25-25Z"
            fill="#8c7a9c"
          />
          <ellipse cx="29" cy="42" rx="13" ry="16" fill="#f4ebdc" />
          <ellipse cx="52" cy="42" rx="13" ry="16" fill="#f4ebdc" />
          <path d="m36 48 5 8 5-8Z" fill="#d8a04e" />
        </>
      )}
      {kind === "owl" ? (
        <>
          <circle cx="29" cy="41" r="4" fill="#36423b" />
          <circle cx="52" cy="41" r="4" fill="#36423b" />
        </>
      ) : (
        <>
          <circle cx="29" cy="39" r="2.7" fill="#36423b" />
          <circle cx="51" cy="39" r="2.7" fill="#36423b" />
          <path
            d="M36 58q4 5 8 0"
            fill="none"
            stroke="#36423b"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      <circle cx="21" cy="48" r="4" fill="#db9b89" opacity=".45" />
      <circle cx="59" cy="48" r="4" fill="#db9b89" opacity=".45" />
    </svg>
  );
}
