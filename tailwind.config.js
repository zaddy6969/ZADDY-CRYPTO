/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          bg: "#050811",
          panel: "#0c1322",
          panelStrong: "#08101c",
          border: "rgba(158, 184, 255, 0.14)",
          borderStrong: "rgba(120, 170, 255, 0.3)",
          text: "#edf3ff",
          muted: "#94a8cb",
          blue: "#66b6ff",
          violet: "#8e6bff",
          cyan: "#7ae7ff",
          green: "#7dd3ae",
          red: "#f1a0ae"
        }
      },
      boxShadow: {
        glass: "0 28px 90px rgba(0, 0, 0, 0.42)",
        glow: "0 18px 70px rgba(102, 182, 255, 0.16)"
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      backgroundImage: {
        "arc-shell":
          "radial-gradient(circle at top left, rgba(102, 182, 255, 0.18), transparent 22%), radial-gradient(circle at top right, rgba(142, 107, 255, 0.14), transparent 26%), linear-gradient(180deg, #070b14 0%, #04070f 100%)",
        "arc-panel":
          "linear-gradient(180deg, rgba(12, 18, 32, 0.96), rgba(9, 14, 24, 0.94))",
        "arc-highlight":
          "linear-gradient(135deg, rgba(102, 182, 255, 0.2), rgba(142, 107, 255, 0.08))"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-3px)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(102, 182, 255, 0)" },
          "50%": { boxShadow: "0 0 28px rgba(102, 182, 255, 0.18)" }
        },
        shimmerX: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
        shimmer: "shimmerX 1.6s linear infinite"
      }
    }
  },
  plugins: []
};
