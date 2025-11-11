/**
 * HunterFooter Component
 * 
 * Footer for the Hunter screen with app navigation and legal links.
 * Uses translucent background with backdrop blur for AlphaWhale v1.0 design.
 * 
 * Requirements:
 * - 7.6: Footer with navigation links (Portfolio, Guardian, Scanner, etc.)
 * - 9.12: Footer link to Privacy, Disclosures, and Risk pages
 * 
 * @module components/hunter/HunterFooter
 */

import React from 'react';
import { Briefcase, Shield, Radar, Target, Home } from 'lucide-react';

export function HunterFooter() {
  const appLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Portfolio', path: '/portfolio-enhanced', icon: Briefcase },
    { label: 'Guardian', path: '/guardian', icon: Shield },
    { label: 'Scanner', path: '/scanner', icon: Radar },
    { label: 'Hunter', path: '/hunter', icon: Target },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Disclosures', path: '/disclosures' },
    { label: 'Risk Warning', path: '/risk' },
    { label: 'Terms of Service', path: '/terms' },
  ];

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <footer className="border-t border-border/40 bg-background/70 backdrop-blur-md mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* App Navigation */}
        <nav 
          className="flex flex-wrap justify-center gap-6 mb-6"
          aria-label="App navigation"
        >
          {appLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => handleNavigation(link.path)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00F5A0] transition-colors duration-200"
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Legal Links */}
        <nav 
          className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-3"
          aria-label="Legal navigation"
        >
          {legalLinks.map((link, index) => (
            <React.Fragment key={link.path}>
              {index > 0 && <span className="text-border" aria-hidden="true">•</span>}
              <a
                href={link.path}
                className="hover:text-[#00F5A0] transition-colors duration-200"
              >
                {link.label}
              </a>
            </React.Fragment>
          ))}
        </nav>

        {/* Copyright */}
        <div className="text-xs text-center text-muted-foreground/70 mb-2">
          © 2025 AlphaWhale. All rights reserved.
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-center text-muted-foreground/60 max-w-2xl mx-auto">
          Not financial advice. Rewards are variable and may change. Always conduct your own research.
        </div>
      </div>
    </footer>
  );
}
