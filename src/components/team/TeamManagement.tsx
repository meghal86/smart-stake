import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Settings, Trash2, Mail, Shield, Eye, Circle, Upload } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  online?: boolean;
}

export const TeamManagement = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', role: 'viewer' as const });
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@company.com',
      role: 'admin',
      status: 'active',
      lastActive: '2 hours ago',
      online: true
    },
    {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah@company.com',
      role: 'analyst',
      status: 'active',
      lastActive: '1 day ago',
      online: false
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@company.com',
      role: 'viewer',
      status: 'pending',
      lastActive: 'Never',
      online: false
    }
  ]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'analyst': return <Settings className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'analyst': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const inviteMember = () => {
    if (newMember.email) {
      const member: TeamMember = {
        id: Date.now().toString(),
        name: newMember.email.split('@')[0],
        email: newMember.email,
        role: newMember.role,
        status: 'pending',
        lastActive: 'Never'
      };
      setTeamMembers([...teamMembers, member]);
      setNewMember({ email: '', role: 'viewer' });
      setShowInviteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Team Management</h2>
            <p className="text-muted-foreground">Manage team members and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
            <Button variant="outline" onClick={() => setShowBulkInvite(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Invite
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Members</span>
            </div>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Admins</span>
            </div>
            <div className="text-2xl font-bold">{teamMembers.filter(m => m.role === 'admin').length}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Analysts</span>
            </div>
            <div className="text-2xl font-bold">{teamMembers.filter(m => m.role === 'analyst').length}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'pending').length}</div>
          </Card>
        </div>

        {/* Team Members List */}
        <div className="space-y-3">
          <h3 className="font-semibold">Team Members</h3>
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-medium text-primary">{member.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <Circle className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-current ${
                    member.online ? 'text-green-500' : 'text-meta'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    <span className={`text-xs ${
                      member.online ? 'text-green-600' : 'text-label'
                    }`}>
                      {member.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                  <div className="text-xs text-muted-foreground">Last active: {member.lastActive}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getRoleColor(member.role)}>
                  {getRoleIcon(member.role)}
                  <span className="ml-1 capitalize">{member.role}</span>
                </Badge>
                <Badge variant={member.status === 'active' ? 'default' : member.status === 'pending' ? 'secondary' : 'destructive'}>
                  {member.status}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={newMember.role} onValueChange={(value: unknown) => setNewMember({...newMember, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer - Read only access</SelectItem>
                    <SelectItem value="analyst">Analyst - Can create alerts and rules</SelectItem>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={inviteMember} className="flex-1">Send Invite</Button>
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {showBulkInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Bulk Invite Members</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email Addresses (one per line)</label>
                <textarea
                  className="w-full h-32 p-3 border rounded-lg text-sm resize-none"
                  placeholder="john@company.com&#10;sarah@company.com&#10;mike@company.com"
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {bulkEmails.split('\n').filter(e => e.trim()).length} email(s) ready to invite
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    console.log('Bulk inviting:', bulkEmails.split('\n').filter(e => e.trim()));
                    setBulkEmails('');
                    setShowBulkInvite(false);
                  }} 
                  className="flex-1" 
                  disabled={!bulkEmails.trim()}
                >
                  Send Invites
                </Button>
                <Button variant="outline" onClick={() => setShowBulkInvite(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};