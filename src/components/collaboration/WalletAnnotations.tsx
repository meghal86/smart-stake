import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Edit, Trash2, Eye, EyeOff, User } from 'lucide-react';

interface Annotation {
  id: string;
  walletAddress: string;
  userId: string;
  userName: string;
  annotation: string;
  category: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WalletAnnotationsProps {
  walletAddress: string;
}

export function WalletAnnotations({ walletAddress }: WalletAnnotationsProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([
    {
      id: '1',
      walletAddress,
      userId: 'user1',
      userName: 'John Doe',
      annotation: 'High-volume trader, likely institutional. Frequent interactions with major exchanges.',
      category: 'Analysis',
      isPrivate: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      walletAddress,
      userId: 'user2',
      userName: 'Jane Smith',
      annotation: 'Flagged for review - unusual transaction patterns detected in the last 30 days.',
      category: 'Compliance',
      isPrivate: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [newAnnotation, setNewAnnotation] = useState({
    annotation: '',
    category: 'Analysis',
    isPrivate: true
  });

  const categories = ['Analysis', 'Compliance', 'Risk Assessment', 'Investigation', 'General'];

  const handleAddAnnotation = () => {
    if (!newAnnotation.annotation.trim()) return;

    const annotation: Annotation = {
      id: Date.now().toString(),
      walletAddress,
      userId: 'current-user',
      userName: 'Current User',
      annotation: newAnnotation.annotation,
      category: newAnnotation.category,
      isPrivate: newAnnotation.isPrivate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setAnnotations([annotation, ...annotations]);
    setNewAnnotation({ annotation: '', category: 'Analysis', isPrivate: true });
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Compliance': return 'bg-red-100 text-red-800';
      case 'Risk Assessment': return 'bg-yellow-100 text-yellow-800';
      case 'Investigation': return 'bg-purple-100 text-purple-800';
      case 'Analysis': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Wallet Annotations</h3>
        <Badge variant="outline">{annotations.length}</Badge>
      </div>

      <div className="space-y-6">
        {/* Add New Annotation */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <h4 className="font-medium mb-4">Add New Annotation</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="annotation" className="text-sm font-medium">Annotation</Label>
              <Textarea
                id="annotation"
                placeholder="Enter your analysis, notes, or observations about this wallet..."
                value={newAnnotation.annotation}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, annotation: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <select
                  id="category"
                  value={newAnnotation.category}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, category: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="private"
                  checked={newAnnotation.isPrivate}
                  onCheckedChange={(checked) => setNewAnnotation({ ...newAnnotation, isPrivate: checked })}
                />
                <Label htmlFor="private" className="text-sm">Private annotation</Label>
              </div>
            </div>

            <Button onClick={handleAddAnnotation} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Annotation
            </Button>
          </div>
        </div>

        {/* Annotations List */}
        <div className="space-y-4">
          <h4 className="font-medium">Annotations ({annotations.length})</h4>
          
          {annotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No annotations yet. Add the first one above.</p>
            </div>
          ) : (
            annotations.map((annotation) => (
              <div key={annotation.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{annotation.userName}</span>
                    <Badge className={getCategoryColor(annotation.category)}>
                      {annotation.category}
                    </Badge>
                    {annotation.isPrivate ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm mb-3">{annotation.annotation}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Created: {annotation.createdAt.toLocaleDateString()}
                  </span>
                  {annotation.updatedAt > annotation.createdAt && (
                    <span>
                      Updated: {annotation.updatedAt.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Collaboration Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {annotations.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Annotations</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {annotations.filter(a => !a.isPrivate).length}
            </div>
            <div className="text-sm text-muted-foreground">Public</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {annotations.filter(a => a.isPrivate).length}
            </div>
            <div className="text-sm text-muted-foreground">Private</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(annotations.map(a => a.userId)).size}
            </div>
            <div className="text-sm text-muted-foreground">Contributors</div>
          </div>
        </div>
      </div>
    </Card>
  );
}