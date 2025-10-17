'use client';

import React from 'react';
import { Card } from './card';
import { Button } from './button';
import { X, Brain, TrendingUp, AlertTriangle } from 'lucide-react';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: 'market-intelligence' | 'whale-signals' | 'risk-analysis';
}

const ExplainModal: React.FC<ExplainModalProps> = ({ 
  isOpen, 
  onClose, 
  topic = 'market-intelligence' 
}) => {
  if (!isOpen) return null;

  const getContent = () => {
    switch (topic) {
      case 'whale-signals':
        return {
          title: '🐋 Whale Signals Explained',
          icon: <TrendingUp className="w-6 h-6" />,
          sections: [
            {
              title: 'What are Whale Signals?',
              content: 'Whale signals are large cryptocurrency transactions (usually $1M+) that can indicate major market movements. Think of whales as the "big players" who can move markets.'
            },
            {
              title: 'Why Do They Matter?',
              content: 'When whales buy or sell large amounts, it often predicts price changes. If many whales are buying, prices usually go up. If they\'re selling, prices often go down.'
            },
            {
              title: 'How to Use This Info',
              content: 'Watch for patterns: Multiple whale buys = potential price increase. Multiple whale sells = potential price decrease. But always consider other factors too!'
            }
          ]
        };
      case 'risk-analysis':
        return {
          title: '⚠️ Risk Analysis Explained',
          icon: <AlertTriangle className="w-6 h-6" />,
          sections: [
            {
              title: 'What is Risk Score?',
              content: 'Our risk score (0-10) measures how volatile or unpredictable the market might be. 0 = very stable, 10 = very volatile/risky.'
            },
            {
              title: 'Risk Factors',
              content: 'We analyze whale movements, trading volume, price volatility, and market sentiment to calculate risk. High whale activity often means higher risk.'
            },
            {
              title: 'Using Risk Scores',
              content: 'Low risk (0-3): Good for steady investments. Medium risk (4-6): Normal market conditions. High risk (7-10): Be extra careful, big moves possible.'
            }
          ]
        };
      default:
        return {
          title: '🧠 Market Intelligence Explained',
          icon: <Brain className="w-6 h-6" />,
          sections: [
            {
              title: 'What is Market Intelligence?',
              content: 'Market intelligence combines whale tracking, sentiment analysis, and AI predictions to give you a complete picture of what\'s happening in crypto markets.'
            },
            {
              title: 'How We Calculate It',
              content: 'We analyze thousands of transactions, social media sentiment, trading patterns, and whale behavior using advanced AI to predict market movements.'
            },
            {
              title: 'Making Smart Decisions',
              content: 'Use our intelligence as one factor in your decisions. Green signals = potentially good time to buy. Red signals = potentially good time to sell or wait.'
            }
          ]
        };
    }
  };

  const content = getContent();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(6, 13, 31, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(28, 169, 255, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ padding: '32px' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#1CA9FF' }}>{content.icon}</div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#F0F6FF',
                margin: 0
              }}>
                {content.title}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#F0F6FF',
                padding: '8px',
                borderRadius: '8px'
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content Sections */}
          <div style={{ space: '24px' }}>
            {content.sections.map((section, index) => (
              <div key={index} style={{
                marginBottom: index < content.sections.length - 1 ? '24px' : '0',
                padding: '20px',
                background: 'rgba(28, 169, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(28, 169, 255, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#1CA9FF',
                  marginBottom: '12px',
                  margin: '0 0 12px 0'
                }}>
                  {section.title}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#E2E8F0',
                  margin: 0
                }}>
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '32px',
            padding: '16px',
            background: 'rgba(107, 95, 255, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(107, 95, 255, 0.2)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#9CA3AF',
              margin: 0
            }}>
              💡 <strong>Pro Tip:</strong> Combine multiple signals for better accuracy. Never invest more than you can afford to lose!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExplainModal;