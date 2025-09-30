'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MobileFooterNav } from '@/components/navigation/MobileFooterNav'
import { DesktopSidebarNav } from '@/components/navigation/DesktopSidebarNav'
import { User, Bell, Shield, CreditCard, LogOut } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebarNav currentPath="/settings" />
      
      <div className="md:pl-64">
        <main className="p-4 pb-20 md:pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account, preferences, and subscription
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile
                  </CardTitle>
                  <CardDescription>
                    Manage your account information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input 
                        type="email" 
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                        placeholder="your@email.com"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Handle</label>
                      <input 
                        type="text" 
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                        placeholder="@yourhandle"
                      />
                    </div>
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Whale Alerts</div>
                      <div className="text-sm text-muted-foreground">Get notified of large whale movements</div>
                    </div>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Daily Digest</div>
                      <div className="text-sm text-muted-foreground">Receive daily whale intelligence reports</div>
                    </div>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Token Unlocks</div>
                      <div className="text-sm text-muted-foreground">Alerts for upcoming token unlocks</div>
                    </div>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription
                  </CardTitle>
                  <CardDescription>
                    Manage your AlphaWhale subscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Current Plan</div>
                      <div className="text-sm text-muted-foreground">Lite Plan - Free</div>
                    </div>
                    <Button variant="outline">Upgrade to Pro</Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Upgrade to Pro for unlimited whale alerts, full calendar access, and advanced analytics.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Change Password</div>
                      <div className="text-sm text-muted-foreground">Update your account password</div>
                    </div>
                    <Button variant="outline">Change</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <LogOut className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-destructive">Delete Account</div>
                      <div className="text-sm text-muted-foreground">Permanently delete your account and all data</div>
                    </div>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileFooterNav currentPath="/settings" />
    </div>
  )
}
