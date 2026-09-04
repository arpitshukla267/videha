import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";

const CRM_API = process.env.CRM_API_URL || "http://127.0.0.1:5000";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  /**
   * Proxy /api → CRM backend.
   * Mounted at `/api`, Express strips that prefix from req.url, so we
   * must rewrite paths back to `/api/...` before forwarding.
   */
  app.use(
    "/api",
    createProxyMiddleware({
      target: CRM_API,
      changeOrigin: true,
      pathRewrite: (path) => `/api${path}`,
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Videha CRM UI] http://0.0.0.0:${PORT} → API ${CRM_API}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Videha CRM frontend:", err);
  process.exit(1);
});
