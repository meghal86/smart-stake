/**
 * Tests for Hunter Screen Test Fixtures
 * 
 * Requirements:
 * - 15.1: Deterministic dataset
 * - 15.2: All opportunity types
 * - 15.3: Various trust levels and eligibility states
 * - 15.4: Edge cases
 */

import { describe, it, expect } from 'vitest';
import { getFixtureOpportunities } from '@/lib/fixtures/hunter-opportunities';

describe('Hunter Opportunities Fixtures', () => {
  describe('Deterministic behavior', () => {
    it('should return the same data on every call', () => {
      const fixtures1 = getFixtureOpportunities();
      const fixtures2 = getFixtureOpportunities();
      
      expect(fixtures1).toEqual(fixtures2);
      expect(fixtures1.length).toBe(fixtures2.length);
    });

    it('should return exactly 15 opportunities', () => {
      const fixtures = getFixtureOpportunities();
      expect(fixtures).toHaveLength(15);
    });

    it('should have consistent IDs starting with f1000000', () => {
      const fixtures = getFixtureOpportunities();
      
      fixtures.forEach((fixture, index) => {
        expect(fixture.id).toMatch(/^f1000000-0000-0000-0000-0000000000(0[1-9]|1[0-5])$/);
      });
    });
  });

  describe('Opportunity types coverage', () => {
    it('should include all 7 opportunity types', () => {
      const fixtures = getFixtureOpportunities();
      const types = new Set(fixtures.map(f => f.type));
      
      expect(types).toContain('airdrop');
      expect(types).toContain('quest');
      expect(types).toContain('staking');
      expect(types).toContain('yield');
      expect(types).toContain('points');
      expect(types).toContain('loyalty');
      expect(types).toContain('testnet');
      expect(types.size).toBe(7);
    });

    it('should have at least 2 items per pillar', () => {
      const fixtures = getFixtureOpportunities();
      const typeCounts = fixtures.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Airdrops should have multiple items
      expect(typeCounts['airdrop']).toBeGreaterThanOrEqual(2);
      // Quests should have multiple items
      expect(typeCounts['quest']).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Trust levels coverage', () => {
    it('should include green trust opportunities', () => {
      const fixtures = getFixtureOpportunities();
      const greenTrust = fixtures.filter(f => f.trust.level === 'green');
      
      expect(greenTrust.length).toBeGreaterThan(0);
      greenTrust.forEach(f => {
        expect(f.trust.score).toBeGreaterThanOrEqual(80);
      });
    });

    it('should include amber trust opportunities', () => {
      const fixtures = getFixtureOpportunities();
      const amberTrust = fixtures.filter(f => f.trust.level === 'amber');
      
      expect(amberTrust.length).toBeGreaterThan(0);
      amberTrust.forEach(f => {
        expect(f.trust.score).toBeGreaterThanOrEqual(60);
        expect(f.trust.score).toBeLessThan(80);
      });
    });

    it('should include red trust opportunity', () => {
      const fixtures = getFixtureOpportunities();
      const redTrust = fixtures.filter(f => f.trust.level === 'red');
      
      expect(redTrust.length).toBeGreaterThan(0);
      redTrust.forEach(f => {
        expect(f.trust.score).toBeLessThan(60);
        expect(f.trust.issues).toBeDefined();
        expect(f.trust.issues!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Eligibility states coverage', () => {
    it('should include likely eligible opportunity', () => {
      const fixtures = getFixtureOpportunities();
      const likelyEligible = fixtures.filter(
        f => f.eligibility_preview?.status === 'likely'
      );
      
      expect(likelyEligible.length).toBeGreaterThan(0);
      likelyEligible.forEach(f => {
        expect(f.eligibility_preview!.score).toBeGreaterThanOrEqual(0.7);
      });
    });

    it('should include maybe eligible opportunity', () => {
      const fixtures = getFixtureOpportunities();
      const maybeEligible = fixtures.filter(
        f => f.eligibility_preview?.status === 'maybe'
      );
      
      expect(maybeEligible.length).toBeGreaterThan(0);
      maybeEligible.forEach(f => {
        expect(f.eligibility_preview!.score).toBeGreaterThanOrEqual(0.4);
        expect(f.eligibility_preview!.score).toBeLessThan(0.7);
      });
    });

    it('should include unlikely eligible opportunity', () => {
      const fixtures = getFixtureOpportunities();
      const unlikelyEligible = fixtures.filter(
        f => f.eligibility_preview?.status === 'unlikely'
      );
      
      expect(unlikelyEligible.length).toBeGreaterThan(0);
      unlikelyEligible.forEach(f => {
        expect(f.eligibility_preview!.score).toBeLessThan(0.4);
      });
    });

    it('should include opportunities without eligibility preview', () => {
      const fixtures = getFixtureOpportunities();
      const noEligibility = fixtures.filter(f => !f.eligibility_preview);
      
      expect(noEligibility.length).toBeGreaterThan(0);
    });
  });

  describe('Reward types coverage', () => {
    it('should include USD rewards', () => {
      const fixtures = getFixtureOpportunities();
      const usdRewards = fixtures.filter(f => f.reward.currency === 'USD');
      
      expect(usdRewards.length).toBeGreaterThan(0);
    });

    it('should include TOKEN rewards', () => {
      const fixtures = getFixtureOpportunities();
      const tokenRewards = fixtures.filter(f => f.reward.currency === 'TOKEN');
      
      expect(tokenRewards.length).toBeGreaterThan(0);
    });

    it('should include POINTS rewards', () => {
      const fixtures = getFixtureOpportunities();
      const pointsRewards = fixtures.filter(f => f.reward.currency === 'POINTS');
      
      expect(pointsRewards.length).toBeGreaterThan(0);
    });

    it('should include APY rewards', () => {
      const fixtures = getFixtureOpportunities();
      const apyRewards = fixtures.filter(f => f.reward.currency === 'APY');
      
      expect(apyRewards.length).toBeGreaterThan(0);
      apyRewards.forEach(f => {
        expect(f.apr).toBeDefined();
      });
    });

    it('should include NFT rewards', () => {
      const fixtures = getFixtureOpportunities();
      const nftRewards = fixtures.filter(f => f.reward.currency === 'NFT');
      
      expect(nftRewards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should include expired opportunity', () => {
      const fixtures = getFixtureOpportunities();
      const expired = fixtures.filter(f => f.status === 'expired');
      
      expect(expired.length).toBeGreaterThan(0);
      expired.forEach(f => {
        expect(f.time_left_sec).toBe(0);
        expect(f.expires_at).toBeDefined();
        expect(new Date(f.expires_at!).getTime()).toBeLessThan(Date.now());
      });
    });

    it('should include zero reward opportunity', () => {
      const fixtures = getFixtureOpportunities();
      const zeroReward = fixtures.filter(
        f => f.reward.min === 0 && f.reward.max === 0
      );
      
      expect(zeroReward.length).toBeGreaterThan(0);
    });

    it('should include sponsored opportunities', () => {
      const fixtures = getFixtureOpportunities();
      const sponsored = fixtures.filter(f => f.sponsored);
      
      expect(sponsored.length).toBeGreaterThanOrEqual(3);
      sponsored.forEach(f => {
        expect(f.badges.some(b => b.type === 'sponsored')).toBe(true);
      });
    });

    it('should include featured opportunities', () => {
      const fixtures = getFixtureOpportunities();
      const featured = fixtures.filter(f => f.featured);
      
      expect(featured.length).toBeGreaterThan(0);
      featured.forEach(f => {
        expect(f.badges.some(b => b.type === 'featured')).toBe(true);
      });
    });

    it('should include opportunities with urgency flags', () => {
      const fixtures = getFixtureOpportunities();
      const withUrgency = fixtures.filter(f => f.urgency);
      
      expect(withUrgency.length).toBeGreaterThan(0);
      
      const urgencyTypes = new Set(withUrgency.map(f => f.urgency));
      expect(urgencyTypes).toContain('ending_soon');
      expect(urgencyTypes).toContain('new');
      expect(urgencyTypes).toContain('hot');
    });
  });

  describe('Data structure validation', () => {
    it('should have valid opportunity structure', () => {
      const fixtures = getFixtureOpportunities();
      
      fixtures.forEach(fixture => {
        // Required fields
        expect(fixture.id).toBeDefined();
        expect(fixture.slug).toBeDefined();
        expect(fixture.title).toBeDefined();
        expect(fixture.protocol).toBeDefined();
        expect(fixture.protocol.name).toBeDefined();
        expect(fixture.protocol.logo).toBeDefined();
        expect(fixture.type).toBeDefined();
        expect(fixture.chains).toBeDefined();
        expect(fixture.chains.length).toBeGreaterThan(0);
        expect(fixture.reward).toBeDefined();
        expect(fixture.trust).toBeDefined();
        expect(fixture.difficulty).toBeDefined();
        expect(fixture.badges).toBeDefined();
        expect(fixture.status).toBeDefined();
        expect(fixture.created_at).toBeDefined();
        expect(fixture.updated_at).toBeDefined();
        
        // Trust structure
        expect(fixture.trust.score).toBeGreaterThanOrEqual(0);
        expect(fixture.trust.score).toBeLessThanOrEqual(100);
        expect(fixture.trust.level).toMatch(/^(green|amber|red)$/);
        expect(fixture.trust.last_scanned_ts).toBeDefined();
        
        // Reward structure
        expect(fixture.reward.min).toBeGreaterThanOrEqual(0);
        expect(fixture.reward.max).toBeGreaterThanOrEqual(fixture.reward.min);
        expect(fixture.reward.currency).toBeDefined();
        expect(fixture.reward.confidence).toMatch(/^(estimated|confirmed)$/);
      });
    });

    it('should have valid ISO 8601 timestamps', () => {
      const fixtures = getFixtureOpportunities();
      
      fixtures.forEach(fixture => {
        expect(() => new Date(fixture.created_at)).not.toThrow();
        expect(() => new Date(fixture.updated_at)).not.toThrow();
        expect(() => new Date(fixture.trust.last_scanned_ts)).not.toThrow();
        
        if (fixture.published_at) {
          expect(() => new Date(fixture.published_at)).not.toThrow();
        }
        
        if (fixture.expires_at) {
          expect(() => new Date(fixture.expires_at)).not.toThrow();
        }
      });
    });

    it('should have valid URLs', () => {
      const fixtures = getFixtureOpportunities();
      
      fixtures.forEach(fixture => {
        expect(() => new URL(fixture.protocol.logo)).not.toThrow();
        
        if (fixture.external_url) {
          expect(() => new URL(fixture.external_url)).not.toThrow();
        }
      });
    });
  });

  describe('Consistency checks', () => {
    it('should have consistent trust level and score', () => {
      const fixtures = getFixtureOpportunities();
      
      fixtures.forEach(fixture => {
        if (fixture.trust.level === 'green') {
          expect(fixture.trust.score).toBeGreaterThanOrEqual(80);
        } else if (fixture.trust.level === 'amber') {
          expect(fixture.trust.score).toBeGreaterThanOrEqual(60);
          expect(fixture.trust.score).toBeLessThan(80);
        } else if (fixture.trust.level === 'red') {
          expect(fixture.trust.score).toBeLessThan(60);
        }
      });
    });

    it('should have consistent eligibility status and score', () => {
      const fixtures = getFixtureOpportunities();
      
      fixtures.forEach(fixture => {
        if (fixture.eligibility_preview) {
          const { status, score } = fixture.eligibility_preview;
          
          if (status === 'likely') {
            expect(score).toBeGreaterThanOrEqual(0.7);
          } else if (status === 'maybe') {
            expect(score).toBeGreaterThanOrEqual(0.4);
            expect(score).toBeLessThan(0.7);
          } else if (status === 'unlikely') {
            expect(score).toBeLessThan(0.4);
          }
        }
      });
    });

    it('should have sponsored badge when sponsored is true', () => {
      const fixtures = getFixtureOpportunities();
      
      fixtures.forEach(fixture => {
        if (fixture.sponsored) {
          expect(fixture.badges.some(b => b.type === 'sponsored')).toBe(true);
        }
      });
    });

    it('should have featured badge when featured is true', () => {
      const fixtures = getFixtureOpportunities();
      
      fixtures.forEach(fixture => {
        if (fixture.featured) {
          expect(fixture.badges.some(b => b.type === 'featured')).toBe(true);
        }
      });
    });
  });
});
