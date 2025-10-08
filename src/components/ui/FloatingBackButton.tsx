/**
 * Floating Back Button - A+++ UX Enhancement
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/lib/telemetry';

interface FloatingBackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function FloatingBackButton({ 
  to = '/', 
  label = 'Back to Dashboard',
  className = ''
}: FloatingBackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
    trackEvent('nav_floating_back', { to });
  };

  return (
    <Button
      onClick={handleClick}
      className={`fixed bottom-20 right-4 z-30 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg rounded-full w-12 h-12 p-0 md:hidden ${className}`}
      title={label}
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );
}