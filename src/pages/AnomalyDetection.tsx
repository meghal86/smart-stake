/**
 * Anomaly Detection Page
 * Pro+ Feature: Advanced ML-based whale behavior anomaly detection
 */

import { AnomalyDetectionDashboard } from '@/components/analytics/AnomalyDetectionDashboard';
import { AppLayout } from '@/components/layout/AppLayout';

export default function AnomalyDetection() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <AnomalyDetectionDashboard />
      </div>
    </AppLayout>
  );
}

