import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b border-emerald-200/70 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href="/" className="font-semibold text-moss">Food Forest Forge</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/design/new">New Design</Link>
              <Link href="/library">Plant Library</Link>
              <Link href="/about">About</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
      </body>
    </html>
  );
}
