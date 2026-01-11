import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Chrome, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Cloudflare Turnstile site key (public)
// Note: this is safe to ship in frontend. Domain restrictions are enforced in Turnstile settings.
// Production key for nowintown.se - use testing key for non-production domains
const isProductionDomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'nowintown.se' || window.location.hostname === 'www.nowintown.se');
// Use real key for production, visible testing key for development/preview
const TURNSTILE_SITE_KEY = isProductionDomain 
  ? "0x4AAAAAACKgQEPVM6HOoY9T" 
  : "1x00000000000000000000AA"; // Cloudflare visible testing key - always passes

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

const Auth: React.FC = () => {
  const { t, language } = useLanguage();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Turnstile script via centralized loader
  useEffect(() => {
    import('@/lib/turnstile').then(({ loadTurnstile }) => {
      loadTurnstile()
        .then(() => setScriptLoaded(true))
        .catch(() => {
          setCaptchaError(
            language === 'sv'
              ? 'Captcha kunde inte laddas (blockerad eller felaktig nyckel).'
              : 'Captcha failed to load (blocked or invalid key).'
          );
        });
    });
  }, [language]);

  // Cleanup widget on unmount / when widget changes
  useEffect(() => {
    return () => {
      if (captchaWidgetId && window.turnstile) {
        window.turnstile.remove(captchaWidgetId);
      }
    };
  }, [captchaWidgetId]);

  // Render Turnstile widget for signup
  const renderCaptcha = useCallback(async () => {
    const container = document.getElementById('turnstile-container');
    const { getTurnstile } = await import('@/lib/turnstile');
    const api = getTurnstile();
    if (!container || !api) return;

    // Clear existing widget + reset token
    container.innerHTML = '';
    setCaptchaToken(null);
    setCaptchaError(null);

    const widgetId = api.render(container, {      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        setCaptchaToken(token);
        setCaptchaError(null);
      },
      'error-callback': () => {
        // Common cause: site key not allowed for current domain (Turnstile error 400020)
        const host = window.location.hostname;
        setCaptchaToken(null);
        setCaptchaError(
          language === 'sv'
            ? `Captcha fungerar inte på denna domän (${host}). Lägg till domänen i Turnstile-inställningarna för din sitekey (fel 400020).`
            : `Captcha is not working on this domain (${host}). Add it to the allowed domains for your Turnstile site key (error 400020).`
        );
      },
      'expired-callback': () => {
        setCaptchaToken(null);
      },
      theme: 'auto',
      size: 'normal',
    });

    setCaptchaWidgetId(widgetId);
  }, [language]);

  // Render captcha immediately when entering signup (no need to type in fields)
  useEffect(() => {
    if (activeTab !== 'signup' || !scriptLoaded) return;

    let tries = 0;
    const maxTries = 60; // ~6s

    const tick = () => {
      const container = document.getElementById('turnstile-container');
      if (container && window.turnstile) {
        renderCaptcha();
        return;
      }

      tries += 1;
      if (tries >= maxTries) {
        setCaptchaError(
          language === 'sv'
            ? 'Captcha kunde inte initieras. Kontrollera att Turnstile-scriptet inte blockeras.'
            : 'Captcha could not initialize. Check if the Turnstile script is being blocked.'
        );
        return;
      }
      window.setTimeout(tick, 100);
    };

    tick();
  }, [activeTab, scriptLoaded, renderCaptcha, language]);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('auth.welcomeBack'),
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setLoading(true);

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
        setLoading(false);
        return;
      }

      const { error } = await signUp(signupEmail, signupPassword, signupName);

      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });

        if (captchaWidgetId && window.turnstile) {
          window.turnstile.reset(captchaWidgetId);
        }
        setCaptchaToken(null);
      } else {
        toast({
          title: t('auth.welcome'),
          description: 'Account created successfully!',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log('Starting Google login...');
      const { error } = await signInWithGoogle();

      if (error) {
        console.error('Google login error from hook:', error);
        toast({
          title: t('common.error'),
          description: `Firebase: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('auth.welcome'),
          description: 'Signed in successfully!',
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Caught error during Google login:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to sign in with Google',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Firebase password reset instead of Supabase
      const { sendPasswordResetEmail } = await import('@/integrations/firebase/password-reset');
      await sendPasswordResetEmail(resetEmail);
      
      toast({
        title: t('auth.passwordReset'),
        description: t('auth.passwordResetSent'),
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Layout>
        <Helmet>
          <title>NowInTown - {t('auth.resetPassword')}</title>
        </Helmet>

        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center relative">
               <Button
                 type="button"
                 variant="ghost"
                 className="absolute left-2 top-2 h-8 px-2"
                 onClick={() => {
                   navigate('/');
                 }}
                 aria-label={language === 'sv' ? 'Tillbaka' : 'Back'}
               >
                 <ArrowLeft className="w-4 h-4 mr-1" />
                 {language === 'sv' ? 'Tillbaka' : 'Back'}
               </Button>
              <Link to="/" className="flex items-center justify-center gap-2 mb-4">
                <span className="text-3xl">✨</span>
                <span className="font-display font-bold text-2xl">
                  <span className="text-primary">Now</span>
                  <span className="text-accent">In</span>
                  <span className="text-foreground">Town</span>
                </span>
              </Link>
              <CardTitle className="font-display text-2xl">{t('auth.resetPassword')}</CardTitle>
              <CardDescription>
                {t('auth.resetDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('common.loading') : t('auth.sendResetLink')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('auth.backToSignIn')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {t('auth.login')}</title>
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center relative">
            <Button
              type="button"
              variant="ghost"
              className="absolute left-2 top-2 h-8 px-2"
              onClick={() => {
                navigate('/');
              }}
              aria-label={language === 'sv' ? 'Tillbaka' : 'Back'}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {language === 'sv' ? 'Tillbaka' : 'Back'}
            </Button>
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">✨</span>
              <span className="font-display font-bold text-2xl">
                <span className="text-primary">Now</span>
                <span className="text-accent">In</span>
                <span className="text-foreground">Town</span>
              </span>
            </Link>
            <CardTitle className="font-display text-2xl">{t('auth.welcome')}</CardTitle>
            <CardDescription>
              {t('hero.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('common.loading') : t('auth.signIn')}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-muted-foreground hover:text-primary"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    {t('auth.forgotPassword')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Min. 6 characters"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Captcha Widget */}
                  <div className="flex flex-col items-center gap-2">
                    <div id="turnstile-container" className="min-h-[65px]" />
                    {captchaToken ? (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Shield className="w-4 h-4" />
                        {language === 'sv' ? 'Verifierad' : 'Verified'}
                      </div>
                    ) : captchaError ? (
                      <p className="text-xs text-destructive text-center">
                        {captchaError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {language === 'sv'
                          ? 'Slutför captcha för att skapa konto.'
                          : 'Complete the captcha to create an account.'}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('common.loading') : 'Sign up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-11 shadow-sm border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Chrome className="w-4 h-4 mr-2" />
              )}
              {t('auth.google')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Auth;
