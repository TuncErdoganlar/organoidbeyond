// vite.config.ts
// -----------------------------------------------------------------------------
// Vite: React plugin, `@` alias, and same-origin `/api/pubmed` middleware for
// `npm run dev` / `vite preview` — mirrors production (Vercel `api/pubmed.ts`).
// -----------------------------------------------------------------------------
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import {
  createTimeoutSignal,
  proxyFetchPubmed,
  resolvePubmedUpstreamUrl,
  searchParamsFromNodeRequest,
} from './api/pubmedUpstream';

function pubmedProxyPlugin(mode: string): Plugin {
  const serverApiKey = () => loadEnv(mode, process.cwd(), '').PUBMED_API_KEY?.trim();

  const middleware = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): Promise<void> => {
    if (!req.url?.startsWith('/api/pubmed')) {
      next();
      return;
    }

    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET');
      res.end('Method Not Allowed');
      return;
    }

    try {
      const sp = searchParamsFromNodeRequest(req.url, undefined);
      const built = resolvePubmedUpstreamUrl(sp, { serverApiKey: serverApiKey() });
      if (!built.ok) {
        res.statusCode = built.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(built.body);
        return;
      }

      const signal = createTimeoutSignal(25_000);
      const upstream = await proxyFetchPubmed(built.url, signal);
      res.statusCode = upstream.status;
      const ct = upstream.headers.get('content-type');
      if (ct) res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'no-store');
      const text = await upstream.text();
      res.end(text);
    } catch {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'PubMed proxy upstream failed.' }));
    }
  };

  return {
    name: 'pubmed-same-origin-proxy',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), pubmedProxyPlugin(mode)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
}));
