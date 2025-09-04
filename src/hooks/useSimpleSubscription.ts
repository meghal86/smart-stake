import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

export const useSimpleSubscription = () => {
  const { user } = useAuth()
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  const fetchPlan = async () => {
    if (!user) {
      setPlan('free')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('plan')
        .eq('user_id', user.id)

      if (error || !data || data.length === 0) {
        setPlan('free')
      } else {
        setPlan(data[0]?.plan || 'free')
      }
    } catch (error) {
      setPlan('free')
    } finally {
      setLoading(false)
    }
  }

  const createCheckout = async (priceId: string) => {
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('simple-subscription', {
      body: {
        action: 'create-checkout',
        priceId,
        userId: user.id
      }
    })

    if (error) throw error
    return data.url
  }

  const verifyPayment = async (sessionId: string) => {
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('simple-subscription', {
      body: {
        action: 'verify-payment',
        sessionId,
        userId: user.id
      }
    })

    if (error) throw error
    setPlan(data.plan)
    // Notify other components about plan change
    localStorage.setItem('user_plan_updated', Date.now().toString())
    window.dispatchEvent(new StorageEvent('storage', { key: 'user_plan_updated' }))
    return data
  }

  useEffect(() => {
    fetchPlan()
  }, [user])

  // Listen for plan updates from other components
  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        fetchPlan()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user])

  return {
    plan,
    loading,
    createCheckout,
    verifyPayment,
    refetch: fetchPlan
  }
}