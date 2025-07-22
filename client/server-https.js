import { createServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const httpPort = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_FRONTEND_PORT || 3000;

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port: httpsPort });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  try {
    // Try to load SSL certificates
    const sslPath = path.join(__dirname, '../server/ssl');
    const httpsOptions = {
      key: fs.readFileSync(path.join(sslPath, 'private-key.pem')),
      cert: fs.readFileSync(path.join(sslPath, 'certificate.pem'))
    };

    // Create HTTPS server
    createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
    .once('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('HTTPS Server error:', err);
      process.exit(1);
    })
    .listen(httpsPort, () => {
      // eslint-disable-next-line no-console
      console.log(`🔒 Next.js HTTPS server ready on https://69.62.115.12:${httpsPort}`);
    });

    // Also create HTTP server for fallback
    createHttpServer(async (req, res) => {
      try {
        // Redirect HTTP to HTTPS
        if (req.headers.host) {
          const httpsUrl = `https://${req.headers.host.replace(':' + httpPort, ':' + httpsPort)}${req.url}`;
          res.writeHead(301, { Location: httpsUrl });
          res.end();
          return;
        }
        
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
    .once('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('HTTP Server error:', err);
      process.exit(1);
    })
    .listen(httpPort, () => {
      // eslint-disable-next-line no-console
      console.log(`📡 Next.js HTTP server ready on http://69.62.115.12:${httpPort} (redirects to HTTPS)`);
    });

  } catch (sslError) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  SSL certificates not found, starting HTTP only:', sslError.message);
    
    // Fallback to HTTP only
    createHttpServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
    .once('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('HTTP Server error:', err);
      process.exit(1);
    })
    .listen(httpPort, () => {
      // eslint-disable-next-line no-console
      console.log(`📡 Next.js HTTP server ready on http://69.62.115.12:${httpPort}`);
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});