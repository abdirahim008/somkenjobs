import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Remove X-Powered-By header for security and SEO
app.disable('x-powered-by');

// Enable GZip/Brotli compression for better performance and SEO
app.use(compression({
  filter: (req, res) => {
    // Compress all responses except for already compressed content
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6, // Compression level (1-9, 6 is default balance of speed/compression)
}));

// Domain consolidation middleware - redirect www to non-www for canonical domain
app.use((req, res, next) => {
  const host = req.headers.host;
  
  // Only apply domain consolidation in production and if host is available
  if (app.get('env') === 'production' && host && host.startsWith('www.')) {
    const nonWwwHost = host.substring(4); // Remove 'www.' prefix
    const protocol = req.headers['x-forwarded-proto'] || 'https'; // Assume HTTPS in production
    const redirectUrl = `${protocol}://${nonWwwHost}${req.originalUrl}`;
    
    // 301 permanent redirect to canonical non-www domain
    return res.redirect(301, redirectUrl);
  }
  
  next();
});

// Increase payload size limit to handle rich text content from job creation forms
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
