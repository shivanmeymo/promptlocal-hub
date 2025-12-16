import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'sv';

interface Translations {
  [key: string]: {
    en: string;
    sv: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', sv: 'Hem' },
  'nav.createEvent': { en: 'Create Event', sv: 'Skapa Event' },
  'nav.about': { en: 'About Us', sv: 'Om Oss' },
  'nav.contact': { en: 'Contact Us', sv: 'Kontakta Oss' },
  'nav.dataIntegrity': { en: 'Data Integrity', sv: 'Dataintegritet' },
  'nav.terms': { en: 'Terms & Conditions', sv: 'Villkor' },
  'nav.myAccount': { en: 'My Account', sv: 'Mitt Konto' },
  'nav.manageEvents': { en: 'Manage Events', sv: 'Hantera Event' },
  'nav.logout': { en: 'Log Out', sv: 'Logga Ut' },
  'nav.login': { en: 'Log In', sv: 'Logga In' },
  'nav.signInUp': { en: 'Sign In / Sign Up', sv: 'Logga In / Registrera' },
  'nav.menu': { en: 'Menu', sv: 'Meny' },

  // Hero Section
  'hero.title': { en: 'Discover Events and Activities Across Sweden', sv: 'Upptäck Event och Aktiviteter Över Hela Sverige' },
  'hero.subtitle': { en: 'Explore thousands of events from Uppsala, Stockholm and beyond. All in one place.', sv: 'Utforska tusentals evenemang från Uppsala, Stockholm och vidare. Allt på ett ställe.' },
  'hero.cta': { en: 'Explore Events', sv: 'Utforska Event' },

  // Search & Filters
  'search.placeholder': { en: 'Press Enter...', sv: 'Tryck Enter...' },
  'search.search': { en: 'Search', sv: 'Sök' },
  'search.date': { en: 'Date', sv: 'Datum' },
  'search.location': { en: 'Location', sv: 'Plats' },
  'search.category': { en: 'Category', sv: 'Kategori' },
  'search.free': { en: 'Free', sv: 'Gratis' },
  'search.notify': { en: 'Notify', sv: 'Notifiera' },
  'search.select': { en: 'Select...', sv: 'Välj...' },

  // Events
  'events.upcoming': { en: 'Upcoming Events', sv: 'Kommande Event' },
  'events.found': { en: 'events found', sv: 'event hittade' },
  'events.noEvents': { en: 'No events found', sv: 'Inga event hittade' },
  'events.edit': { en: 'Edit', sv: 'Redigera' },
  'events.delete': { en: 'Delete', sv: 'Ta bort' },
  'events.pending': { en: 'Pending Approval', sv: 'Väntar på godkännande' },
  'events.approved': { en: 'Approved', sv: 'Godkänd' },
  'events.rejected': { en: 'Rejected', sv: 'Avvisad' },

  // Create Event
  'create.title': { en: 'Create New Event', sv: 'Skapa Nytt Event' },
  'create.subtitle': { en: 'Fill in the details below to publish your event', sv: 'Fyll i detaljerna nedan för att publicera ditt event' },
  'create.organizerInfo': { en: 'Organizer Information', sv: 'Arrangörsinformation' },
  'create.organizerName': { en: "Organizer's Name", sv: 'Arrangörens namn' },
  'create.organizerEmail': { en: 'Organizer Email', sv: 'Arrangörens e-post' },
  'create.organizerDesc': { en: "Organizer's Description (Optional)", sv: 'Arrangörens beskrivning (valfritt)' },
  'create.eventDetails': { en: 'Event Details', sv: 'Eventdetaljer' },
  'create.eventTitle': { en: 'Event Title', sv: 'Eventtitel' },
  'create.eventDesc': { en: 'Event Description', sv: 'Eventbeskrivning' },
  'create.startDate': { en: 'Start Date', sv: 'Startdatum' },
  'create.startTime': { en: 'Start Time', sv: 'Starttid' },
  'create.endDate': { en: 'End Date', sv: 'Slutdatum' },
  'create.endTime': { en: 'End Time', sv: 'Sluttid' },
  'create.location': { en: 'Location', sv: 'Plats' },
  'create.category': { en: 'Category', sv: 'Kategori' },
  'create.isFree': { en: 'This event is free', sv: 'Detta event är gratis' },
  'create.price': { en: 'Event Price', sv: 'Eventpris' },
  'create.image': { en: 'Event Image (Optional)', sv: 'Eventbild (valfritt)' },
  'create.uploadImage': { en: 'Click to upload or drag and drop', sv: 'Klicka för att ladda upp eller dra och släpp' },
  'create.submit': { en: 'Create Event', sv: 'Skapa Event' },
  'create.success': { en: 'Event created successfully! Awaiting admin approval.', sv: 'Event skapat! Väntar på adminens godkännande.' },

  // Contact
  'contact.title': { en: 'Contact NowInTown', sv: 'Kontakta NowInTown' },
  'contact.subtitle': { en: "We'd love to hear from you!", sv: 'Vi vill gärna höra från dig!' },
  'contact.getInTouch': { en: 'Get in Touch', sv: 'Kontakta oss' },
  'contact.operatingHours': { en: 'Operating Hours', sv: 'Öppettider' },
  'contact.hours': { en: 'Monday - Friday: 9:00 AM - 5:00 PM', sv: 'Måndag - Fredag: 9:00 - 17:00' },
  'contact.sendMessage': { en: 'Send Us a Message', sv: 'Skicka ett meddelande' },
  'contact.name': { en: 'Name', sv: 'Namn' },
  'contact.email': { en: 'Email', sv: 'E-post' },
  'contact.phone': { en: 'Phone', sv: 'Telefon' },
  'contact.category': { en: 'Category', sv: 'Kategori' },
  'contact.message': { en: 'Message', sv: 'Meddelande' },
  'contact.submit': { en: 'Send Message', sv: 'Skicka meddelande' },
  'contact.createUnforgettable': { en: "Let's Create Something Unforgettable", sv: 'Låt oss skapa något oförglömligt' },
  'contact.success': { en: 'Message sent successfully!', sv: 'Meddelande skickat!' },

  // About
  'about.title': { en: 'About NowInTown', sv: 'Om NowInTown' },
  'about.tagline': { en: 'Breaking loneliness, building connections, one event at a time', sv: 'Bryter ensamhet, bygger kontakter, ett event i taget' },
  'about.mission': { en: 'Our Mission', sv: 'Vårt uppdrag' },
  'about.story': { en: 'Our Story', sv: 'Vår historia' },
  'about.communityFirst': { en: 'Community First', sv: 'Gemenskap först' },
  'about.simplicity': { en: 'Simplicity & Access', sv: 'Enkelhet & tillgänglighet' },
  'about.quality': { en: 'Quality & Trust', sv: 'Kvalitet & förtroende' },
  'about.getStarted': { en: 'Ready to Get Started?', sv: 'Redo att börja?' },
  'about.nationwide': { en: 'Nationwide Coverage', sv: 'Rikstäckande' },
  'about.dailyUpdates': { en: 'Daily Updates', sv: 'Dagliga uppdateringar' },
  'about.growingCommunity': { en: 'Growing Community', sv: 'Växande gemenskap' },

  // Profile
  'profile.title': { en: 'My Account', sv: 'Mitt Konto' },
  'profile.subtitle': { en: 'Manage your account settings and preferences', sv: 'Hantera dina kontoinställningar och preferenser' },
  'profile.info': { en: 'Profile Information', sv: 'Profilinformation' },
  'profile.viewManage': { en: 'View and manage your account details', sv: 'Visa och hantera dina kontouppgifter' },
  'profile.fullName': { en: 'Full Name', sv: 'Fullständigt namn' },
  'profile.email': { en: 'Email Address', sv: 'E-postadress' },
  'profile.changePassword': { en: 'Change Password', sv: 'Ändra lösenord' },
  'profile.passwordSubtitle': { en: 'Update your password to keep your account secure', sv: 'Uppdatera ditt lösenord för att hålla ditt konto säkert' },
  'profile.newPassword': { en: 'New Password', sv: 'Nytt lösenord' },
  'profile.confirmPassword': { en: 'Confirm Password', sv: 'Bekräfta lösenord' },
  'profile.updatePassword': { en: 'Update Password', sv: 'Uppdatera lösenord' },
  'profile.deleteAccount': { en: 'Delete Account', sv: 'Ta bort konto' },
  'profile.deleteWarning': { en: 'Permanently delete your account and all associated data', sv: 'Ta bort ditt konto och all tillhörande data permanent' },
  'profile.deleteButton': { en: 'Delete My Account', sv: 'Ta bort mitt konto' },

  // Data Integrity
  'data.title': { en: 'Data Integrity & Security', sv: 'Dataintegritet & Säkerhet' },
  'data.subtitle': { en: 'Your trust is our priority. We implement robust security measures to protect your event data and ensure its integrity at all times.', sv: 'Ditt förtroende är vår prioritet. Vi implementerar robusta säkerhetsåtgärder för att skydda din eventdata och säkerställa dess integritet hela tiden.' },
  'data.protection': { en: 'Data Protection', sv: 'Dataskydd' },
  'data.accessControl': { en: 'Access Control', sv: 'Åtkomstkontroll' },
  'data.integrity': { en: 'Data Integrity', sv: 'Dataintegritet' },
  'data.cleanup': { en: 'Automatic Cleanup', sv: 'Automatisk rensning' },
  'data.transparency': { en: 'Transparency', sv: 'Transparens' },
  'data.backups': { en: 'Regular Backups', sv: 'Regelbundna säkerhetskopior' },
  'data.commitment': { en: 'Our Commitment to You', sv: 'Vårt åtagande till dig' },
  'data.manageAccount': { en: 'Manage Your Account', sv: 'Hantera ditt konto' },
  'data.goToAccount': { en: 'Go to My Account', sv: 'Gå till mitt konto' },

  // Auth
  'auth.login': { en: 'Log In', sv: 'Logga In' },
  'auth.signIn': { en: 'Sign In', sv: 'Logga In' },
  'auth.signUp': { en: 'Sign Up', sv: 'Registrera dig' },
  'auth.signup': { en: 'Sign Up', sv: 'Registrera dig' },
  'auth.email': { en: 'Email', sv: 'E-post' },
  'auth.password': { en: 'Password', sv: 'Lösenord' },
  'auth.fullName': { en: 'Full Name', sv: 'Fullständigt namn' },
  'auth.orContinueWith': { en: 'Or continue with', sv: 'Eller fortsätt med' },
  'auth.google': { en: 'Google', sv: 'Google' },
  'auth.noAccount': { en: "Don't have an account?", sv: 'Har du inget konto?' },
  'auth.hasAccount': { en: 'Already have an account?', sv: 'Har du redan ett konto?' },
  'auth.welcome': { en: 'Welcome to NowInTown', sv: 'Välkommen till NowInTown' },
  'auth.welcomeBack': { en: 'Welcome back!', sv: 'Välkommen tillbaka!' },

  // Footer
  'footer.tagline': { en: 'Discover amazing events and activities across Sweden.', sv: 'Upptäck fantastiska event och aktiviteter över hela Sverige.' },
  'footer.quickLinks': { en: 'Quick Links', sv: 'Snabblänkar' },
  'footer.rights': { en: 'All rights reserved.', sv: 'Alla rättigheter förbehållna.' },

  // Categories
  'category.music': { en: 'Music', sv: 'Musik' },
  'category.sports': { en: 'Sports', sv: 'Sport' },
  'category.art': { en: 'Art', sv: 'Konst' },
  'category.food': { en: 'Food', sv: 'Mat' },
  'category.business': { en: 'Business', sv: 'Affärer' },
  'category.education': { en: 'Education', sv: 'Utbildning' },
  'category.community': { en: 'Community', sv: 'Gemenskap' },
  'category.other': { en: 'Other', sv: 'Övrigt' },

  // Common
  'common.loading': { en: 'Loading...', sv: 'Laddar...' },
  'common.error': { en: 'An error occurred', sv: 'Ett fel inträffade' },
  'common.save': { en: 'Save', sv: 'Spara' },
  'common.cancel': { en: 'Cancel', sv: 'Avbryt' },
  'common.confirm': { en: 'Confirm', sv: 'Bekräfta' },
  'common.required': { en: 'Required', sv: 'Obligatoriskt' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'sv';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
