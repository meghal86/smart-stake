import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIDigestProps {
  summary: string;
  confidence: 'high' | 'medium' | 'low';
  keyInsights: string[];
  generatedAt: string;
  className?: string;
}

export default function AIDigest({ 
  summary, 
  confidence, 
  keyInsights, 
  generatedAt,
  className 
}: AIDigestProps) {
  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-meta bg-gray-50';
    }
  };

  const getConfidenceIcon = (conf: string) => {
    switch (conf) {
      case 'high': return <TrendingUp className="w-3 h-3" />;
      case 'medium': return <AlertTriangle className="w-3 h-3" />;
      case 'low': return <TrendingDown className="w-3 h-3" />;
      default: return <Brain className="w-3 h-3" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">AI Market Digest</h3>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getConfidenceColor(confidence))}
                  >
                    {getConfidenceIcon(confidence)}
                    <span className="ml-1 capitalize">{confidence} Confidence</span>
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(generatedAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Summary */}
              <motion.p 
                className="text-sm text-foreground leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {summary}
              </motion.p>

              {/* Key Insights */}
              {keyInsights.length > 0 && (
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <h4 className="text-xs font-medium text-muted-foreground">Key Insights:</h4>
                  <div className="flex flex-wrap gap-1">
                    {keyInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.2 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          {insight}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Footer */}
              <motion.div 
                className="pt-2 border-t border-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <p className="text-xs text-muted-foreground">
                  Generated with read-only data, no wallet keys stored. 
                  <span className="ml-1 text-primary">Learn more</span>
                </p>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
