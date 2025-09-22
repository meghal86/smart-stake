import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'whale' | 'exchange' | 'defi' | 'unknown';
  value: number;
  risk: number;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  value: number;
  transactions: number;
}

interface CounterpartyGraphProps {
  whaleAddress: string;
  transactions: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function CounterpartyGraph({ whaleAddress, transactions, isOpen, onClose }: CounterpartyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !transactions.length) return;

    // Build graph data from transactions
    const nodeMap = new Map<string, GraphNode>();
    const edgeMap = new Map<string, GraphEdge>();

    // Add whale node
    nodeMap.set(whaleAddress, {
      id: whaleAddress,
      label: `${whaleAddress.slice(0, 8)}...${whaleAddress.slice(-6)}`,
      type: 'whale',
      value: 0,
      risk: 50
    });

    transactions.forEach(tx => {
      const { fromAddress, toAddress, amountUSD, fromType, toType, fromName, toName } = tx;
      
      // Add nodes
      if (!nodeMap.has(fromAddress)) {
        nodeMap.set(fromAddress, {
          id: fromAddress,
          label: fromName || `${fromAddress.slice(0, 8)}...${fromAddress.slice(-6)}`,
          type: fromType === 'exchange' ? 'exchange' : fromType === 'defi' ? 'defi' : 'unknown',
          value: 0,
          risk: 30
        });
      }
      
      if (!nodeMap.has(toAddress)) {
        nodeMap.set(toAddress, {
          id: toAddress,
          label: toName || `${toAddress.slice(0, 8)}...${toAddress.slice(-6)}`,
          type: toType === 'exchange' ? 'exchange' : toType === 'defi' ? 'defi' : 'unknown',
          value: 0,
          risk: 30
        });
      }

      // Update node values
      const fromNode = nodeMap.get(fromAddress)!;
      const toNode = nodeMap.get(toAddress)!;
      fromNode.value += amountUSD;
      toNode.value += amountUSD;

      // Add edge
      const edgeKey = `${fromAddress}-${toAddress}`;
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          source: fromAddress,
          target: toAddress,
          value: 0,
          transactions: 0
        });
      }
      
      const edge = edgeMap.get(edgeKey)!;
      edge.value += amountUSD;
      edge.transactions += 1;
    });

    setNodes(Array.from(nodeMap.values()));
    setEdges(Array.from(edgeMap.values()));
  }, [whaleAddress, transactions, isOpen]);

  useEffect(() => {
    if (!isOpen || !nodes.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Simple force-directed layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    // Position nodes in a circle around the whale
    const whaleNode = nodes.find(n => n.id === whaleAddress);
    if (whaleNode) {
      whaleNode.x = centerX;
      whaleNode.y = centerY;
    }

    const otherNodes = nodes.filter(n => n.id !== whaleAddress);
    otherNodes.forEach((node, i) => {
      const angle = (i / otherNodes.length) * 2 * Math.PI;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        
        // Edge thickness based on value
        ctx.lineWidth = Math.max(1, Math.min(5, edge.value / 10000000));
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      if (!node.x || !node.y) return;

      const nodeRadius = Math.max(8, Math.min(20, Math.sqrt(node.value / 1000000)));
      
      // Node color based on type
      let color = '#6B7280'; // gray
      switch (node.type) {
        case 'whale': color = '#3B82F6'; break; // blue
        case 'exchange': color = '#10B981'; break; // green
        case 'defi': color = '#8B5CF6'; break; // purple
      }

      // Risk tinting
      if (node.risk > 70) {
        color = '#EF4444'; // red
      } else if (node.risk > 40) {
        color = '#F59E0B'; // yellow
      }

      // Draw node
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Highlight hovered node
      if (hoveredNode === node.id) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + nodeRadius + 12);
    });

  }, [nodes, edges, isOpen, hoveredNode, whaleAddress]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered node
    let foundNode = null;
    for (const node of nodes) {
      if (node.x && node.y) {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        const nodeRadius = Math.max(8, Math.min(20, Math.sqrt(node.value / 1000000)));
        if (distance <= nodeRadius) {
          foundNode = node.id;
          break;
        }
      }
    }

    setHoveredNode(foundNode);
  };

  if (!isOpen) return null;

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${(value / 1e3).toFixed(0)}K`;
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
      isFullscreen ? '' : 'md:p-8'
    }`}>
      <Card className={`bg-background ${
        isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl h-96 md:h-[500px]'
      } flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Counterparty Network</h3>
            <Badge variant="secondary" className="text-xs">
              {whaleAddress.slice(0, 8)}...{whaleAddress.slice(-6)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
          />
          
          {hoveredNode && (
            <div className="absolute top-4 left-4 bg-popover border rounded-lg p-3 shadow-lg">
              {(() => {
                const node = nodes.find(n => n.id === hoveredNode);
                if (!node) return null;
                
                return (
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{node.label}</p>
                    <p className="text-xs text-muted-foreground">Type: {node.type}</p>
                    <p className="text-xs text-muted-foreground">Volume: {formatValue(node.value)}</p>
                    <p className="text-xs text-muted-foreground">Risk: {node.risk}/100</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{nodes.length} addresses • {edges.length} connections</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Whale</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Exchange</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>DeFi</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>High Risk</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}