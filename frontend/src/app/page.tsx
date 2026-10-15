'use client';

import React, { useState, useEffect } from 'react';

interface PredictionResult {
  text: string;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  probabilities: {
    BULLISH?: number;
    BEARISH?: number;
    NEUTRAL?: number;
    [key: string]: number | undefined;
  };
  latency_ms: number;
}

const PRESET_TEXTS: Record<string, { title: string; subtitle: string; code: string; text: string; color: string }> = {
  P01: {
    code: 'P-01',
    subtitle: 'REVENUE BEAT',
    title: 'Tesla Q4 Earnings Beat',
    color: 'emerald',
    text: '"Tesla reports record-breaking Q4 revenue of $25.1B, exceeding Wall Street consensus by 18% with automotive gross margins expanding significantly."',
  },
  P02: {
    code: 'P-02',
    subtitle: 'REGULATORY ACTION',
    title: 'SEC Securities Probe',
    color: 'rose',
    text: '"Securities and Exchange Commission issues formal civil subpoena regarding off-balance-sheet accounting provisions and special vehicle entities."',
  },
  P03: {
    code: 'P-03',
    subtitle: 'CORPORATE FILING',
    title: 'Apple Shareholder Proxy',
    color: 'amber',
    text: '"Apple issues 2025 Notice of Annual Meeting of Shareholders proposing executive compensation program adjustments and board oversight mandates."',
  },
  P04: {
    code: 'P-04',
    subtitle: 'MACRO POLICY',
    title: 'Federal Reserve Rate Cut',
    color: 'cyan',
    text: '"Federal Open Market Committee lowers target range for federal funds rate by 50 basis points, citing stabilized inflation metrics and labor balance."',
  },
};

export default function Home() {
  const [apiUrl, setApiUrl] = useState<string>(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      setApiUrl(process.env.NEXT_PUBLIC_API_URL);
    }
  }, []);
  const [inputText, setInputText] = useState<string>(
    '"Tesla reports record-breaking Q4 revenue of $25.1B, exceeding Wall Street consensus by 18% with automotive gross margins expanding significantly."'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('P01');
  const [mainsPower, setMainsPower] = useState<boolean>(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'waking' | 'offline'>('checking');
  const [wakeElapsed, setWakeElapsed] = useState<number>(0);
  const [wakeAttempt, setWakeAttempt] = useState<number>(0);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<string>('2025.10.24-14:02:49.034');
  const [rotaryAngles, setRotaryAngles] = useState({ sens: 45, decay: -12, damp: 90 });
  const [networkRtt, setNetworkRtt] = useState<number | null>(24);

  const [result, setResult] = useState<PredictionResult>({
    text: 'Tesla reports record-breaking Q4 revenue of $25.1B, exceeding Wall Street consensus by 18% with automotive gross margins expanding significantly.',
    signal: 'BULLISH',
    confidence: 93.8,
    probabilities: {
      BULLISH: 93.8,
      NEUTRAL: 3.1,
      BEARISH: 3.0,
    },
    latency_ms: 18.4,
  });

  // Real-time clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number, z = 2) => String(n).padStart(z, '0');
      const formatted = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}-${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
      setTimestamp(formatted);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Health check API polling with smart cold-start detection and responsive retry
  useEffect(() => {
    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout>;

    const checkHealth = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${apiUrl}/health`, { 
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          if (isMounted) {
            setApiOnline(true);
            setBackendStatus('online');
            setWakeElapsed(0);
          }
          // Connected: relax polling interval to 25s
          timerId = setTimeout(checkHealth, 25000);
        } else {
          // Status 502/503/504: Space is booting/cold starting
          if (isMounted) {
            setApiOnline(false);
            setBackendStatus('waking');
            setWakeElapsed((prev) => prev + 3);
          }
          // While waking up, probe every 3.5s
          timerId = setTimeout(checkHealth, 3500);
        }
      } catch {
        if (isMounted) {
          setApiOnline(false);
          setBackendStatus('waking');
          setWakeElapsed((prev) => prev + 3);
        }
        // Connection error or timeout while booting: probe again in 3.5s
        timerId = setTimeout(checkHealth, 3500);
      }
    };

    checkHealth();

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        checkHealth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [apiUrl]);

  // Execute Sentiment Inference with multi-attempt auto-retry on cold-start
  const handleAnalyze = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setLoading(true);
    setWakeAttempt(0);
    const startTime = performance.now();

    const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 25000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return res;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    let successData: PredictionResult | null = null;

    // Retry loop: up to 3 attempts with progressive delay (accommodating cold-start)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        setWakeAttempt(attempt);
        const response = await fetchWithTimeout(
          `${apiUrl}/predict`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: trimmed }),
          },
          attempt === 1 ? 25000 : 15000
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: PredictionResult = await response.json();
        successData = data;
        setApiOnline(true);
        setBackendStatus('online');
        setIsSimulated(false);
        break;
      } catch {
        if (attempt < 3) {
          setBackendStatus('waking');
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    const rtt = Math.round(performance.now() - startTime);
    setNetworkRtt(rtt);

    if (successData) {
      setResult(successData);
      setLoading(false);
      return;
    }

    // Heuristic fallback if remote server is unreachable after all retries
    setIsSimulated(true);
    const upper = trimmed.toUpperCase();
    let simSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let simConf = 75.0;
    let pBull = 20.0;
    let pBear = 20.0;
    let pNeu = 60.0;

    if (upper.includes('RECORD') || upper.includes('BEAT') || upper.includes('SURGE') || upper.includes('GROWTH') || upper.includes('EXPANDING')) {
      simSignal = 'BULLISH';
      simConf = 93.8;
      pBull = 93.8;
      pNeu = 3.2;
      pBear = 3.0;
    } else if (upper.includes('SUBPOENA') || upper.includes('PROBE') || upper.includes('LOSS') || upper.includes('CRASH') || upper.includes('INVESTIGATION')) {
      simSignal = 'BEARISH';
      simConf = 89.4;
      pBear = 89.4;
      pNeu = 6.4;
      pBull = 4.2;
    } else if (upper.includes('RATE CUT') || upper.includes('EASING')) {
      simSignal = 'BULLISH';
      simConf = 82.5;
      pBull = 82.5;
      pNeu = 12.0;
      pBear = 5.5;
    }

    setResult({
      text: trimmed,
      signal: simSignal,
      confidence: simConf,
      probabilities: {
        BULLISH: pBull,
        NEUTRAL: pNeu,
        BEARISH: pBear,
      },
      latency_ms: 18.4,
    });
    setLoading(false);
  };

  const selectPreset = (key: string) => {
    const preset = PRESET_TEXTS[key];
    if (!preset) return;
    setActivePreset(key);
    setInputText(preset.text);
  };

  // Probabilities calculation with safe bounds
  const rawBull = typeof result.probabilities.BULLISH === 'number' ? result.probabilities.BULLISH : (result.signal === 'BULLISH' ? result.confidence : 0.0);
  const rawNeu = typeof result.probabilities.NEUTRAL === 'number' ? result.probabilities.NEUTRAL : (result.signal === 'NEUTRAL' ? result.confidence : 0.0);
  const rawBear = typeof result.probabilities.BEARISH === 'number' ? result.probabilities.BEARISH : (result.signal === 'BEARISH' ? result.confidence : 0.0);
  const bullishProb = Math.max(0.0, Math.min(100.0, rawBull));
  const neutralProb = Math.max(0.0, Math.min(100.0, rawNeu));
  const bearishProb = Math.max(0.0, Math.min(100.0, rawBear));

  // Meter Needle Angles (-45deg to +45deg)
  const needleAngleA = -42 + (bullishProb / 100) * 82;
  const needleAngleB = -42 + (bearishProb / 100) * 82;

  const peakDbA = bullishProb >= 50 ? `+${((bullishProb - 50) / 15).toFixed(1)} dB` : `-${((50 - bullishProb) / 4).toFixed(1)} dB`;
  const peakDbB = bearishProb >= 50 ? `+${((bearishProb - 50) / 15).toFixed(1)} dB` : `-${((50 - bearishProb) / 3.5).toFixed(1)} dB`;

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-screen py-2 sm:py-4">
      {/* ========================================================================= */}
      {/* MASTER CHASSIS WRAPPER (19" Heavy Duty Rack Mount)                       */}
      {/* ========================================================================= */}
      <div
        className="w-full max-w-[1720px] bg-rack-base rounded-lg border-2 border-stone-800 shadow-chassis overflow-hidden relative"
        data-purpose="rack-mount-chassis"
      >
        {/* Rack Ears & Screws Top Edge */}
        <div className="h-3.5 bg-[#0c0d10] border-b border-stone-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <span className="bolt-screw" />
            <span className="text-[9px] uppercase tracking-widest text-stone-600 font-mono">
              LAB SPEC // 4U STANDARD CHASSIS RACK
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[9px] tracking-widest text-stone-600 font-mono">
              SERIES 884-MKII // CALIBRATED TOKYO/GENEVA
            </span>
            <span className="bolt-screw" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOP MASTER HEADER / ROLLING TICKER CONSOLE                                */}
        {/* ========================================================================= */}
        <header className="brushed-metal border-b-2 border-stone-900 px-5 py-3 relative" data-purpose="chassis-master-header">
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
            {/* Left Brand & Power Section */}
            <div className="flex items-center space-x-5">
              {/* Industrial Toggle Switch */}
              <div className="flex items-center space-x-2.5 bg-black/50 px-3 py-1.5 rounded border border-stone-800">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${mainsPower ? 'bg-emerald-400 jewel-lamp animate-pulse' : 'bg-rose-500 jewel-lamp-red'}`}
                />
                <div className="flex flex-col">
                  <span className="text-[8px] font-tech tracking-wider text-stone-400 leading-none">MAINS POWER</span>
                  <span className={`text-[11px] font-bold ${mainsPower ? 'text-emerald-400' : 'text-stone-500'} font-mono leading-none mt-0.5`}>
                    {mainsPower ? 'ONLINE 240V' : 'STANDBY 0V'}
                  </span>
                </div>
                {/* Vintage Rocker Switch Plate */}
                <button
                  onClick={() => setMainsPower(!mainsPower)}
                  className="ml-2 w-7 h-5 bg-stone-900 rounded border border-stone-700 flex items-center justify-center shadow-inner hover:border-emerald-500 transition-colors cursor-pointer"
                  title="Toggle System Power"
                >
                  <span className={`w-4 h-2 rounded-sm transition-colors ${mainsPower ? 'bg-emerald-500/90' : 'bg-stone-700'}`} />
                </button>
              </div>

              {/* Title Stamp Plate */}
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-stone-900 border border-stone-700 flex items-center justify-center text-cyan-400 font-tech font-bold text-xs shadow-inner">
                    Q
                  </div>
                  <h1 className="font-tech text-lg md:text-xl font-bold tracking-wider text-stone-100 flex items-center space-x-2">
                    <span>QUANT MARKET SENTIMENT ENGINE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 font-mono font-normal">
                      MOD-01 v1.0
                    </span>
                  </h1>
                </div>
                <p className="text-[10px] text-stone-400 tracking-wide font-mono mt-0.5">
                  FINE-TUNED DISTILBERT NLP MICROSERVICE // HIGH-THROUGHPUT REALTIME ALPHA CORE
                </p>
              </div>
            </div>

            {/* Center: Hardware Analog Latency / Clock Meter */}
            <div className="flex items-center space-x-3 bg-stone-950/80 px-4 py-1.5 rounded-md border border-stone-800/80 shadow-inner">
              <div className="flex flex-col text-right">
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-tech">INFERENCE LATENCY</span>
                <span className="text-xs font-code text-cyan-400 font-bold tracking-tight">
                  {result.latency_ms.toFixed(1)} <span className="text-[10px] text-stone-400 font-normal">ms (FP16)</span>
                  {networkRtt !== null && (
                    <span className="text-[10px] text-stone-400 font-normal ml-1">
                      // RTT: <span className="text-emerald-400 font-bold">{networkRtt}ms</span>
                    </span>
                  )}
                </span>
              </div>
              <div className="h-6 w-px bg-stone-800" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-tech">IO THREAD STATUS</span>
                <span className="text-[11px] font-mono font-semibold flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      backendStatus === 'online'
                        ? 'bg-emerald-400 animate-ping'
                        : backendStatus === 'waking'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-stone-500'
                    }`}
                  />
                  <span
                    className={
                      backendStatus === 'online'
                        ? 'text-emerald-400'
                        : backendStatus === 'waking'
                        ? 'text-amber-300'
                        : 'text-stone-400'
                    }
                  >
                    {backendStatus === 'online'
                      ? 'LIVE // FAST-API CONNECTED'
                      : backendStatus === 'waking'
                      ? `COLD START // WAKING UP (~${Math.max(2, 25 - wakeElapsed)}s)`
                      : 'OFFLINE // SIMULATOR READY'}
                  </span>
                </span>
              </div>
            </div>

            {/* Right: Audio-Style Level Link / Calibration Knobs */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-black/60 px-3 py-1.5 rounded border border-stone-800">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 jewel-lamp-amber" />
                <div className="text-[10px] font-tech uppercase text-stone-300 tracking-wider">
                  DSP BUS: <span className="font-mono text-amber-300 font-bold">LOCKED</span>
                </div>
              </div>
              {/* Hex Bolts */}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="bolt-screw" />
                <span className="bolt-screw" />
              </div>
            </div>
          </div>

          {/* Live Rolling Analog Market Ticker Bar */}
          <div className="mt-3 pt-2.5 border-t border-stone-800/80 overflow-x-auto scroller-none flex items-center justify-between text-xs font-mono space-x-6 text-stone-300">
            <div className="flex items-center space-x-1 shrink-0 text-amber-400 font-tech uppercase text-[10px] tracking-wider bg-stone-900/90 px-2 py-0.5 rounded border border-amber-900/40">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
              </svg>
              <span>NYSE // NASDAQ SYNC</span>
            </div>

            {/* Market Ticker Items */}
            <div className="flex items-center space-x-6 shrink-0 divide-x divide-stone-800 text-[11px]">
              <div className="pl-4 flex items-center space-x-1.5">
                <span className="text-stone-400 font-semibold">US 10Y</span>
                <span className="text-stone-200">4.08%</span>
                <span className="text-rose-400 bg-rose-950/40 px-1 rounded text-[10px] font-code">-0.03%</span>
              </div>
              <div className="pl-4 flex items-center space-x-1.5">
                <span className="text-stone-400 font-semibold">S&amp;P 500</span>
                <span className="text-stone-200">5,864.20</span>
                <span className="text-emerald-400 bg-emerald-950/40 px-1 rounded text-[10px] font-code">+0.42%</span>
              </div>
              <div className="pl-4 flex items-center space-x-1.5">
                <span className="text-stone-400 font-semibold">NASDAQ</span>
                <span className="text-stone-200">20,412.10</span>
                <span className="text-emerald-400 bg-emerald-950/40 px-1 rounded text-[10px] font-code">+0.68%</span>
              </div>
              <div className="pl-4 flex items-center space-x-1.5">
                <span className="text-stone-400 font-semibold">TSLA</span>
                <span className="text-stone-200">$248.50</span>
                <span className="text-emerald-400 bg-emerald-950/40 px-1 rounded text-[10px] font-code">+3.20%</span>
              </div>
              <div className="pl-4 flex items-center space-x-1.5">
                <span className="text-stone-400 font-semibold">NVDA</span>
                <span className="text-stone-200">$138.90</span>
                <span className="text-emerald-400 bg-emerald-950/40 px-1 rounded text-[10px] font-code">+2.40%</span>
              </div>
              <div className="pl-4 flex items-center space-x-1.5">
                <span className="text-stone-400 font-semibold">AAPL</span>
                <span className="text-stone-200">$231.10</span>
                <span className="text-emerald-400 bg-emerald-950/40 px-1 rounded text-[10px] font-code">+0.15%</span>
              </div>
              <div className="pl-4 flex items-center space-x-1.5">
                <span className="text-stone-400 font-semibold">BTC/USD</span>
                <span className="text-stone-200">$67,450</span>
                <span className="text-rose-400 bg-rose-950/40 px-1 rounded text-[10px] font-code">-1.10%</span>
              </div>
              <div className="pl-4 flex items-center space-x-1.5">
                <span className="text-stone-400 font-semibold">GOLD</span>
                <span className="text-stone-200">$2,652.10</span>
                <span className="text-emerald-400 bg-emerald-950/40 px-1 rounded text-[10px] font-code">+0.80%</span>
              </div>
            </div>

            <div className="text-[10px] text-stone-500 font-mono tracking-tight shrink-0 hidden md:block">
              TIMESTAMP: {timestamp}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* TRIPLE MODULAR RACK PANELS GRID                                          */}
        {/* ========================================================================= */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x-2 divide-stone-900 bg-rack-panel" data-purpose="three-module-chassis">
          {/* ========================================================================= */}
          {/* MODULE 1 (LEFT): TAPE INGESTION & DATA CASSETTE TERMINAL                   */}
          {/* ========================================================================= */}
          <section className="lg:col-span-4 p-5 flex flex-col justify-between space-y-5 bg-[#14161a]" data-purpose="signal-ingestion-unit">
            {/* Module Header Stamp */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="bolt-screw" />
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-stone-200">
                  MODULE 01 // SIGNAL INGESTION
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  BUFFER: ARMED
                </span>
                <span className="bolt-screw" />
              </div>
            </div>

            {/* Vintage Data Tape Deck Emulation / CRT Display Screen */}
            <div className="anodized-bezel p-3 rounded-lg border border-stone-800 shadow-inner-deep flex flex-col space-y-2">
              {/* Screen Top Bar with Tape Reel Deco */}
              <div className="flex items-center justify-between pb-1 text-[10px] text-stone-400 border-b border-stone-800/80 font-mono">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-amber-400/90 tape-wheel" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="2" x2="12" y2="9" />
                    <line x1="12" y1="15" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="9" y2="12" />
                    <line x1="15" y1="12" x2="22" y2="12" />
                  </svg>
                  <span className="text-stone-300 font-tech font-semibold tracking-wider">REC BAY 01 // TEXT FEED</span>
                </div>
                <div className="flex items-center space-x-1 font-code text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>{String(inputText.length).padStart(4, '0')} / 2000 CHARS</span>
                </div>
              </div>

              {/* Screen Recessed Terminal Area */}
              <div className="relative bg-black/90 rounded border border-stone-900 p-3 crt-scanlines overflow-hidden">
                <div className="flex items-center space-x-2 text-[10px] font-code text-cyan-400/80 mb-1.5">
                  <span>&gt;_ RAW FINANCIAL DISCLOSURE INGESTION:</span>
                </div>
                <textarea
                  id="financial-input"
                  rows={6}
                  maxLength={2000}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter market headlines, earnings press releases, Fed statements, or crypto tweets to detect real-time sentiment signals..."
                  className="w-full bg-transparent border-0 text-xs sm:text-sm font-code text-emerald-300/95 leading-relaxed focus:ring-0 p-0 resize-none selection:bg-emerald-700 selection:text-white placeholder-stone-600 focus:outline-none"
                />
                <div className="mt-2 pt-2 border-t border-stone-900 flex items-center justify-between text-[9px] text-stone-500 font-mono">
                  <span>TOKENIZER: BPE (SUBWORD)</span>
                  <span>DEVICE: ACCELERATOR-CUDA-0</span>
                </div>
              </div>
            </div>

            {/* Hugging Face Spaces Cold-Start Telemetry Notice */}
            {backendStatus === 'waking' && (
              <div className="bg-amber-950/40 border border-amber-600/50 p-2.5 rounded text-[10px] font-mono text-amber-300 flex items-center justify-between shadow-inner animate-pulse">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="font-tech font-bold tracking-wide">
                    SPACES CONTAINER BOOTING UP FROM HIBERNATION...
                  </span>
                </div>
                <span className="text-[9px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded border border-amber-700/60 font-code">
                  EST: ~{Math.max(2, 25 - wakeElapsed)}s
                </span>
              </div>
            )}

            {/* Simulated Mode Warning if Offline */}
            {isSimulated && backendStatus !== 'online' && (
              <div className="bg-stone-900/90 border border-stone-700 p-2 rounded text-[10px] font-mono text-stone-400 flex items-center justify-between">
                <span>SIMULATION ENGINE ACTIVE (BACKEND RECONNECTING...)</span>
                <span className="text-amber-400 font-bold">FALLBACK</span>
              </div>
            )}

            {/* Big Industrial Push Button: ENGAGE QUANT CLASSIFIER */}
            <div className="py-1">
              <button
                id="btn-engage-classifier"
                onClick={handleAnalyze}
                disabled={loading}
                className="group w-full relative overflow-hidden rounded-md border-2 border-cyan-500/80 bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-900 p-3 text-stone-100 shadow-[0_6px_0_#0e4554,0_10px_20px_rgba(0,0,0,0.7)] active:translate-y-1 active:shadow-[0_2px_0_#0e4554] transition-all flex items-center justify-center space-x-3 cursor-pointer hover:brightness-110 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-4 h-4 rounded-full border border-cyan-200/50 flex items-center justify-center bg-cyan-400/20 group-hover:scale-110 transition-transform">
                  <svg className="w-2.5 h-2.5 text-cyan-200 fill-current" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1 11V7l5 3-5 3z" />
                  </svg>
                </div>
                <span className="font-tech font-bold text-sm tracking-widest uppercase text-white drop-shadow-md">
                  {loading
                    ? wakeAttempt > 1
                      ? `WAKING CONTAINER (RETRY ${wakeAttempt}/3)...`
                      : 'SAMPLING DSP WAVEFORM...'
                    : backendStatus === 'waking'
                    ? 'ENGAGE CLASSIFIER (AUTO-WAKE)'
                    : 'ENGAGE QUANT CLASSIFIER'}
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_#39ff14]" />
              </button>
            </div>

            {/* Quick-Patch Matrix Buttons (Transcript Presets) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-tech uppercase text-stone-400 tracking-wider">
                <span>TRANSCRIPT PRESET MATRIX</span>
                <span className="text-stone-500 font-mono">[CLICK TO PATCH]</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-left">
                {Object.entries(PRESET_TEXTS).map(([key, item]) => {
                  const isSelected = activePreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => selectPreset(key)}
                      className={`preset-card bg-stone-900/90 hover:bg-stone-800/90 border ${
                        isSelected ? 'border-cyan-400 ring-1 ring-cyan-400/50' : 'border-stone-800'
                      } hover:border-${item.color}-500/60 p-2.5 rounded transition-all text-left flex flex-col justify-between h-16 shadow-sm group cursor-pointer`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[9px] font-mono font-semibold text-${
                            item.color === 'emerald' ? 'emerald-400' : item.color === 'rose' ? 'rose-400' : item.color === 'amber' ? 'amber-400' : 'cyan-400'
                          } uppercase tracking-tight flex items-center gap-1`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.color === 'emerald' ? 'bg-emerald-400' : item.color === 'rose' ? 'bg-rose-400' : item.color === 'amber' ? 'bg-amber-400' : 'bg-cyan-400'
                            } group-hover:animate-ping`}
                          />
                          {item.subtitle}
                        </span>
                        <span className="text-[8px] font-mono text-stone-500">{item.code}</span>
                      </div>
                      <span className="text-[11px] font-code text-stone-200 font-medium truncate">
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security Module Stamped Enclave Plate */}
            <div className="bg-black/50 p-2.5 rounded border border-stone-800 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <div className="leading-tight">
                  <div className="text-stone-200 font-bold tracking-tight">HARDWARE ENCLAVE: ISOLATED</div>
                  <div className="text-[9px] text-stone-500">Strict Pydantic v2 · Zero external egress</div>
                </div>
              </div>
              {/* DIP Switches Visual */}
              <div className="flex space-x-1 bg-stone-900 px-1.5 py-1 rounded border border-stone-700">
                <span className="w-1.5 h-3 bg-emerald-500 rounded-xs" />
                <span className="w-1.5 h-3 bg-emerald-500 rounded-xs" />
                <span className="w-1.5 h-3 bg-stone-700 rounded-xs" />
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* MODULE 2 (CENTER): DUAL VU METERS & VINTAGE FREQUENCY TELEMETRY           */}
          {/* ========================================================================= */}
          <section className="lg:col-span-5 p-5 flex flex-col justify-between space-y-5 bg-[#17191e]" data-purpose="analog-meter-and-signal-unit">
            {/* Module Header Stamp */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="bolt-screw" />
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-amber-300">
                  MODULE 02 // DUAL VU BALISTIC DISCRIMINATOR
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                  ANALOG BALISTICS
                </span>
                <span className="bolt-screw" />
              </div>
            </div>

            {/* Physical Dual VU Meter Deck (Warm Amber Backlit Gauges) */}
            <div className="grid grid-cols-2 gap-3" data-purpose="dual-analog-vu-meters">
              {/* VU Channel A: BULLISH MOMENTUM */}
              <div className="anodized-bezel p-2 rounded-lg border border-stone-800 shadow-inner-deep flex flex-col items-center relative">
                <div className="w-full flex items-center justify-between text-[8px] font-tech text-stone-400 px-1 mb-1">
                  <span>CH-A: BULLISH</span>
                  <span className="text-emerald-400 font-bold">PEAK: {peakDbA}</span>
                </div>
                {/* Analog Meter Gauge Face (SVG) */}
                <div className="w-full h-28 rounded bg-[#f3ecd8] relative overflow-hidden border border-stone-700 shadow-inner">
                  <svg className="w-full h-full" viewBox="0 0 260 160">
                    <path d="M 30 135 A 115 115 0 0 1 230 135" fill="none" stroke="#222" strokeWidth="2" />
                    <path d="M 180 135 A 115 115 0 0 1 230 135" fill="none" stroke="#c02b2b" strokeWidth="4" />
                    {/* Ticks */}
                    <g stroke="#222" strokeWidth="1.5">
                      <line x1="40" x2="48" y1="126" y2="120" />
                      <line x1="65" x2="74" y1="95" y2="92" />
                      <line x1="95" x2="102" y1="72" y2="73" />
                      <line x1="130" x2="130" y1="60" y2="70" />
                      <line x1="165" x2="158" y1="72" y2="73" />
                      <line x1="195" x2="186" y1="95" y2="92" />
                      <line x1="220" x2="212" y1="126" y2="120" />
                    </g>
                    {/* Legend Labels */}
                    <text fill="#333" fontFamily="'Share Tech Mono'" fontSize="9" x="35" y="142">-20</text>
                    <text fill="#333" fontFamily="'Share Tech Mono'" fontSize="9" x="65" y="112">-10</text>
                    <text fill="#333" fontFamily="'Share Tech Mono'" fontSize="9" x="125" y="83">0</text>
                    <text fill="#a00" fontFamily="'Share Tech Mono'" fontSize="9" x="190" y="112">+2</text>
                    <text fill="#a00" fontFamily="'Share Tech Mono'" fontSize="9" x="215" y="142">+3</text>
                    <text fill="#665c49" fontFamily="'Chakra Petch'" fontSize="12" fontWeight="bold" letterSpacing="2" x="110" y="115">VU</text>
                    {/* Needle CH-A */}
                    <g
                      style={{
                        transformOrigin: '130px 145px',
                        transform: `rotate(${needleAngleA}deg)`,
                        transition: 'transform 0.55s cubic-bezier(0.18, 0.89, 0.32, 1.25)',
                      }}
                      className={loading ? 'animate-needle-ch1' : ''}
                    >
                      <line stroke="#b22222" strokeLinecap="round" strokeWidth="2" x1="130" x2="185" y1="145" y2="40" />
                      <circle cx="130" cy="145" fill="#111" r="7" />
                      <circle cx="130" cy="145" fill="#888" r="3" />
                    </g>
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                </div>
                <div className="w-full flex items-center justify-between text-[9px] font-mono text-stone-400 mt-1 px-1">
                  <span>BALLISTICS: FAST</span>
                  <span className={`w-2 h-2 rounded-full ${bullishProb > 60 ? 'bg-emerald-500 shadow-[0_0_6px_#39ff14]' : 'bg-stone-700'}`} />
                </div>
              </div>

              {/* VU Channel B: BEARISH PRESSURE */}
              <div className="anodized-bezel p-2 rounded-lg border border-stone-800 shadow-inner-deep flex flex-col items-center relative">
                <div className="w-full flex items-center justify-between text-[8px] font-tech text-stone-400 px-1 mb-1">
                  <span>CH-B: BEARISH</span>
                  <span className="text-rose-400 font-bold">PEAK: {peakDbB}</span>
                </div>
                {/* Analog Meter Gauge Face (SVG) */}
                <div className="w-full h-28 rounded bg-[#f3ecd8] relative overflow-hidden border border-stone-700 shadow-inner">
                  <svg className="w-full h-full" viewBox="0 0 260 160">
                    <path d="M 30 135 A 115 115 0 0 1 230 135" fill="none" stroke="#222" strokeWidth="2" />
                    <path d="M 180 135 A 115 115 0 0 1 230 135" fill="none" stroke="#c02b2b" strokeWidth="4" />
                    <g stroke="#222" strokeWidth="1.5">
                      <line x1="40" x2="48" y1="126" y2="120" />
                      <line x1="65" x2="74" y1="95" y2="92" />
                      <line x1="95" x2="102" y1="72" y2="73" />
                      <line x1="130" x2="130" y1="60" y2="70" />
                      <line x1="165" x2="158" y1="72" y2="73" />
                      <line x1="195" x2="186" y1="95" y2="92" />
                      <line x1="220" x2="212" y1="126" y2="120" />
                    </g>
                    <text fill="#333" fontFamily="'Share Tech Mono'" fontSize="9" x="35" y="142">-20</text>
                    <text fill="#333" fontFamily="'Share Tech Mono'" fontSize="9" x="65" y="112">-10</text>
                    <text fill="#333" fontFamily="'Share Tech Mono'" fontSize="9" x="125" y="83">0</text>
                    <text fill="#a00" fontFamily="'Share Tech Mono'" fontSize="9" x="190" y="112">+2</text>
                    <text fill="#a00" fontFamily="'Share Tech Mono'" fontSize="9" x="215" y="142">+3</text>
                    <text fill="#665c49" fontFamily="'Chakra Petch'" fontSize="12" fontWeight="bold" letterSpacing="2" x="110" y="115">VU</text>
                    {/* Needle CH-B */}
                    <g
                      style={{
                        transformOrigin: '130px 145px',
                        transform: `rotate(${needleAngleB}deg)`,
                        transition: 'transform 0.55s cubic-bezier(0.18, 0.89, 0.32, 1.25)',
                      }}
                      className={loading ? 'animate-needle-ch2' : ''}
                    >
                      <line stroke="#b22222" strokeLinecap="round" strokeWidth="2" x1="130" x2="185" y1="145" y2="40" />
                      <circle cx="130" cy="145" fill="#111" r="7" />
                      <circle cx="130" cy="145" fill="#888" r="3" />
                    </g>
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                </div>
                <div className="w-full flex items-center justify-between text-[9px] font-mono text-stone-400 mt-1 px-1">
                  <span>OVERLOAD: SAFE</span>
                  <span className={`w-2 h-2 rounded-full ${bearishProb > 60 ? 'bg-rose-500 shadow-[0_0_6px_#ff3344]' : 'bg-stone-700'}`} />
                </div>
              </div>
            </div>

            {/* Primary Output Marquee & Nixie-Style Readout */}
            <div className="bg-black/80 rounded-lg p-3 border-2 border-stone-800 shadow-inner flex flex-col items-center justify-center text-center space-y-2">
              <div className="text-[9px] font-tech tracking-widest text-stone-400 uppercase">
                PRIMARY INFERENCE SIGNAL OUTPUT
              </div>
              {/* Glowing Marquee Badge */}
              <div
                className={`w-full ${
                  result.signal === 'BULLISH'
                    ? 'bg-emerald-950/40 border-2 border-emerald-500/70 shadow-[0_0_15px_rgba(0,240,144,0.18)]'
                    : result.signal === 'BEARISH'
                    ? 'bg-rose-950/40 border-2 border-rose-500/70 shadow-[0_0_15px_rgba(255,51,68,0.18)]'
                    : 'bg-amber-950/40 border-2 border-amber-500/70 shadow-[0_0_15px_rgba(255,170,0,0.18)]'
                } rounded py-2 px-4 flex items-center justify-between`}
              >
                <div className="flex items-center space-x-2">
                  {result.signal === 'BULLISH' ? (
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                  ) : result.signal === 'BEARISH' ? (
                    <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                  )}
                  <span
                    className={`font-tech text-xl sm:text-2xl font-bold tracking-wider ${
                      result.signal === 'BULLISH'
                        ? 'text-emerald-300 glow-green'
                        : result.signal === 'BEARISH'
                        ? 'text-rose-300 glow-red'
                        : 'text-amber-300 glow-amber'
                    } uppercase`}
                  >
                    {result.signal === 'BULLISH' && result.confidence > 85
                      ? 'STRONG BULLISH'
                      : result.signal === 'BEARISH' && result.confidence > 85
                      ? 'STRONG BEARISH'
                      : result.signal}
                  </span>
                </div>
                {/* Confidence Score Nixie Tube style */}
                <div className="text-right">
                  <div className="text-[8px] font-mono text-stone-400">CERTAINTY</div>
                  <div className="text-2xl font-code font-bold text-amber-400 glow-amber">
                    {result.confidence.toFixed(1)}
                    <span className="text-base text-amber-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Triple Rotary Knobs: Physical Audio Lab Potentiometers */}
            <div className="grid grid-cols-3 gap-2 bg-stone-900/60 p-2.5 rounded border border-stone-800 text-center">
              {/* Knob 1 */}
              <div
                className="flex flex-col items-center space-y-1 cursor-pointer"
                onClick={() => setRotaryAngles((p) => ({ ...p, sens: (p.sens + 30) % 360 }))}
              >
                <span className="text-[8px] font-tech uppercase text-stone-400">SENSITIVITY</span>
                <div className="w-12 h-12 rounded-full bg-stone-800 border-2 border-stone-600 shadow-knob flex items-center justify-center relative group hover:border-amber-400 transition-colors">
                  <div className="absolute inset-1 rounded-full bg-gradient-to-b from-stone-700 to-stone-900 flex items-center justify-center">
                    <div
                      className="w-1 h-3.5 bg-amber-400 rounded-full shadow-[0_0_4px_#ffaa00] transition-transform"
                      style={{ transform: `rotate(${rotaryAngles.sens}deg) translateY(-8px)` }}
                    />
                  </div>
                </div>
                <span className="text-[9px] font-mono text-amber-300 font-bold">0.85 TH</span>
              </div>
              {/* Knob 2 */}
              <div
                className="flex flex-col items-center space-y-1 cursor-pointer"
                onClick={() => setRotaryAngles((p) => ({ ...p, decay: (p.decay + 30) % 360 }))}
              >
                <span className="text-[8px] font-tech uppercase text-stone-400">ATTN DECAY</span>
                <div className="w-12 h-12 rounded-full bg-stone-800 border-2 border-stone-600 shadow-knob flex items-center justify-center relative group hover:border-cyan-400 transition-colors">
                  <div className="absolute inset-1 rounded-full bg-gradient-to-b from-stone-700 to-stone-900 flex items-center justify-center">
                    <div
                      className="w-1 h-3.5 bg-cyan-400 rounded-full shadow-[0_0_4px_#00f0ff] transition-transform"
                      style={{ transform: `rotate(${rotaryAngles.decay}deg) translateY(-8px)` }}
                    />
                  </div>
                </div>
                <span className="text-[9px] font-mono text-cyan-300 font-bold">128 MS</span>
              </div>
              {/* Knob 3 */}
              <div
                className="flex flex-col items-center space-y-1 cursor-pointer"
                onClick={() => setRotaryAngles((p) => ({ ...p, damp: (p.damp + 30) % 360 }))}
              >
                <span className="text-[8px] font-tech uppercase text-stone-400">DAMPING</span>
                <div className="w-12 h-12 rounded-full bg-stone-800 border-2 border-stone-600 shadow-knob flex items-center justify-center relative group hover:border-emerald-400 transition-colors">
                  <div className="absolute inset-1 rounded-full bg-gradient-to-b from-stone-700 to-stone-900 flex items-center justify-center">
                    <div
                      className="w-1 h-3.5 bg-emerald-400 rounded-full shadow-[0_0_4px_#39ff14] transition-transform"
                      style={{ transform: `rotate(${rotaryAngles.damp}deg) translateY(-8px)` }}
                    />
                  </div>
                </div>
                <span className="text-[9px] font-mono text-emerald-300 font-bold">0.42 Q</span>
              </div>
            </div>

            {/* 3-Way Analog Momentum Channel Sliders / Faders */}
            <div className="space-y-2 bg-black/60 p-3 rounded border border-stone-800" data-purpose="three-channel-faders">
              <div className="text-[9px] font-tech uppercase tracking-wider text-stone-400 flex justify-between">
                <span>DISCRETE PROBABILITY CHANNELS</span>
                <span className="font-mono text-stone-500">SUM = 1.000</span>
              </div>
              {/* Channel 1: Bullish Fader */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    BULLISH MOMENTUM
                  </span>
                  <span className="text-emerald-400 font-bold font-code">{bullishProb.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-stone-950 rounded border border-stone-800 p-0.5 relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded shadow-[0_0_8px_rgba(0,240,144,0.5)] transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, bullishProb))}%` }}
                  />
                </div>
              </div>
              {/* Channel 2: Neutral Fader */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    NEUTRAL NOISE
                  </span>
                  <span className="text-amber-400 font-bold font-code">{neutralProb.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-stone-950 rounded border border-stone-800 p-0.5 relative">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded shadow-[0_0_8px_rgba(255,170,0,0.5)] transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, neutralProb))}%` }}
                  />
                </div>
              </div>
              {/* Channel 3: Bearish Fader */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    BEARISH PRESSURE
                  </span>
                  <span className="text-rose-400 font-bold font-code">{bearishProb.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-stone-950 rounded border border-stone-800 p-0.5 relative">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded shadow-[0_0_8px_rgba(255,51,68,0.5)] transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, bearishProb))}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* MODULE 3 (RIGHT): MODEL ARCHITECTURE & RACK TELEMETRY                     */}
          {/* ========================================================================= */}
          <section className="lg:col-span-3 p-5 flex flex-col justify-between space-y-5 bg-[#14161a]" data-purpose="telemetry-and-architecture-unit">
            {/* Module Header Stamp */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="bolt-screw" />
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-stone-200">
                  MODULE 03 // DSP ARCHITECTURE
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  CALIBRATED
                </span>
                <span className="bolt-screw" />
              </div>
            </div>

            {/* Architecture Specifications Faceplate */}
            <div className="bg-black/70 rounded-lg border border-stone-800 p-3.5 space-y-3 shadow-inner">
              <div className="text-[10px] font-tech uppercase tracking-wider text-stone-400 border-b border-stone-800 pb-1 flex items-center justify-between">
                <span>MODEL TELEMETRY SPECIFICATION</span>
                <span className="text-cyan-400 font-mono">CUDA // FP16</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-mono">Core Architecture:</span>
                  <span className="text-stone-100 font-code font-bold bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                    distilbert-base-uncased
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-mono">Validation Accuracy:</span>
                  <span className="text-emerald-400 font-code font-bold glow-green">86.89%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-mono">Macro F1-Score:</span>
                  <span className="text-emerald-400 font-code font-bold glow-green">82.84%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-mono">Benchmark Dataset:</span>
                  <span className="text-amber-300 font-code">twitter-financial-news</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-mono">Parameter Count:</span>
                  <span className="text-cyan-300 font-code font-bold">66.3M Parameters</span>
                </div>
              </div>
            </div>

            {/* Production Microservice Patchbay & Relay Matrix */}
            <div className="space-y-2.5 bg-stone-900/80 p-3 rounded border border-stone-800" data-purpose="microservice-patchbay">
              <div className="text-[10px] font-tech uppercase tracking-wider text-stone-400 flex items-center justify-between">
                <span>PRODUCTION MICROSERVICE RELAYS</span>
                <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ALL RELAYS ENGAGED
                </span>
              </div>
              <div className="space-y-2">
                {/* Relay 1 */}
                <div className="flex items-center justify-between bg-black/60 p-2 rounded border border-stone-800 text-[11px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#39ff14]" />
                    <span className="text-stone-300 font-medium">FastAPI Asynchronous Layer</span>
                  </div>
                  <span className="text-[9px] text-stone-500 font-code">asyncio_thread</span>
                </div>
                {/* Relay 2 */}
                <div className="flex items-center justify-between bg-black/60 p-2 rounded border border-stone-800 text-[11px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#39ff14]" />
                    <span className="text-stone-300 font-medium">Docker SDK Container</span>
                  </div>
                  <span className="text-[9px] text-stone-500 font-code">UID 1000 Isolated</span>
                </div>
                {/* Relay 3 */}
                <div className="flex items-center justify-between bg-black/60 p-2 rounded border border-stone-800 text-[11px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#39ff14]" />
                    <span className="text-stone-300 font-medium">Self-Healing Hub Fallback</span>
                  </div>
                  <span className="text-[9px] text-stone-500 font-code">Auto-Failover</span>
                </div>
                {/* Relay 4 */}
                <div className="flex items-center justify-between bg-black/60 p-2 rounded border border-stone-800 text-[11px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#39ff14]" />
                    <span className="text-stone-300 font-medium">Next.js 14 Web App</span>
                  </div>
                  <span className="text-[9px] text-stone-500 font-code">Vercel Edge</span>
                </div>
              </div>
            </div>

            {/* Engraved Bottom Stamp Plate with Navigation Toggles */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded p-3 text-[11px] font-mono flex flex-col justify-between space-y-2">
              <div className="text-stone-400 text-[10px]">
                Engineered by <span className="text-stone-100 font-bold">Assubki</span> for Quantitative Alpha &amp; Risk Analysis
              </div>
              <div className="flex items-center space-x-3 pt-1">
                <a
                  className="flex-1 bg-stone-950 hover:bg-stone-900 text-stone-300 hover:text-white px-2.5 py-1.5 rounded border border-stone-800 hover:border-cyan-500/80 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                  href="https://huggingface.co/assubki"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z" />
                  </svg>
                  <span className="text-[10px] font-tech font-bold uppercase tracking-wider">HuggingFace Space</span>
                </a>
                <a
                  className="flex-1 bg-stone-950 hover:bg-stone-900 text-stone-300 hover:text-white px-2.5 py-1.5 rounded border border-stone-800 hover:border-emerald-500/80 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                  href="https://github.com/subki72/quant-market-sentiment-engine"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span className="text-[10px] font-tech font-bold uppercase tracking-wider">GitHub Repo</span>
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* ========================================================================= */}
        {/* CHASSIS BOTTOM RAIL WITH CALIBRATION JACKS                                */}
        {/* ========================================================================= */}
        <footer className="h-8 bg-[#0e1014] border-t-2 border-stone-900 flex items-center justify-between px-6" data-purpose="bottom-chassis-rail">
          <div className="flex items-center space-x-4 text-[9px] font-mono text-stone-500">
            <span className="bolt-screw" />
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-stone-900 border-2 border-stone-700 shadow-inner inline-block" />
              <span className="uppercase">SIGNAL IN [UNBALANCED]</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-stone-900 border-2 border-stone-700 shadow-inner inline-block" />
              <span className="uppercase">SYNC CLK [TTL]</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-[9px] font-mono text-stone-600 uppercase">
              IMPEDANCE: 600 OHM // VOLTAGE: +/- 15V RAILS
            </div>
            <span className="bolt-screw" />
          </div>
        </footer>
      </div>
    </div>
  );
}
