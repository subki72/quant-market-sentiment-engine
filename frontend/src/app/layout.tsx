import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QUANT MARKET SENTIMENT ENGINE // UNIT MOD-01',
  description:
    'FINE-TUNED DISTILBERT NLP MICROSERVICE // HIGH-THROUGHPUT REALTIME ALPHA CORE (SERIES 884-MKII 4U RACK)',
  keywords: ['quant', 'sentiment analysis', 'nlp', 'distilbert', 'finance', 'fastapi'],
  authors: [{ name: 'Assubki' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-stone-950">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;700;800&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
        {/* Tailwind CDN with container queries and forms plugins */}
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" />
        {/* Hardware & Rack Design System Config */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      mono: ['"Share Tech Mono"', 'monospace'],
                      code: ['"JetBrains Mono"', 'monospace'],
                      tech: ['"Chakra Petch"', 'sans-serif'],
                    },
                    colors: {
                      rack: {
                        base: '#111317',
                        panel: '#181b20',
                        metal: '#20242b',
                        bezel: '#0d0e12',
                        border: '#2e3440',
                        screws: '#3e4451',
                      },
                      amber: {
                        glow: '#ffaa00',
                        dim: '#7c4d00',
                        tube: '#ffbd4a',
                      },
                      phosphor: {
                        green: '#00f090',
                        dim: '#005936',
                        bright: '#39ff14',
                      },
                      crimson: {
                        alarm: '#ff3344',
                        dim: '#590e15',
                      }
                    },
                    boxShadow: {
                      'inner-deep': 'inset 0 3px 8px rgba(0,0,0,0.85), inset 0 1px 2px rgba(0,0,0,0.95)',
                      'beveled': '0 1px 0 rgba(255,255,255,0.08), 0 -1px 0 rgba(0,0,0,0.7)',
                      'chassis': '0 25px 60px -15px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)',
                      'knob': '0 4px 10px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.3)',
                    }
                  }
                }
              };
            `,
          }}
        />
      </head>
      <body className="min-h-screen text-stone-300 font-mono flex flex-col items-center justify-start p-2 sm:p-4 antialiased selection:bg-amber-500 selection:text-black bg-stone-950">
        {children}
      </body>
    </html>
  );
}
