import { config } from 'dotenv';

// Load environment variables
config();

interface Config {
  port: number;
  nodeEnv: string;
  firebase: {
    serviceAccountPath?: string;
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  logLevel: string;
}

export const appConfig: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },
  
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables
export function validateConfig(): void {
  const errors: string[] = [];

  // Firebase validation - either service account path OR individual credentials
  const hasServiceAccount = !!appConfig.firebase.serviceAccountPath;
  const hasIndividualCreds = !!(
    appConfig.firebase.projectId &&
    appConfig.firebase.clientEmail &&
    appConfig.firebase.privateKey
  );

  if (!hasServiceAccount && !hasIndividualCreds) {
    errors.push(
      'Firebase configuration missing: Provide either FIREBASE_SERVICE_ACCOUNT_PATH or ' +
      '(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)'
    );
  }

  // Supabase validation
  if (!appConfig.supabase.url) {
    errors.push('SUPABASE_URL is required');
  }
  if (!appConfig.supabase.serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ Configuration validated successfully');
}
