import Link from "next/link";
import "./globals.css";

import { AuthProvider } from "./components/AuthProvider";
import AccountMenu from "./components/AccountMenu";

export const metadata = {
  title: "FaZe Draft — A New Odyssey",
  description:
    "Assemble your crew. Discover the next generation of gaming creators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="od-header">
            <Link href="/" className="od-brand">
              FAZE <span>DRAFT</span>
              <small>THE SCOUT’S ODYSSEY</small>
            </Link>

            <nav
              className="od-nav"
              aria-label="Main navigation"
            >
              <Link href="/draft">Draft your crew</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/watchlist">Watchlist</Link>
            </nav>

            <AccountMenu />
          </header>

          <main className="od-main">{children}</main>

          <footer className="od-footer">
            <span>FAZE DRAFT / THE JOURNEY BEGINS</span>

            <span>
              Unofficial prototype · Free to play · Virtual budget
            </span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
