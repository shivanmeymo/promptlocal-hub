import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, User, Mail, Key, LogOut } from 'lucide-react';

export const FirebaseAuthTest: React.FC = () => {
  const { user, profile, signUp, signIn, signInWithGoogle, signOut, loading } = useAuth();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('Test123456');
  const [testName, setTestName] = useState('Test User');
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ test: string; status: 'success' | 'error'; message: string }>>([]);

  const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, { test, status, message }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testSignUp = async () => {
    setTestLoading(true);
    clearResults();
    
    try {
      addTestResult('Sign Up', 'success', 'Starting sign up test...');
      
      const { error } = await signUp(testEmail, testPassword, testName);
      
      if (error) {
        addTestResult('Sign Up', 'error', `Error: ${error.message}`);
      } else {
        addTestResult('Sign Up', 'success', 'User created successfully!');
        
        // Wait a bit for profile sync
        setTimeout(() => {
          if (user) {
            addTestResult('Firebase User', 'success', `UID: ${user.uid}`);
            addTestResult('Firebase Email', 'success', user.email || 'No email');
          }
          if (profile) {
            addTestResult('Supabase Profile', 'success', `Profile synced: ${profile.full_name}`);
          }
        }, 2000);
      }
    } catch (err: any) {
      addTestResult('Sign Up', 'error', err.message);
    }
    
    setTestLoading(false);
  };

  const testSignIn = async () => {
    setTestLoading(true);
    clearResults();
    
    try {
      addTestResult('Sign In', 'success', 'Starting sign in test...');
      
      const { error } = await signIn(testEmail, testPassword);
      
      if (error) {
        addTestResult('Sign In', 'error', `Error: ${error.message}`);
      } else {
        addTestResult('Sign In', 'success', 'Signed in successfully!');
        
        setTimeout(() => {
          if (user) {
            addTestResult('Firebase User', 'success', `UID: ${user.uid}`);
            addTestResult('Firebase Email', 'success', user.email || 'No email');
          }
          if (profile) {
            addTestResult('Supabase Profile', 'success', `Profile: ${profile.full_name}`);
          }
        }, 1000);
      }
    } catch (err: any) {
      addTestResult('Sign In', 'error', err.message);
    }
    
    setTestLoading(false);
  };

  const testGoogleSignIn = async () => {
    setTestLoading(true);
    clearResults();
    
    try {
      addTestResult('Google Sign In', 'success', 'Opening Google sign-in popup...');
      
      const { error } = await signInWithGoogle();
      
      if (error) {
        addTestResult('Google Sign In', 'error', `Error: ${error.message}`);
      } else {
        addTestResult('Google Sign In', 'success', 'Google sign-in successful!');
      }
    } catch (err: any) {
      addTestResult('Google Sign In', 'error', err.message);
    }
    
    setTestLoading(false);
  };

  const testSignOut = async () => {
    setTestLoading(true);
    clearResults();
    
    try {
      addTestResult('Sign Out', 'success', 'Signing out...');
      
      await signOut();
      
      addTestResult('Sign Out', 'success', 'Signed out successfully!');
    } catch (err: any) {
      addTestResult('Sign Out', 'error', err.message);
    }
    
    setTestLoading(false);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto my-8">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading auth state...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Firebase Authentication Test
          {user ? (
            <Badge variant="default" className="ml-2">Authenticated</Badge>
          ) : (
            <Badge variant="secondary" className="ml-2">Not Authenticated</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Test the new Firebase + Supabase hybrid authentication
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current User Status */}
        {user ? (
          <Alert>
            <User className="h-4 w-4" />
            <AlertTitle>Current User (Firebase)</AlertTitle>
            <AlertDescription className="space-y-1">
              <div><strong>UID:</strong> {user.uid}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Display Name:</strong> {user.displayName || 'Not set'}</div>
              <div><strong>Email Verified:</strong> {user.emailVerified ? '✅' : '❌'}</div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertTitle>Not Authenticated</AlertTitle>
            <AlertDescription>No user is currently signed in.</AlertDescription>
          </Alert>
        )}

        {/* Profile Status */}
        {profile && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Supabase Profile Synced</AlertTitle>
            <AlertDescription className="space-y-1">
              <div><strong>User ID:</strong> {profile.user_id}</div>
              <div><strong>Full Name:</strong> {profile.full_name}</div>
              <div><strong>Email:</strong> {profile.email}</div>
            </AlertDescription>
          </Alert>
        )}

        {/* Test Credentials */}
        {!user && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Credentials</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm">Email</label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="text-sm">Password</label>
                <Input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
              <div>
                <label className="text-sm">Full Name</label>
                <Input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Test User"
                />
              </div>
            </div>
          </div>
        )}

        {/* Test Buttons */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test Actions</h3>
          <div className="flex flex-wrap gap-2">
            {!user ? (
              <>
                <Button
                  onClick={testSignUp}
                  disabled={testLoading}
                  variant="default"
                >
                  {testLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                  Test Sign Up
                </Button>
                
                <Button
                  onClick={testSignIn}
                  disabled={testLoading}
                  variant="secondary"
                >
                  {testLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                  Test Sign In
                </Button>
                
                <Button
                  onClick={testGoogleSignIn}
                  disabled={testLoading}
                  variant="outline"
                >
                  {testLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Test Google Sign In
                </Button>
              </>
            ) : (
              <Button
                onClick={testSignOut}
                disabled={testLoading}
                variant="destructive"
              >
                {testLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Test Results</h3>
              <Button size="sm" variant="ghost" onClick={clearResults}>
                Clear
              </Button>
            </div>
            <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {result.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong>{result.test}:</strong> {result.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertTitle>Testing Instructions</AlertTitle>
          <AlertDescription className="space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Try signing up with a new email (change the test email above)</li>
              <li>Check if the user is created in Firebase Console</li>
              <li>Verify profile is synced to Supabase</li>
              <li>Sign out and sign in again</li>
              <li>Try Google Sign In (opens popup)</li>
            </ol>
            <div className="mt-2 text-xs text-muted-foreground">
              <strong>Firebase Console:</strong> https://console.firebase.google.com/project/nowintown/authentication/users
              <br />
              <strong>Supabase Dashboard:</strong> https://supabase.com/dashboard/project/suueubckrgtiniymoxio/editor
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
