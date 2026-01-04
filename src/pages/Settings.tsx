import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Mail, Shield, Unlink, Loader2, Check, AlertCircle, Bell, BellOff, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AuthProvider = "email" | "google" | "unknown";

interface Notification {
  id: string;
  email: string;
  is_active: boolean;
  filters: {
    location?: string;
    category?: string;
    freeOnly?: boolean;
    keywords?: string[];
  } | null;
  created_at: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [authProvider, setAuthProvider] = useState<AuthProvider>("unknown");
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  
  // Notification preferences
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      // Determine auth provider from user metadata
      const provider = user.app_metadata?.provider;
      if (provider === "google") {
        setAuthProvider("google");
      } else if (provider === "email" || user.email) {
        setAuthProvider("email");
      }
      
      // Fetch user's notification subscriptions
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setNotificationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setNotifications((data || []).map(n => ({
        ...n,
        filters: n.filters as Notification["filters"]
      })));
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const toggleNotification = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      const { error } = await supabase
        .from("event_notifications")
        .update({ is_active: !currentActive })
        .eq("id", id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_active: !currentActive } : n)
      );
      
      toast.success(currentActive ? "Notifikationer pausade" : "Notifikationer aktiverade");
    } catch (err: any) {
      toast.error("Kunde inte uppdatera notifikationer");
    } finally {
      setTogglingId(null);
    }
  };

  const deleteNotification = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("event_notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Prenumeration borttagen");
    } catch (err: any) {
      toast.error("Kunde inte ta bort prenumeration");
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      music: "Musik",
      sports: "Sport",
      art: "Konst",
      food: "Mat & Dryck",
      business: "Business",
      education: "Utbildning",
      community: "Community",
      other: "Övrigt",
    };
    return labels[category] || category;
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setEmailLoading(true);
    try {
      // Firebase updateEmail requires recent authentication
      // User should re-authenticate before changing email
      const { updateEmail } = await import('firebase/auth');
      const { auth } = await import('@/integrations/firebase/auth');
      
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }

      await updateEmail(auth.currentUser, newEmail.trim());
      toast.success("En bekräftelselänk har skickats till din nya e-postadress.");
      setNewEmail("");
    } catch (err: any) {
      // If error is auth/requires-recent-login, prompt user to sign in again
      if (err?.code === 'auth/requires-recent-login') {
        toast.error("För säkerhets skull, logga in igen för att ändra din e-post.");
      } else {
        toast.error(err?.message || "Kunde inte uppdatera e-post.");
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setUnlinkLoading(true);
    try {
      const { auth } = await import('@/integrations/firebase/auth');
      
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }

      // Check if user has password provider or only Google
      const providerData = auth.currentUser.providerData;
      const hasPassword = providerData.some(p => p.providerId === 'password');
      
      if (!hasPassword) {
        toast.error("Du måste först sätta ett lösenord innan du kan koppla bort Google.");
        return;
      }

      // Firebase unlink provider
      const { unlink } = await import('firebase/auth');
      await unlink(auth.currentUser, 'google.com');
      
      toast.success("Google-konto har kopplats bort.");
    } catch (err: any) {
      toast.error(err?.message || "Ett fel inträffade.");
    } finally {
      setUnlinkLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <main className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <Helmet>
        <title>Inställningar | NowInTown</title>
        <meta name="description" content="Hantera dina kontoinställningar på NowInTown." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <main className="container max-w-2xl py-8 px-4 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Inställningar</h1>
          <p className="text-muted-foreground mt-1">Hantera ditt konto och inloggningsmetoder.</p>
        </div>

        {/* Login Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Inloggningsmetod
            </CardTitle>
            <CardDescription>Se hur du loggar in på ditt konto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {authProvider === "google" && "Inloggad via Google"}
                  {authProvider === "email" && "Inloggad via e-post och lösenord"}
                  {authProvider === "unknown" && "Okänd inloggningsmetod"}
                </p>
              </div>
              <Badge variant={authProvider === "google" ? "secondary" : "outline"}>
                {authProvider === "google" ? "Google" : "E-post"}
              </Badge>
            </div>

            {authProvider === "google" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Vill du använda e-post och lösenord istället?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleUnlinkGoogle}
                    disabled={unlinkLoading}
                    className="gap-2"
                  >
                    {unlinkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                    Koppla bort Google
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Byt e-postadress
            </CardTitle>
            <CardDescription>
              En bekräftelselänk skickas till din nya e-postadress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">Ny e-postadress</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="din.nya@epost.se"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={emailLoading || !newEmail.trim()}>
                {emailLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Skickar...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Uppdatera e-post
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Evenemangsnotifikationer
            </CardTitle>
            <CardDescription>
              Hantera dina prenumerationer för e-postnotifikationer om nya evenemang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <BellOff className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Du har inga aktiva notifikationer.</p>
                <p className="text-sm mt-1">
                  Prenumerera på evenemang från startsidan för att få notifikationer.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.email}</p>
                        <Badge variant={notification.is_active ? "default" : "secondary"}>
                          {notification.is_active ? "Aktiv" : "Pausad"}
                        </Badge>
                      </div>
                      
                      {notification.filters && (
                        <div className="flex flex-wrap gap-1.5">
                          {notification.filters.location && (
                            <Badge variant="outline" className="text-xs">
                              📍 {notification.filters.location}
                            </Badge>
                          )}
                          {notification.filters.category && (
                            <Badge variant="outline" className="text-xs">
                              🎭 {getCategoryLabel(notification.filters.category)}
                            </Badge>
                          )}
                          {notification.filters.freeOnly && (
                            <Badge variant="outline" className="text-xs">
                              💰 Endast gratis
                            </Badge>
                          )}
                          {notification.filters.keywords && notification.filters.keywords.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              🔍 {notification.filters.keywords.join(", ")}
                            </Badge>
                          )}
                          {!notification.filters.location && 
                           !notification.filters.category && 
                           !notification.filters.freeOnly && 
                           (!notification.filters.keywords || notification.filters.keywords.length === 0) && (
                            <span className="text-xs text-muted-foreground">Alla evenemang</span>
                          )}
                        </div>
                      )}
                      
                      {!notification.filters && (
                        <span className="text-xs text-muted-foreground">Alla evenemang</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={notification.is_active}
                          onCheckedChange={() => toggleNotification(notification.id, notification.is_active)}
                          disabled={togglingId === notification.id}
                        />
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingId === notification.id}
                          >
                            {deletingId === notification.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort prenumeration?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Du kommer inte längre att få e-postnotifikationer för dessa evenemang.
                              Du kan alltid prenumerera igen från startsidan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteNotification(notification.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Ta bort
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Om du har problem med ditt konto eller vill ta bort det helt, 
            besök din <a href="/profile" className="underline hover:text-foreground">profilsida</a>.
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default Settings;
