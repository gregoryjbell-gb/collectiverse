import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Collectiverse — AI-Powered Collectible Intelligence',
  description: 'Transforming Trading Cards Into Interactive Collectibles. Every Card Has a Story.',
  openGraph: {
    title: 'Collectiverse',
    description: 'AI-Powered Collectible Intelligence Platform',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Collectiverse',
    description: 'AI-Powered Collectible Intelligence Platform',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-navy text-white font-sans antialiased">
        <Navbar />
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}
