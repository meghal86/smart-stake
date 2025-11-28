/**
 * PatternChart - World-class charting with candlesticks, signal markers, and animated overlays
 * Tesla × Airbnb × Robinhood × Perplexity DNA
 */

import { motion, useAnimation } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart3, TrendingUp, TrendingDown, Maximize2, Download } from 'lucide-react';
import type { Signal } from '@/types/signal';

interface PatternChartProps {
  signal: Signal;
  timeframe: '24h' | '48h' | '7d';
  isLoading: boolean;
  patternData: unknown;
}

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface EventMarker {
  time: number;
  type: 'inflow' | 'outflow';
  outcome: 'positive' | 'negative';
  amount: number;
  confidence: number;
  x: number;
  y: number;
}

export function PatternChart({ signal, timeframe, isLoading, patternData }: PatternChartProps) {
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('line');
  const [hoveredMarker, setHoveredMarker] = useState<EventMarker | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const controls = useAnimation();
  
  const reducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Generate realistic price data with proper OHLC
  const generatePriceData = (): CandlestickData[] => {
    const points = timeframe === '24h' ? 24 : timeframe === '48h' ? 48 : 168;
    const basePrice = signal.asset === 'BTC' ? 45000 : signal.asset === 'ETH' ? 2800 : 1;
    const data: CandlestickData[] = [];
    
    let currentPrice = basePrice;
    
    for (let i = 0; i < points; i++) {
      const volatility = 0.02; // 2% volatility
      const trend = Math.sin(i / points * Math.PI * 2) * 0.005;
      const noise = (Math.random() - 0.5) * volatility;
      
      const open = currentPrice;
      const priceChange = (trend + noise) * currentPrice;
      const close = open + priceChange;
      
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      data.push({
        time: Date.now() - (points - i) * (timeframe === '24h' ? 3600000 : timeframe === '48h' ? 1800000 : 3600000),
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000 + 500
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  const priceData = generatePriceData();
  const currentPrice = priceData[priceData.length - 1]?.close || 45000;
  const priceChange = ((currentPrice - priceData[0]?.open) / priceData[0]?.open) * 100;
  
  // Generate enhanced event markers
  const eventMarkers: EventMarker[] = Array.from({ length: 6 }, (_, i) => {
    const dataIndex = Math.floor(Math.random() * (priceData.length - 10)) + 5;
    const x = (dataIndex / (priceData.length - 1)) * 800;
    const pricePoint = priceData[dataIndex];
    const minPrice = Math.min(...priceData.map(d => d.low));
    const maxPrice = Math.max(...priceData.map(d => d.high));
    const y = 256 - ((pricePoint.close - minPrice) / (maxPrice - minPrice)) * 200 - 28;
    
    return {
      time: pricePoint.time,
      type: Math.random() > 0.5 ? 'inflow' : 'outflow',
      outcome: Math.random() > 0.3 ? 'positive' : 'negative',
      amount: Math.random() * 500 + 100,
      confidence: Math.random() * 0.3 + 0.7,
      x,
      y: Math.max(28, Math.min(228, y))
    };
  });

  // Calculate price bounds for scaling
  const minPrice = Math.min(...priceData.map(d => d.low));
  const maxPrice = Math.max(...priceData.map(d => d.high));
  const priceRange = maxPrice - minPrice;
  
  const scaleY = (price: number) => {
    return 256 - ((price - minPrice) / priceRange) * 200 - 28;
  };

  // Generate path for line chart
  const generateLinePath = () => {
    return priceData.map((point, i) => {
      const x = (i / (priceData.length - 1)) * 800;
      const y = scaleY(point.close);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  };

  // Generate area path
  const generateAreaPath = () => {
    const linePath = generateLinePath();
    const lastPoint = priceData[priceData.length - 1];
    const lastX = ((priceData.length - 1) / (priceData.length - 1)) * 800;
    return `${linePath} L ${lastX} 256 L 0 256 Z`;
  };

  useEffect(() => {
    if (!reducedMotion && !isLoading) {
      controls.start({
        pathLength: 1,
        transition: { duration: 1.2, ease: "easeOut" }
      });
    }
  }, [controls, reducedMotion, isLoading, timeframe]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {signal.asset} Pattern Context
          </h3>
          <Badge className={`font-mono tabular-nums ${
            priceChange >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Current: <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              ${currentPrice.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              className="text-xs h-7"
            >
              Line
            </Button>
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('candlestick')}
              className="text-xs h-7"
            >
              Candles
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="text-xs h-7">
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-64 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <svg ref={svgRef} className="w-full h-full" viewBox="0 0 800 256">
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(20, 184, 166)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="rgb(20, 184, 166)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(20, 184, 166)" stopOpacity="0.05" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid Lines */}
          <g opacity="0.1">
            {Array.from({ length: 5 }, (_, i) => (
              <line
                key={i}
                x1="0"
                y1={28 + (i * 40)}
                x2="800"
                y2={28 + (i * 40)}
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <line
                key={i}
                x1={i * 160}
                y1="28"
                x2={i * 160}
                y2="228"
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
          </g>
          
          {chartType === 'line' ? (
            <>
              {/* Price area */}
              <motion.path
                d={generateAreaPath()}
                fill="url(#priceGradient)"
                initial={!reducedMotion ? { pathLength: 0 } : { pathLength: 1 }}
                animate={controls}
              />
              
              {/* Price line */}
              <motion.path
                d={generateLinePath()}
                fill="none"
                stroke="rgb(20, 184, 166)"
                strokeWidth="2.5"
                filter="url(#glow)"
                initial={!reducedMotion ? { pathLength: 0 } : { pathLength: 1 }}
                animate={controls}
              />
            </>
          ) : (
            /* Candlestick Chart */
            <g>
              {priceData.map((candle, i) => {
                const x = (i / (priceData.length - 1)) * 800;
                const openY = scaleY(candle.open);
                const closeY = scaleY(candle.close);
                const highY = scaleY(candle.high);
                const lowY = scaleY(candle.low);
                const isGreen = candle.close > candle.open;
                
                return (
                  <motion.g
                    key={i}
                    initial={!reducedMotion ? { opacity: 0, scaleY: 0 } : { opacity: 1, scaleY: 1 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={!reducedMotion ? { delay: i * 0.01, duration: 0.3 } : { duration: 0 }}
                  >
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isGreen ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                      strokeWidth="1"
                    />
                    {/* Body */}
                    <rect
                      x={x - 2}
                      y={Math.min(openY, closeY)}
                      width="4"
                      height={Math.abs(closeY - openY) || 1}
                      fill={isGreen ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                      opacity="0.8"
                    />
                  </motion.g>
                );
              })}
            </g>
          )}

          {/* Event Markers with Enhanced Interactions */}
          {eventMarkers.map((marker, i) => (
            <TooltipProvider key={i}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.g
                    onMouseEnter={() => setHoveredMarker(marker)}
                    onMouseLeave={() => setHoveredMarker(null)}
                    className="cursor-pointer"
                  >
                    {/* Vertical line */}
                    <motion.line
                      x1={marker.x}
                      y1={marker.y}
                      x2={marker.x}
                      y2="228"
                      stroke={marker.type === 'inflow' ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                      opacity="0.7"
                      initial={!reducedMotion ? { pathLength: 0 } : { pathLength: 1 }}
                      animate={{ pathLength: 1 }}
                      transition={!reducedMotion ? { delay: 1.5 + i * 0.1, duration: 0.4 } : { duration: 0 }}
                    />
                    
                    {/* Event dot */}
                    <motion.circle
                      cx={marker.x}
                      cy={marker.y}
                      r={hoveredMarker === marker ? "6" : "4"}
                      fill={marker.type === 'inflow' ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                      filter="url(#glow)"
                      initial={!reducedMotion ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                      animate={{ 
                        scale: hoveredMarker === marker ? 1.5 : 1, 
                        opacity: 1 
                      }}
                      transition={!reducedMotion ? { 
                        delay: 1.7 + i * 0.1, 
                        duration: 0.3,
                        type: "spring",
                        stiffness: 300
                      } : { duration: 0 }}
                    />
                    
                    {/* Outcome ring */}
                    <motion.circle
                      cx={marker.x}
                      cy={marker.y}
                      r="8"
                      fill="none"
                      stroke={marker.outcome === 'positive' ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                      strokeWidth="1.5"
                      opacity={hoveredMarker === marker ? "0.8" : "0.4"}
                      initial={!reducedMotion ? { scale: 0 } : { scale: 1 }}
                      animate={{ scale: hoveredMarker === marker ? 1.2 : 1 }}
                      transition={!reducedMotion ? { delay: 1.9 + i * 0.1, duration: 0.4 } : { duration: 0 }}
                    />
                    
                    {/* Confidence indicator */}
                    <motion.circle
                      cx={marker.x}
                      cy={marker.y}
                      r="12"
                      fill="none"
                      stroke="rgb(20, 184, 166)"
                      strokeWidth="2"
                      strokeDasharray={`${marker.confidence * 75} ${75 - marker.confidence * 75}`}
                      opacity="0.3"
                      initial={!reducedMotion ? { rotate: -90 } : { rotate: -90 }}
                      animate={{ rotate: hoveredMarker === marker ? 270 : -90 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: `${marker.x}px ${marker.y}px` }}
                    />
                  </motion.g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">
                      {marker.type === 'inflow' ? 'Inflow' : 'Outflow'} Event
                    </div>
                    <div>Amount: ${marker.amount.toFixed(0)}M</div>
                    <div>Confidence: {(marker.confidence * 100).toFixed(0)}%</div>
                    <div>Outcome: {marker.outcome}</div>
                    <div className="text-slate-500">
                      {new Date(marker.time).toLocaleDateString()}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}

          {/* Current signal marker with pulsing animation */}
          <motion.g>
            <line
              x1="750"
              y1="40"
              x2="750"
              y2="228"
              stroke="rgb(20, 184, 166)"
              strokeWidth="3"
              filter="url(#glow)"
            />
            <motion.circle
              cx="750"
              cy="40"
              r="8"
              fill="rgb(20, 184, 166)"
              filter="url(#glow)"
              animate={!reducedMotion ? { 
                scale: [1, 1.4, 1],
                opacity: [1, 0.7, 1]
              } : {}}
              transition={!reducedMotion ? { 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 1,
                ease: "easeInOut"
              } : {}}
            />
            <text
              x="760"
              y="35"
              fill="rgb(20, 184, 166)"
              fontSize="11"
              fontWeight="600"
              className="font-mono"
            >
              LIVE
            </text>
          </motion.g>
        </svg>

        {/* Drift Window Overlay */}
        <motion.div 
          className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 text-xs border border-slate-200 dark:border-slate-700 shadow-lg"
          initial={!reducedMotion ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={!reducedMotion ? { delay: 2.5, duration: 0.3 } : { duration: 0 }}
        >
          <div className="text-slate-600 dark:text-slate-400 mb-1">{timeframe} Drift Window</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            Expected: <span className={patternData.medianDrift > 0 ? 'text-emerald-600' : 'text-red-600'}>
              {patternData.medianDrift > 0 ? '+' : ''}{patternData.medianDrift}%
            </span>
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {patternData.accuracy}% accuracy
          </div>
        </motion.div>
      </div>

      {/* Enhanced Chart Legend */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[var(--brand-teal,#14B8A6)] rounded"></div>
            <span>Price Movement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Inflow Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Outflow Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 border-2 border-emerald-500 rounded-full"></div>
            <span>Positive Outcomes</span>
          </div>
        </div>
        
        <div className="text-slate-500 dark:text-slate-400">
          {eventMarkers.length} historical patterns • {timeframe} window
        </div>
      </div>
    </div>
  );
}