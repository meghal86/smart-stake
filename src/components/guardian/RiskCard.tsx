/**
 * Guardian Risk Card
 * Generic card for displaying risk information
 */
import { AlertCircle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RiskCardProps {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'good' | 'ok';
  lines: string[];
  cta?: {
    label: string;
    onClick: () => void;
  };
  sideBadge?: string;
  className?: string;
}

export function RiskCard({
  title,
  severity,
  lines,
  cta,
  sideBadge,
  className,
}: RiskCardProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'good':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          borderColor: 'border-green-500/30',
          bgColor: 'bg-green-500/5',
          badgeClass: 'bg-green-500/10 text-green-500 border-green-500/30',
        };
      case 'ok':
        return {
          icon: Info,
          iconColor: 'text-blue-500',
          borderColor: 'border-blue-500/30',
          bgColor: 'bg-blue-500/5',
          badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
        };
      case 'low':
        return {
          icon: Info,
          iconColor: 'text-slate-500',
          borderColor: 'border-slate-500/30',
          bgColor: 'bg-slate-500/5',
          badgeClass: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
        };
      case 'medium':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-500',
          borderColor: 'border-yellow-500/30',
          bgColor: 'bg-yellow-500/5',
          badgeClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
        };
      case 'high':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-500',
          borderColor: 'border-red-500/30',
          bgColor: 'bg-red-500/5',
          badgeClass: 'bg-red-500/10 text-red-500 border-red-500/30',
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-slate-500',
          borderColor: 'border-slate-500/30',
          bgColor: 'bg-slate-500/5',
          badgeClass: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
        };
    }
  };

  const config = getSeverityColor();
  const Icon = config.icon;

  return (
    <Card className={cn('border-2', config.borderColor, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                config.bgColor
              )}
            >
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <CardTitle className="text-base pt-1.5 flex-1 min-w-0">
              {title}
            </CardTitle>
          </div>
          {sideBadge && (
            <Badge variant="outline" className={cn('flex-shrink-0', config.badgeClass)}>
              {sideBadge}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Info Lines */}
        <ul className="space-y-2">
          {lines.map((line, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
              <span className="flex-1">{line}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {cta && (
          <Button
            variant="outline"
            size="sm"
            onClick={cta.onClick}
            className="w-full"
          >
            {cta.label}
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

