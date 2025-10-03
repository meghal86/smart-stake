/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        'xs': '375px', // Extra small devices
        'mobile': '480px', // Mobile devices
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        premium: "#fbbf24",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "tip-fade-in": {
          "0%": { opacity: "0", transform: "translateY(-8px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        microPulse: {
          "0%": { transform: "scale(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" },
          "50%": { transform: "scale(1.035)", boxShadow: "0 8px 24px rgba(0,0,0,.25)" },
          "100%": { transform: "scale(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" }
        },
        breathe: {
          "0%": { opacity: "0.7", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0.7", transform: "scale(0.98)" }
        },
        glowSweep: {
          "0%": { boxShadow: "0 0 0 0 rgba(56,189,248,0)" },
          "40%": { boxShadow: "0 0 0 12px rgba(56,189,248,0.15)" },
          "100%": { boxShadow: "0 0 0 0 rgba(56,189,248,0)" }
        },
        milestoneGlow: {
          "0%": { boxShadow: "0 0 0 0 rgba(255,138,76,0)", transform: "scale(1)" },
          "50%": { boxShadow: "0 0 20px 8px rgba(255,138,76,0.3)", transform: "scale(1.02)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,138,76,0)", transform: "scale(1)" }
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100px) rotate(360deg)", opacity: "0" }
        },
        graduation: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "20%": { transform: "scale(1.1)", opacity: "0.8" },
          "40%": { transform: "scale(0.9)", opacity: "0.6" },
          "60%": { transform: "scale(1.05)", opacity: "0.4" },
          "80%": { transform: "scale(0.95)", opacity: "0.2" },
          "100%": { transform: "scale(1)", opacity: "0" }
        },
        checkGlow: {
          "0%": { transform: "scale(0) rotate(-45deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(-45deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-45deg)", opacity: "0.8" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        gentlePulse: {
          "0%, 100%": { opacity: "0.98", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1)" }
        },
        slideIn: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "tip-fade-in": "tip-fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        microPulse: "microPulse 900ms ease-out 1",
        breathe: "breathe 3s ease-in-out infinite",
        "streak-celebrate": "glowSweep 1200ms ease-out 1",
        "milestone-glow": "milestoneGlow 2000ms ease-out 1",
        confetti: "confetti 1500ms ease-out 1",
        graduation: "graduation 1200ms ease-out 1",
        "check-glow": "checkGlow 800ms ease-out 1",
        shimmer: "shimmer 2.5s linear infinite",
        gentlePulse: "gentlePulse 1.8s ease-in-out infinite",
        slideIn: "slideIn 240ms ease-out",
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      minWidth: {
        'touch': '44px', // Minimum touch target size
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}