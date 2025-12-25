import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Send, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// Cloudflare Turnstile site key (public)
const TURNSTILE_SITE_KEY = "0x4AAAAAACH5AgxC_kb_RAge";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact';
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactOrganizerDialogProps {
  eventId: string;
  eventTitle: string;
  organizerName: string;
}

export const ContactOrganizerDialog: React.FC<ContactOrganizerDialogProps> = ({
  eventId,
  eventTitle,
  organizerName,
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CAPTCHA state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  // Load Turnstile script
  useEffect(() => {
    if (!open) return;

    const existing = document.getElementById('turnstile-script') as HTMLScriptElement | null;

    if (existing) {
      if (window.turnstile) {
        setScriptLoaded(true);
        return;
      }

      const onLoad = () => setScriptLoaded(true);
      existing.addEventListener('load', onLoad);
      return () => existing.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      setCaptchaError(
        language === 'sv'
          ? 'Captcha kunde inte laddas.'
          : 'Captcha failed to load.'
      );
    };
    document.head.appendChild(script);
  }, [open, language]);

  // Cleanup widget on close/unmount
  useEffect(() => {
    return () => {
      if (captchaWidgetId && window.turnstile) {
        try {
          window.turnstile.remove(captchaWidgetId);
        } catch (e) {
          // Widget may already be removed
        }
      }
    };
  }, [captchaWidgetId]);

  // Render Turnstile widget
  const renderCaptcha = useCallback(() => {
    const container = document.getElementById('organizer-turnstile-container');
    if (!container || !window.turnstile) return;

    // Clear existing widget + reset token
    container.innerHTML = '';
    setCaptchaToken(null);
    setCaptchaError(null);

    const widgetId = window.turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        setCaptchaToken(token);
        setCaptchaError(null);
      },
      'error-callback': () => {
        const host = window.location.hostname;
        setCaptchaToken(null);
        setCaptchaError(
          language === 'sv'
            ? `Captcha fungerar inte på denna domän (${host}).`
            : `Captcha is not working on this domain (${host}).`
        );
      },
      'expired-callback': () => {
        setCaptchaToken(null);
      },
      theme: 'auto',
      size: 'compact',
    });

    setCaptchaWidgetId(widgetId);
  }, [language]);

  // Render captcha when dialog opens and script loads
  useEffect(() => {
    if (!open || !scriptLoaded) return;

    let tries = 0;
    const maxTries = 60;

    const tick = () => {
      const container = document.getElementById('organizer-turnstile-container');
      if (container && window.turnstile) {
        renderCaptcha();
        return;
      }

      tries += 1;
      if (tries >= maxTries) {
        setCaptchaError(
          language === 'sv'
            ? 'Captcha kunde inte initieras.'
            : 'Captcha could not initialize.'
        );
        return;
      }
      window.setTimeout(tick, 100);
    };

    tick();
  }, [open, scriptLoaded, renderCaptcha, language]);

  // Reset captcha state when dialog closes
  useEffect(() => {
    if (!open) {
      setCaptchaToken(null);
      setCaptchaError(null);
      if (captchaWidgetId && window.turnstile) {
        try {
          window.turnstile.remove(captchaWidgetId);
        } catch (e) {
          // Widget may already be removed
        }
        setCaptchaWidgetId(null);
      }
    }
  }, [open, captchaWidgetId]);

  const onSubmit = async (data: ContactFormData) => {
    // Verify captcha
    if (!captchaToken) {
      toast({
        title: language === 'sv' ? 'Verifiering krävs' : 'Verification required',
        description:
          captchaError ||
          (language === 'sv'
            ? 'Vänligen slutför captcha-verifieringen.'
            : 'Please complete the captcha verification.'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify captcha token with backend
      const { data: captchaResult, error: captchaInvokeError } = await supabase.functions.invoke('verify-captcha', {
        body: { token: captchaToken },
      });

      if (captchaInvokeError || !captchaResult?.success) {
        toast({
          title: language === 'sv' ? 'Verifiering misslyckades' : 'Verification failed',
          description:
            language === 'sv'
              ? 'Captcha-verifieringen misslyckades. Försök igen.'
              : 'Captcha verification failed. Please try again.',
          variant: 'destructive',
        });

        if (captchaWidgetId && window.turnstile) {
          window.turnstile.reset(captchaWidgetId);
        }
        setCaptchaToken(null);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.functions.invoke('contact-organizer', {
        body: {
          eventId,
          eventTitle,
          senderName: data.name,
          senderEmail: data.email,
          message: data.message,
        },
      });

      if (error) throw error;

      toast({
        title: language === 'sv' ? 'Meddelande skickat!' : 'Message sent!',
        description: language === 'sv' 
          ? 'Arrangören kommer att kontakta dig via e-post.'
          : 'The organizer will contact you via email.',
      });
      
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error sending contact message:', error);
      toast({
        title: language === 'sv' ? 'Ett fel uppstod' : 'An error occurred',
        description: language === 'sv' 
          ? 'Försök igen senare.'
          : 'Please try again later.',
        variant: 'destructive',
      });

      // Reset captcha on error
      if (captchaWidgetId && window.turnstile) {
        window.turnstile.reset(captchaWidgetId);
      }
      setCaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Mail className="w-4 h-4" />
          {language === 'sv' ? 'Kontakta arrangör' : 'Contact Organizer'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {language === 'sv' ? 'Kontakta arrangören' : 'Contact the Organizer'}
          </DialogTitle>
          <DialogDescription>
            {language === 'sv' 
              ? `Skicka ett meddelande till ${organizerName} angående "${eventTitle}"`
              : `Send a message to ${organizerName} regarding "${eventTitle}"`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'sv' ? 'Ditt namn' : 'Your name'}</FormLabel>
                  <FormControl>
                    <Input placeholder={language === 'sv' ? 'Namn' : 'Name'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'sv' ? 'Din e-post' : 'Your email'}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'sv' ? 'Meddelande' : 'Message'}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={language === 'sv' ? 'Skriv ditt meddelande här...' : 'Write your message here...'}
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CAPTCHA Widget */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>
                  {language === 'sv'
                    ? 'Vänligen verifiera att du inte är en robot'
                    : 'Please verify you are not a robot'}
                </span>
              </div>
              <div id="organizer-turnstile-container" className="min-h-[65px]" />
              {captchaError && (
                <p className="text-sm text-destructive">{captchaError}</p>
              )}
              {captchaToken && (
                <p className="text-sm text-green-600">
                  {language === 'sv' ? '✓ Verifierad' : '✓ Verified'}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !captchaToken}>
              <Send className="w-4 h-4" />
              {isSubmitting 
                ? (language === 'sv' ? 'Skickar...' : 'Sending...') 
                : (language === 'sv' ? 'Skicka meddelande' : 'Send Message')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
