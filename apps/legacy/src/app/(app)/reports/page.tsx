'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MobileFooterNav } from '@/components/navigation/MobileFooterNav'
import { DesktopSidebarNav } from '@/components/navigation/DesktopSidebarNav'
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebarNav currentPath="/reports" />
      
      <div className="md:pl-64">
        <main className="p-4 pb-20 md:pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground mt-2">
                Generate and download comprehensive whale intelligence reports
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Daily Digest
                  </CardTitle>
                  <CardDescription>
                    Comprehensive daily whale activity report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last generated:</span>
                      <span className="text-sm text-muted-foreground">Never</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Format:</span>
                      <span className="text-sm text-muted-foreground">PDF</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Analysis
                  </CardTitle>
                  <CardDescription>
                    Weekly market intelligence and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last generated:</span>
                      <span className="text-sm text-muted-foreground">Never</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Format:</span>
                      <span className="text-sm text-muted-foreground">PDF</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Unlock Calendar
                  </CardTitle>
                  <CardDescription>
                    Upcoming token unlocks and releases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last generated:</span>
                      <span className="text-sm text-muted-foreground">Never</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Format:</span>
                      <span className="text-sm text-muted-foreground">CSV</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Report Generation</CardTitle>
                <CardDescription>
                  Create custom reports with your preferred settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate your first report to get started with whale intelligence
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      <Download className="h-4 w-4" />
                      Generate Daily Digest
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background rounded-md hover:bg-accent">
                      <Calendar className="h-4 w-4" />
                      Schedule Reports
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <MobileFooterNav currentPath="/reports" />
    </div>
  )
}
