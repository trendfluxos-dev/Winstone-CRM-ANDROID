import React from 'react';

interface WinstoneLogoProps {
  variant?: 'horizontal' | 'emblem' | 'stacked' | 'banner';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const WinstoneLogo: React.FC<WinstoneLogoProps> = ({
  variant = 'stacked',
  size = 'md',
  className = '',
}) => {
  const emblemSizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16 sm:w-18 sm:h-18',
    lg: 'w-22 h-22 sm:w-24 sm:h-24',
    xl: 'w-28 h-28 sm:w-32 sm:h-32',
  };

  const textSizes = {
    sm: { title: 'text-lg', props: 'text-[8px]', motto: 'text-[7px]', space: 'gap-2', divider: 'my-0.5' },
    md: { title: 'text-2xl sm:text-[26px]', props: 'text-[10px]', motto: 'text-[8.5px]', space: 'gap-3', divider: 'my-1' },
    lg: { title: 'text-3xl sm:text-4xl', props: 'text-xs', motto: 'text-[10px]', space: 'gap-4', divider: 'my-1.5' },
    xl: { title: 'text-4xl sm:text-5xl', props: 'text-sm', motto: 'text-xs', space: 'gap-5', divider: 'my-2' },
  };

  const emblemClass = emblemSizes[size];
  const textScale = textSizes[size];

  // Precision 3D Vector Emblem with house silhouette, chimney, 4-pane gold window, WP monogram, and foundation
  const renderEmblem = (customClass = emblemClass) => (
    <div
      className={`relative ${customClass} rounded-full p-[2.5px] bg-gradient-to-tr from-[#9B792B] via-[#F3E2B8] to-[#8C6B24] shadow-[0_8px_24px_rgba(0,0,0,0.3)] flex items-center justify-center shrink-0`}
    >
      <div className="w-full h-full rounded-full bg-[#0D121B] flex items-center justify-center relative overflow-hidden border border-[#232C3E]">
        {/* Radial highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(229,199,125,0.22)_0%,rgba(13,18,27,0.95)_75%)] pointer-events-none" />

        <svg
          viewBox="0 0 160 160"
          className="w-[94%] h-[94%] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldSheen1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2CE" />
              <stop offset="30%" stopColor="#D9AA48" />
              <stop offset="70%" stopColor="#9C7729" />
              <stop offset="100%" stopColor="#ECC46C" />
            </linearGradient>
            <linearGradient id="goldSheen2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#C99E3C" />
              <stop offset="100%" stopColor="#7E5C16" />
            </linearGradient>
            <filter id="goldEmboss" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Outer Gold Border Ring */}
          <circle cx="80" cy="80" r="76" stroke="url(#goldSheen1)" strokeWidth="2.5" />
          <circle cx="80" cy="80" r="72" stroke="#1F293D" strokeWidth="0.8" />

          {/* Chimney */}
          <path
            d="M38 52V36H48V56"
            stroke="url(#goldSheen1)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Roof Gable */}
          <path
            d="M20 62L80 20L140 62"
            stroke="url(#goldSheen1)"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#goldEmboss)"
          />
          {/* Left Vertical Wall */}
          <path
            d="M34 59V98"
            stroke="url(#goldSheen1)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* 4-Pane Accent Window */}
          <g transform="translate(73, 34)">
            <rect x="0" y="0" width="6" height="6" fill="#0D121B" stroke="url(#goldSheen1)" strokeWidth="0.8" rx="0.5" />
            <rect x="7" y="0" width="6" height="6" fill="url(#goldSheen1)" stroke="#8A661F" strokeWidth="0.6" rx="0.5" />
            <rect x="0" y="7" width="6" height="6" fill="url(#goldSheen1)" stroke="#8A661F" strokeWidth="0.6" rx="0.5" />
            <rect x="7" y="7" width="6" height="6" fill="#0D121B" stroke="url(#goldSheen1)" strokeWidth="0.8" rx="0.5" />
          </g>

          {/* 3D Gold 'WP' Monogram */}
          <path
            d="M44 58L58 100L72 68L86 100L100 58"
            stroke="url(#goldSheen1)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="miter"
            filter="url(#goldEmboss)"
          />
          <path
            d="M44 58L58 100L72 68L86 100L100 58"
            stroke="url(#goldSheen2)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />

          {/* 'P' Letter */}
          <path
            d="M88 58H118C126 58 132 64 132 72C132 80 126 86 118 86H102V100"
            stroke="url(#goldSheen1)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="miter"
            filter="url(#goldEmboss)"
          />
          <path
            d="M88 58H118C126 58 132 64 132 72C132 80 126 86 118 86H102V100"
            stroke="url(#goldSheen2)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />

          {/* Perspective Foundation Deck */}
          <path d="M26 118L38 100H54L45 118H26Z" fill="#1A2232" stroke="url(#goldSheen1)" strokeWidth="0.8" />
          <path d="M49 118L57 100H73L68 118H49Z" fill="#1A2232" stroke="url(#goldSheen1)" strokeWidth="0.8" />
          <path d="M72 118L76 100H92L91 118H72Z" fill="#1A2232" stroke="url(#goldSheen1)" strokeWidth="0.8" />
          <path d="M95 118L95 100H111L114 118H95Z" fill="#1A2232" stroke="url(#goldSheen1)" strokeWidth="0.8" />
          <path d="M118 118L114 100H130L137 118H118Z" fill="#1A2232" stroke="url(#goldSheen1)" strokeWidth="0.8" />

          {/* Circular Text: WINSTONE PROPERTIES */}
          <text
            x="80"
            y="135"
            textAnchor="middle"
            fill="url(#goldSheen1)"
            fontSize="10"
            fontWeight="900"
            fontFamily="Cinzel, Georgia, serif"
            letterSpacing="2"
          >
            WINSTONE
          </text>
          <text
            x="80"
            y="145"
            textAnchor="middle"
            fill="#C99E3C"
            fontSize="5.2"
            fontWeight="700"
            fontFamily="sans-serif"
            letterSpacing="1.8"
          >
            PROPERTIES
          </text>
        </svg>
      </div>
    </div>
  );

  // Stacked Lockup (Exact match to uploaded mobile screenshot)
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center select-none text-center ${className}`}>
        {renderEmblem()}
        <div className="flex flex-col items-center mt-3">
          {/* Main Display Wordmark */}
          <h1
            className={`font-serif font-black tracking-[0.18em] text-[#B8934A] uppercase leading-none ${textScale.title}`}
            style={{ fontFamily: 'Cinzel, "Playfair Display", Georgia, serif' }}
          >
            WINSTONE
          </h1>

          {/* Subheading: PROPERTIES */}
          <span
            className={`font-semibold tracking-[0.38em] text-[#B8934A]/90 uppercase mt-1 ${textScale.props}`}
          >
            PROPERTIES
          </span>

          {/* Slogan Motto with lines: — FIND. BUILD. INVEST. — */}
          <div className="flex items-center gap-2.5 mt-1.5 w-full max-w-[220px]">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#B8934A]/70" />
            <span
              className={`font-bold tracking-[0.24em] text-[#B8934A] uppercase shrink-0 ${textScale.motto}`}
            >
              FIND. BUILD. INVEST.
            </span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#B8934A]/70" />
          </div>
        </div>
      </div>
    );
  }

  // Horizontal Lockup
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center ${textScale.space} select-none ${className}`}>
        {renderEmblem()}
        <div className="flex flex-col justify-center min-w-0">
          <span
            className={`font-serif font-black tracking-[0.14em] text-[#B8934A] uppercase leading-none ${textScale.title}`}
            style={{ fontFamily: 'Cinzel, "Playfair Display", Georgia, serif' }}
          >
            WINSTONE
          </span>
          <div className={`w-full h-[1.5px] bg-[#B8934A] ${textScale.divider}`} />
          <span
            className={`font-semibold tracking-[0.24em] text-[#B8934A] uppercase text-center block ${textScale.motto}`}
          >
            FIND. BUILD. INVEST.
          </span>
        </div>
      </div>
    );
  }

  // Emblem Only
  return renderEmblem(className || emblemClass);
};
