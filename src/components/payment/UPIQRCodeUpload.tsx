import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, QrCode, Trash2 } from 'lucide-react';

interface UPIQRCodeUploadProps {
  chitId: string;
}

interface PaymentSettings {
  id: string;
  qr_code_url: string | null;
  upi_id: string | null;
  account_holder_name: string | null;
}

export function UPIQRCodeUpload({ chitId }: UPIQRCodeUploadProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [chitId]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('chit_id', chitId)
      .maybeSingle();

    if (!error && data) {
      setSettings(data);
      setUpiId(data.upi_id || '');
      setAccountHolderName(data.account_holder_name || '');
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB'
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${chitId}/qr-code.${fileExt}`;

      // Delete existing file if any
      if (settings?.qr_code_url) {
        const existingPath = settings.qr_code_url.split('/').pop();
        if (existingPath) {
          await supabase.storage
            .from('upi-qr-codes')
            .remove([`${chitId}/${existingPath}`]);
        }
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('upi-qr-codes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('upi-qr-codes')
        .getPublicUrl(filePath);

      // Update or insert payment settings
      const { data: user } = await supabase.auth.getUser();
      
      if (settings) {
        await supabase
          .from('payment_settings')
          .update({
            qr_code_url: urlData.publicUrl,
            updated_at: new Date().toISOString(),
            updated_by: user.user?.id
          })
          .eq('id', settings.id);
      } else {
        await supabase
          .from('payment_settings')
          .insert({
            chit_id: chitId,
            qr_code_url: urlData.publicUrl,
            updated_by: user.user?.id
          });
      }

      toast({
        title: 'QR Code uploaded',
        description: 'Payment QR code has been updated'
      });

      fetchSettings();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload QR code'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteQR = async () => {
    if (!settings?.qr_code_url) return;

    setUploading(true);
    try {
      // Extract file path from URL
      const url = new URL(settings.qr_code_url);
      const pathParts = url.pathname.split('/');
      const filePath = `${chitId}/${pathParts[pathParts.length - 1]}`;

      await supabase.storage
        .from('upi-qr-codes')
        .remove([filePath]);

      await supabase
        .from('payment_settings')
        .update({ qr_code_url: null })
        .eq('id', settings.id);

      toast({
        title: 'QR Code removed',
        description: 'Payment QR code has been deleted'
      });

      fetchSettings();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Failed to delete QR code'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      if (settings) {
        await supabase
          .from('payment_settings')
          .update({
            upi_id: upiId || null,
            account_holder_name: accountHolderName || null,
            updated_at: new Date().toISOString(),
            updated_by: user.user?.id
          })
          .eq('id', settings.id);
      } else {
        await supabase
          .from('payment_settings')
          .insert({
            chit_id: chitId,
            upi_id: upiId || null,
            account_holder_name: accountHolderName || null,
            updated_by: user.user?.id
          });
      }

      toast({
        title: 'Settings saved',
        description: 'Payment details have been updated'
      });

      fetchSettings();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Failed to save payment details'
      });
    } finally {
      setSaving(false);
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

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" />
          UPI Payment Settings
        </CardTitle>
        <CardDescription>
          Upload your UPI QR code for members to scan and make payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Preview */}
        <div className="flex flex-col items-center gap-4">
          {settings?.qr_code_url ? (
            <div className="relative">
              <img
                src={settings.qr_code_url}
                alt="UPI QR Code"
                className="h-48 w-48 rounded-lg border object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-8 w-8"
                onClick={handleDeleteQR}
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
              <div className="text-center text-muted-foreground">
                <QrCode className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">No QR code uploaded</p>
              </div>
            </div>
          )}

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={uploading}
            />
            <Button variant="outline" disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {settings?.qr_code_url ? 'Replace QR Code' : 'Upload QR Code'}
            </Button>
          </div>
        </div>

        {/* UPI Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID</Label>
            <Input
              id="upi-id"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-name">Account Holder Name</Label>
            <Input
              id="account-name"
              placeholder="Account holder name"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveDetails} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Payment Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
