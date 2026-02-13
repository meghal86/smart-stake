import { useState, useRef, useEffect } from 'react';
import { Wallet, Shield, AlertTriangle, ArrowRight, Network, ZoomIn, ZoomOut, RotateCcw, Filter, Maximize2 } from 'lucide-react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FlowNode {
  id: string;
  label: string;
  type: 'wallet' | 'protocol' | 'contract';
  riskLevel: 'low' | 'medium' | 'high';
  x?: number;
  y?: number;
}

interface FlowEdge {
  from: string;
  to: string;
  type: 'approval' | 'interaction' | 'transfer';
  amount: string;
  risk: 'low' | 'medium' | 'high';
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface GraphLiteVisualizerProps {
  flowData: FlowData;
  freshness: FreshnessConfidence;
  walletScope: WalletScope;
  version: 'v0' | 'v1'; // v0: static placeholder, v1: interactive
}

export function GraphLiteVisualizer({ 
  flowData, 
  freshness, 
  walletScope, 
  version = 'v0' 
}: GraphLiteVisualizerProps) {
  // Interactive graph state
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'wallet' | 'protocol' | 'contract'>('all');
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize node positions if not set
  useEffect(() => {
    if (version === 'v1' && flowData.nodes.some(n => !n.x || !n.y)) {
      // Simple force-directed layout initialization
      const centerX = 400;
      const centerY = 300;
      const radius = 150;
      
      flowData.nodes.forEach((node, index) => {
        if (!node.x || !node.y) {
          const angle = (index / flowData.nodes.length) * 2 * Math.PI;
          node.x = centerX + radius * Math.cos(angle);
          node.y = centerY + radius * Math.sin(angle);
        }
      });
    }
  }, [flowData, version]);

  // Filter nodes and edges based on selected filters
  const filteredNodes = flowData.nodes.filter(node => {
    if (riskFilter !== 'all' && node.riskLevel !== riskFilter) return false;
    if (typeFilter !== 'all' && node.type !== typeFilter) return false;
    return true;
  });

  const filteredEdges = flowData.edges.filter(edge => {
    if (riskFilter !== 'all' && edge.risk !== riskFilter) return false;
    // Only show edges where both nodes are visible
    const fromVisible = filteredNodes.some(n => n.id === edge.from);
    const toVisible = filteredNodes.some(n => n.id === edge.to);
    return fromVisible && toVisible;
  });

  // Pan and zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (version === 'v1') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && version === 'v1') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev * 0.8, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'wallet': return Wallet;
      case 'protocol': return Shield;
      default: return Network;
    }
  };

  const getNodeColor = (type: string, riskLevel: string) => {
    if (type === 'wallet') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    
    switch (riskLevel) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-400 border-green-500/20';
    }
  };

  const getNodeFillColor = (type: string, riskLevel: string) => {
    if (type === 'wallet') return '#3B82F6';
    
    switch (riskLevel) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getEdgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getEdgeIcon = (type: string) => {
    switch (type) {
      case 'approval': return Shield;
      case 'transfer': return ArrowRight;
      default: return Network;
    }
  };

  const getNodeSize = (node: FlowNode) => {
    // Base size with slight variation based on connections
    const connections = flowData.edges.filter(e => e.from === node.id || e.to === node.id).length;
    return 20 + Math.min(connections * 2, 15);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Transaction Flow (Graph-Lite {version})</h3>
          <Badge variant="outline" className="text-xs">
            {version === 'v0' ? 'Static Preview' : 'Interactive'}
          </Badge>
        </div>
        
        <div className="text-sm text-gray-400">
          Scope: {walletScope.mode === 'all_wallets' ? 'All Wallets' : 'Single Wallet'}
        </div>
      </div>

      {version === 'v0' ? (
        // V1: Static mini diagram/list-based flow placeholder
        <div className="space-y-6">
          {/* Flow Summary */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Flow Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">{flowData.nodes.length}</div>
                <p className="text-xs text-gray-400">Connected Entities</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{flowData.edges.length}</div>
                <p className="text-xs text-gray-400">Interactions</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {flowData.edges.filter(e => e.risk === 'high').length}
                </div>
                <p className="text-xs text-gray-400">High Risk</p>
              </div>
            </div>
          </div>

          {/* Nodes List */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Connected Entities</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flowData.nodes.map((node) => {
                const NodeIcon = getNodeIcon(node.type);
                
                return (
                  <div 
                    key={node.id}
                    className={`p-3 rounded-lg border ${getNodeColor(node.type, node.riskLevel)}`}
                  >
                    <div className="flex items-center gap-2">
                      <NodeIcon className="w-4 h-4" />
                      <span className="font-medium">{node.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {node.type}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactions List */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Interactions</h4>
            <div className="space-y-2">
              {flowData.edges.map((edge, index) => {
                const EdgeIcon = getEdgeIcon(edge.type);
                const fromNode = flowData.nodes.find(n => n.id === edge.from);
                const toNode = flowData.nodes.find(n => n.id === edge.to);
                
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border bg-gray-700/20 ${getEdgeColor(edge.risk)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <EdgeIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-white">
                          {fromNode?.label} → {toNode?.label}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {edge.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">{edge.amount}</span>
                        <Badge className={`text-xs ${
                          edge.risk === 'high' ? 'bg-red-500/10 text-red-400' :
                          edge.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-green-500/10 text-green-400'
                        }`}>
                          {edge.risk} risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* V1.1 Notice */}
          <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-blue-200">
                <strong>Coming in V1.1:</strong> Interactive graph visualization with drag-and-drop nodes, 
                zoom controls, and real-time risk highlighting.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // V1.1: Full interactive graph visualization
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4 mr-1" />
                Zoom In
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4 mr-1" />
                Zoom Out
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetView}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>

            <div className="flex gap-2">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="px-3 py-1 text-sm bg-gray-700/50 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-1 text-sm bg-gray-700/50 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Types</option>
                <option value="wallet">Wallets</option>
                <option value="protocol">Protocols</option>
                <option value="contract">Contracts</option>
              </select>
            </div>
          </div>

          {/* Graph Canvas */}
          <div className="flex gap-4">
            <div 
              ref={containerRef}
              className="flex-1 relative border border-gray-700/50 rounded-lg bg-gray-900/50 overflow-hidden cursor-move"
              style={{ height: '500px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                className="absolute inset-0"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                {/* Render edges */}
                <g>
                  {filteredEdges.map((edge, index) => {
                    const fromNode = filteredNodes.find(n => n.id === edge.from);
                    const toNode = filteredNodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode || !fromNode.x || !fromNode.y || !toNode.x || !toNode.y) return null;

                    const edgeColor = getEdgeColor(edge.risk);
                    const strokeWidth = edge.risk === 'high' ? 3 : edge.risk === 'medium' ? 2 : 1;

                    return (
                      <g key={`edge-${index}`}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={edgeColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={edge.type === 'approval' ? '5,5' : 'none'}
                          opacity={0.6}
                        />
                        {/* Edge label */}
                        <text
                          x={(fromNode.x + toNode.x) / 2}
                          y={(fromNode.y + toNode.y) / 2}
                          fill="#9CA3AF"
                          fontSize="10"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {edge.amount}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Render nodes */}
                <g>
                  {filteredNodes.map((node) => {
                    if (!node.x || !node.y) return null;
                    
                    const nodeSize = getNodeSize(node);
                    const fillColor = getNodeFillColor(node.type, node.riskLevel);
                    const isSelected = selectedNode?.id === node.id;

                    return (
                      <g key={node.id}>
                        {/* Selection ring */}
                        {isSelected && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={nodeSize + 5}
                            fill="none"
                            stroke="#60A5FA"
                            strokeWidth="2"
                            opacity={0.5}
                          />
                        )}
                        
                        {/* Node circle */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeSize}
                          fill={fillColor}
                          stroke="#fff"
                          strokeWidth="2"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleNodeClick(node)}
                        />
                        
                        {/* Node label */}
                        <text
                          x={node.x}
                          y={node.y + nodeSize + 15}
                          fill="#E5E7EB"
                          fontSize="11"
                          fontWeight="500"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Instructions overlay */}
              <div className="absolute bottom-4 left-4 bg-gray-800/90 border border-gray-700 rounded-lg p-3 text-xs text-gray-300">
                <p className="font-medium mb-1">Controls:</p>
                <ul className="space-y-1">
                  <li>• Click and drag to pan</li>
                  <li>• Use zoom buttons to zoom in/out</li>
                  <li>• Click nodes to view details</li>
                  <li>• Use filters to focus on specific items</li>
                </ul>
              </div>
            </div>

            {/* Node details panel */}
            {selectedNode && (
              <Card className="w-80 bg-gray-800/50 border-gray-700/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white">Node Details</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedNode(null)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-400">Label:</span>
                    <div className="text-sm font-medium text-white mt-1">{selectedNode.label}</div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">Type:</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {selectedNode.type}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">Risk Level:</span>
                    <Badge 
                      className={`ml-2 text-xs ${
                        selectedNode.riskLevel === 'high' ? 'bg-red-500/10 text-red-400' :
                        selectedNode.riskLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-green-500/10 text-green-400'
                      }`}
                    >
                      {selectedNode.riskLevel}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">Connections:</span>
                    <div className="text-sm text-white mt-1">
                      {flowData.edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).length} interactions
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-700/50">
                    <span className="text-xs text-gray-400">Related Transactions:</span>
                    <div className="mt-2 space-y-2">
                      {flowData.edges
                        .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                        .slice(0, 3)
                        .map((edge, idx) => {
                          const EdgeIcon = getEdgeIcon(edge.type);
                          const otherNodeId = edge.from === selectedNode.id ? edge.to : edge.from;
                          const otherNode = flowData.nodes.find(n => n.id === otherNodeId);
                          
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <EdgeIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-300">
                                {edge.from === selectedNode.id ? '→' : '←'} {otherNode?.label}
                              </span>
                              <span className="text-gray-400 ml-auto">{edge.amount}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-gray-400" style={{ borderStyle: 'dashed' }}></div>
              <span>Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-gray-400"></div>
              <span>Transfer</span>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-xl font-bold text-blue-400">{filteredNodes.length}</div>
              <p className="text-xs text-gray-400">Visible Nodes</p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-xl font-bold text-orange-400">{filteredEdges.length}</div>
              <p className="text-xs text-gray-400">Visible Edges</p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-xl font-bold text-red-400">
                {filteredEdges.filter(e => e.risk === 'high').length}
              </div>
              <p className="text-xs text-gray-400">High Risk</p>
            </div>
          </div>
        </div>
      )}

      {/* Confidence Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Flow Analysis Confidence</span>
          <span className={`font-medium ${
            freshness.confidence >= 0.8 ? 'text-green-400' : 
            freshness.confidence >= 0.6 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(freshness.confidence * 100)}%
          </span>
        </div>
        
        {freshness.degraded && (
          <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600/30 rounded">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-yellow-200">
                Flow analysis may be incomplete due to low confidence data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}