import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Loader2, 
  UserPlus, 
  Trash2,
  CheckCircle2,
  Clock,
  Copy
} from 'lucide-react';
import { formatCurrency } from '@/lib/chit-calculations';

interface Chit {
  id: string;
  name: string;
  chit_amount: number;
  members_count: number;
  months: number;
  base_monthly_payment: number;
  post_take_monthly_payment: number;
  status: string;
  start_date: string | null;
  foreman_id: string | null;
}

interface ChitMember {
  id: string;
  user_id: string;
  has_taken: boolean;
  taken_month: number | null;
  join_date: string;
  profile: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

interface Profile {
  id: string;
  name: string;
  email: string | null;
}

export default function ChitDetails() {
  const { chitId } = useParams<{ chitId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [chit, setChit] = useState<Chit | null>(null);
  const [members, setMembers] = useState<ChitMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const isForeman = chit?.foreman_id === user?.id;

  useEffect(() => {
    if (chitId) {
      fetchChitDetails();
      fetchMembers();
    }
  }, [chitId]);

  const fetchChitDetails = async () => {
    const { data, error } = await supabase
      .from('chits')
      .select('*')
      .eq('id', chitId)
      .maybeSingle();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load chit details'
      });
      navigate('/');
      return;
    }

    if (!data) {
      toast({
        variant: 'destructive',
        title: 'Not Found',
        description: 'Chit group not found'
      });
      navigate('/');
      return;
    }

    setChit(data);
  };

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chit_members')
      .select(`
        id,
        user_id,
        has_taken,
        taken_month,
        join_date
      `)
      .eq('chit_id', chitId)
      .order('join_date', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    const userIds = data.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, phone')
      .in('id', userIds);

    const membersWithProfiles = data.map(member => ({
      ...member,
      profile: profiles?.find(p => p.id === member.user_id) || null
    }));

    setMembers(membersWithProfiles);
    setLoading(false);
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;
    
    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .ilike('email', `%${searchEmail}%`)
      .limit(10);

    if (!error && data) {
      // Filter out users who are already members
      const existingUserIds = members.map(m => m.user_id);
      setSearchResults(data.filter(p => !existingUserIds.includes(p.id)));
    }
    setSearching(false);
  };

  const addMember = async (userId: string) => {
    if (!chitId || !chit) return;

    // Check if we've reached member limit
    if (members.length >= chit.members_count) {
      toast({
        variant: 'destructive',
        title: 'Member limit reached',
        description: `This chit group can only have ${chit.members_count} members`
      });
      return;
    }

    setAdding(true);
    const { error } = await supabase
      .from('chit_members')
      .insert({
        chit_id: chitId,
        user_id: userId
      });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add member'
      });
    } else {
      toast({
        title: 'Member added',
        description: 'Member has been added to the chit group'
      });
      fetchMembers();
      setSearchResults([]);
      setSearchEmail('');
    }
    setAdding(false);
  };

  const removeMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member?.has_taken) {
      toast({
        variant: 'destructive',
        title: 'Cannot remove',
        description: 'Cannot remove a member who has already taken the chit'
      });
      return;
    }

    const { error } = await supabase
      .from('chit_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove member'
      });
    } else {
      toast({
        title: 'Member removed',
        description: 'Member has been removed from the chit group'
      });
      fetchMembers();
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/chits/${chitId}/join`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: 'Invite link has been copied to clipboard'
    });
  };

  if (loading && !chit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">{chit?.name}</h1>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(chit?.chit_amount || 0)} • {chit?.members_count} members
            </p>
          </div>
          <Badge variant={chit?.status === 'active' ? 'default' : 'secondary'}>
            {chit?.status}
          </Badge>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Chit Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chit Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(chit?.chit_amount || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Base Payment (B)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(chit?.base_monthly_payment || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Post-Take Payment (A)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(chit?.post_take_monthly_payment || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Members Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <CardDescription>
                {members.length} of {chit?.members_count} members
              </CardDescription>
            </div>
            
            {isForeman && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyInviteLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Invite Link
                </Button>
                
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Member</DialogTitle>
                      <DialogDescription>
                        Search for a user by email to add them to this chit group.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="search-email" className="sr-only">Email</Label>
                          <Input
                            id="search-email"
                            placeholder="Search by email..."
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                          />
                        </div>
                        <Button onClick={searchUsers} disabled={searching}>
                          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                        </Button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="space-y-2">
                          {searchResults.map((profile) => (
                            <div
                              key={profile.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div>
                                <p className="font-medium">{profile.name}</p>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addMember(profile.id)}
                                disabled={adding}
                              >
                                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchEmail && searchResults.length === 0 && !searching && (
                        <p className="text-center text-sm text-muted-foreground">
                          No users found. They need to sign up first.
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 font-semibold">No members yet</h3>
                <p className="text-sm text-muted-foreground">
                  Add members to this chit group to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    {isForeman && <TableHead className="w-[80px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.profile?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.profile?.email || '-'}
                      </TableCell>
                      <TableCell>
                        {member.has_taken ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Taker (Month {member.taken_month})
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Not taken
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.join_date).toLocaleDateString()}
                      </TableCell>
                      {isForeman && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMember(member.id)}
                            disabled={member.has_taken}
                            title={member.has_taken ? 'Cannot remove - already taken' : 'Remove member'}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}