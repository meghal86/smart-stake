/**
 * Guardian Connect Gate
 * Onboarding screen shown to non-connected users
 */
import { ReactNode } from 'react';
import { Shield, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ConnectGateProps {
  onConnect: () => void;
  renderConnectButton?: () => ReactNode;
  onDemoMode?: () => void;
}

export function ConnectGate({ onConnect, renderConnectButton, onDemoMode }: ConnectGateProps) {
  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50">
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Guardian
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Let's connect your wallet for a quick 30-second safety check.
            We'll scan for risky approvals, suspicious contracts, and more.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle className="text-base">Trust Score</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Get a 0-100 score based on approvals, mixer activity, and reputation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5 text-purple-500" />
              </div>
              <CardTitle className="text-base">Fix Risks</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                One-tap revoke for unlimited approvals and suspicious contracts.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <CardTitle className="text-base">Stay Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Real-time alerts for new approvals and contract interactions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <div className="flex flex-col gap-3 items-center">
            {renderConnectButton ? (
              <div className="flex justify-center">{renderConnectButton()}</div>
            ) : (
              <Button
                size="lg"
                onClick={onConnect}
                className="guardian-connect-button px-8 shadow-lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Connect Wallet
              </Button>
            )}
            
            {onDemoMode && (
              <>
                <div className="text-xs text-muted-foreground">or</div>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onDemoMode}
                  className="guardian-demo-button px-8 border-2"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Try Demo Mode
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            <Lock className="w-3 h-3 inline mr-1" />
            Non-custodial. We only read public blockchain data.
          </p>
        </div>
      </div>
    </div>
  );
}

