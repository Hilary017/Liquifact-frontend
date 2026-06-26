import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import { ToastProvider } from "../components/ToastProvider";
import { WalletProvider } from "../components/WalletProvider";
import ThemeToggle, { THEME_STORAGE_KEY, THEMES } from "../components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LiquiFact — Global Invoice Liquidity on Stellar",
  description:
    "Tokenized invoice financing for SMEs. Unlock liquidity from unpaid invoices on the Stellar network.",
};

/**
 * Inline script that runs synchronously before the first paint to set the
 * correct data-theme attribute on <html>.  Reads the user's stored preference
 * from localStorage (or falls back to the OS colour-scheme media query).
 * Inlining avoids the "flash of incorrect theme" that would occur if we let
 * React hydrate first.
 *
 * The script must be a string constant because Next.js serialises it into
 * a <script> tag at the HTML level.  dangerouslySetInnerHTML is intentional
 * and safe here — the content is a static literal, not user-supplied data.
 */
const THEME_SCRIPT = `(function(){
  var key = '${THEME_STORAGE_KEY}';
  var themes = ${JSON.stringify(THEMES)};
  var pref = 'system';
  try { var s = localStorage.getItem(key); if (s && themes.indexOf(s) !== -1) pref = s; } catch(e){}
  var effective = pref;
  if (pref === 'system') {
    effective = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', effective);
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/*
        Pre-paint theme script: runs synchronously before React hydrates,
        eliminating the flash of incorrect theme (FOIT-equivalent for themes).
      */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip link: first focusable element so keyboard users can bypass the header */}
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ToastProvider>
          <WalletProvider>{children}</WalletProvider>
        </ToastProvider>
        {/* Theme toggle — fixed to top-right, above all other content */}
        <div className="fixed top-3 right-16 z-50 md:right-20">
          <ThemeToggle />
        </div>
        <Footer />
      </body>
    </html>
  );
}
