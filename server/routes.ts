import type { Express } from "express";
import type { Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

const VALID_ROUTES = [
  "/",
  "/for-builders",
  "/hub",
  "/dashboard",
  "/login",
  "/logout",
  "/faq",
  "/privacy",
  "/terms",
  "/under-construction",
  "/settings",
  "/workstation",
  "/admin",
  "/mcp-test",
  "/mcp-blueprint-results",
  "/scan",
];

const VALID_ROUTE_PREFIXES = [
  "/app/",
  "/mcp-blueprint-results/",
];

export function isValidRoute(path: string): boolean {
  const normalized = path.replace(/\/+$/, "") || "/";
  if (VALID_ROUTES.includes(normalized)) return true;
  return VALID_ROUTE_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8001";

  app.get("/app-details", (req, res) => {
    const id = req.query.id;
    if (id && typeof id === "string") {
      return res.redirect(301, `/app/${id}`);
    }
    return res.redirect(301, "/dashboard");
  });

  app.get("/manage-app", (_req, res) => {
    res.redirect(301, "/dashboard");
  });

  app.get("/api/config/firebase", (req, res) => {
    res.json({
      apiKey: process.env.FIREBASE_API_KEY || "",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.FIREBASE_APP_ID || "",
    });
  });

  for (const prefix of ["/api", "/stubs", "/stubs-bp"]) {
    app.use(
      prefix,
      createProxyMiddleware({
        target: PYTHON_BACKEND_URL,
        changeOrigin: true,
      })
    );
  }

  return httpServer;
}
