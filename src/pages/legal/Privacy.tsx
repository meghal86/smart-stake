/**
 * Privacy Policy Page
 * 
 * Real content for Privacy Policy - not placeholder
 * Requirements: R6-AC4, R20-AC1, R20-AC2, R24-AC1, R24-AC4
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AlphaWhale Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                We collect information to provide and improve our services:
              </p>
              
              <h3 className="text-lg font-medium mb-3">Account Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Email address (for authentication and notifications)</li>
                <li>Profile information you provide (name, avatar)</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">Blockchain Data</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Wallet addresses you connect or analyze</li>
                <li>Transaction history and blockchain interactions</li>
                <li>Portfolio composition and performance metrics</li>
                <li>Risk scores and security assessments</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">Usage Data</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Pages visited and features used</li>
                <li>Time spent on different sections</li>
                <li>Error logs and performance metrics</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">
                We use collected information for:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Service Provision:</strong> Analyzing blockchain data and providing insights</li>
                <li><strong>Security:</strong> Detecting risks and protecting your assets</li>
                <li><strong>Personalization:</strong> Customizing your experience and recommendations</li>
                <li><strong>Communication:</strong> Sending notifications and updates you've requested</li>
                <li><strong>Improvement:</strong> Enhancing our services and developing new features</li>
                <li><strong>Compliance:</strong> Meeting legal and regulatory requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Data Sharing and Disclosure</h2>
              <p className="mb-4">
                We do not sell your personal information. We may share data in limited circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Service Providers:</strong> Third-party services that help us operate (analytics, hosting)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
                <li><strong>Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Blockchain Data Privacy</h2>
              <p className="mb-4">
                <strong>Important:</strong> Blockchain transactions are public by design. We analyze publicly available blockchain data to provide our services.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>We never access private keys or seed phrases</li>
                <li>We only analyze public blockchain transactions</li>
                <li>Wallet addresses you connect are stored securely</li>
                <li>You can disconnect wallets at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Essential:</strong> Authentication and security</li>
                <li><strong>Functional:</strong> Remembering your preferences</li>
                <li><strong>Analytics:</strong> Understanding usage patterns (anonymized)</li>
                <li><strong>Performance:</strong> Optimizing loading times and reliability</li>
              </ul>
              <p className="mb-4">
                You can control cookies through your browser settings, though some features may not work properly if disabled.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Encryption in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication</li>
                <li>Secure data centers and infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Your Rights and Choices</h2>
              <p className="mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a standard format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Data Retention</h2>
              <p className="mb-4">
                We retain data for as long as necessary to provide services and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Account data: Until account deletion</li>
                <li>Transaction analysis: 7 years for tax compliance</li>
                <li>Usage logs: 2 years for security and improvement</li>
                <li>Marketing data: Until you opt out</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. International Transfers</h2>
              <p className="mb-4">
                Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy periodically. We'll notify you of significant changes via email or through the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
              <p className="mb-4">
                For privacy-related questions or requests:
              </p>
              <ul className="list-none mb-4">
                <li>Email: privacy@alphawhale.com</li>
                <li>Support: support@alphawhale.com</li>
                <li>Data Protection Officer: dpo@alphawhale.com</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}