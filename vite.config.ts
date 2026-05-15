import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo atual e sem prefixo (usamos '')
  const env = loadEnv(mode, process.cwd(), '');
  const ixcToken = env.IXC_API_TOKEN || "";
  const authHeader = `Basic ${Buffer.from(ixcToken).toString('base64')}`;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/ixc-api": {
          target: "https://4419.ixcsoft.com",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ixc-api/, "/webservice/v1"),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Oculta o token Bearer enviado pelo frontend e injeta a Chave Master do IXC
              proxyReq.setHeader('Authorization', authHeader);
              proxyReq.setHeader('ixcsoft', 'listar');
            });
          }
        },
      },
    },
    optimizeDeps: {
      exclude: ['qrcode.react', '@capacitor/core', '@capacitor/preferences', '@capacitor/clipboard'],
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
