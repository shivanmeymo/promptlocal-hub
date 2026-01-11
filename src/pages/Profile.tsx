import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Key, Trash2, AlertTriangle, Shield, Smartphone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, profile, updatePassword, deleteAccount, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetLinkLoading, setResetLinkLoading] = useState(false);

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Delete account state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast({
        title: t('common.error'),
        description: language === 'sv' ? 'Ange ditt nuvarande lösenord' : 'Enter your current password',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: language === 'sv' ? 'Lösenorden matchar inte' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: language === 'sv' ? 'Lösenordet måste vara minst 6 tecken' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setPasswordLoading(true);

    const { error } = await updatePassword(currentPassword, newPassword);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'sv' ? 'Lösenord uppdaterat' : 'Password updated',
        description: language === 'sv' ? 'Ditt lösenord har uppdaterats.' : 'Your password has been updated.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setPasswordLoading(false);
  };

  const handleSendResetLink = async () => {
    if (!user?.email) return;
    
    setResetLinkLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/profile`,
    });

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'sv' ? 'E-post skickad' : 'Email sent',
        description: language === 'sv' 
          ? 'En återställningslänk har skickats till din e-post.' 
          : 'A password reset link has been sent to your email.',
      });
    }

    setResetLinkLoading(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('user_id', user.uid);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'sv' ? 'Profil uppdaterad' : 'Profile updated',
        description: language === 'sv' ? 'Din profil har uppdaterats.' : 'Your profile has been updated.',
      });
      await refreshProfile();
      setEditMode(false);
    }

    setProfileLoading(false);
  };

  const handleToggle2FA = async () => {
    setTwoFactorLoading(true);

    // Supabase doesn't have built-in 2FA in the same way, but we can use MFA
    // For now, we'll show a toast indicating this is coming soon
    toast({
      title: language === 'sv' ? 'Kommer snart' : 'Coming Soon',
      description: language === 'sv' 
        ? 'Tvåfaktorsautentisering kommer snart att vara tillgänglig.' 
        : 'Two-factor authentication will be available soon.',
    });

    setTwoFactorLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: t('common.error'),
        description: language === 'sv' ? 'Skriv DELETE för att bekräfta' : 'Type DELETE to confirm',
        variant: 'destructive',
      });
      return;
    }

    setDeleteLoading(true);

    const { error } = await deleteAccount();

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'sv' ? 'Konto raderat' : 'Account deleted',
        description: language === 'sv' ? 'Ditt konto har raderats.' : 'Your account has been deleted.',
      });
      navigate('/');
    }

    setDeleteLoading(false);
  };

  if (!user) return null;

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {t('profile.title')}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              {language === 'sv' ? 'Profil' : 'Profile'}
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              {language === 'sv' ? 'Säkerhet' : 'Security'}
            </TabsTrigger>
            <TabsTrigger value="danger">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {language === 'sv' ? 'Farozon' : 'Danger Zone'}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('profile.info')}
                </CardTitle>
                <CardDescription>{t('profile.viewManage')}</CardDescription>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">{t('profile.fullName')}</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={language === 'sv' ? 'Ditt fullständiga namn' : 'Your full name'}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {t('profile.email')}
                      </Label>
                      <Input
                        value={user.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'sv' ? 'E-postadressen kan inte ändras' : 'Email address cannot be changed'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={profileLoading}>
                        {profileLoading ? t('common.loading') : (language === 'sv' ? 'Spara' : 'Save')}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>{t('profile.fullName')}</Label>
                      <Input
                        value={profile?.full_name || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {t('profile.email')}
                      </Label>
                      <Input
                        value={user.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <Button onClick={() => setEditMode(true)}>
                      {language === 'sv' ? 'Redigera profil' : 'Edit Profile'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  {t('profile.changePassword')}
                </CardTitle>
                <CardDescription>{t('profile.passwordSubtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">
                      {language === 'sv' ? 'Nuvarande lösenord' : 'Current Password'}
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={language === 'sv' ? 'Ange nuvarande lösenord' : 'Enter current password'}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={language === 'sv' ? 'Ange nytt lösenord' : 'Enter new password'}
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={language === 'sv' ? 'Bekräfta nytt lösenord' : 'Confirm new password'}
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading ? t('common.loading') : t('profile.updatePassword')}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    {language === 'sv' 
                      ? 'Glömt ditt lösenord? Få en återställningslänk via e-post.' 
                      : 'Forgot your password? Get a reset link via email.'}
                  </p>
                  <Button variant="outline" onClick={handleSendResetLink} disabled={resetLinkLoading}>
                    <Send className="w-4 h-4 mr-2" />
                    {resetLinkLoading 
                      ? t('common.loading') 
                      : (language === 'sv' ? 'Skicka återställningslänk' : 'Send Reset Link')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  {language === 'sv' ? 'Tvåfaktorsautentisering' : 'Two-Factor Authentication'}
                </CardTitle>
                <CardDescription>
                  {language === 'sv' 
                    ? 'Lägg till ett extra säkerhetslager till ditt konto' 
                    : 'Add an extra layer of security to your account'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {language === 'sv' ? 'Aktivera 2FA' : 'Enable 2FA'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'sv' 
                        ? 'Kräv en verifieringskod vid inloggning' 
                        : 'Require a verification code when signing in'}
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handleToggle2FA}
                    disabled={twoFactorLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-6 mt-6">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  {t('profile.deleteAccount')}
                </CardTitle>
                <CardDescription>{t('profile.deleteWarning')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                  <p className="text-sm text-destructive font-medium mb-2">
                    {language === 'sv' ? 'Varning!' : 'Warning!'}
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>{language === 'sv' ? 'Alla dina event kommer att raderas' : 'All your events will be deleted'}</li>
                    <li>{language === 'sv' ? 'Din profildata kommer att tas bort' : 'Your profile data will be removed'}</li>
                    <li>{language === 'sv' ? 'Denna åtgärd kan inte ångras' : 'This action cannot be undone'}</li>
                  </ul>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteLoading}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('profile.deleteButton')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        {language === 'sv' ? 'Är du säker?' : 'Are you sure?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {language === 'sv'
                          ? 'Denna åtgärd kan inte ångras. Detta kommer permanent ta bort ditt konto och all data kopplad till det.'
                          : 'This action cannot be undone. This will permanently delete your account and all data associated with it.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label htmlFor="deleteConfirm">
                        {language === 'sv' ? 'Skriv DELETE för att bekräfta' : 'Type DELETE to confirm'}
                      </Label>
                      <Input
                        id="deleteConfirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="mt-2"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                        {t('common.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                      >
                        {deleteLoading ? t('common.loading') : t('profile.deleteButton')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
