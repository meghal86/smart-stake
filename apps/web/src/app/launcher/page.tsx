import { LegacyAppLauncher } from '@/components/LegacyAppLauncher'

export default function LauncherPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🐋 AlphaWhale App Launcher</h1>
          <p className="text-muted-foreground">
            Access different parts of the AlphaWhale platform
          </p>
        </div>
        
        <LegacyAppLauncher />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Legacy app runs on port 8080 for optimal performance</p>
        </div>
      </div>
    </div>
  )
}