// Vite の設定。トップ（分岐）・旅行者・事業者の3ページ。ローカルでは /api/* を api/ の関数で動かす。
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';

function apiDevServer() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/api\/([a-z-]+)(?:\?|$)/);
        if (!m) {
          // 本番（Vercel の cleanUrls）と同じく /traveler → traveler.html
          const page = req.url.match(/^\/(traveler|business)(?:[?#]|$)/);
          if (page) req.url = req.url.replace(`/${page[1]}`, `/${page[1]}.html`);
          return next();
        }
        try {
          const mod = await server.ssrLoadModule(resolve(import.meta.dirname, `api/${m[1]}.js`));
          await mod.default(req, res);
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'server_error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [apiDevServer()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          traveler: resolve(import.meta.dirname, 'traveler.html'),
          business: resolve(import.meta.dirname, 'business.html'),
        },
      },
    },
  };
});
