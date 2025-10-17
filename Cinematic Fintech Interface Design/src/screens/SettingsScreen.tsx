import { GlassCard } from "../components/GlassCard";
import { Moon, Sun, Zap, Bell, Shield, Globe, HelpCircle, LogOut, TrendingUp } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { ExplainTooltip } from "../components/ExplainTooltip";

interface SettingsScreenProps {
  theme: "light" | "dark" | "pro";
  onThemeChange: (theme: "light" | "dark" | "pro") => void;
}

export function SettingsScreen({ theme, onThemeChange }: SettingsScreenProps) {
  return (
    <div className="space-y-6 max-w-4xl pb-20 md:pb-6">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Settings</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Customize your AlphaWhale experience
        </p>
      </div>

      {/* Theme Selection */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 style={{ color: "var(--foreground)" }}>Theme</h3>
            <ExplainTooltip title="Choose Your Theme">
              Light theme for daytime use, Dark for cinematic ocean experience, Pro for minimal distraction
            </ExplainTooltip>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: "light", label: "Ocean Day", icon: Sun },
            { id: "dark", label: "Deep Blue", icon: Moon },
            { id: "pro", label: "Pro Mode", icon: Zap },
          ].map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => onThemeChange(themeOption.id as "light" | "dark" | "pro")}
              className="p-4 rounded-xl transition-all"
              style={{
                background: theme === themeOption.id ? "var(--primary)" : "var(--input-background)",
                border: theme === themeOption.id ? "2px solid var(--primary)" : "none",
                color: theme === themeOption.id ? "white" : "var(--foreground)",
              }}
            >
              <themeOption.icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm">{themeOption.label}</div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Notifications</h3>
        <div className="space-y-4">
          {[
            { label: "Whale Alerts", description: "Get notified of major whale movements", icon: Bell },
            { label: "Risk Warnings", description: "Critical security and risk alerts", icon: Shield },
            { label: "Price Alerts", description: "Custom price movement notifications", icon: TrendingUp },
          ].map((setting, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--input-background)" }}>
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg" style={{ background: "var(--accent)" }}>
                  <setting.icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <div style={{ color: "var(--foreground)" }}>{setting.label}</div>
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{setting.description}</div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Privacy & Security */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" style={{ color: "var(--chart-3)" }} />
          <h3 style={{ color: "var(--foreground)" }}>Privacy & Security</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: "Two-Factor Authentication", enabled: true },
            { label: "Biometric Login", enabled: true },
            { label: "Session Timeout (15min)", enabled: false },
            { label: "Anonymous Analytics", enabled: true },
          ].map((setting, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--input-background)" }}>
              <span style={{ color: "var(--foreground)" }}>{setting.label}</span>
              <Switch defaultChecked={setting.enabled} />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Regional Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5" style={{ color: "var(--primary)" }} />
          <h3 style={{ color: "var(--foreground)" }}>Regional Settings</h3>
        </div>
        <div className="space-y-3">
          <div className="p-4 rounded-xl" style={{ background: "var(--input-background)" }}>
            <div className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>Currency</div>
            <div style={{ color: "var(--foreground)" }}>USD ($)</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "var(--input-background)" }}>
            <div className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>Timezone</div>
            <div style={{ color: "var(--foreground)" }}>UTC-5 (Eastern Time)</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "var(--input-background)" }}>
            <div className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>Jurisdiction</div>
            <div style={{ color: "var(--foreground)" }}>United States</div>
          </div>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--destructive)" }}>Danger Zone</h3>
        <div className="space-y-3">
          <button className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.01]" style={{ background: "rgba(249, 92, 57, 0.1)", border: "1px solid rgba(249, 92, 57, 0.3)", color: "var(--destructive)" }}>
            <LogOut className="w-4 h-4 inline mr-2" />
            Sign Out
          </button>
        </div>
      </GlassCard>

      <div className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        v5.6.0 • Build 2025.10.15
      </div>
    </div>
  );
}
