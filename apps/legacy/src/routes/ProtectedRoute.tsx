import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  Crown, 
  Building, 
  ArrowRight,
  CheckCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requirePlan?: 'pro' | 'premium' | 'enterprise';
  requireRole?: 'user' | 'admin' | 'institutional';
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requirePlan,
  requireRole,
  fallback,
  showUpgrade = true
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { tier, loading: tierLoading, isPremium, isEnterprise } = useTier();

  // Show loading state while checking auth
  if (authLoading || tierLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in to access this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => window.location.href = '/login'}>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check plan requirement
  if (requirePlan && user) {
    const planHierarchy = ['free', 'pro', 'premium', 'enterprise'];
    const userPlanIndex = planHierarchy.indexOf(tier);
    const requiredPlanIndex = planHierarchy.indexOf(requirePlan);
    
    if (userPlanIndex < requiredPlanIndex) {
      if (fallback) return <>{fallback}</>;
      
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {requirePlan === 'enterprise' ? (
                  <Building className="h-6 w-6 text-purple-600" />
                ) : (
                  <Crown className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <CardTitle>Upgrade Required</CardTitle>
              <CardDescription>
                This feature requires a {requirePlan} plan or higher.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Plan</span>
                  <Badge variant="outline" className="capitalize">
                    {tier}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Required Plan</span>
                  <Badge className={cn(
                    "capitalize",
                    requirePlan === 'enterprise' ? "bg-purple-100 text-purple-800" : "bg-yellow-100 text-yellow-800"
                  )}>
                    {requirePlan}
                  </Badge>
                </div>
              </div>
              
              {showUpgrade && (
                <Button className="w-full" onClick={() => window.location.href = '/billing'}>
                  Upgrade to {requirePlan}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Check role requirement
  if (requireRole && user) {
    // This would check user.app_metadata.role in a real implementation
    const userRole = user.app_metadata?.role || 'user';
    const roleHierarchy = ['user', 'admin', 'institutional'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requireRole);
    
    if (userRoleIndex < requiredRoleIndex) {
      if (fallback) return <>{fallback}</>;
      
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have the required permissions to access this feature.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-sm text-muted-foreground">
                Contact your administrator for access.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}
