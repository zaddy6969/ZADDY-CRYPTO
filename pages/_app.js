import "@rainbow-me/rainbowkit/styles.css";
import AppProviders from "../components/app-providers";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <AppProviders>
      <Component {...pageProps} />
    </AppProviders>
  );
}
