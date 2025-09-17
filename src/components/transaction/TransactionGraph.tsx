import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Filter } from 'lucide-react';

interface TransactionNode {
  id: string;
  address: string;
  label?: string;
  riskScore: number;
  totalVolume: number;
  transactionCount: number;
  entityType: 'exchange' | 'defi' | 'wallet' | 'mixer' | 'unknown';
  x?: number;
  y?: number;
}

interface TransactionEdge {
  source: string;
  target: string;
  volume: number;
  transactionCount: number;
}

interface TransactionGraphProps {
  centerAddress: string;
  depth?: number;
  minAmount?: number;
}

export function TransactionGraph({ centerAddress, depth = 3, minAmount = 1000 }: TransactionGraphProps) {
  const [nodes, setNodes] = useState<TransactionNode[]>([]);
  const [edges, setEdges] = useState<TransactionEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<TransactionNode | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // Mock data for demonstration
    const mockNodes: TransactionNode[] = [
      {
        id: centerAddress,
        address: centerAddress,
        label: 'Target Wallet',
        riskScore: 3,
        totalVolume: 2500000,
        transactionCount: 45,
        entityType: 'wallet',
        x: 300,
        y: 200
      },
      {
        id: '0x1234...5678',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        label: 'Binance Hot Wallet',
        riskScore: 2,
        totalVolume: 50000000,
        transactionCount: 1250,
        entityType: 'exchange',
        x: 150,
        y: 100
      },
      {
        id: '0xabcd...efgh',
        address: '0xabcdef1234567890abcdef1234567890abcdefgh',
        label: 'Uniswap V3',
        riskScore: 1,
        totalVolume: 15000000,
        transactionCount: 890,
        entityType: 'defi',
        x: 450,
        y: 100
      },
      {
        id: '0x9999...1111',
        address: '0x9999999999999999999999999999999999999999',
        riskScore: 8,
        totalVolume: 5000000,
        transactionCount: 25,
        entityType: 'mixer',
        x: 300,
        y: 350
      }
    ];

    const mockEdges: TransactionEdge[] = [
      { source: centerAddress, target: '0x1234...5678', volume: 1500000, transactionCount: 15 },
      { source: centerAddress, target: '0xabcd...efgh', volume: 800000, transactionCount: 20 },
      { source: centerAddress, target: '0x9999...1111', volume: 200000, transactionCount: 10 }
    ];

    setNodes(mockNodes);
    setEdges(mockEdges);
  }, [centerAddress]);

  const getNodeColor = (node: TransactionNode) => {
    if (node.entityType === 'exchange') return '#3B82F6';
    if (node.entityType === 'defi') return '#10B981';
    if (node.entityType === 'mixer') return '#EF4444';
    if (node.riskScore > 6) return '#F59E0B';
    return '#6B7280';
  };

  const getNodeSize = (node: TransactionNode) => {
    const baseSize = 20;
    const volumeMultiplier = Math.log(node.totalVolume / 1000000) * 5;
    return Math.max(baseSize, baseSize + volumeMultiplier);
  };

  const getRiskBadge = (score: number) => {
    if (score <= 3) return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
    if (score <= 6) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Transaction Flow Graph</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setZoom(zoom * 1.2)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoom(zoom * 0.8)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoom(1)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div 
            className="relative border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden"
            style={{ height: '400px', transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Render edges */}
              {edges.map((edge, index) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                return (
                  <g key={index}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="#94A3B8"
                      strokeWidth={Math.max(1, Math.log(edge.volume / 100000))}
                      strokeDasharray={edge.volume < 500000 ? "5,5" : "none"}
                    />
                    <text
                      x={(sourceNode.x! + targetNode.x!) / 2}
                      y={(sourceNode.y! + targetNode.y!) / 2}
                      fill="#64748B"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      ${(edge.volume / 1000).toFixed(0)}K
                    </text>
                  </g>
                );
              })}

              {/* Render nodes */}
              {nodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={getNodeSize(node)}
                    fill={getNodeColor(node)}
                    stroke="#fff"
                    strokeWidth="2"
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => setSelectedNode(node)}
                  />
                  <text
                    x={node.x}
                    y={node.y! + getNodeSize(node) + 15}
                    fill="#374151"
                    fontSize="10"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {node.label || `${node.address.slice(0, 6)}...${node.address.slice(-4)}`}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>DeFi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Mixer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Wallet</span>
            </div>
          </div>
        </div>

        {selectedNode && (
          <div className="w-80">
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Node Details</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Address:</span>
                  <div className="font-mono text-xs break-all">{selectedNode.address}</div>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Label:</span>
                  <div className="font-medium">{selectedNode.label || 'Unknown'}</div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Entity Type:</span>
                  <Badge variant="outline" className="ml-2">
                    {selectedNode.entityType}
                  </Badge>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Risk Score:</span>
                  <div className="mt-1">{getRiskBadge(selectedNode.riskScore)}</div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Total Volume:</span>
                  <div className="font-medium">${selectedNode.totalVolume.toLocaleString()}</div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Transactions:</span>
                  <div className="font-medium">{selectedNode.transactionCount}</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
}