// api/ai.js
// Función Serverless de Vercel — Proxy Seguro para Google Gemini, DeepSeek y OpenRouter
// Protege las API Keys manteniéndolas en el servidor y evitando su exposición en el cliente.

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

  const {
    provider = 'gemini',
    action = 'chat', // 'chat' | 'raw' | 'test'
    messages = [],
    systemPrompt = '',
    userPrompt = '',
    model = '',
    userApiKey = '',
    temperature = 0.7,
    maxTokens = 2048
  } = req.body || {};

  // Obtener API Keys del entorno del servidor o clave personalizada opcional del usuario
  const geminiKey = (userApiKey && provider === 'gemini' ? userApiKey : process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  const deepseekKey = (userApiKey && provider === 'deepseek' ? userApiKey : process.env.DEEPSEEK_API_KEY || '').trim();
  const openrouterKey = (userApiKey && provider === 'openrouter' ? userApiKey : process.env.OPENROUTER_API_KEY || '').trim();

  // Helper de timeout
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 25000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // ─── 1. GOOGLE GEMINI HANDLER ──────────────────────────────────────────────
  const handleGemini = async () => {
    if (!geminiKey) {
      return res.status(400).json({ error: 'Falta configurar la GEMINI_API_KEY en el servidor o en Ajustes.' });
    }

    const cleanKey = geminiKey.replace(/^["']|["']$/g, '');
    const modelToUse = model || 'gemini-1.5-flash';

    if (action === 'test') {
      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
        const testRes = await fetchWithTimeout(testUrl, { method: 'GET' }, 8000);
        const data = await testRes.json();
        if (testRes.ok && data.models) {
          const availableModels = data.models
            .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
            .map(m => m.name.replace(/^models\//, ''));
          return res.status(200).json({
            success: true,
            message: 'Conexión exitosa con Google Gemini AI Studio.',
            models: availableModels
          });
        }
        return res.status(testRes.status).json({
          success: false,
          error: data.error?.message || 'Error al conectar con Gemini.'
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // Preparar el contenido
    let sysText = systemPrompt;
    let mainUserText = userPrompt;

    if (messages && messages.length > 0) {
      sysText = messages.find(m => m.role === 'system')?.content || sysText;
      const otherMessages = messages.filter(m => m.role !== 'system');
      if (otherMessages.length > 0) {
        const lastUser = otherMessages.filter(m => m.role === 'user').pop();
        const historyText = otherMessages
          .slice(0, -1)
          .map(m => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.content}`)
          .join('\n\n');
        
        mainUserText = historyText 
          ? `${historyText}\n\nUsuario: ${lastUser ? lastUser.content : userPrompt}`
          : (lastUser ? lastUser.content : userPrompt);
      }
    }

    const modelsToTry = [modelToUse, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    let lastError = null;

    for (const mName of [...new Set(modelsToTry)]) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${cleanKey}`;
        const payload = {
          contents: [{ parts: [{ text: mainUserText || 'Hola' }] }],
          generationConfig: {
            temperature: parseFloat(temperature) || 0.7,
            maxOutputTokens: parseInt(maxTokens) || 2048
          }
        };

        if (sysText) {
          payload.systemInstruction = { parts: [{ text: sysText }] };
        }

        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, 25000);

        const data = await response.json();
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.status(200).json({
            text: data.candidates[0].content.parts[0].text,
            provider: 'gemini',
            model: mName
          });
        }
        if (data.error?.message) {
          lastError = data.error.message;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(500).json({
      error: lastError || 'Error al comunicarse con Google Gemini API.'
    });
  };

  // ─── 2. DEEPSEEK HANDLER ───────────────────────────────────────────────────
  const handleDeepSeek = async () => {
    if (!deepseekKey) {
      return res.status(400).json({ error: 'Falta configurar la DEEPSEEK_API_KEY en el servidor o en Ajustes.' });
    }

    const modelToUse = model || 'deepseek-chat';

    if (action === 'test') {
      try {
        const testRes = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
          body: JSON.stringify({
            model: modelToUse,
            messages: [{ role: 'user', content: 'Responde únicamente con la palabra OK' }]
          })
        }, 10000);
        const data = await testRes.json();
        if (testRes.ok) {
          return res.status(200).json({ success: true, message: 'Conexión exitosa con DeepSeek API.' });
        }
        return res.status(testRes.status).json({ success: false, error: data.error?.message || 'Error de DeepSeek' });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    const payloadMessages = messages.length > 0
      ? messages
      : [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ];

    try {
      const response = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
        body: JSON.stringify({
          model: modelToUse,
          messages: payloadMessages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 2048
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || `HTTP ${response.status}` });
      }

      return res.status(200).json({
        text: data.choices[0].message.content,
        provider: 'deepseek',
        model: modelToUse
      });
    } catch (err) {
      return res.status(500).json({ error: `Error DeepSeek: ${err.message}` });
    }
  };

  // ─── 3. OPENROUTER HANDLER ─────────────────────────────────────────────────
  const handleOpenRouter = async () => {
    if (!openrouterKey) {
      return res.status(400).json({ error: 'Falta configurar la OPENROUTER_API_KEY en el servidor o en Ajustes.' });
    }

    const modelToUse = model || 'google/gemini-2.5-flash';

    if (action === 'test') {
      try {
        const testRes = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'https://sync-pro-os.vercel.app',
            'X-Title': 'Inefable'
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [{ role: 'user', content: 'Responde únicamente con la palabra OK' }]
          })
        }, 10000);
        const data = await testRes.json();
        if (testRes.ok) {
          return res.status(200).json({ success: true, message: 'Conexión exitosa con OpenRouter API.' });
        }
        return res.status(testRes.status).json({ success: false, error: data.error?.message || 'Error OpenRouter' });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    const payloadMessages = messages.length > 0
      ? messages
      : [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ];

    try {
      const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://sync-pro-os.vercel.app',
          'X-Title': 'Inefable'
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: payloadMessages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 2048
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || `HTTP ${response.status}` });
      }

      return res.status(200).json({
        text: data.choices[0].message.content,
        provider: 'openrouter',
        model: modelToUse
      });
    } catch (err) {
      return res.status(500).json({ error: `Error OpenRouter: ${err.message}` });
    }
  };

  // ─── ROUTING SEGÚN PROVEEDOR ───────────────────────────────────────────────
  switch (provider) {
    case 'deepseek':
      return await handleDeepSeek();
    case 'openrouter':
      return await handleOpenRouter();
    case 'gemini':
    default:
      return await handleGemini();
  }
}
