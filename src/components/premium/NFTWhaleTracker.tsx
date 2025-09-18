import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExternalLink, Image, TrendingUp, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface NFTWhaleTransaction {
  id: string
  transaction_hash: string
  block_number: number
  timestamp: string
  from_address: string
  to_address: string
  contract_address: string
  token_id: string
  collection_name: string
  collection_slug: string
  transaction_type: 'sale' | 'transfer' | 'mint' | 'burn'
  marketplace: 'opensea' | 'blur' | 'looksrare' | 'x2y2' | 'direct'
  price_eth?: number
  price_usd?: number
  rarity_rank?: number
  is_whale_transaction: boolean
  whale_threshold_met: string[]
}

interface NFTCollection {
  contract_address: string
  name: string
  slug: string
  floor_price_eth: number
  volume_24h_eth: number
  total_supply: number
  is_monitored: boolean
  whale_threshold_usd: number
}

export const NFTWhaleTracker = () => {
  const [nftTransactions, setNftTransactions] = useState<NFTWhaleTransaction[]>([])
  const [collections, setCollections] = useState<NFTCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    minPrice: 100000,
    collection: 'all',
    timeframe: '24h'
  })

  useEffect(() => {
    fetchNFTData()
    const interval = setInterval(fetchNFTData, 120000) // 2-minute refresh
    return () => clearInterval(interval)
  }, [])

  const fetchNFTData = async () => {
    try {
      // Fetch NFT whale transactions
      const { data: txData } = await supabase
        .from('nft_whale_transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      // Fetch monitored collections
      const { data: collectionsData } = await supabase
        .from('nft_collections')
        .select('*')
        .eq('is_monitored', true)

      setNftTransactions(txData || [])
      setCollections(collectionsData || [])
    } catch (error) {
      console.error('Error fetching NFT data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerNFTScan = async () => {
    try {
      setLoading(true)
      await supabase.functions.invoke('nft-whale-tracker')
      await fetchNFTData()
    } catch (error) {
      console.error('Error triggering NFT scan:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = nftTransactions.filter(tx => {
    const matchesPrice = !tx.price_usd || tx.price_usd >= filters.minPrice
    const matchesCollection = filters.collection === 'all' || tx.collection_slug === filters.collection
    
    // Timeframe filter
    const now = new Date()
    const txTime = new Date(tx.timestamp)
    const hoursDiff = (now.getTime() - txTime.getTime()) / (1000 * 60 * 60)
    
    let matchesTimeframe = true
    if (filters.timeframe === '1h') matchesTimeframe = hoursDiff <= 1
    else if (filters.timeframe === '24h') matchesTimeframe = hoursDiff <= 24
    else if (filters.timeframe === '7d') matchesTimeframe = hoursDiff <= 168
    
    return matchesPrice && matchesCollection && matchesTimeframe
  })

  const getThresholdBadgeColor = (threshold: string) => {
    switch (threshold) {
      case 'high_value': return 'bg-red-100 text-red-800'
      case 'whale_wallet': return 'bg-purple-100 text-purple-800'
      case 'rare_nft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMarketplaceBadge = (marketplace: string) => {
    const colors = {
      opensea: 'bg-blue-100 text-blue-800',
      blur: 'bg-orange-100 text-orange-800',
      looksrare: 'bg-green-100 text-green-800',
      x2y2: 'bg-purple-100 text-purple-800'
    }
    return colors[marketplace] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NFT Whale Tracking</h2>
          <p className="text-muted-foreground">Monitor high-value NFT transactions and whale activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50">
            Live NFT Monitoring
          </Badge>
          <Button onClick={triggerNFTScan} disabled={loading} size="sm">
            {loading ? 'Scanning...' : 'Scan Now'}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          <div className="text-sm text-muted-foreground">Whale Transactions</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{collections.length}</div>
          <div className="text-sm text-muted-foreground">Monitored Collections</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {filteredTransactions.reduce((sum, tx) => sum + (tx.price_usd || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Volume (USD)</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {new Set(filteredTransactions.map(tx => tx.to_address)).size}
          </div>
          <div className="text-sm text-muted-foreground">Unique Whales</div>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Min Price (USD)</Label>
            <Input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label>Collection</Label>
            <Select value={filters.collection} onValueChange={(value) => setFilters(prev => ({ ...prev, collection: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {collections.map(collection => (
                  <SelectItem key={collection.contract_address} value={collection.slug}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timeframe</Label>
            <Select value={filters.timeframe} onValueChange={(value) => setFilters(prev => ({ ...prev, timeframe: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={fetchNFTData}>Apply Filters</Button>
          </div>
        </div>
      </Card>

      {/* NFT Whale Transactions */}
      <div className="grid gap-4">
        {filteredTransactions.map(tx => (
          <Card key={tx.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                  <Image className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-medium">{tx.collection_name}</div>
                  <div className="text-sm text-muted-foreground">Token #{tx.token_id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {tx.price_usd ? `$${tx.price_usd.toLocaleString()}` : 'Transfer'}
                </div>
                {tx.price_eth && (
                  <div className="text-sm text-muted-foreground">{tx.price_eth.toFixed(2)} ETH</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {tx.whale_threshold_met.map(threshold => (
                <Badge key={threshold} className={`text-xs ${getThresholdBadgeColor(threshold)}`}>
                  {threshold.replace('_', ' ').toUpperCase()}
                </Badge>
              ))}
              <Badge className={getMarketplaceBadge(tx.marketplace)}>
                {tx.marketplace}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {tx.transaction_type}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">From:</span>
                <div className="font-mono text-xs">
                  {tx.from_address.slice(0, 10)}...{tx.from_address.slice(-6)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">To:</span>
                <div className="font-mono text-xs">
                  {tx.to_address.slice(0, 10)}...{tx.to_address.slice(-6)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  OpenSea
                </Button>
                <Button size="sm" variant="outline">
                  <Users className="h-4 w-4 mr-1" />
                  Analyze Wallet
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No NFT Whale Transactions Found</h3>
          <p className="text-muted-foreground mb-4">
            No high-value NFT transactions match your current filters.
          </p>
          <Button onClick={triggerNFTScan}>Start NFT Monitoring</Button>
        </Card>
      )}

      {/* Monitored Collections */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Monitored Collections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {collections.map(collection => (
            <div key={collection.contract_address} className="p-3 border rounded-lg">
              <div className="font-medium text-sm">{collection.name}</div>
              <div className="text-xs text-muted-foreground">
                Floor: {collection.floor_price_eth} ETH
              </div>
              <div className="text-xs text-muted-foreground">
                Threshold: ${collection.whale_threshold_usd.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}