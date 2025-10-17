import { useState, useEffect } from "react";
import { Sun, Moon, Zap } from "lucide-react";

type Theme = "light" | "dark" | "pro";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    console.log('Applying theme:', newTheme);
    document.documentElement.classList.remove("dark", "pro");
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    if (newTheme === "pro") document.documentElement.classList.add("dark", "pro");
    
    // Force background color
    const colors = {
      light: '#F0F9FF',
      dark: '#081A34', 
      pro: '#050B17'
    };
    document.body.style.backgroundColor = colors[newTheme];
    
    localStorage.setItem("theme", newTheme);
  };

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "pro"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case "light": return <Sun className="w-4 h-4" />;
      case "dark": return <Moon className="w-4 h-4" />;
      case "pro": return <Zap className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light": return "Ocean Day";
      case "dark": return "Deep Sea";
      case "pro": return "Abyss Pro";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105"
      style={{
        background: "var(--accent)",
        color: "var(--accent-foreground)",
      }}
    >
      {getIcon()}
      <span className="text-sm">{getLabel()}</span>
    </button>
  );
}