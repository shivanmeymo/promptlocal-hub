import { Layout } from '@/components/layout/Layout';
import { FirebaseConnectionTest } from '@/components/FirebaseConnectionTest';
import { SupabaseConnectionTest } from '@/components/SupabaseConnectionTest';
import { FirebaseSupabaseTest } from '@/components/FirebaseSupabaseTest';
import { Helmet } from 'react-helmet-async';

export default function ConnectionTest() {
  return (
    <Layout>
      <Helmet>
        <title>Connection Test | NowInTown</title>
      </Helmet>
      
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Database Connections Test
        </h1>
        
        <div className="space-y-6">
          <FirebaseConnectionTest />
          <SupabaseConnectionTest />
          <FirebaseSupabaseTest />
        </div>
      </div>
    </Layout>
  );
}
