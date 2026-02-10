import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polka-Xplo | Polkadot Explorer",
  description:
    "A modular, metadata-driven blockchain explorer for the Polkadot ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-bold text-polkadot-pink">
            Polka-Xplo
          </span>
        </a>

        <SearchBar />

        <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
          <a href="/" className="hover:text-zinc-100 transition-colors">
            Blocks
          </a>
          <a
            href="/chain-state/System/Account"
            className="hover:text-zinc-100 transition-colors"
          >
            Chain State
          </a>
        </nav>
      </div>
    </header>
  );
}

function SearchBar() {
  return (
    <form action="/api/search-redirect" method="GET" className="flex-1 max-w-xl">
      <input
        name="q"
        type="text"
        placeholder="Search by block, transaction hash, or address..."
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-polkadot-pink/50 focus:ring-1 focus:ring-polkadot-pink/30 transition-colors"
      />
    </form>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-500">
      Polka-Xplo &mdash; Modular Polkadot Explorer &mdash; Powered by PAPI
    </footer>
  );
}
