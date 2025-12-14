import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  profile: {
    name: string;
    phone: string | null;
  } | null;
}

interface RecordOfflinePaymentProps {
  chitId: string;
  members: Member[];
  basePayment: number;
  postTakePayment: number;
  onPaymentRecorded: () => void;
}

export function RecordOfflinePayment({
  chitId,
  members,
  basePayment,
  postTakePayment,
  onPaymentRecorded,
}: RecordOfflinePaymentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [description, setDescription] = useState('');

  const handleRecordPayment = async () => {
    if (!selectedMember || !amount) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please select a member and enter the amount',
      });
      return;
    }

    setLoading(true);

    try {
      // Insert ledger entry as debit (member paid)
      const { error: ledgerError } = await supabase.from('ledger').insert({
        chit_id: chitId,
        member_id: selectedMember,
        type: 'credit',
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        description: description || `Offline ${paymentMethod} payment recorded`,
      });

      if (ledgerError) throw ledgerError;

      // Log admin action
      await supabase.from('admin_actions').insert({
        chit_id: chitId,
        admin_id: user?.id,
        action_type: 'record_offline_payment',
        payload: {
          member_id: selectedMember,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          description,
        },
      });

      toast({
        title: 'Payment recorded',
        description: `₹${amount} payment recorded as pending confirmation`,
      });

      setOpen(false);
      setSelectedMember('');
      setAmount('');
      setPaymentMethod('cash');
      setDescription('');
      onPaymentRecorded();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record payment',
      });
    } finally {
      setLoading(false);
    }
  };

  const setQuickAmount = (type: 'B' | 'A') => {
    setAmount(type === 'B' ? basePayment.toString() : postTakePayment.toString());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-start">
          <Banknote className="mr-2 h-4 w-4" />
          Record Offline Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Offline Payment</DialogTitle>
          <DialogDescription>
            Manually record a cash or offline payment. Payment will be marked as pending until confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label>Select Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.profile?.name || 'Unknown'} 
                    {member.profile?.phone && ` (${member.profile.phone})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickAmount('B')}
              >
                B: ₹{basePayment.toLocaleString()}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickAmount('A')}
              >
                A: ₹{postTakePayment.toLocaleString()}
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi_offline">UPI (Offline)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any notes about this payment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRecordPayment} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
