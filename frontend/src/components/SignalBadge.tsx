'use client';
import React from 'react';
import { TrendingUpIcon, TrendingDownIcon, MinusCircleIcon } from './Icons';

interface SignalBadgeProps {
  signal: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SignalBadge: React.FC<SignalBadgeProps> = ({ signal, size = 'md' }) => {
  const norm = signal.toUpperCase();

  let color = 'var(--neutral)';
  let bg = 'var(--neutral-bg)';
  let glow = 'var(--neutral-glow)';
  let icon = <MinusCircleIcon size={size === 'lg' ? 24 : size === 'sm' ? 14 : 18} color="var(--neutral)" />;
  let label = 'NEUTRAL SIGNAL';

  if (norm.includes('BULLISH')) {
    color = 'var(--bullish)';
    bg = 'var(--bullish-bg)';
    glow = 'var(--bullish-glow)';
    icon = <TrendingUpIcon size={size === 'lg' ? 24 : size === 'sm' ? 14 : 18} color="var(--bullish)" />;
    label = 'STRONG BULLISH';
  } else if (norm.includes('BEARISH')) {
    color = 'var(--bearish)';
    bg = 'var(--bearish-bg)';
    glow = 'var(--bearish-glow)';
    icon = <TrendingDownIcon size={size === 'lg' ? 24 : size === 'sm' ? 14 : 18} color="var(--bearish)" />;
    label = 'STRONG BEARISH';
  }

  const padding = size === 'lg' ? '12px 28px' : size === 'sm' ? '4px 10px' : '8px 18px';
  const fontSize = size === 'lg' ? '1.2rem' : size === 'sm' ? '0.75rem' : '0.9rem';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding,
        backgroundColor: bg,
        color,
        border: `1.5px solid ${color}`,
        borderRadius: '9999px',
        fontWeight: 800,
        fontSize,
        boxShadow: `0 0 24px ${glow}`,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', filter: `drop-shadow(0 0 6px ${color})` }}>
        {icon}
      </div>
      <span>{label}</span>
    </div>
  );
};
