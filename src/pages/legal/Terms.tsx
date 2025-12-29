/**
 * Terms of Service Page
 * 
 * Real content for Terms of Service - not placeholder
 * Requirements: R6-AC4, R24-AC1, R24-AC4
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
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
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AlphaWhale Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using AlphaWhale ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                AlphaWhale provides blockchain analytics, security scanning, and portfolio management tools. The Service includes:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Guardian: Security scanning and risk assessment for blockchain addresses</li>
                <li>Hunter: Opportunity discovery and yield farming insights</li>
                <li>HarvestPro: Tax-loss harvesting and portfolio optimization</li>
                <li>Portfolio tracking and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. User Responsibilities</h2>
              <p className="mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring your use complies with applicable laws and regulations</li>
                <li>Making your own investment and financial decisions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Financial Disclaimer</h2>
              <p className="mb-4">
                <strong>Important:</strong> AlphaWhale provides informational tools and analysis only. We do not provide financial, investment, tax, or legal advice. All information is for educational purposes only.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Past performance does not guarantee future results</li>
                <li>All investments carry risk of loss</li>
                <li>Consult qualified professionals before making financial decisions</li>
                <li>Tax implications vary by jurisdiction - consult a tax professional</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Privacy and Data</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p className="mb-4">
                AlphaWhale shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Service Availability</h2>
              <p className="mb-4">
                We strive to maintain high availability but do not guarantee uninterrupted service. Maintenance, updates, and technical issues may cause temporary disruptions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Modifications</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the Service constitutes acceptance of modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Contact Information</h2>
              <p className="mb-4">
                For questions about these Terms of Service, please contact us at:
              </p>
              <ul className="list-none mb-4">
                <li>Email: legal@alphawhale.com</li>
                <li>Support: support@alphawhale.com</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}