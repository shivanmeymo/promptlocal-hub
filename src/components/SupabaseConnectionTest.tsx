import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const checkConnection = async () => {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      if (!url || !key) {
        setStatus('error');
        setMessage('Missing Environment Variables (URL or Key)');
        return;
      }

      try {
        const supabase = createClient(url, key);
        // Try to get the session. This verifies the URL and Key are valid and the service is reachable.
        const { error } = await supabase.auth.getSession();
        
        if (error) throw error;

        setStatus('success');
        setMessage('Connected successfully');
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        setMessage(errorMessage);
        // eslint-disable-next-line no-console
        console.error('Supabase Check Error:', err);
      }
    };

    checkConnection();
  }, []);

  if (status === 'loading') return null;

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border z-50 max-w-sm ${
      status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-center gap-2 font-semibold">
        {status === 'success' ? '✅ Supabase Online' : '❌ Supabase Error'}
      </div>
      <p className="text-sm mt-1 opacity-90">{message}</p>
      <p className="text-xs mt-2 font-mono opacity-75 break-all">
        {import.meta.env.VITE_SUPABASE_URL as string}
      </p>
    </div>
  );
};