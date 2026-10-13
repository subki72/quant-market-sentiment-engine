'use client';
import React from 'react';
import { TrendingUpIcon, TrendingDownIcon, MinusCircleIcon, SparklesIcon } from './Icons';

interface SentimentGaugeProps {
  signal: string;
  confidence: number;
  probabilities?: Record<string, number>;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({
  signal,
  confidence,
  probabilities = {},
}) => {
  const bullishProb = probabilities['BULLISH'] || (signal === 'BULLISH' ? confidence : 0);
  const bearishProb = probabilities['BEARISH'] || (signal === 'BEARISH' ? confidence : 0);
  const neutralProb = probabilities['NEUTRAL'] || (signal === 'NEUTRAL' ? confidence : 0);

  // Compute needle angle on 180-degree semi-circle gauge:
  // -90 deg = left (Bearish)
  // 0 deg   = center (Neutral)
  // +90 deg = right (Bullish)
  let needleAngle = 0;
  if (signal.toUpperCase().includes('BULLISH')) {
    needleAngle = 30 + Math.min(60, (bullishProb / 100) * 60);
  } else if (signal.toUpperCase().includes('BEARISH')) {
    needleAngle = -30 - Math.min(60, (bearishProb / 100) * 60);
  } else {
    needleAngle = (bullishProb - bearishProb) * 0.4;
  }

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Semi-Circle Speedometer Arc */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginBottom: '16px' }}>
        <svg width="280" height="150" viewBox="0 0 280 150" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Arc Track */}
          <path
            d="M 30 140 A 110 110 0 0 1 250 140"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Colored Gradient Active Arc */}
          <path
            d="M 30 140 A 110 110 0 0 1 250 140"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
          />

          {/* Needle Pivot & Indicator */}
          <g transform={`translate(140, 140) rotate(${needleAngle})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-98"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))"
              style={{ transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <circle cx="0" cy="0" r="8" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)" />
            <circle cx="0" cy="0" r="3.5" fill="#0f172a" />
          </g>

          {/* Gauge Tick Labels */}
          <text x="20" y="146" fill="#ef4444" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">BEAR</text>
          <text x="126" y="24" fill="#f59e0b" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">NEUTRAL</text>
          <text x="236" y="146" fill="#10b981" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">BULL</text>
        </svg>

        {/* Digital Confidence Center Readout */}
        <div style={{ marginTop: '-12px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em' }}>
            {confidence.toFixed(1)}<span style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>%</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Model Classification Certainty
          </div>
        </div>
      </div>

      {/* Probability Breakdown 3-Card Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '16px',
        }}
      >
        {/* Bullish Metric */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(16, 185, 129, 0.07)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--bullish)', fontWeight: 700, letterSpacing: '0.04em' }}>BULLISH</span>
            <TrendingUpIcon size={16} color="var(--bullish)" />
          </div>
          <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            {bullishProb.toFixed(1)}%
          </div>
          <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.1)', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${bullishProb}%`, height: '100%', backgroundColor: 'var(--bullish)', transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Neutral Metric */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(245, 158, 11, 0.07)',
            borderRadius: '10px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral)', fontWeight: 700, letterSpacing: '0.04em' }}>NEUTRAL</span>
            <MinusCircleIcon size={16} color="var(--neutral)" />
          </div>
          <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            {neutralProb.toFixed(1)}%
          </div>
          <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.1)', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${neutralProb}%`, height: '100%', backgroundColor: 'var(--neutral)', transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Bearish Metric */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.07)',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--bearish)', fontWeight: 700, letterSpacing: '0.04em' }}>BEARISH</span>
            <TrendingDownIcon size={16} color="var(--bearish)" />
          </div>
          <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            {bearishProb.toFixed(1)}%
          </div>
          <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.1)', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${bearishProb}%`, height: '100%', backgroundColor: 'var(--bearish)', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
