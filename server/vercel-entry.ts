import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";

const app = express();

app.disable('x-powered-by');

app.use((req, res, next) => {
  const host = req.headers.host;
  if (host && host.startsWith('www.')) {
    const nonWwwHost = host.substring(4);
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    return res.redirect(301, `${protocol}://${nonWwwHost}${req.originalUrl}`);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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

// Error handler (registered early so it catches init errors too)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Express error:", message);
  res.status(status).json({ message });
});

// Lazy initialization — avoids top-level await which can silently crash Vercel cold starts
let initialized = false;
let initError: Error | null = null;
let initPromise: Promise<void> | null = null;

function doInitialize(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await registerRoutes(app);

      const publicPathCandidates = [
        path.join(process.cwd(), "dist", "public"),
        path.join(process.cwd(), "api", "public"),
      ];
      const publicPath = publicPathCandidates.find((candidate) => fs.existsSync(candidate));
      if (publicPath) {
        app.use(express.static(publicPath));
        app.use("*", (_req: Request, res: Response) => {
          res.sendFile(path.join(publicPath, "index.html"));
        });
      } else {
        console.warn("Static files not found at", publicPathCandidates.join(" or "));
      }

      initialized = true;
      console.log("Server initialized successfully");
    } catch (err: any) {
      initError = err instanceof Error ? err : new Error(String(err));
      console.error("Server initialization failed:", initError.message, initError.stack);
      throw initError;
    }
  })();
  return initPromise;
}

// Vercel serverless handler — one export, no top-level await
export default async function handler(req: Request, res: Response) {
  if (!initialized) {
    try {
      await doInitialize();
    } catch (err: any) {
      return res.status(500).json({ message: "Server failed to start: " + (err.message || String(err)) });
    }
  }
  return app(req, res);
}
