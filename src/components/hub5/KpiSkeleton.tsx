'use client'

import { Card, CardContent } from '@/components/ui/card'

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {[1, 2].map((i) => (
        <Card key={i} className="rounded-xl bg-white/80 dark:bg-[#141E36] border-slate-200 animate-pulse">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-4 h-4 bg-slate-300 dark:bg-slate-700 rounded" />
                <div className="space-y-1">
                  <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-20 bg-slate-300 dark:bg-slate-700 rounded" />
                </div>
              </div>
              <div className="h-6 w-16 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-7 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
