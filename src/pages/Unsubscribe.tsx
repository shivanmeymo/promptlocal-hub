import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { MailX, CheckCircle, AlertCircle, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const Unsubscribe: React.FC = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'confirm'>('confirm');
  const [email, setEmail] = useState('');

  const subscriptionId = searchParams.get('id');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [emailParam]);

  const handleUnsubscribe = async () => {
    if (!subscriptionId || !email) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      const { error } = await supabase.functions.invoke('unsubscribe', {
        body: { subscription_id: subscriptionId, email: email },
      });

      if (error) throw error;
      setStatus('success');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStatus('error');
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {language === 'sv' ? 'Avprenumerera' : 'Unsubscribe'}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {status === 'confirm' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <MailX className="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle className="font-display text-2xl">
                  {language === 'sv' ? 'Avprenumerera' : 'Unsubscribe'}
                </CardTitle>
                <CardDescription>
                  {language === 'sv'
                    ? `Är du säker på att du vill avprenumerera${email ? ` (${email})` : ''}?`
                    : `Are you sure you want to unsubscribe${email ? ` (${email})` : ''}?`}
                </CardDescription>
              </>
            )}

            {status === 'loading' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <CardTitle className="font-display text-2xl">
                  {language === 'sv' ? 'Behandlar...' : 'Processing...'}
                </CardTitle>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <CardTitle className="font-display text-2xl text-success">
                  {language === 'sv' ? 'Avprenumererad!' : 'Unsubscribed!'}
                </CardTitle>
                <CardDescription>
                  {language === 'sv'
                    ? 'Du kommer inte längre att få e-postmeddelanden om nya evenemang.'
                    : 'You will no longer receive email notifications about new events.'}
                </CardDescription>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="font-display text-2xl text-destructive">
                  {language === 'sv' ? 'Något gick fel' : 'Something went wrong'}
                </CardTitle>
                <CardDescription>
                  {language === 'sv'
                    ? 'Vi kunde inte behandla din begäran. Kontakta oss om problemet kvarstår.'
                    : 'We could not process your request. Please contact us if the problem persists.'}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="text-center space-y-4">
            {status === 'confirm' && (
              <div className="flex flex-col gap-3">
                <Button onClick={handleUnsubscribe} variant="destructive" className="w-full">
                  {language === 'sv' ? 'Ja, avprenumerera' : 'Yes, unsubscribe'}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">
                    {language === 'sv' ? 'Avbryt' : 'Cancel'}
                  </Link>
                </Button>
              </div>
            )}

            {(status === 'success' || status === 'error') && (
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  {language === 'sv' ? 'Tillbaka till startsidan' : 'Back to home'}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Unsubscribe;
