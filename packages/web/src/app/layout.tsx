import type { Metadata } from "next";
import { SearchBar } from "../components/SearchBar";
import { Providers } from "../components/Providers";
import { HeaderNav } from "../components/HeaderNav";
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
        <Providers>
          <Header />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

function Header() {
  const apiDocsUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api-docs`;
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-bold text-polkadot-pink">
            Polka-Xplo
          </span>
        </a>

        <SearchBar />

        <HeaderNav apiDocsUrl={apiDocsUrl} />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-500">
      Polka-Xplo &mdash; Modular Polkadot Explorer &mdash; Powered by PAPI
    </footer>
  );
}
