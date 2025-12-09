import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, TrendingUp, Users, Wallet, Plus, Settings, ChevronRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/chit-calculations';

interface Chit {
  id: string;
  name: string;
  chit_amount: number;
  members_count: number;
  status: string;
  foreman_id: string | null;
}

export default function Dashboard() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [chits, setChits] = useState<Chit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChits();
  }, [user]);

  const fetchChits = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch chits where user is foreman or member
    const { data, error } = await supabase
      .from('chits')
      .select('id, name, chit_amount, members_count, status, foreman_id')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setChits(data);
    }
    
    setLoading(false);
  };

  const activeChits = chits.filter(c => c.status === 'active');
  const totalInvested = chits.reduce((sum, c) => sum + c.chit_amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">ChitBuddy</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {isAdmin ? 'Admin' : 'Member'}
            </Badge>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chits</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeChits.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeChits.length === 0 ? 'No active chit groups yet' : 'Active chit groups'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
              <p className="text-xs text-muted-foreground">Across all chit groups</p>
            </CardContent>
          </Card>
          
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">No upcoming payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Manage your chit groups</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/chits/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Chit Group
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Chit Groups List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Chit Groups</CardTitle>
            <CardDescription>View and manage your chit fund memberships</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 font-semibold">No chit groups yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {isAdmin 
                    ? "Create your first chit group to get started"
                    : "You haven't joined any chit groups yet"}
                </p>
                {isAdmin && (
                  <Button onClick={() => navigate('/chits/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Chit Group
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {chits.map((chit) => (
                  <div
                    key={chit.id}
                    onClick={() => navigate(`/chits/${chit.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{chit.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(chit.chit_amount)} • {chit.members_count} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={chit.status === 'active' ? 'default' : 'secondary'}>
                        {chit.status}
                      </Badge>
                      {chit.foreman_id === user?.id && (
                        <Badge variant="outline">Foreman</Badge>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}