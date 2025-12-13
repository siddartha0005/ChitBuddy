import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Plus, 
  Phone, 
  Link, 
  Contact,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import { ContactsPicker } from '@/components/contacts/ContactsPicker';
import { isNativeApp } from '@/lib/contacts';

interface Profile {
  id: string;
  name: string;
  phone: string | null;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chitId: string;
  chitName: string;
  existingMemberUserIds: string[];
  maxMembers: number;
  currentMemberCount: number;
  onMemberAdded: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  chitId,
  chitName,
  existingMemberUserIds,
  maxMembers,
  currentMemberCount,
  onMemberAdded
}: AddMemberDialogProps) {
  const { toast } = useToast();
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/join/${chitId}`;

  const formatPhoneForSearch = (phone: string) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // If starts with 91 and is 12 digits, it's already with country code
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    // If 10 digits, add +91
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    return phone;
  };

  const searchUsers = async () => {
    if (!searchPhone.trim()) return;
    
    setSearching(true);
    const formattedPhone = formatPhoneForSearch(searchPhone);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .or(`phone.ilike.%${searchPhone}%,phone.eq.${formattedPhone}`)
      .limit(10);

    if (!error && data) {
      // Filter out users who are already members
      setSearchResults(data.filter(p => !existingMemberUserIds.includes(p.id)));
    }
    setSearching(false);
  };

  const addMember = async (userId: string) => {
    if (currentMemberCount >= maxMembers) {
      toast({
        variant: 'destructive',
        title: 'Member limit reached',
        description: `This chit group can only have ${maxMembers} members`
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
      onMemberAdded();
      setSearchResults([]);
      setSearchPhone('');
    }
    setAdding(false);
  };

  const handleContactSelected = async (contact: { name: string; phone: string | null }) => {
    if (!contact.phone) {
      toast({
        variant: 'destructive',
        title: 'No phone number',
        description: 'This contact does not have a phone number'
      });
      return;
    }

    setSearchPhone(contact.phone);
    // Auto search after selecting contact
    setSearching(true);
    const formattedPhone = formatPhoneForSearch(contact.phone);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .or(`phone.ilike.%${contact.phone.replace(/\D/g, '').slice(-10)}%,phone.eq.${formattedPhone}`)
      .limit(10);

    if (!error && data && data.length > 0) {
      setSearchResults(data.filter(p => !existingMemberUserIds.includes(p.id)));
    } else {
      toast({
        title: 'User not found',
        description: `${contact.name} is not registered. Share the invite link with them!`
      });
    }
    setSearching(false);
  };

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: 'Link copied',
      description: 'Invite link copied to clipboard'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInviteLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${chitName}`,
          text: `You've been invited to join the chit group "${chitName}". Click the link to join:`,
          url: inviteLink
        });
      } catch (error) {
        // User cancelled or share failed
        copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Add members by phone number or share an invite link
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="phone" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone" className="gap-2">
              <Phone className="h-4 w-4" />
              By Phone
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link className="h-4 w-4" />
              Invite Link
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="phone" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="search-phone" className="sr-only">Phone Number</Label>
                  <Input
                    id="search-phone"
                    placeholder="Enter phone number..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                    type="tel"
                  />
                </div>
                <Button onClick={searchUsers} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {isNativeApp() && (
                <ContactsPicker 
                  mode="single"
                  onContactSelected={handleContactSelected}
                />
              )}
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
                      <p className="text-sm text-muted-foreground">{profile.phone}</p>
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

            {searchPhone && searchResults.length === 0 && !searching && (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  No registered user found with this number.
                </p>
                <p className="text-xs text-muted-foreground">
                  Share the invite link for them to join after signing up.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Share this link with people you want to invite:</Label>
              
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyInviteLink}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <Button 
                className="w-full" 
                onClick={shareInviteLink}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Invite Link
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Anyone with this link can request to join your chit group after signing up.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
