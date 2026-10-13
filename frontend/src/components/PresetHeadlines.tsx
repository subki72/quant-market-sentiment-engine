'use client';
import React from 'react';
import { TrendingUpIcon, TrendingDownIcon, MinusCircleIcon, ActivityIcon } from './Icons';

interface PresetHeadlinesProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

const PRESETS = [
  {
    type: 'Bullish',
    color: 'var(--bullish)',
    icon: <TrendingUpIcon size={14} color="var(--bullish)" />,
    tag: 'REVENUE BEAT',
    title: 'Tesla Q4 Earnings Outperform',
    text: 'Tesla reports record-breaking Q4 revenue of $25.1B, exceeding Wall Street consensus by 18% with automotive gross margins expanding significantly.',
  },
  {
    type: 'Bearish',
    color: 'var(--bearish)',
    icon: <TrendingDownIcon size={14} color="var(--bearish)" />,
    tag: 'REGULATORY ACTION',
    title: 'SEC Securities Enforcement',
    text: 'SEC files formal enforcement lawsuit against major cryptocurrency exchange alleging unregistered securities fraud, native token plunges 22%.',
  },
  {
    type: 'Neutral',
    color: 'var(--neutral)',
    icon: <MinusCircleIcon size={14} color="var(--neutral)" />,
    tag: 'CORPORATE FILING',
    title: 'Apple Shareholder Proxy Notice',
    text: 'Apple Inc. files annual proxy statement with SEC and announces annual shareholders meeting will convene virtually on February 28.',
  },
  {
    type: 'Bullish',
    color: 'var(--bullish)',
    icon: <ActivityIcon size={14} color="var(--bullish)" />,
    tag: 'MACRO MONETARY POLICY',
    title: 'Federal Reserve Rate Cut',
    text: 'Federal Reserve cuts benchmark interest rate by 50 basis points citing resilient labor market and cooling inflationary pressures across major sectors.',
  },
];

export const PresetHeadlines: React.FC<PresetHeadlinesProps> = ({ onSelect, disabled }) => {
  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Live Financial News Transcripts (Quick-Select)
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
          Click to load & analyze
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
        {PRESETS.map((preset, index) => (
          <button
            key={index}
            onClick={() => onSelect(preset.text)}
            disabled={disabled}
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                e.currentTarget.style.borderColor = preset.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 16px rgba(0, 0, 0, 0.4)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {preset.icon}
              <span className="mono" style={{ fontSize: '0.65rem', color: preset.color, fontWeight: 700, letterSpacing: '0.05em' }}>
                {preset.tag}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {preset.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
