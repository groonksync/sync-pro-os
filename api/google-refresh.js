// api/google-refresh.js
// Función serverless de Vercel para renovar de forma segura el access_token de Google OAuth
// sin exponer el Client Secret en el frontend.

import axios from 'axios';

export default async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });
  }

  const { refresh_token } = req.body || {};

  if (!refresh_token) {
    return res.status(400).json({ error: 'Falta el parámetro obligatorio refresh_token.' });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    console.error('[google-refresh] Faltan variables de entorno en el servidor.');
    return res.status(500).json({
      error: 'Configuración del servidor incompleta. Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.'
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', googleClientId);
    params.append('client_secret', googleClientSecret);
    params.append('refresh_token', refresh_token);
    params.append('grant_type', 'refresh_token');

    const response = await axios.post('https://oauth2.googleapis.com/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in, scope, token_type } = response.data;

    return res.status(200).json({
      access_token,
      expires_in,
      scope,
      token_type
    });
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[google-refresh] Error de Google OAuth API:', errorDetails);
    
    const statusCode = error.response?.status || 500;
    return res.status(statusCode).json({
      error: 'Error al refrescar el token de Google.',
      details: errorDetails
    });
  }
}
