import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

interface YieldCalculatorProps {
  protocol?: any;
}

export const YieldCalculator: React.FC<YieldCalculatorProps> = ({ protocol }) => {
  const [amount, setAmount] = useState('1000');
  const [timeframe, setTimeframe] = useState('365');
  const [results, setResults] = useState<any>(null);

  const calculateYield = () => {
    const principal = parseFloat(amount) || 0;
    const days = parseInt(timeframe) || 365;
    const apy = protocol?.apy || 10;
    const riskScore = protocol?.risk_score || 50;
    
    // Calculate returns
    const grossReturn = principal * (apy / 100) * (days / 365);
    const fees = grossReturn * 0.02; // 2% platform fee
    const riskAdjustment = grossReturn * (riskScore / 1000); // Risk penalty
    const netReturn = grossReturn - fees - riskAdjustment;
    const totalValue = principal + netReturn;
    
    setResults({
      principal,
      grossReturn,
      fees,
      riskAdjustment,
      netReturn,
      totalValue,
      roi: (netReturn / principal) * 100,
      dailyReturn: netReturn / days
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Yield Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Investment Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
            />
          </div>
          <div>
            <Label htmlFor="timeframe">Time Period (days)</Label>
            <Input
              id="timeframe"
              type="number"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="365"
            />
          </div>
        </div>

        <Button onClick={calculateYield} className="w-full">
          Calculate Returns
        </Button>

        {results && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Initial Investment:</span>
              <span className="font-medium">${results.principal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gross Return:</span>
              <span className="font-medium text-green-600">+${results.grossReturn.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Platform Fees:</span>
              <span className="font-medium text-red-600">-${results.fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Risk Adjustment:</span>
              <span className="font-medium text-red-600">-${results.riskAdjustment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Net Return:</span>
              <span className={`font-bold ${results.netReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${results.netReturn.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Value:</span>
              <span className="font-bold">${results.totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ROI:</span>
              <span className={`font-medium ${results.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {results.roi.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Daily Return:</span>
              <span className="font-medium">${results.dailyReturn.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};