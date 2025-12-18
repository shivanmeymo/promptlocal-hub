import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const ResetPassword: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
      setCheckingSession(false);
    };

    // Listen for auth state changes (handles the token exchange from URL)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
        setCheckingSession(false);
      } else if (session) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'sv' ? 'Lösenorden matchar inte' : 'Passwords do not match',
        description: language === 'sv' ? 'Vänligen se till att lösenorden matchar.' : 'Please make sure the passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: language === 'sv' ? 'Lösenordet är för kort' : 'Password too short',
        description: language === 'sv' ? 'Lösenordet måste vara minst 6 tecken.' : 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSuccess(true);
      toast({
        title: language === 'sv' ? 'Lösenord uppdaterat' : 'Password updated',
        description: language === 'sv' ? 'Ditt lösenord har ändrats.' : 'Your password has been changed successfully.',
      });
    }

    setLoading(false);
  };

  if (checkingSession) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!hasSession) {
    return (
      <Layout>
        <Helmet>
          <title>NowInTown - {language === 'sv' ? 'Ogiltig länk' : 'Invalid Link'}</title>
        </Helmet>

        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">
                {language === 'sv' ? 'Ogiltig eller utgången länk' : 'Invalid or Expired Link'}
              </CardTitle>
              <CardDescription>
                {language === 'sv' 
                  ? 'Denna återställningslänk är ogiltig eller har gått ut. Vänligen begär en ny länk.'
                  : 'This password reset link is invalid or has expired. Please request a new one.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/auth">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === 'sv' ? 'Tillbaka till inloggning' : 'Back to Sign In'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <Helmet>
          <title>NowInTown - {language === 'sv' ? 'Lösenord uppdaterat' : 'Password Updated'}</title>
        </Helmet>

        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="font-display text-2xl">
                {language === 'sv' ? 'Lösenord uppdaterat!' : 'Password Updated!'}
              </CardTitle>
              <CardDescription>
                {language === 'sv' 
                  ? 'Ditt lösenord har ändrats. Du kan nu logga in med ditt nya lösenord.'
                  : 'Your password has been changed successfully. You can now sign in with your new password.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/">
                  {language === 'sv' ? 'Gå till startsidan' : 'Go to Home'}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/profile">
                  {language === 'sv' ? 'Gå till profil' : 'Go to Profile'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {language === 'sv' ? 'Återställ lösenord' : 'Reset Password'}</title>
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">✨</span>
              <span className="font-display font-bold text-2xl">
                <span className="text-primary">Now</span>
                <span className="text-accent">In</span>
                <span className="text-foreground">Town</span>
              </span>
            </Link>
            <CardTitle className="font-display text-2xl">
              {language === 'sv' ? 'Skapa nytt lösenord' : 'Create New Password'}
            </CardTitle>
            <CardDescription>
              {language === 'sv' 
                ? 'Ange ditt nya lösenord nedan.'
                : 'Enter your new password below.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="new-password">
                  {language === 'sv' ? 'Nytt lösenord' : 'New Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password">
                  {language === 'sv' ? 'Bekräfta lösenord' : 'Confirm Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Re-enter password"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? t('common.loading') 
                  : (language === 'sv' ? 'Uppdatera lösenord' : 'Update Password')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPassword;
