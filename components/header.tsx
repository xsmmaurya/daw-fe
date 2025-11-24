// /Users/xsm/Documents/workspace/srotas-space/FE/srotas-fe/components/header.tsx
"use client";

import Link from "next/link";
import ToggleTheme from "./toggle-theme";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link className="brand" href="/">
          <Logo className="logo" />
          <span>Srotas Space</span>
        </Link>

        <nav className="topnav" aria-label="Main Navigation">
          <Link href="/open-source">Open Source</Link>
          {/*<Link href="/aws">AWS</Link>*/}

          {/*<div className="menu-group">
            <button className="menu-label">Srotas Suite ▾</button>
            <div className="menu-pop">
              <Link href="/srotas/vector">Vector</Link>
              <Link href="/srotas/crypto">Crypto</Link>
              <Link href="/srotas/bridge">Bridge</Link>
              <Link href="/srotas/shield">Shield</Link>
            </div>
          </div>
*/}
          <Link href="/solutions">Solutions</Link>
          {/*<Link href="/about">About</Link>*/}
        </nav>

        <ToggleTheme />
      </div>
    </header>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl shadow-sm ${className}`}
      style={{
        width: 44,
        height: 44,
        backgroundColor: "#0E7686",
      }}
    >
      <img
        src="/srotas.png"
        alt="Srotas logo"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
        }}
      />
    </div>
  );
}

