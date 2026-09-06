'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  stacked?: boolean;
}

export default function MTechnoLogo({
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
  stacked = false,
}: LogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-base sm:text-lg font-black tracking-tight',
    lg: 'text-xl sm:text-2xl font-black tracking-tight',
    xl: 'text-2xl sm:text-3xl font-black tracking-tight',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  const isLight = variant === 'light';

  return (
    <div
      className={`flex items-center gap-3 select-none ${
        stacked ? 'flex-col text-center' : ''
      }`}
    >
      {/* Official M Technovate Solutions Logo Badge */}
      <div
        className={`${iconSizes[size]} relative shrink-0 rounded-xl overflow-hidden bg-white p-0.5 shadow-md shadow-blue-500/10 border border-slate-200/80 transition-transform hover:scale-105`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="M Technovate Solutions Logo"
          className="w-full h-full object-contain"
        />
      </div>

      <div className={stacked ? 'mt-1' : ''}>
        <div className="leading-tight">
          <span
            className={`${textSizes[size]} ${
              isLight ? 'text-white' : 'text-slate-900'
            }`}
          >
            M TECHNOVATE <span className="text-blue-600 font-extrabold">SOLUTIONS</span>
          </span>
        </div>
        {showSubtitle && (
          <p
            className={`${subtitleSizes[size]} font-medium tracking-wide ${
              isLight ? 'text-cyan-300' : 'text-slate-500'
            } mt-0.5`}
          >
            Innovate at every step
          </p>
        )}
      </div>
    </div>
  );
}
