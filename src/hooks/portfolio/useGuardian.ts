import { useState, useEffect } from 'react';

export interface GuardianScan { 
  trust: number; 
  flags: Array<{ 
    type: string; 
    severity: 'low' | 'medium' | 'high'; 
    count: number;
  }>; 
  lastScan: string;
}

export function useGuardian(): { 
  data?: GuardianScan; 
  refresh: () => Promise<void>; 
  isLoading: boolean;
} {
  const [data, setData] = useState<GuardianScan>();
  const [isLoading, setIsLoading] = useState(true);

  const fetchGuardian = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setData({
      trust: 87,
      flags: [
        { type: 'mixer', severity: 'medium', count: 2 },
        { type: 'suspicious', severity: 'low', count: 1 }
      ],
      lastScan: new Date().toISOString()
    });
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGuardian();
  }, []);

  return { 
    data, 
    refresh: fetchGuardian, 
    isLoading 
  };
}