import { Anton, Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'FaZe Draft',
  description: 'Scout the next FaZe star.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        <header className="border-b border-white/10">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-4">
            <Link href="/" className="font-display text-2xl">
              FaZe <span className="text-[#E4002B]">Draft</span>
            </Link>
            <div className="flex flex-wrap gap-5 text-sm text-white/70">
              <Link href="/draft" className="hover:text-white">Draft</Link>
              <Link href="/leaderboard" className="hover:text-white">Leaderboard</Link>
              <Link href="/watchlist" className="hover:text-white">FaZe Watchlist</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
