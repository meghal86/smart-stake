'use client';

import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { cinematicColors, cinematicGradients } from '../styles/cinematicTokens';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Metric } from './ui/Metric';
import { HolographicWhale } from './HolographicWhale';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(28, 169, 255, 0.3); }
  50% { transform: scale(1.02); box-shadow: 0 0 40px rgba(28, 169, 255, 0.6); }
`;

const HubContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #060D1F 0%, #073674 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(28, 169, 255, 0.05) 50%,
      transparent 70%
    );
    background-size: 200% 200%;
    animation: ${shimmer} 8s ease-in-out infinite;
    pointer-events: none;
  }
`;

const Header = styled.header`
  padding: 2rem;
  text-align: center;
  position: relative;
  z-index: 10;
`;

const Title = styled.h1`
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${cinematicColors.textPrimary};
  margin-bottom: 0.5rem;
  text-shadow: 0 0 30px rgba(240, 246, 255, 0.5);
`;

const Subtitle = styled.p`
  font-family: 'Inter', sans-serif;
  color: ${cinematicColors.textSecondary};
  font-size: 1.1rem;
  margin-bottom: 2rem;
`;

const PersonaNav = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(6, 13, 31, 0.9);
  backdrop-filter: blur(20px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  border-bottom: 1px solid rgba(28, 169, 255, 0.2);
`;

const PersonaChip = styled.button<{ $active: boolean; $persona: 'novice' | 'pro' | 'simuto' }>`
  padding: 12px 24px;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  transition: all 0.3s ease;
  
  ${({ $persona, $active }) => {
    const colors = {
      novice: cinematicColors.turquoiseProfit,
      pro: cinematicColors.violetPulse,
      simuto: cinematicColors.amberReview
    };
    
    return css`
      background: ${$active ? colors[$persona] : 'rgba(255, 255, 255, 0.1)'};
      color: ${$active ? cinematicColors.abyss : cinematicColors.textSecondary};
      ${$active && `animation: ${pulse} 2s ease-in-out infinite;`}
    `;
  }}
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const PodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const GlassPod = styled(Card)`
  background: linear-gradient(145deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(28, 169, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 12px 48px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(28, 169, 255, 0.3);
  }
`;

const ActionChip = styled(Button)<{ $glowing?: boolean }>`
  ${({ $glowing }) => $glowing && css`
    animation: ${pulse} 2s ease-in-out infinite;
  `}
`;

const WhaleHeroSection = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
`;

interface MarketHubProps {
  persona?: 'novice' | 'pro' | 'simuto';
}

export const MarketHub: React.FC<MarketHubProps> = ({ persona = 'pro' }) => {
  const [activePersona, setActivePersona] = useState(persona);
  const [pulsingPods, setPulsingPods] = useState<string[]>([]);

  const triggerPodPulse = (podId: string) => {
    setPulsingPods(prev => [...prev, podId]);
    setTimeout(() => {
      setPulsingPods(prev => prev.filter(id => id !== podId));
    }, 2000);
  };

  return (
    <HubContainer>
      <Header>
        <Title>AlphaWhale</Title>
        <Subtitle>Master the DeFi Waves</Subtitle>
        
        <WhaleHeroSection>
          <HolographicWhale threatLevel="elevated" />
        </WhaleHeroSection>
      </Header>

      <PersonaNav>
        <PersonaChip 
          $persona="novice" 
          $active={activePersona === 'novice'}
          onClick={() => setActivePersona('novice')}
        >
          🌊 Novice
        </PersonaChip>
        <PersonaChip 
          $persona="pro" 
          $active={activePersona === 'pro'}
          onClick={() => setActivePersona('pro')}
        >
          ⚡ Pro
        </PersonaChip>
        <PersonaChip 
          $persona="simuto" 
          $active={activePersona === 'simuto'}
          onClick={() => setActivePersona('simuto')}
        >
          🎯 Simuto
        </PersonaChip>
      </PersonaNav>

      <PodGrid>
        <GlassPod>
          <Card.Header>
            <Card.Title variant="accent">Whale Moves</Card.Title>
            <span>🐋</span>
          </Card.Header>
          <Card.Content>
            <Metric
              label="Large Transfers"
              value="$2.4M"
              variant="critical"
              change={{ value: "+340%", direction: "up" }}
              description="Massive ETH accumulation detected"
            />
            <div style={{ marginTop: '1rem' }}>
              <ActionChip 
                variant="primary" 
                size="sm"
                $glowing={pulsingPods.includes('whale')}
                onClick={() => triggerPodPulse('whale')}
              >
                🔍 Watch
              </ActionChip>
            </div>
          </Card.Content>
        </GlassPod>

        <GlassPod>
          <Card.Header>
            <Card.Title variant="accent">Risk Scanner</Card.Title>
            <span>⚠️</span>
          </Card.Header>
          <Card.Content>
            <Badge variant="danger" size="lg" pulse>
              HIGH RISK
            </Badge>
            <p style={{ color: cinematicColors.textSecondary, margin: '1rem 0' }}>
              Unusual wallet activity detected in top 100 addresses
            </p>
            <ActionChip variant="danger" size="sm">
              🛡️ Protect
            </ActionChip>
          </Card.Content>
        </GlassPod>

        <GlassPod>
          <Card.Header>
            <Card.Title variant="accent">Signal Stack</Card.Title>
            <span>📡</span>
          </Card.Header>
          <Card.Content>
            <Metric
              label="Active Signals"
              value="47"
              variant="highlighted"
              icon="🎯"
              description="Cross-chain intelligence feeds"
            />
            <ActionChip variant="outline" size="sm" style={{ marginTop: '1rem' }}>
              📊 View All
            </ActionChip>
          </Card.Content>
        </GlassPod>

        <GlassPod>
          <Card.Header>
            <Card.Title variant="accent">AI Digest</Card.Title>
            <span>🧠</span>
          </Card.Header>
          <Card.Content>
            <p style={{ color: cinematicColors.textSecondary, marginBottom: '1rem' }}>
              "Bullish momentum building across DeFi protocols. Whale accumulation suggests major move incoming."
            </p>
            <Badge variant="info" size="sm">87% Confidence</Badge>
          </Card.Content>
        </GlassPod>

        <GlassPod>
          <Card.Header>
            <Card.Title variant="accent">Market Mood</Card.Title>
            <span>💓</span>
          </Card.Header>
          <Card.Content>
            <Metric
              label="Sentiment"
              value="Bullish"
              variant="highlighted"
              change={{ value: "+12%", direction: "up" }}
              icon="🚀"
            />
            <ActionChip variant="primary" size="sm" style={{ marginTop: '1rem' }}>
              🔔 Create Alert
            </ActionChip>
          </Card.Content>
        </GlassPod>

        <GlassPod>
          <Card.Header>
            <Card.Title variant="accent">Profit Tracker</Card.Title>
            <span>💰</span>
          </Card.Header>
          <Card.Content>
            <Metric
              label="24h Gains"
              value="+$8,240"
              variant="highlighted"
              size="lg"
              change={{ value: "+24.7%", direction: "up" }}
            />
            <ActionChip variant="primary" size="sm" style={{ marginTop: '1rem' }}>
              📈 Compare
            </ActionChip>
          </Card.Content>
        </GlassPod>
      </PodGrid>
    </HubContainer>
  );
};