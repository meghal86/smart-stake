import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Webhook, Bell, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'

interface AlertChannel {
  id: string
  user_id: string
  channel_type: 'push' | 'email' | 'webhook' | 'sms'
  endpoint: string
  is_active: boolean
  subscription_tier_required: 'free' | 'premium' | 'enterprise'
  settings: Record<string, unknown>
}

export const MultiChannelAlerts = () => {
  const { user } = useAuth()
  const { userPlan } = useSubscription()
  const [channels, setChannels] = useState<AlertChannel[]>([])
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [newChannel, setNewChannel] = useState({
    channel_type: 'email' as const,
    endpoint: '',
    subscription_tier_required: 'premium' as const
  })

  useEffect(() => {
    if (user) {
      fetchAlertChannels()
    }
  }, [user])

  const fetchAlertChannels = async () => {
    try {
      const { data } = await supabase
        .from('alert_channels')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      setChannels((data || []).map(channel => ({
        ...channel,
        user_id: channel.user_id || '',
        channel_type: (channel.channel_type as 'push' | 'email' | 'webhook' | 'sms') || 'email',
        is_active: channel.is_active ?? true,
        subscription_tier_required: (channel.subscription_tier_required as 'free' | 'premium' | 'enterprise') || 'premium',
        settings: (typeof channel.settings === 'object' && channel.settings !== null) ? channel.settings as Record<string, unknown> : {}
      })))
    } catch (error) {
      console.error('Error fetching alert channels:', error)
    }
  }

  const addChannel = async () => {
    if (!newChannel.endpoint.trim()) return

    try {
      const { data, error } = await supabase
        .from('alert_channels')
        .insert({
          ...newChannel,
          user_id: user!.id
        })
        .select()
        .single()

      if (!error) {
        setChannels(prev => [{
          ...data,
          user_id: data.user_id || '',
          channel_type: (data.channel_type as 'push' | 'email' | 'webhook' | 'sms') || 'email',
          is_active: data.is_active ?? true,
          subscription_tier_required: (data.subscription_tier_required as 'free' | 'premium' | 'enterprise') || 'premium',
          settings: (typeof data.settings === 'object' && data.settings !== null) ? data.settings as Record<string, unknown> : {}
        }, ...prev])
        setNewChannel({ channel_type: 'email', endpoint: '', subscription_tier_required: 'premium' })
        setShowAddChannel(false)
      }
    } catch (error) {
      console.error('Error adding channel:', error)
    }
  }

  const removeChannel = async (channelId: string) => {
    try {
      await supabase
        .from('alert_channels')
        .delete()
        .eq('id', channelId)

      setChannels(prev => prev.filter(c => c.id !== channelId))
    } catch (error) {
      console.error('Error removing channel:', error)
    }
  }

  const toggleChannel = async (channelId: string, isActive: boolean) => {
    try {
      await supabase
        .from('alert_channels')
        .update({ is_active: isActive })
        .eq('id', channelId)

      setChannels(prev => prev.map(c => 
        c.id === channelId ? { ...c, is_active: isActive } : c
      ))
    } catch (error) {
      console.error('Error toggling channel:', error)
    }
  }

  const canAccessChannel = (requiredTier: string) => {
    const tiers: Record<string, number> = { free: 0, guest: 0, pro: 1, premium: 1, enterprise: 2 }
    return (tiers[userPlan.plan] || 0) >= (tiers[requiredTier] || 0)
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-50 text-blue-700'
      case 'webhook': return 'bg-purple-50 text-purple-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-Channel Alert Delivery</h2>
          <p className="text-muted-foreground">Configure email, webhook, and push notifications</p>
        </div>
        <Button onClick={() => setShowAddChannel(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </Button>
      </div>

      {/* Sample Notifications for Free Users */}
      {userPlan.plan === 'free' && (
        <Card className="p-4 bg-muted/30">
          <h3 className="font-medium mb-3">Sample Notifications (Upgrade to Enable)</h3>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Email Sample</span>
              </div>
              <p className="text-sm text-blue-700">
                "🐋 Whale Alert: ETH $2,500,000 transaction detected from Binance to Wintermute"
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Webhook className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">Webhook Sample</span>
              </div>
              <p className="text-sm text-purple-700 font-mono">
                {"{"}"event": "whale_alert", "amount_usd": 2500000{"}"}
              </p>
            </div>
          </div>
          <Button className="mt-3" onClick={() => window.location.href = '/subscription'}>
            Upgrade to Premium
          </Button>
        </Card>
      )}

      {/* Add Channel Form */}
      {showAddChannel && (
        <Card className="p-4">
          <h3 className="font-medium mb-4">Add New Alert Channel</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Channel Type</Label>
              <Select 
                value={newChannel.channel_type} 
                onValueChange={(value: unknown) => setNewChannel(prev => ({ ...prev, channel_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="webhook">🔗 Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {newChannel.channel_type === 'email' ? 'Email Address' : 'Webhook URL'}
              </Label>
              <Input
                value={newChannel.endpoint}
                onChange={(e) => setNewChannel(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder={
                  newChannel.channel_type === 'email' 
                    ? 'your@email.com' 
                    : 'https://hooks.zapier.com/...'
                }
              />
            </div>
            <div>
              <Label>Required Plan</Label>
              <Select 
                value={newChannel.subscription_tier_required} 
                onValueChange={(value: unknown) => setNewChannel(prev => ({ ...prev, subscription_tier_required: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={addChannel}>Add Channel</Button>
            <Button variant="outline" onClick={() => setShowAddChannel(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Existing Channels */}
      <div className="grid gap-4">
        {channels.map(channel => (
          <Card key={channel.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getChannelColor(channel.channel_type)}`}>
                  {getChannelIcon(channel.channel_type)}
                </div>
                <div>
                  <div className="font-medium capitalize">{channel.channel_type} Alert</div>
                  <div className="text-sm text-muted-foreground">{channel.endpoint}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={canAccessChannel(channel.subscription_tier_required) ? 'default' : 'secondary'}>
                  {canAccessChannel(channel.subscription_tier_required) ? 'Active' : 'Upgrade Required'}
                </Badge>
                
                {canAccessChannel(channel.subscription_tier_required) && (
                  <Button
                    size="sm"
                    variant={channel.is_active ? 'default' : 'outline'}
                    onClick={() => toggleChannel(channel.id, !channel.is_active)}
                  >
                    {channel.is_active ? 'Enabled' : 'Disabled'}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeChannel(channel.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!canAccessChannel(channel.subscription_tier_required) && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This channel requires {channel.subscription_tier_required} subscription.
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {channels.length === 0 && !showAddChannel && (
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Alert Channels Configured</h3>
          <p className="text-muted-foreground mb-4">
            Add email or webhook channels to receive whale alerts instantly.
          </p>
          <Button onClick={() => setShowAddChannel(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Channel
          </Button>
        </Card>
      )}
    </div>
  )
}