import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Send } from 'lucide-react';
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

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
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
            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
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
