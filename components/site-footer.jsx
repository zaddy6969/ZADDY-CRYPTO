import { arcTestnet } from "../lib/arc-chain";

const GITHUB_URL = "https://github.com/zaddy6969/ZADDY-CRYPTO";
const X_URL = "https://x.com/ARC_AI_WALLET";
const ARC_DOCS_URL = "https://docs.arc.io/";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="section-kicker">Ecosystem</p>
        <strong>Build on Arc</strong>
      </div>
      <div className="footer-links">
        <a href={X_URL} target="_blank" rel="noreferrer">
          X
        </a>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={ARC_DOCS_URL} target="_blank" rel="noreferrer">
          Arc Docs
        </a>
        <a href={arcTestnet.blockExplorers.default.url} target="_blank" rel="noreferrer">
          ArcScan
        </a>
      </div>
    </footer>
  );
}
