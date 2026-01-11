import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { appConfig, validateConfig } from './config';
import { initializeFirebaseAdmin } from './services/firebase.service';
import { initializeSupabase } from './services/supabase.service';
import apiRoutes from './routes';

/**
 * NowInTown Backend API Server
 * 
 * ARCHITECTURE:
 * - Firebase: Authentication only (verify tokens)
 * - Supabase: Database only (PostgreSQL)
 * - No Supabase Auth, No Firestore
 * 
 * FLOW:
 * 1. Frontend authenticates with Firebase
 * 2. Frontend sends Firebase ID token with requests
 * 3. Backend verifies token
 * 4. Backend maps firebase_uid → supabase_user_id
 * 5. Backend performs database operations
 */

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.validateEnvironment();
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private validateEnvironment(): void {
    console.log('🔍 Validating configuration...');
    validateConfig();
  }

  private initializeServices(): void {
    console.log('🚀 Initializing services...');
    
    try {
      initializeFirebaseAdmin();
      initializeSupabase();
      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        if (appConfig.cors.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (appConfig.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', apiRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'NowInTown API',
        version: '1.0.0',
        status: 'running',
        architecture: {
          authentication: 'Firebase',
          database: 'Supabase PostgreSQL',
        },
        endpoints: {
          health: '/api/health',
          events: '/api/events',
        },
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('❌ Unhandled error:', err);

      // CORS error
      if (err.message === 'Not allowed by CORS') {
        res.status(403).json({
          error: 'CORS Error',
          message: 'Origin not allowed',
        });
        return;
      }

      // Generic error
      res.status(500).json({
        error: 'Internal Server Error',
        message: appConfig.nodeEnv === 'development' ? err.message : 'Something went wrong',
      });
    });
  }

  public start(): void {
    const port = appConfig.port;

    this.app.listen(port, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log('🚀 NowInTown API Server');
      console.log('═══════════════════════════════════════════════');
      console.log(`📡 Server running on: http://localhost:${port}`);
      console.log(`🌍 Environment: ${appConfig.nodeEnv}`);
      console.log(`🔥 Firebase Auth: Enabled`);
      console.log(`⚡ Supabase DB: Connected`);
      console.log('═══════════════════════════════════════════════');
      console.log('');
      console.log('Available endpoints:');
      console.log(`  GET  /api/health              - Health check`);
      console.log(`  GET  /api/events              - List approved events`);
      console.log(`  GET  /api/events/:id          - Get event by ID`);
      console.log(`  GET  /api/events/user/me      - Get user's events (auth required)`);
      console.log(`  POST /api/events              - Create event (auth required)`);
      console.log(`  PUT  /api/events/:id          - Update event (auth required)`);
      console.log(`  DELETE /api/events/:id        - Delete event (auth required)`);
      console.log('');
    });
  }
}

// Start the server
const server = new Server();
server.start();
