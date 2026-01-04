import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DebugSupabase: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [details, setDetails] = useState<string>('');
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  const runChecks = async () => {
    setStatus('idle');
    setDetails('');
    try {
      const sessionRes = await supabase.auth.getSession();
      const sessionOk = !sessionRes.error;

      const tables = ['profiles', 'events', 'event_notifications', 'contact_messages', 'user_roles'] as const;

      const resultCounts: Record<string, number | null> = {};
      for (const tableName of tables) {
        const { count, error } = await supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true });
        if (error) {
          resultCounts[tableName] = null;
        } else {
          resultCounts[tableName] = count ?? 0;
        }
      }

      setCounts(resultCounts);
      if (sessionOk) {
        setStatus('ok');
        setDetails('Connected to Supabase. Session retrieved successfully.');
      } else {
        setStatus('error');
        setDetails(sessionRes.error?.message ?? 'Unknown error');
      }
    } catch (e: any) {
      setStatus('error');
      setDetails(e?.message || String(e));
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug</h1>
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status === 'ok' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`}
          />
          <span className="text-sm">
            {status === 'ok' ? 'Connected' : status === 'error' ? 'Error' : 'Idle'}
          </span>
        </div>
        <pre className="text-xs whitespace-pre-wrap break-all">{details}</pre>
        <Button className="mt-2" onClick={runChecks}>
          Run checks
        </Button>
      </Card>
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Table counts</h2>
        <ul className="list-disc pl-5 text-sm">
          {Object.entries(counts).map(([k, v]) => (
            <li key={k}>
              {k}: {v === null ? 'error or no access' : v}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default DebugSupabase;
