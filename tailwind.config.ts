import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				display: ['Space Grotesk', 'sans-serif'],
				sans: ['Inter', 'sans-serif'],
			},
			backdropBlur: {
				xs: '2px',
			},
			colors: {
				// Trinity Glass UI Colors
				glass: {
					bg: 'rgba(255, 255, 255, 0.07)',
					border: 'rgba(255, 255, 255, 0.1)',
					hover: 'rgba(255, 255, 255, 0.12)',
					active: 'rgba(255, 255, 255, 0.15)',
				},
				// HarvestPro Theme Colors
				harvest: {
					primary: '#ed8f2d',
					'primary-dark': '#B8722E',
					'primary-light': '#FFC766',
					accent: '#E6A532',
					secondary: '#14b8a6',
					'secondary-dark': '#0d9488',
					'secondary-light': '#06b6d4',
				},
				// Hunter Theme Colors
				mint: '#00E0C2',
				amber: '#ff8c42',
				surface: {
					DEFAULT: '#F9FBFF',
					dark: '#0C1221',
					darker: '#0E152D'
				},
				ocean: {
					light: '#EBF3FF',
					dark: '#131B33',
					darker: '#0E152D'
				},
				brand: {
					main: '#3871F3',
					light: '#6DC9F7',
					dark: '#034093',
					indigo: '#6366F1',
					violet: '#8B5CF6',
					deep: '#212121',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground)),'
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: '#3BFFAE',
					text: '#0D2A25',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: '#FFD84D',
					text: '#2D2600',
					foreground: 'hsl(var(--warning-foreground))'
				},
				danger: {
					DEFAULT: '#FF7B7B',
					text: '#3B0000'
				},
				premium: {
					DEFAULT: 'hsl(var(--premium))',
					foreground: 'hsl(var(--premium-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				text: {
					'high-contrast': 'hsl(var(--text-high-contrast))',
					'medium-contrast': 'hsl(var(--text-medium-contrast))',
					'low-contrast': 'hsl(var(--text-low-contrast))'
				},
				interactive: {
					primary: 'hsl(var(--interactive-primary))',
					secondary: 'hsl(var(--interactive-secondary))',
					muted: 'hsl(var(--interactive-muted))'
				}
			},
			boxShadow: {
				'card-dark': '0 0 0 1px rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.35)',
				'card-glow-blue': '0 0 12px rgba(56,113,243,0.25)',
				'card-glow-green': '0 0 12px rgba(59,255,174,0.25)',
				'card-glow-amber': '0 0 12px rgba(255,216,77,0.25)',
				'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
				'glow': '0 0 20px rgba(16, 185, 129, 0.3)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				particles: {
					'0%': { transform: 'translateY(0px) rotate(0deg)', opacity: '0' },
					'10%': { opacity: '1' },
					'90%': { opacity: '1' },
					'100%': { transform: 'translateY(-100vh) rotate(360deg)', opacity: '0' }
				},
				shimmer: {
					'0%': { opacity: '0.5' },
					'50%': { opacity: '1' },
					'100%': { opacity: '0.5' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'particles': 'particles 20s linear infinite',
				'shimmer': 'shimmer 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
