import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserAddress {
  id: string;
  address: string;
  label: string;
  group?: string;
}

const PLACEHOLDER_ADDRESSES = new Set([
  '0x1234567890123456789012345678901234567890',
]);

const sanitizeAddresses = (rows: UserAddress[]) => {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const normalizedAddress = row.address.toLowerCase();

    if (PLACEHOLDER_ADDRESSES.has(normalizedAddress)) {
      return false;
    }

    if (seen.has(normalizedAddress)) {
      return false;
    }

    seen.add(normalizedAddress);
    return true;
  });
};

export function useUserAddresses() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load addresses from database
  const loadAddresses = useCallback(async () => {
    if (!user) {
      // Load from localStorage for non-authenticated users
      const saved = localStorage.getItem('portfolio-addresses');
      if (saved) {
        try {
          setAddresses(sanitizeAddresses(JSON.parse(saved)));
        } catch (error) {
          console.error('Error parsing saved addresses:', error);
        }
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_portfolio_addresses')
        .select('id, address, label, address_group')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userAddresses = data.map(item => ({
        id: item.id,
        address: item.address,
        label: item.label,
        group: item.address_group || undefined
      }));

      setAddresses(sanitizeAddresses(userAddresses));
    } catch (error) {
      console.error('Error loading addresses:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('portfolio-addresses');
      if (saved) {
        try {
          setAddresses(sanitizeAddresses(JSON.parse(saved)));
        } catch (parseError) {
          console.error('Error parsing saved addresses:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add new address
  const addAddress = async (newAddress: Omit<UserAddress, 'id'>) => {
    if (!user) {
      // Save to localStorage for non-authenticated users
      const addressWithId = {
        id: Date.now().toString(),
        ...newAddress
      };
      const updated = sanitizeAddresses([...addresses, addressWithId]);
      setAddresses(updated);
      localStorage.setItem('portfolio-addresses', JSON.stringify(updated));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_portfolio_addresses')
        .insert({
          user_id: user.id,
          address: newAddress.address,
          label: newAddress.label,
          address_group: newAddress.group || null
        })
        .select('id, address, label, address_group')
        .single();

      if (error) throw error;

      const addressWithId = {
        id: data.id,
        address: data.address,
        label: data.label,
        group: data.address_group || undefined
      };

      setAddresses(prev => sanitizeAddresses([...prev, addressWithId]));
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  };

  // Remove address
  const removeAddress = async (id: string) => {
    if (!user) {
      // Remove from localStorage for non-authenticated users
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      localStorage.setItem('portfolio-addresses', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_portfolio_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error removing address:', error);
      throw error;
    }
  };

  // Update address
  const updateAddress = async (id: string, updates: Partial<Omit<UserAddress, 'id'>>) => {
    if (!user) {
      // Update localStorage for non-authenticated users
      const updated = addresses.map(a => 
        a.id === id ? { ...a, ...updates } : a
      );
      setAddresses(updated);
      localStorage.setItem('portfolio-addresses', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_portfolio_addresses')
        .update({
          label: updates.label,
          address_group: updates.group || null
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAddresses(prev => prev.map(a => 
        a.id === id ? { ...a, ...updates } : a
      ));
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  };

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  return {
    addresses,
    loading,
    addAddress,
    removeAddress,
    updateAddress,
    refetch: loadAddresses
  };
}
