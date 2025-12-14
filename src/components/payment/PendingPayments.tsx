import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Loader2, Clock, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/chit-calculations';

interface PendingPayment {
  id: string;
  amount: number;
  type: string;
  payment_method: string | null;
  description: string | null;
  created_at: string;
  member_id: string;
  member_name: string;
  member_phone: string | null;
}

interface PendingPaymentsProps {
  chitId: string;
  onPaymentConfirmed?: () => void;
}

export function PendingPayments({ chitId, onPaymentConfirmed }: PendingPaymentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPayments();
  }, [chitId]);

  const fetchPendingPayments = async () => {
    setLoading(true);
    
    // Get pending ledger entries
    const { data: ledgerData, error: ledgerError } = await supabase
      .from('ledger')
      .select('id, amount, type, payment_method, description, created_at, member_id')
      .eq('chit_id', chitId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (ledgerError) {
      console.error('Error fetching pending payments:', ledgerError);
      setLoading(false);
      return;
    }

    if (!ledgerData || ledgerData.length === 0) {
      setPayments([]);
      setLoading(false);
      return;
    }

    // Get member IDs
    const memberIds = [...new Set(ledgerData.map(l => l.member_id))];
    
    // Get chit_members to get user_ids
    const { data: membersData } = await supabase
      .from('chit_members')
      .select('id, user_id')
      .in('id', memberIds);

    const userIds = membersData?.map(m => m.user_id) || [];
    
    // Get profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .in('id', userIds);

    // Map payments with member info
    const paymentsWithMembers = ledgerData.map(payment => {
      const member = membersData?.find(m => m.id === payment.member_id);
      const profile = profilesData?.find(p => p.id === member?.user_id);
      
      return {
        ...payment,
        member_name: profile?.name || 'Unknown',
        member_phone: profile?.phone || null,
      };
    });

    setPayments(paymentsWithMembers);
    setLoading(false);
  };

  const handleConfirm = async (paymentId: string) => {
    setProcessingId(paymentId);
    
    try {
      const { error } = await supabase
        .from('ledger')
        .update({
          status: 'confirmed',
          confirmed_by: user?.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        chit_id: chitId,
        admin_id: user?.id,
        action_type: 'confirm_payment',
        payload: { payment_id: paymentId },
      });

      toast({
        title: 'Payment confirmed',
        description: 'The payment has been confirmed successfully',
      });

      fetchPendingPayments();
      onPaymentConfirmed?.();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to confirm payment',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    setProcessingId(paymentId);
    
    try {
      const { error } = await supabase
        .from('ledger')
        .update({
          status: 'rejected',
          confirmed_by: user?.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        chit_id: chitId,
        admin_id: user?.id,
        action_type: 'reject_payment',
        payload: { payment_id: paymentId },
      });

      toast({
        title: 'Payment rejected',
        description: 'The payment has been marked as rejected',
      });

      fetchPendingPayments();
      onPaymentConfirmed?.();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject payment',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg">Pending Payment Confirmations</CardTitle>
        </div>
        <CardDescription>
          {payments.length} payment{payments.length > 1 ? 's' : ''} awaiting your confirmation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between rounded-lg border bg-background p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{payment.member_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatCurrency(payment.amount)}</span>
                  {payment.payment_method && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {payment.payment_method.replace('_', ' ')}
                      </Badge>
                    </>
                  )}
                </div>
                {payment.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{payment.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(payment.id)}
                disabled={processingId === payment.id}
              >
                {processingId === payment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirm(payment.id)}
                disabled={processingId === payment.id}
              >
                {processingId === payment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
