import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Contact, Loader2 } from 'lucide-react';
import { isNativeApp, pickContact, importContacts } from '@/lib/contacts';

interface ContactData {
  name: string;
  phone: string | null;
  email: string | null;
}

interface ContactsPickerProps {
  onContactSelected?: (contact: ContactData) => void;
  onContactsImported?: (contacts: ContactData[]) => void;
  mode?: 'single' | 'multiple';
}

export function ContactsPicker({ 
  onContactSelected, 
  onContactsImported,
  mode = 'single' 
}: ContactsPickerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePickContact = async () => {
    if (!isNativeApp()) {
      toast({
        variant: 'destructive',
        title: 'Not available',
        description: 'Contact import is only available in the mobile app'
      });
      return;
    }

    setLoading(true);
    try {
      const contact = await pickContact();
      if (contact && onContactSelected) {
        onContactSelected(contact);
        toast({
          title: 'Contact selected',
          description: `${contact.name} has been selected`
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to access contacts. Please grant permission.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportContacts = async () => {
    if (!isNativeApp()) {
      toast({
        variant: 'destructive',
        title: 'Not available',
        description: 'Contact import is only available in the mobile app'
      });
      return;
    }

    setLoading(true);
    try {
      const contacts = await importContacts();
      if (onContactsImported) {
        onContactsImported(contacts);
        toast({
          title: 'Contacts imported',
          description: `${contacts.length} contacts imported successfully`
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to import contacts. Please grant permission.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={mode === 'single' ? handlePickContact : handleImportContacts}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Contact className="mr-2 h-4 w-4" />
      )}
      {mode === 'single' ? 'Pick from Contacts' : 'Import Contacts'}
    </Button>
  );
}
