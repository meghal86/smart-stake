/**
 * NavigationRouter - Enforces canonical route mapping
 * 
 * Requirements: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS
 * Design: Navigation Architecture → Route Canonicalization & Enforcement
 */

export type RouteId = "home" | "guardian" | "hunter" | "harvestpro" | "portfolio" | "settings" | "cockpit";
export type CanonicalTab = "scan" | "risks" | "alerts" | "history" | "all" | "airdrops" | "quests" | "yield";

export interface CanonicalRoute {
  id: RouteId;
  path: string;          // e.g. "/hunter"
  tab?: CanonicalTab;    // normalized from query param
  canonicalUrl: string;  // e.g. "/hunter?tab=quests"
}

export interface RouteValidationResult {
  isValid: boolean;
  canonicalPath?: string;
  redirectRequired?: boolean;
  errorMessage?: string;
}

/**
 * Canonical route mapping based on requirements table
 */
export const CANONICAL_ROUTES: Record<RouteId, { path: string; defaultTab?: CanonicalTab; allowedTabs?: CanonicalTab[] }> = {
  home: { path: "/" },
  guardian: { 
    path: "/guardian", 
    defaultTab: "scan", 
    allowedTabs: ["scan", "risks", "alerts", "history"] 
  },
  hunter: { 
    path: "/hunter", 
    defaultTab: "all", 
    allowedTabs: ["all", "airdrops", "quests", "yield"] 
  },
  harvestpro: { path: "/harvestpro" },
  portfolio: { path: "/portfolio" },
  settings: { path: "/settings" },
  cockpit: { path: "/cockpit" }
};

/**
 * Navigation item to canonical route mapping
 * Maps bottom nav item IDs to canonical routes
 */
export const NAV_ITEM_TO_ROUTE: Record<string, RouteId> = {
  "whales": "home",
  "home": "home",
  "signals": "home", // Signals redirects to home for now
  "guardian": "guardian",
  "hunter": "hunter", 
  "harvestpro": "harvestpro",
  "portfolio": "portfolio",
  "settings": "settings",
  "market": "home", // Market redirects to home for now
  "hub": "home" // Hub redirects to home for now
};

export class NavigationRouter {
  private static isInitialized = false;
  private static currentCanonicalRoute: CanonicalRoute | null = null;

  /**
   * Initialize browser navigation handling for deterministic back/forward behavior
   * Requirements: R1.ROUTING.DETERMINISTIC
   */
  static initializeBrowserNavigation(navigate: (path: string) => void, showToast?: (message: string) => void): void {
    if (this.isInitialized) return;
    
    // Handle browser back/forward navigation
    const handlePopState = (event: PopStateEvent) => {
      const currentPath = window.location.pathname + window.location.search;
      
      // Validate and canonicalize the current route
      const validation = this.validateRoute(currentPath);
      
      if (!validation.isValid && validation.canonicalPath) {
        // Route is invalid, redirect to canonical path
        if (showToast && validation.errorMessage) {
          showToast(validation.errorMessage);
        }
        
        // Use replace to avoid adding another history entry
        window.history.replaceState(null, '', validation.canonicalPath);
        navigate(validation.canonicalPath);
      } else {
        // Route is valid, update our internal state
        const canonicalRoute = this.canonicalize(currentPath);
        this.currentCanonicalRoute = canonicalRoute;
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handlePopState);
    
    // Initialize current route state
    const currentPath = window.location.pathname + window.location.search;
    this.currentCanonicalRoute = this.canonicalize(currentPath);
    
    this.isInitialized = true;
  }

  /**
   * Get the current canonical route
   */
  static getCurrentCanonicalRoute(): CanonicalRoute | null {
    return this.currentCanonicalRoute;
  }

  /**
   * Update the current canonical route (called when navigation occurs)
   */
  static updateCurrentRoute(path: string): void {
    this.currentCanonicalRoute = this.canonicalize(path);
  }

  /**
   * Get canonical route for a navigation item
   */
  static getCanonicalRoute(navItemId: string): CanonicalRoute {
    const routeId = NAV_ITEM_TO_ROUTE[navItemId] || "home";
    const routeConfig = CANONICAL_ROUTES[routeId];
    
    return {
      id: routeId,
      path: routeConfig.path,
      tab: routeConfig.defaultTab,
      canonicalUrl: routeConfig.defaultTab 
        ? `${routeConfig.path}?tab=${routeConfig.defaultTab}`
        : routeConfig.path
    };
  }

  /**
   * Validate if a route path is canonical
   */
  static validateRoute(path: string): RouteValidationResult {
    // Parse URL to get path and query params
    const url = new URL(path, 'http://localhost');
    const pathname = url.pathname;
    const tabParam = url.searchParams.get('tab') as CanonicalTab | null;

    // Allow sub-routes under /settings (like /settings/wallets, /settings/wallets/add)
    if (pathname.startsWith('/settings/')) {
      return {
        isValid: true,
        canonicalPath: path
      };
    }

    // Find matching canonical route
    const routeEntry = Object.entries(CANONICAL_ROUTES).find(([_, config]) => 
      config.path === pathname
    );

    if (!routeEntry) {
      // Don't show error for /cockpit during transition period
      if (pathname === '/cockpit') {
        return {
          isValid: true,
          canonicalPath: pathname
        };
      }
      
      return {
        isValid: false,
        canonicalPath: "/",
        redirectRequired: true,
        errorMessage: `Invalid route: ${pathname}`
      };
    }

    const [routeId, routeConfig] = routeEntry;

    // Validate tab parameter if present
    if (tabParam && routeConfig.allowedTabs) {
      if (!routeConfig.allowedTabs.includes(tabParam)) {
        const canonicalPath = routeConfig.defaultTab 
          ? `${routeConfig.path}?tab=${routeConfig.defaultTab}`
          : routeConfig.path;
        
        return {
          isValid: false,
          canonicalPath,
          redirectRequired: true,
          errorMessage: `Invalid tab "${tabParam}" for ${routeId} — showing ${routeConfig.defaultTab || 'default'}`
        };
      }
    }

    // Route is valid
    return {
      isValid: true,
      canonicalPath: path
    };
  }

  /**
   * Canonicalize a route path
   */
  static canonicalize(inputUrl: string): CanonicalRoute {
    const url = new URL(inputUrl, 'http://localhost');
    const pathname = url.pathname;
    const tabParam = url.searchParams.get('tab') as CanonicalTab | null;

    // Find matching canonical route
    const routeEntry = Object.entries(CANONICAL_ROUTES).find(([_, config]) => 
      config.path === pathname
    );

    if (!routeEntry) {
      // Default to home if route not found
      return {
        id: "home",
        path: "/",
        canonicalUrl: "/"
      };
    }

    const [routeId, routeConfig] = routeEntry;

    // Use provided tab if valid, otherwise use default
    let finalTab = routeConfig.defaultTab;
    if (tabParam && routeConfig.allowedTabs?.includes(tabParam)) {
      finalTab = tabParam;
    }

    return {
      id: routeId as RouteId,
      path: routeConfig.path,
      tab: finalTab,
      canonicalUrl: finalTab 
        ? `${routeConfig.path}?tab=${finalTab}`
        : routeConfig.path
    };
  }

  /**
   * Navigate to canonical route for a navigation item
   */
  static navigateToCanonical(navItemId: string, navigate: (path: string) => void, showToast?: (message: string) => void): void {
    const canonicalRoute = this.getCanonicalRoute(navItemId);
    
    // Show toast for redirected items
    if (NAV_ITEM_TO_ROUTE[navItemId] !== navItemId && showToast) {
      const routeNames: Record<RouteId, string> = {
        home: "Home",
        guardian: "Guardian", 
        hunter: "Hunter",
        harvestpro: "HarvestPro",
        portfolio: "Portfolio",
        settings: "Settings",
        cockpit: "Cockpit"
      };
      showToast(`Redirected to ${routeNames[canonicalRoute.id]}`);
    }

    // Update current route state
    this.updateCurrentRoute(canonicalRoute.canonicalUrl);
    
    navigate(canonicalRoute.canonicalUrl);
  }

  /**
   * Navigate to a specific path with canonical validation
   * Requirements: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC
   */
  static navigateToPath(path: string, navigate: (path: string) => void, showToast?: (message: string) => void): void {
    const validation = this.validateRoute(path);
    
    if (!validation.isValid && validation.canonicalPath) {
      // Route is invalid, redirect to canonical path
      if (showToast && validation.errorMessage) {
        showToast(validation.errorMessage);
      }
      
      this.updateCurrentRoute(validation.canonicalPath);
      navigate(validation.canonicalPath);
    } else {
      // Route is valid
      this.updateCurrentRoute(path);
      navigate(path);
    }
  }
}