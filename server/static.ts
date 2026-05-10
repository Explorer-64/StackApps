import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isValidRoute } from "./routes";

export function serveStatic(app: Express) {
  // Handle both ESM and CJS environments
  let distPath: string;
  
  // Try multiple strategies to find the public folder
  const possiblePaths = [
    path.resolve(__dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "dist/public"),
  ];
  
  distPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
  
  console.log(`Serving static files from: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with proper MIME types and cache headers
  app.use(express.static(distPath, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      // Set correct MIME types
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      // Don't cache HTML files
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  app.use("*", (req, res) => {
    const url = req.originalUrl;
    if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|webp|webmanifest)$/)) {
      res.status(404).send('Not found');
      return;
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const cleanPath = url.split("?")[0];
    if (!isValidRoute(cleanPath)) {
      res.status(404).type("html").send(`<!DOCTYPE html><html><head><title>404 - Page Not Found</title><meta name="robots" content="noindex"></head><body style="background:#050505;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#00F3FF;font-size:4rem;margin:0">404</h1><p style="color:#aaa;margin:1rem 0">Page not found</p><a href="/" style="color:#39FF14;text-decoration:none">Go Home</a></div></body></html>`);
      return;
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
