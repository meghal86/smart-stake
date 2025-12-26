/**
 * HarvestPro Settings Form Component
 * 
 * Real-time validation for HarvestPro user settings
 * Requirements: Enhanced Req 6 AC1-3 (immediate validation, clear messages)
 * Design: Form Validation → Real-Time Feedback
 */

import React from 'react';
import { useFormValidation, formatCharacterCounter } from '@/lib/ux/FormValidation';
import { UpdateSettingsRequestSchema } from '@/schemas/harvestpro';
import { HarvestUserSettings, RiskTolerance } from '@/types/harvestpro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Settings,
  Percent,
  Bell,
  DollarSign,
  Wallet,
  Shield,
  HelpCircle,
  Save,
  AlertCircle,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { getHarvestProErrorMessage } from '@/lib/harvestpro/humanized-errors';

// Enhanced validation schema with character limits and real-time feedback and humanized error messages
const HarvestProSettingsFormSchema = z.object({
  taxRate: z.number()
    .min(0, 'Tax rate needs to be positive - we can\'t have negative taxes! 😊')
    .max(1, 'Tax rate looks a bit high - did you mean to enter it as a percentage? (e.g., 0.24 for 24%)')
    .refine(
      (val) => val >= 0.1 && val <= 0.5,
      'Tax rate seems unusual - most folks are between 10% and 50%. Double-check with your tax advisor if you\'re unsure!'
    ),
  notificationsEnabled: z.boolean(),
  notificationThreshold: z.number()
    .min(0, 'Notification threshold can\'t be negative - we want to notify you about gains, not losses! 📈')
    .max(100000, 'That\'s a pretty high threshold! Consider a lower amount so you don\'t miss opportunities.')
    .refine(
      (val) => val >= 50,
      'We\'d suggest at least $50 for the threshold - smaller amounts might not be worth the notification noise.'
    ),
  preferredWallets: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'This wallet address format looks off - should be 0x followed by 40 characters'))
    .max(10, 'Whoa, that\'s a lot of wallets! We can only handle 10 at a time to keep things speedy.'),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
});

type HarvestProSettingsFormData = z.infer<typeof HarvestProSettingsFormSchema>;

interface HarvestProSettingsFormProps {
  initialSettings?: Partial<HarvestUserSettings>;
  onSave: (settings: HarvestProSettingsFormData) => Promise<void>;
  className?: string;
}

export function HarvestProSettingsForm({
  initialSettings,
  onSave,
  className
}: HarvestProSettingsFormProps) {
  const form = useFormValidation<HarvestProSettingsFormData>({
    schema: HarvestProSettingsFormSchema,
    mode: 'onBlur', // Real-time validation on blur
    reValidateMode: 'onChange', // Re-validate on every change
    defaultValues: {
      taxRate: initialSettings?.taxRate || 0.24,
      notificationsEnabled: initialSettings?.notificationsEnabled ?? true,
      notificationThreshold: initialSettings?.notificationThreshold || 100,
      preferredWallets: initialSettings?.preferredWallets || [],
      riskTolerance: initialSettings?.riskTolerance || 'moderate',
    },
  });

  const { validationState, getFieldState, handleSaveWithToast } = form;

  // Character counter for wallet addresses
  const walletAddressesText = form.watch('preferredWallets').join('\n');
  const walletCharacterCount = walletAddressesText.length;
  const maxWalletCharacters = 10 * 42; // 10 wallets * 42 chars each (0x + 40 hex)

  // Format tax rate as percentage for display
  const formatTaxRateDisplay = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format currency for notification threshold
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const onSubmit = async (data: HarvestProSettingsFormData) => {
    await handleSaveWithToast(onSave);
  };

  return (
    <TooltipProvider>
      <Card className={cn("w-full max-w-2xl", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            HarvestPro Settings
          </CardTitle>
          <CardDescription>
            Configure your tax-loss harvesting preferences with real-time validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Tax Rate Field */}
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => {
                  const fieldState = getFieldState('taxRate');
                  const displayValue = formatTaxRateDisplay(field.value);
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Tax Rate
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Your marginal tax rate for capital gains. Used to calculate tax savings.</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            placeholder="0.24"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className={cn(
                              fieldState.error && fieldState.isTouched && "border-red-500",
                              fieldState.isValid && fieldState.isTouched && "border-green-500"
                            )}
                          />
                        </FormControl>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {displayValue}
                          </span>
                          {fieldState.isTouched && (
                            fieldState.isValid ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                      <FormDescription>
                        Enter as decimal (e.g., 0.24 for 24%). Most folks are between 10-50% 😊
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Notification Threshold Field */}
              <FormField
                control={form.control}
                name="notificationThreshold"
                render={({ field }) => {
                  const fieldState = getFieldState('notificationThreshold');
                  const displayValue = formatCurrency(field.value);
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Notification Threshold
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Minimum net benefit required to trigger harvest opportunity notifications.</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            max="100000"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className={cn(
                              fieldState.error && fieldState.isTouched && "border-red-500",
                              fieldState.isValid && fieldState.isTouched && "border-green-500"
                            )}
                          />
                        </FormControl>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {displayValue}
                          </span>
                          {fieldState.isTouched && (
                            fieldState.isValid ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                      <FormDescription>
                        We'll only notify you when net benefit exceeds this amount (minimum $50 for meaningful alerts) 📊
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Notifications Enabled Switch */}
              <FormField
                control={form.control}
                name="notificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Enable Notifications
                      </FormLabel>
                      <FormDescription>
                        Get alerts when new harvest opportunities are detected - we promise not to spam you! 🔔
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Risk Tolerance Field */}
              <FormField
                control={form.control}
                name="riskTolerance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Risk Tolerance
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your risk tolerance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="conservative">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <div>
                              <div className="font-medium">Conservative</div>
                              <div className="text-sm text-muted-foreground">Low risk, high Guardian scores only</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-yellow-500" />
                            <div>
                              <div className="font-medium">Moderate</div>
                              <div className="text-sm text-muted-foreground">Balanced risk and reward</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="aggressive">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-red-500" />
                            <div>
                              <div className="font-medium">Aggressive</div>
                              <div className="text-sm text-muted-foreground">Higher risk for maximum opportunities</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determines which opportunities we'll show you based on your comfort with risk 🎯
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preferred Wallets Field */}
              <FormField
                control={form.control}
                name="preferredWallets"
                render={({ field }) => {
                  const fieldState = getFieldState('preferredWallets');
                  const characterCounter = formatCharacterCounter(
                    walletCharacterCount,
                    maxWalletCharacters,
                    0.8
                  );
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Preferred Wallets
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Wallets to prioritize for harvest opportunities. Enter one address per line.</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c&#10;0x8ba1f109551bD432803012645Hac136c22C501e"
                          className={cn(
                            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            fieldState.error && fieldState.isTouched && "border-red-500",
                            fieldState.isValid && fieldState.isTouched && "border-green-500"
                          )}
                          value={field.value.join('\n')}
                          onChange={(e) => {
                            const addresses = e.target.value
                              .split('\n')
                              .map(addr => addr.trim())
                              .filter(addr => addr.length > 0);
                            field.onChange(addresses);
                          }}
                        />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <FormDescription>
                          Enter wallet addresses (one per line, max 10) - copy & paste to avoid typos! 📝
                        </FormDescription>
                        <div className={cn(
                          "text-xs",
                          characterCounter.className
                        )}>
                          {field.value.length}/10 wallets
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Form Status Indicator with Encouraging Language */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {validationState.hasErrors ? (
                      <Heart className="w-4 h-4 text-red-500" />
                    ) : validationState.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {validationState.hasErrors
                        ? 'Almost there! Just need to fix a couple things 🔧'
                        : validationState.isValid && validationState.isDirty
                        ? 'Looking good! Ready to save your settings ✨'
                        : 'Make some changes and we\'ll save them for you'
                      }
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {validationState.isDirty ? 'Unsaved changes' : 'All changes saved 💾'}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button
                type="submit"
                disabled={!validationState.canSave}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {validationState.isSubmitting ? 'Saving your preferences...' : 'Save My Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}