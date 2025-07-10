

import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      server: {
        proxy: {
          '/api/arkham_proxy': {
            target: 'https://api.arkm.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api\/arkham_proxy/, ''),
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                // Hardcode the development cookie for Arkham API authentication.
                // This is the most reliable method for local development.
                proxyReq.setHeader('cookie', 'arkham_is_authed=true; arkham_platform_session=3febdc2f-7ac3-49c9-86ef-1efcd259e9bb; mp_db580d24fbe794a9a4765bcbfec0e06b_mixpanel=%7B%22distinct_id%22%3A%221376665%22%2C%22%24device_id%22%3A%2253d7c72a-9e4f-48fc-bc71-7bb442c02eb3%22%2C%22%24initial_referrer%22%3A%22https%3A%2F%2Fintel.arkm.com%2F%22%2C%22%24initial_referring_domain%22%3A%22intel.arkm.com%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%2C%22%24search_engine%22%3A%22google%22%2C%22%24user_id%22%3A%221376665%22%7D; _dd_s=rum=2&id=ab5a4080-6d6b-4d10-9cfe-48a002ef78ca&created=1752122304683&expire=1752123237930; mp_f32068aad7a42457f4470f3e023dd36f_mixpanel=%7B%22distinct_id%22%3A%20%22%24device%3A19670c3a138c4a-084cacdfab8246-26011c51-384000-19670c3a138c4b%22%2C%22%24device_id%22%3A%20%2219670c3a138c4a-084cacdfab8246-26011c51-384000-19670c3a138c4b%22%2C%22%24search_engine%22%3A%20%22google%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.google.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.google.com%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.google.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.google.com%22%7D%2C%22__mpus%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpr%22%3A%20%5B%5D%2C%22__mpap%22%3A%20%5B%5D%7D');
                
                // Spoofing the origin and referer can help bypass security checks on the target API.
                proxyReq.setHeader('origin', 'https://intel.arkm.com');
                proxyReq.setHeader('referer', 'https://intel.arkm.com/');
              });
            },
          },
          '/api/debot_proxy': {
            target: 'https://debot.ai',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api\/debot_proxy/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.setHeader('accept', 'application/json, text/plain, */*');
                proxyReq.setHeader('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');
                // The debot.ai API may require a referer header
                proxyReq.setHeader('referer', 'https://debot.ai/');
              });
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('.', import.meta.url))
        }
      }
    };
});