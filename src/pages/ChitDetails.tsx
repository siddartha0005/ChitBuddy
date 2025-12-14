import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Users, 
  Loader2, 
  UserPlus, 
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/chit-calculations';
import { UPIQRCodeUpload } from '@/components/payment/UPIQRCodeUpload';
import { UPIQRCodeDisplay } from '@/components/payment/UPIQRCodeDisplay';
import { AddMemberDialog } from '@/components/chit/AddMemberDialog';
import { RecordOfflinePayment } from '@/components/payment/RecordOfflinePayment';
import { PendingPayments } from '@/components/payment/PendingPayments';

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

export default function ChitDetails() {
  const { chitId } = useParams<{ chitId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [chit, setChit] = useState<Chit | null>(null);
  const [members, setMembers] = useState<ChitMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

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
        {/* Role indicator for this chit */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {isForeman ? 'You are the Foreman' : 'You are a Member'}
                </CardTitle>
                <CardDescription>
                  {isForeman 
                    ? 'You can manage members, select receivers, and approve payments'
                    : 'You can view details, make payments, and participate in auctions'}
                </CardDescription>
              </div>
              <Badge variant={isForeman ? 'default' : 'secondary'} className="text-sm">
                {isForeman ? 'Foreman' : 'Member'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

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
              <p className="text-xs text-muted-foreground">Paid before taking</p>
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
              <p className="text-xs text-muted-foreground">Paid after taking</p>
            </CardContent>
          </Card>
        </div>

        {/* Foreman Actions */}
        {isForeman && (
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Foreman Controls</CardTitle>
              <CardDescription>Manage this chit group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="justify-start">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Select Monthly Receiver
                </Button>
                <Button variant="outline" className="justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  Open Auction
                </Button>
                <RecordOfflinePayment
                  chitId={chitId!}
                  members={members.map(m => ({
                    id: m.id,
                    user_id: m.user_id,
                    profile: m.profile ? { name: m.profile.name, phone: m.profile.phone } : null
                  }))}
                  basePayment={chit?.base_monthly_payment || 0}
                  postTakePayment={chit?.post_take_monthly_payment || 0}
                  onPaymentRecorded={() => {}}
                />
                <Button variant="outline" className="justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View Ledger
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Payments for Foreman */}
        {isForeman && chitId && (
          <div className="mb-6">
            <PendingPayments chitId={chitId} />
          </div>
        )}

        {/* UPI Payment Settings for Foreman */}
        {isForeman && chitId && (
          <div className="mb-6">
            <UPIQRCodeUpload chitId={chitId} />
          </div>
        )}

        {/* Member Actions */}
        {!isForeman && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Your Actions</CardTitle>
              <CardDescription>Available actions for this chit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button variant="outline" className="justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  View Payment Due
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View Statements
                </Button>
                <Button variant="outline" className="justify-start">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Participate in Auction
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* UPI QR Code Display for Members */}
        {!isForeman && chitId && (
          <div className="mb-6">
            <UPIQRCodeDisplay chitId={chitId} />
          </div>
        )}

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
            
            {isForeman && chitId && chit && (
              <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
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
                  {isForeman 
                    ? 'Add members to this chit group to get started'
                    : 'No other members have joined yet'}
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
                        {member.user_id === user?.id && (
                          <Badge variant="outline" className="ml-2">You</Badge>
                        )}
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
                            disabled={member.has_taken || member.user_id === user?.id}
                            title={member.has_taken ? 'Cannot remove - already taken' : member.user_id === user?.id ? 'Cannot remove yourself' : 'Remove member'}
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

      {/* Add Member Dialog */}
      {chitId && chit && (
        <AddMemberDialog
          open={addMemberOpen}
          onOpenChange={setAddMemberOpen}
          chitId={chitId}
          chitName={chit.name}
          existingMemberUserIds={members.map(m => m.user_id)}
          maxMembers={chit.members_count}
          currentMemberCount={members.length}
          onMemberAdded={fetchMembers}
        />
      )}
    </div>
  );
}