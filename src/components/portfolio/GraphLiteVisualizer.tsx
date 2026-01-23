import { Wallet, Shield, AlertTriangle, ArrowRight, Network } from 'lucide-react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';

interface FlowNode {
  id: string;
  label: string;
  type: 'wallet' | 'protocol' | 'contract';
  riskLevel: 'low' | 'medium' | 'high';
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

  const getEdgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'border-red-400';
      case 'medium': return 'border-yellow-400';
      default: return 'border-green-400';
    }
  };

  const getEdgeIcon = (type: string) => {
    switch (type) {
      case 'approval': return Shield;
      case 'transfer': return ArrowRight;
      default: return Network;
    }
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
        // V1.1: Full interactive graph (placeholder for future implementation)
        <div className="text-center py-12">
          <Network className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h4 className="text-lg font-medium mb-2 text-white">Interactive Graph</h4>
          <p className="text-gray-400">
            Full interactive graph visualization will be implemented in V1.1
          </p>
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