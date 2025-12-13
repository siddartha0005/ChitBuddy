import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, QrCode, Copy, ExternalLink } from 'lucide-react';

interface UPIQRCodeDisplayProps {
  chitId: string;
  amountDue?: number;
}

interface PaymentSettings {
  qr_code_url: string | null;
  upi_id: string | null;
  account_holder_name: string | null;
}

export function UPIQRCodeDisplay({ chitId, amountDue }: UPIQRCodeDisplayProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [chitId]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_settings')
      .select('qr_code_url, upi_id, account_holder_name')
      .eq('chit_id', chitId)
      .maybeSingle();

    if (!error) {
      setSettings(data);
    }
    setLoading(false);
  };

  const copyUpiId = () => {
    if (settings?.upi_id) {
      navigator.clipboard.writeText(settings.upi_id);
      toast({
        title: 'UPI ID copied',
        description: 'UPI ID has been copied to clipboard'
      });
    }
  };

  const openUpiApp = () => {
    if (settings?.upi_id && amountDue) {
      // UPI deep link format
      const upiLink = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.account_holder_name || 'Chit Payment')}&am=${amountDue}&cu=INR`;
      window.location.href = upiLink;
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

  if (!settings || (!settings.qr_code_url && !settings.upi_id)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <QrCode className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 font-semibold">No Payment Info Available</h3>
          <p className="text-sm text-muted-foreground">
            The foreman has not set up payment details yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" />
          Make Payment
        </CardTitle>
        {amountDue !== undefined && (
          <CardDescription className="text-lg font-semibold text-foreground">
            Amount Due: ₹{amountDue.toLocaleString('en-IN')}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        {settings.qr_code_url && (
          <div className="flex justify-center">
            <img
              src={settings.qr_code_url}
              alt="UPI QR Code"
              className="h-64 w-64 rounded-lg border object-contain"
            />
          </div>
        )}

        {/* UPI Details */}
        {settings.upi_id && (
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            {settings.account_holder_name && (
              <div>
                <p className="text-xs text-muted-foreground">Pay to</p>
                <p className="font-medium">{settings.account_holder_name}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">UPI ID</p>
                <p className="font-mono font-medium">{settings.upi_id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={copyUpiId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Pay Now Button */}
        {settings.upi_id && amountDue !== undefined && amountDue > 0 && (
          <Button className="w-full" size="lg" onClick={openUpiApp}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Pay ₹{amountDue.toLocaleString('en-IN')} via UPI
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
        </p>
      </CardContent>
    </Card>
  );
}
