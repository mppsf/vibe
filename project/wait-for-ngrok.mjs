// wait-for-ngrok.mjs
import { setTimeout as delay } from 'timers/promises';
import http from 'http';

const getNgrokUrl = async () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://ngrok:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const publicUrl = json.tunnels?.[0]?.public_url;
          resolve(publicUrl);
        } catch (err) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
  });
};

console.log('[entrypoint] Waiting for ngrok tunnel...');
let publicUrl = null;

while (!publicUrl || publicUrl === 'null') {
  publicUrl = await getNgrokUrl();
  if (!publicUrl || publicUrl === 'null') {
    await delay(500);
  }
}

console.log('[entrypoint] ngrok URL detected:', publicUrl);

// Устанавливаем переменную окружения 
process.env.WEBHOOK_URL = publicUrl;
