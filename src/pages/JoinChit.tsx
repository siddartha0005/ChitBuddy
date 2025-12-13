import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, CheckCircle2, XCircle } from 'lucide-react';
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
}

export default function JoinChit() {
  const { chitId } = useParams<{ chitId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [chit, setChit] = useState<Chit | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      // Store the join URL and redirect to auth
      sessionStorage.setItem('joinChitRedirect', `/join/${chitId}`);
      navigate('/auth');
      return;
    }

    if (chitId && user) {
      fetchChitDetails();
    }
  }, [chitId, user, authLoading]);

  const fetchChitDetails = async () => {
    // Fetch chit details (public query for join page)
    const { data: chitData, error: chitError } = await supabase
      .from('chits')
      .select('*')
      .eq('id', chitId)
      .maybeSingle();

    if (chitError || !chitData) {
      toast({
        variant: 'destructive',
        title: 'Not Found',
        description: 'This chit group does not exist or the link is invalid.'
      });
      setLoading(false);
      return;
    }

    setChit(chitData);

    // Check if user is already a member
    const { data: memberData } = await supabase
      .from('chit_members')
      .select('id')
      .eq('chit_id', chitId)
      .eq('user_id', user?.id)
      .maybeSingle();

    setIsMember(!!memberData);

    // Get current member count
    const { count } = await supabase
      .from('chit_members')
      .select('*', { count: 'exact', head: true })
      .eq('chit_id', chitId);

    setMemberCount(count || 0);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user || !chitId || !chit) return;

    if (memberCount >= chit.members_count) {
      toast({
        variant: 'destructive',
        title: 'Group Full',
        description: 'This chit group has reached its member limit.'
      });
      return;
    }

    setJoining(true);
    const { error } = await supabase
      .from('chit_members')
      .insert({
        chit_id: chitId,
        user_id: user.id
      });

    if (error) {
      if (error.code === '42501') {
        toast({
          variant: 'destructive',
          title: 'Cannot Join',
          description: 'You need to be invited by the foreman to join this group.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to join the chit group. Please try again.'
        });
      }
    } else {
      toast({
        title: 'Joined Successfully!',
        description: `You are now a member of ${chit.name}`
      });
      navigate(`/chits/${chitId}`);
    }
    setJoining(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This chit group does not exist or the link has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <CardTitle>Already a Member</CardTitle>
            <CardDescription>
              You are already a member of {chit.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate(`/chits/${chitId}`)}>
              View Chit Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFull = memberCount >= chit.members_count;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle>Join {chit.name}</CardTitle>
          <CardDescription>
            You've been invited to join this chit group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Chit Amount</p>
              <p className="font-semibold">{formatCurrency(chit.chit_amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Duration</p>
              <p className="font-semibold">{chit.months} months</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Monthly Payment (B)</p>
              <p className="font-semibold">{formatCurrency(chit.base_monthly_payment)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Members</p>
              <p className="font-semibold">{memberCount} / {chit.members_count}</p>
            </div>
          </div>

          {isFull ? (
            <div className="text-center py-4">
              <XCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-destructive">This group is full</p>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Join Chit Group
            </Button>
          )}

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
