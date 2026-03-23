import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";

const app = express();

app.disable('x-powered-by');

// www → non-www redirect for canonical domain
app.use((req, res, next) => {
  const host = req.headers.host;
  if (app.get('env') === 'production' && host && host.startsWith('www.')) {
    const nonWwwHost = host.substring(4);
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    return res.redirect(301, `${protocol}://${nonWwwHost}${req.originalUrl}`);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      const logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      console.log(logLine.length > 80 ? logLine.slice(0, 79) + "…" : logLine);
    }
  });
  next();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
  if (err.message.includes('terminating connection') ||
      err.message.includes('Connection terminated') ||
      (err as any).code === '57P01') {
    return;
  }
});

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled rejection:', reason?.message || reason);
});

await registerRoutes(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Serve static frontend files.
// On Vercel: vercel.json buildCommand copies dist/public → api/public, and
// includeFiles bundles api/public/** with the function. Files land at
// process.cwd()/api/public in the Vercel runtime (/var/task/api/public).
const publicPath = path.join(process.cwd(), "api", "public");
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
} else {
  console.warn("Static files not found at", publicPath);
}

export default app;
