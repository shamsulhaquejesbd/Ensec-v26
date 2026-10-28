import React from 'react';

interface HoneycombLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const HoneycombLogo: React.FC<HoneycombLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Honeycomb Golden Hexagon Cluster */}
      <svg
        width={iconSize}
        height={iconSize * 1.1}
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-200 hover:scale-105"
      >
        {/* Hexagon 1: Top Center */}
        <polygon
          points="35,16 48,8 61,16 61,31 48,39 35,31"
          stroke="#f59e0b"
          strokeWidth="3.5"
          fill="#fffbeb"
          className="dark:fill-amber-950/40"
        />

        {/* Hexagon 2: Top Right */}
        <polygon
          points="62,32 75,24 88,32 88,48 75,56 62,48"
          stroke="#f59e0b"
          strokeWidth="3.5"
          fill="#fffbeb"
          className="dark:fill-amber-950/40"
        />

        {/* Hexagon 3: Large Main Lower Hexagon */}
        <polygon
          points="18,52 48,35 78,52 78,87 48,104 18,87"
          stroke="#ea580c"
          strokeWidth="4"
          fill="#ffffff"
          className="dark:fill-slate-900"
        />

        {/* Stylized M-Emblem inside lower hexagon */}
        <path
          d="M32 80 L32 58 L41 71 L48 61 L55 71 L64 58 L64 80"
          stroke="#334155"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="dark:stroke-slate-200"
        />
        <path
          d="M48 61 L55 71 L64 58"
          stroke="#ea580c"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-slate-100 font-sans">
              MOUCHAAK
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              ENSEC
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Distribution & Field Force ERP
          </span>
        </div>
      )}
    </div>
  );
};
