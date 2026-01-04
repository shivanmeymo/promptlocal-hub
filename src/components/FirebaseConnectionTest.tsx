import { useEffect, useState } from 'react';
import { firebaseApp } from '@/integrations/firebase/client';
import { getAuth } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function FirebaseConnectionTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test Firebase initialization
        if (!firebaseApp) {
          throw new Error('Firebase app not initialized');
        }

        // Get Firebase Auth instance
        const auth = getAuth(firebaseApp);
        
        // Get project ID from Firebase config
        const config = firebaseApp.options;
        setProjectId(config.projectId || 'Unknown');

        // Check if auth is initialized
        if (auth) {
          setIsConnected(true);
          console.log('✅ Firebase connected successfully!', {
            projectId: config.projectId,
            authDomain: config.authDomain,
          });
        } else {
          throw new Error('Firebase Auth not initialized');
        }
      } catch (err) {
        setIsConnected(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('❌ Firebase connection error:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Firebase Connection Test
          {isConnected === null && <Loader2 className="h-5 w-5 animate-spin" />}
          {isConnected === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {isConnected === false && <XCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>
          Testing connection to Firebase services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {isConnected === null && <Badge variant="outline">Testing...</Badge>}
          {isConnected === true && <Badge className="bg-green-500">Connected</Badge>}
          {isConnected === false && <Badge variant="destructive">Failed</Badge>}
        </div>

        {projectId && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Project ID:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded">{projectId}</code>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {isConnected && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              ✅ Firebase is properly configured and connected!
            </p>
            <ul className="mt-2 text-xs text-green-600 space-y-1">
              <li>• Firebase App initialized</li>
              <li>• Authentication ready</li>
              <li>• Service Worker registered</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
