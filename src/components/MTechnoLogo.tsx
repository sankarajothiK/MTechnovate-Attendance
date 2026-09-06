import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
}

export default function MTechnoLogo({
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
}: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-extrabold',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Dynamic Geometric Shield Logo */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 shadow-md shadow-blue-500/20 text-white font-black tracking-wider transition-transform hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5"
        >
          <path d="M4 19V5l8 7 8-7v14" />
        </svg>
        {/* Subtle Tech Pulse Dot */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
      </div>

      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`${textSizes[size]} tracking-tight ${
              isDark ? 'text-slate-900' : 'text-white'
            }`}
          >
            M <span className="text-blue-600">TECHNO</span>
          </span>
        </div>
        {showSubtitle && (
          <p
            className={`${subtitleSizes[size]} tracking-wider uppercase font-semibold text-slate-400 mt-1`}
          >
            Attendance Portal
          </p>
        )}
      </div>
    </div>
  );
}
