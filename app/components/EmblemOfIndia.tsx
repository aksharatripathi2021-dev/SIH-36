import React from "react";

export function EmblemOfIndia({ className = "w-12 h-14" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="State Emblem of India"
    >
      {/* Ashoka Lion Capital Vector Silhouette */}
      <g fill="#996B1F" stroke="#7A5212" strokeWidth="0.5">
        {/* Central Crown & Mane Details */}
        <path d="M50 8 C46 8, 43 11, 43 16 C43 20, 46 22, 50 22 C54 22, 57 20, 57 16 C57 11, 54 8, 50 8 Z" fill="#996B1F" />

        {/* Central Lion Head */}
        <path d="M44 16 C42 16, 40 18, 40 21 C40 25, 43 28, 47 29 L47 36 L53 36 L53 29 C57 28, 60 25, 60 21 C60 18, 58 16, 56 16 C56 13, 53 11, 50 11 C47 11, 44 13, 44 16 Z" />
        <circle cx="47" cy="20" r="1.2" fill="#2E1C03" />
        <circle cx="53" cy="20" r="1.2" fill="#2E1C03" />
        <path d="M48 24 L52 24 L50 26 Z" fill="#2E1C03" />

        {/* Left Lion Head & Shoulder */}
        <path d="M33 19 C30 19, 27 22, 27 26 C27 31, 31 35, 36 36 L38 42 L42 42 L41 34 C36 33, 33 29, 33 24 C33 22, 34 20, 35 19 Z" />
        <circle cx="33" cy="24" r="1.2" fill="#2E1C03" />

        {/* Right Lion Head & Shoulder */}
        <path d="M67 19 C70 19, 73 22, 73 26 C73 31, 69 35, 64 36 L62 42 L58 42 L59 34 C64 33, 67 29, 67 24 C67 22, 66 20, 65 19 Z" />
        <circle cx="67" cy="24" r="1.2" fill="#2E1C03" />

        {/* Torso and Forelegs */}
        <path d="M36 38 C34 44, 33 52, 33 62 L39 62 C40 54, 41 46, 43 40 Z" />
        <path d="M64 38 C66 44, 67 52, 67 62 L61 62 C60 54, 59 46, 57 40 Z" />
        <path d="M44 38 L44 62 L48 62 L48 38 Z" />
        <path d="M52 38 L52 62 L56 62 L56 38 Z" />

        {/* Abacus / Pedestal */}
        <rect x="22" y="64" width="56" height="14" rx="2" fill="#996B1F" />

        {/* Ashoka Chakra in Central Abacus */}
        <circle cx="50" cy="71" r="5" fill="#FFFFFF" stroke="#003366" strokeWidth="1" />
        <circle cx="50" cy="71" r="1.5" fill="#003366" />
        {/* Spokes */}
        <line x1="50" y1="66" x2="50" y2="76" stroke="#003366" strokeWidth="0.6" />
        <line x1="45" y1="71" x2="55" y2="71" stroke="#003366" strokeWidth="0.6" />
        <line x1="46.5" y1="67.5" x2="53.5" y2="74.5" stroke="#003366" strokeWidth="0.6" />
        <line x1="46.5" y1="74.5" x2="53.5" y2="67.5" stroke="#003366" strokeWidth="0.6" />

        {/* Animals on Abacus (Bull & Horse representations) */}
        <ellipse cx="32" cy="71" rx="4" ry="2.5" fill="#5C3B07" />
        <ellipse cx="68" cy="71" rx="4" ry="2.5" fill="#5C3B07" />

        {/* Lotus Base */}
        <path d="M26 80 C32 88, 68 88, 74 80 L76 84 C68 93, 32 93, 24 84 Z" fill="#7A5212" />
        <path d="M30 84 C38 90, 62 90, 70 84 L71 87 C62 94, 38 94, 29 87 Z" fill="#996B1F" />
      </g>

      {/* Motto: Satyameva Jayate (सत्यमेव जयते) */}
      <text
        x="50"
        y="104"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="bold"
        fill="#5C3B07"
        fontFamily="sans-serif"
      >
        सत्यमेव जयते
      </text>
    </svg>
  );
}
