import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const FirebaseSupabaseTest = () => {
  const { user, profile } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    const runTests = async () => {
      const results: any[] = [];

      // Test 1: Check Firebase Auth
      results.push({
        test: 'Firebase Auth',
        status: user ? '✅' : '❌',
        data: user ? { id: user.id, email: user.email } : null
      });

      // Test 2: Check Supabase connection
      try {
        const { data, error } = await supabase.from('profiles').select('count');
        results.push({
          test: 'Supabase Connection',
          status: error ? '❌' : '✅',
          data: error ? error.message : `Profiles count: ${data?.[0]?.count || 0}`
        });
      } catch (err: any) {
        results.push({
          test: 'Supabase Connection',
          status: '❌',
          data: err.message
        });
      }

      // Test 3: Check if current user exists in Supabase
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          results.push({
            test: 'User in Supabase',
            status: data ? '✅' : '❌',
            data: error ? error.message : (data || 'User not found in profiles table')
          });
        } catch (err: any) {
          results.push({
            test: 'User in Supabase',
            status: '❌',
            data: err.message
          });
        }
      }

      // Test 4: Check AuthContext profile
      results.push({
        test: 'AuthContext Profile',
        status: profile ? '✅' : '❌',
        data: profile || 'No profile loaded'
      });

      setTestResults(results);
    };

    runTests();
  }, [user, profile]);

  if (!user) {
    return (
      <div className="p-4 bg-yellow-100 rounded">
        <p>Please sign in with Google to test Firebase-Supabase integration</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Firebase-Supabase Integration Test</h2>
      {testResults.map((result, idx) => (
        <div key={idx} className="border p-3 rounded">
          <div className="font-semibold">
            {result.status} {result.test}
          </div>
          <pre className="text-sm mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};
