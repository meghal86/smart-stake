'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  type?: 'kpi' | 'digest' | 'signals' | 'portfolio'
  className?: string
}

export default function SkeletonLoader({ type = 'kpi', className }: SkeletonLoaderProps) {
  const renderKPISkeleton = () => (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </CardContent>
    </Card>
  )

  const renderDigestSkeleton = () => (
    <Card className={cn("animate-pulse", className)}>
      <div className="h-1 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </CardContent>
    </Card>
  )

  const renderSignalsSkeleton = () => (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
              <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderPortfolioSkeleton = () => (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
        <div className="mt-4 h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </CardContent>
    </Card>
  )

  switch (type) {
    case 'digest': return renderDigestSkeleton()
    case 'signals': return renderSignalsSkeleton()
    case 'portfolio': return renderPortfolioSkeleton()
    default: return renderKPISkeleton()
  }
}