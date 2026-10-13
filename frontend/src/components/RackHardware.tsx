'use client';
import React from 'react';

// Authentic metallic slotted chassis rack screw
export const RackScrew: React.FC<{ size?: number; rotation?: number }> = ({ size = 16, rotation = 45 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{
      transform: `rotate(${rotation}deg)`,
      filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.8))',
    }}
  >
    <defs>
      <radialGradient id="screwGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#8a99a8" />
        <stop offset="40%" stopColor="#485461" />
        <stop offset="85%" stopColor="#28313b" />
        <stop offset="100%" stopColor="#1a202c" />
      </radialGradient>
    </defs>
    {/* Outer screw head */}
    <circle cx="12" cy="12" r="11" fill="url(#screwGrad)" stroke="#1a202c" strokeWidth="1" />
    <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.8" />
    {/* Center slot */}
    <rect x="3.5" y="10.8" width="17" height="2.4" rx="0.5" fill="#11161f" stroke="#0a0d14" strokeWidth="0.5" />
    {/* Highlights */}
    <line x1="4" y1="11" x2="20" y2="11" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.6" />
  </svg>
);

// LED indicator with realistic lens flare glow
export const LedIndicator: React.FC<{
  color?: 'green' | 'amber' | 'red' | 'cyan';
  active?: boolean;
  size?: number;
}> = ({ color = 'green', active = true, size = 10 }) => {
  const colors = {
    green: { on: '#00ff66', glow: 'rgba(0, 255, 102, 0.8)', off: '#0f381e' },
    amber: { on: '#ffb703', glow: 'rgba(255, 183, 3, 0.8)', off: '#3d2c00' },
    red: { on: '#ff0054', glow: 'rgba(255, 0, 84, 0.8)', off: '#380a18' },
    cyan: { on: '#00f5d4', glow: 'rgba(0, 245, 212, 0.8)', off: '#053833' },
  };

  const c = colors[color];
  const activeColor = active ? c.on : c.off;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: activeColor,
        border: '1px solid rgba(0, 0, 0, 0.6)',
        boxShadow: active ? `0 0 ${size}px ${c.glow}, inset 0 0 ${size / 2}px #ffffff` : 'none',
        display: 'inline-block',
        transition: 'all 0.2s ease',
      }}
    />
  );
};

// Vintage Analog VU Meter
interface VUMeterProps {
  label: string;
  peakDb: string;
  needleValue: number; // 0 to 100
  subLabel?: string;
  isOverload?: boolean;
}

export const VUMeter: React.FC<VUMeterProps> = ({
  label,
  peakDb,
  needleValue,
  subLabel = 'BALLISTICS: FAST',
  isOverload = false,
}) => {
  // Map needleValue (0-100) to needle angle degrees (-45deg to +45deg)
  // 0%  = -45deg (deep left, -20 dB)
  // 50% = -8deg  (mid scale, -3 dB)
  // 75% = +12deg (0 dB / unity)
  // 100% = +45deg (+3 dB overload red zone)
  const clamped = Math.max(0, Math.min(100, needleValue));
  const angle = -45 + (clamped / 100) * 90;

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#0c0f14',
        borderRadius: '8px',
        border: '1.5px solid #222a36',
        padding: '10px 12px 8px 12px',
        boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'Share Tech Mono, monospace', color: '#94a3b8', fontWeight: 700 }}>
          {label}
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            fontFamily: 'JetBrains Mono, monospace',
            color: isOverload ? '#ff0054' : '#00ff66',
            backgroundColor: isOverload ? 'rgba(255, 0, 84, 0.15)' : 'rgba(0, 255, 102, 0.12)',
            border: `1px solid ${isOverload ? '#ff0054' : '#00ff66'}`,
            padding: '1px 6px',
            borderRadius: '3px',
            fontWeight: 800,
          }}
        >
          {peakDb}
        </span>
      </div>

      {/* Meter Face Container */}
      <div
        style={{
          width: '100%',
          height: '110px',
          position: 'relative',
          backgroundColor: '#f4ebd0',
          borderRadius: '5px',
          overflow: 'hidden',
          boxShadow: 'inset 0 4px 14px rgba(0, 0, 0, 0.4), inset 0 0 40px rgba(180, 150, 90, 0.3)',
          border: '2px solid #222933',
        }}
      >
        {/* Vintage Warm Backlight & Glass Reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 90%, rgba(255, 245, 200, 0.85) 0%, rgba(240, 225, 185, 0.5) 60%, rgba(200, 180, 140, 0.4) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* SVG Scale Marks & Text */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 240 110"
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Main Black Scale Arc */}
          <path
            d="M 28 86 A 115 115 0 0 1 170 38"
            fill="none"
            stroke="#1a1c20"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Overload Red Scale Arc (0 dB to +3 dB) */}
          <path
            d="M 170 38 A 115 115 0 0 1 216 52"
            fill="none"
            stroke="#d90429"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Tick Marks & Scale Numbers */}
          {/* -20 */}
          <line x1="38" y1="80" x2="44" y2="72" stroke="#1a1c20" strokeWidth="1.8" />
          <text x="36" y="93" fontSize="8" fontWeight="700" fill="#1a1c20" fontFamily="Share Tech Mono">-20</text>

          {/* -10 */}
          <line x1="68" y1="62" x2="73" y2="54" stroke="#1a1c20" strokeWidth="1.8" />
          <text x="64" y="73" fontSize="8" fontWeight="700" fill="#1a1c20" fontFamily="Share Tech Mono">-10</text>

          {/* -7 */}
          <line x1="92" y1="51" x2="96" y2="44" stroke="#1a1c20" strokeWidth="1.5" />
          <text x="90" y="60" fontSize="7.5" fontWeight="700" fill="#1a1c20" fontFamily="Share Tech Mono">-7</text>

          {/* -5 */}
          <line x1="112" y1="44" x2="115" y2="37" stroke="#1a1c20" strokeWidth="1.8" />
          <text x="110" y="52" fontSize="7.5" fontWeight="700" fill="#1a1c20" fontFamily="Share Tech Mono">-5</text>

          {/* -3 */}
          <line x1="134" y1="40" x2="136" y2="33" stroke="#1a1c20" strokeWidth="1.8" />
          <text x="132" y="48" fontSize="7.5" fontWeight="700" fill="#1a1c20" fontFamily="Share Tech Mono">-3</text>

          {/* -1 */}
          <line x1="154" y1="38" x2="155" y2="31" stroke="#1a1c20" strokeWidth="1.8" />
          <text x="151" y="46" fontSize="7.5" fontWeight="700" fill="#1a1c20" fontFamily="Share Tech Mono">-1</text>

          {/* 0 (Unity Red boundary) */}
          <line x1="170" y1="38" x2="171" y2="29" stroke="#d90429" strokeWidth="2.2" />
          <text x="168" y="46" fontSize="8.5" fontWeight="800" fill="#d90429" fontFamily="Share Tech Mono">0</text>

          {/* +1 */}
          <line x1="186" y1="41" x2="188" y2="33" stroke="#d90429" strokeWidth="1.8" />
          <text x="184" y="50" fontSize="7.5" fontWeight="800" fill="#d90429" fontFamily="Share Tech Mono">+1</text>

          {/* +2 */}
          <line x1="202" y1="46" x2="205" y2="38" stroke="#d90429" strokeWidth="1.8" />
          <text x="199" y="56" fontSize="7.5" fontWeight="800" fill="#d90429" fontFamily="Share Tech Mono">+2</text>

          {/* +3 */}
          <line x1="216" y1="52" x2="220" y2="44" stroke="#d90429" strokeWidth="2.2" />
          <text x="212" y="64" fontSize="8" fontWeight="800" fill="#d90429" fontFamily="Share Tech Mono">+3</text>

          {/* Vintage "VU" badge */}
          <text x="114" y="74" fontSize="13" fontWeight="900" fill="#2b2d32" fontFamily="Share Tech Mono" letterSpacing="1">VU</text>

          {/* Meter Needle */}
          <g transform={`translate(120, 105) rotate(${angle})`}>
            {/* Needle line */}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-84"
              stroke="#cc0022"
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{ transition: 'all 0.45s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}
            />
            {/* Pivot cap */}
            <circle cx="0" cy="0" r="8" fill="#1b1d22" />
            <circle cx="0" cy="0" r="5" fill="#3b4252" />
            <circle cx="0" cy="0" r="2" fill="#0f1115" />
          </g>
        </svg>
      </div>

      {/* Meter Footer Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <span style={{ fontSize: '0.65rem', fontFamily: 'Share Tech Mono, monospace', color: '#64748b' }}>
          {subLabel}
        </span>
        <LedIndicator color={isOverload ? 'red' : 'green'} active={true} size={7} />
      </div>
    </div>
  );
};

// Precision Audio Rotary Potentiometer Knob
export const RotaryKnob: React.FC<{
  label: string;
  valueText: string;
  angle?: number;
  notchColor?: string;
}> = ({ label, valueText, angle = -30, notchColor = '#00f5d4' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
    <span style={{ fontSize: '0.65rem', fontFamily: 'Share Tech Mono, monospace', color: '#94a3b8', letterSpacing: '0.06em' }}>
      {label}
    </span>
    {/* Physical Knob Disc */}
    <div
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: '#1b222d',
        border: '2px solid #2e3a4e',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Knurled grip ring */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#131822',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          position: 'relative',
          transform: `rotate(${angle}deg)`,
          transition: 'transform 0.4s ease',
        }}
      >
        {/* Notch pointer */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '3px',
            height: '10px',
            borderRadius: '1.5px',
            backgroundColor: notchColor,
            boxShadow: `0 0 6px ${notchColor}`,
          }}
        />
      </div>
    </div>
    <span
      className="mono"
      style={{
        fontSize: '0.7rem',
        color: '#f8fafc',
        fontWeight: 700,
        backgroundColor: '#0a0d14',
        padding: '2px 6px',
        borderRadius: '3px',
        border: '1px solid #1a2230',
      }}
    >
      {valueText}
    </span>
  </div>
);
