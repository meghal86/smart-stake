import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Shield, 
  CheckCircle,
  Globe,
  Lock
} from 'lucide-react';

export const PaymentMethodInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Supported Payment Methods
          </CardTitle>
          <CardDescription>
            We support multiple secure payment options through Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CreditCard className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium">Credit & Debit Cards</div>
                <div className="text-sm text-muted-foreground">Visa, Mastercard, Amex</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium">Apple Pay</div>
                <div className="text-sm text-muted-foreground">iOS & Safari</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Wallet className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium">Google Pay</div>
                <div className="text-sm text-muted-foreground">Android & Chrome</div>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Setup Instructions for Mobile Payments
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Apple Pay:</strong> Available automatically on Safari (iOS/macOS) and supported browsers. 
                Ensure Apple Pay is set up in your device settings.
              </p>
              <p>
                <strong>Google Pay:</strong> Available on Chrome and supported browsers. 
                Add your payment method to Google Pay for quick checkout.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
          <CardDescription>
            Your payment information is protected with industry-leading security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <div className="font-medium">PCI DSS Level 1</div>
                <div className="text-sm text-muted-foreground">
                  Highest level of payment security certification
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <div className="font-medium">256-bit SSL Encryption</div>
                <div className="text-sm text-muted-foreground">
                  Bank-level encryption for all transactions
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <div className="font-medium">3D Secure</div>
                <div className="text-sm text-muted-foreground">
                  Additional authentication for card payments
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <div className="font-medium">Global Compliance</div>
                <div className="text-sm text-muted-foreground">
                  GDPR, SOC 2, and other international standards
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Powered by Stripe</span>
              <Badge variant="outline" className="ml-auto">Trusted by millions</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              We never store your payment information. All transactions are processed securely by Stripe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};