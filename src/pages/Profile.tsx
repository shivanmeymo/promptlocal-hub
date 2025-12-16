import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Key, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, profile, updatePassword, deleteAccount, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const { error } = await updatePassword(newPassword);

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
      setNewPassword('');
      setConfirmPassword('');
    }

    setPasswordLoading(false);
  };

  const handleDeleteAccount = async () => {
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

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('profile.info')}
              </CardTitle>
              <CardDescription>{t('profile.viewManage')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

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
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? t('common.loading') : t('profile.updatePassword')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                {t('profile.deleteAccount')}
              </CardTitle>
              <CardDescription>{t('profile.deleteWarning')}</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {deleteLoading ? t('common.loading') : t('profile.deleteButton')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
