import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'CareLink - Companionship & Assistance Platform',
  description: 'Connect with local helpers for companionship and everyday assistance',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets content extend into notch/home-indicator areas so env(safe-area-inset-*)
  // actually resolves to a real value instead of 0 on iPhones. Pinch-zoom is left
  // enabled (no maximumScale) for accessibility; inputs use 16px+ font-size instead
  // to stop iOS Safari's forced zoom-on-focus.
  viewportFit: 'cover',
  // Shrinks the visual viewport when the on-screen keyboard opens (instead of
  // overlaying it on top of the page) so fixed/sticky UI — the bottom nav, the
  // sticky Save button — moves above the keyboard instead of being hidden under it.
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}


          <script
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    `,
  }}
/>
        </AuthProvider>
      </body>
    </html>
  );
}