import { ReactNode } from 'react';
import { GlobalHeader } from '@/components/header/GlobalHeader';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageLayout - Standard layout wrapper with GlobalHeader
 * 
 * Use this to wrap page content and automatically include the global header
 * with sign in, connect wallet, and all common features.
 * 
 * @example
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <PageLayout>
 *       <div>My page content</div>
 *     </PageLayout>
 *   );
 * }
 * ```
 */
export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      <main className={className}>
        {children}
      </main>
    </div>
  );
}
