import { useState, useEffect } from 'react';

export interface AddressRow { 
  address: string; 
  totalValue: number; 
  pnl24hPct: number; 
  risk: number; 
  activity: number; 
  sources: { real: boolean; sim: boolean }; 
  tokens: number;
}

export function useAddresses(): { 
  rows: AddressRow[]; 
  isLoading: boolean;
} {
  const [rows, setRows] = useState<AddressRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setRows([
        {
          address: '0x1234...5678',
          totalValue: 75000,
          pnl24hPct: 3.2,
          risk: 6,
          activity: 8,
          sources: { real: true, sim: false },
          tokens: 12
        },
        {
          address: '0xabcd...efgh',
          totalValue: 50000,
          pnl24hPct: 1.8,
          risk: 4,
          activity: 5,
          sources: { real: true, sim: true },
          tokens: 8
        }
      ]);
      setIsLoading(false);
    };

    fetchAddresses();
  }, []);

  return { rows, isLoading };
}