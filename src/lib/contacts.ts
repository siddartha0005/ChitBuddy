// Capacitor Contacts integration
// This will only work in native mobile apps

interface Contact {
  name: string;
  phone: string | null;
  email: string | null;
}

// Check if we're running in a native Capacitor environment
export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && 
         window.hasOwnProperty('Capacitor') && 
         (window as any).Capacitor?.isNativePlatform?.();
}

// Import contacts from device
export async function importContacts(): Promise<Contact[]> {
  if (!isNativeApp()) {
    console.log('Contacts API is only available in native apps');
    return [];
  }

  try {
    // Dynamic import to avoid issues in web
    const { Contacts } = await import('@capacitor-community/contacts');
    
    // Request permission
    const permission = await Contacts.requestPermissions();
    
    if (permission.contacts !== 'granted') {
      throw new Error('Contacts permission denied');
    }

    // Get all contacts
    const result = await Contacts.getContacts({
      projection: {
        name: true,
        phones: true,
        emails: true
      }
    });

    // Map to our Contact interface
    return result.contacts.map(contact => ({
      name: contact.name?.display || contact.name?.given || 'Unknown',
      phone: contact.phones?.[0]?.number || null,
      email: contact.emails?.[0]?.address || null
    })).filter(c => c.phone || c.email);
  } catch (error) {
    console.error('Error importing contacts:', error);
    throw error;
  }
}

// Pick a single contact
export async function pickContact(): Promise<Contact | null> {
  if (!isNativeApp()) {
    console.log('Contacts API is only available in native apps');
    return null;
  }

  try {
    const { Contacts } = await import('@capacitor-community/contacts');
    
    const result = await Contacts.pickContact({
      projection: {
        name: true,
        phones: true,
        emails: true
      }
    });

    if (!result.contact) return null;

    return {
      name: result.contact.name?.display || result.contact.name?.given || 'Unknown',
      phone: result.contact.phones?.[0]?.number || null,
      email: result.contact.emails?.[0]?.address || null
    };
  } catch (error) {
    console.error('Error picking contact:', error);
    throw error;
  }
}
