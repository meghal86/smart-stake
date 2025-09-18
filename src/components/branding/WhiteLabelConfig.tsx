import { useState } from 'react';
import { Palette, Upload, Eye, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BrandingConfig {
  companyName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  favicon: string;
  customDomain: string;
}

export function WhiteLabelConfig() {
  const [config, setConfig] = useState<BrandingConfig>({
    companyName: 'WhalePlus',
    logo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#10B981',
    favicon: '',
    customDomain: ''
  });

  const handleSave = async () => {
    try {
      await fetch('/api/branding/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      alert('Branding configuration saved successfully!');
    } catch (error) {
      alert('Failed to save configuration');
    }
  };

  const handleFileUpload = (type: 'logo' | 'favicon') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setConfig(prev => ({
          ...prev,
          [type]: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Palette className="h-5 w-5" />
        <h3 className="text-lg font-semibold">White Label Configuration</h3>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={config.companyName}
                onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <Label htmlFor="customDomain">Custom Domain</Label>
              <Input
                id="customDomain"
                value={config.customDomain}
                onChange={(e) => setConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                placeholder="analytics.yourcompany.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Company Logo</Label>
              <div className="mt-2 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload('logo')}
                />
                {config.logo && (
                  <div className="p-4 border rounded-lg">
                    <img src={config.logo} alt="Logo preview" className="h-12 object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Favicon</Label>
              <div className="mt-2 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload('favicon')}
                />
                {config.favicon && (
                  <div className="p-4 border rounded-lg">
                    <img src={config.favicon} alt="Favicon preview" className="h-8 w-8 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={config.secondaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  placeholder="#1E40AF"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={config.accentColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <div className="p-6 border rounded-lg" style={{ 
            borderColor: config.primaryColor,
            background: `linear-gradient(135deg, ${config.primaryColor}10, ${config.accentColor}10)`
          }}>
            <div className="flex items-center gap-4 mb-4">
              {config.logo && (
                <img src={config.logo} alt="Logo" className="h-8 object-contain" />
              )}
              <h2 className="text-xl font-bold" style={{ color: config.primaryColor }}>
                {config.companyName}
              </h2>
            </div>
            
            <div className="space-y-2">
              <div 
                className="px-4 py-2 rounded text-white text-sm"
                style={{ backgroundColor: config.primaryColor }}
              >
                Primary Button
              </div>
              <div 
                className="px-4 py-2 rounded text-white text-sm"
                style={{ backgroundColor: config.accentColor }}
              >
                Accent Button
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-6 border-t">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </Card>
  );
}