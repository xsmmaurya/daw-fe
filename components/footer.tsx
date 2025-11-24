import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-modern">
      <div className="footer-content">
        {/* Left side */}
        <div className="footer-left">
          <div className="footer-logo">
            <Logo className="footer-logo-svg" />
            <h3>Srotas Space</h3>
        </div>
        </div>

        {/* Middle nav */}
        <div className="footer-nav">
          <div>
            <h4>Products</h4>
            <Link href="/srotas/vector">Srotas Vector</Link>
            <Link href="/srotas/crypto">Srotas Crypto</Link>
            <Link href="/srotas/bridge">Srotas Bridge</Link>
            <Link href="/srotas/shield">Srotas Shield</Link>
          </div>
          <div>
            <h4>Resources</h4>
            <Link href="/open-source">Open Source</Link>
            <Link href="/solutions">Solutions</Link>
            <Link href="/discussions">Community</Link>
            <Link href="/contact-us">Contact Us</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="mailto:hello@srotas.space">Contact</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {year} Srotas Space Tech •{" "}
          <a href="https://srotas.space" target="_blank" rel="noreferrer">
            srotas.space
          </a>
        </p>
        <div className="footer-social">
          <a href="https://github.com/srotas-space" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://x.com/xsmmaurya" target="_blank" rel="noreferrer">X</a>
          <a href="https://www.linkedin.com/in/xsmmaurya" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}

/* Shared logo component reused from header */
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
