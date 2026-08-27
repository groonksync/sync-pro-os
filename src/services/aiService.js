// src/services/aiService.js
// Servicio Centralizado y Seguro de Inteligencia Artificial para Inefable
// Las consultas se enrutan prioritariamente a través del endpoint serverless /api/ai
// manteniendo las API Keys 100% protegidas en el servidor.

const REQUEST_TIMEOUT_MS = 30000;

function sanitizeError(error, provider = 'IA') {
  if (!error) return 'Error desconocido.';
  const msg = error.message || String(error);
  const keyPatterns = [
    /(?:key|token|secret|auth|password)[=:][^\s&]+/gi,
    /AIza[0-9A-Za-z_-]{35}/g,
    /sk-[0-9a-zA-Z]{20,}/g,
    /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g
  ];
  let sanitized = msg;
  for (const pattern of keyPatterns) {
    sanitized = sanitized.replace(pattern, '[KEY_OMITIDA]');
  }
  return `Error ${provider}: ${sanitized.split('. ').pop().substring(0, 200)}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function cleanAiResponse(text) {
  if (!text) return '';
  let cleaned = text.trim();

  // Filtrar posibles ecos de razonamiento o plantillas en inglés
  if (cleaned.includes('User says:') || cleaned.includes('Context: I am') || cleaned.includes('Goal: Respond') || cleaned.includes('Current View:')) {
    const matchQuote = cleaned.match(/"([^"]{10,})"/);
    if (matchQuote && matchQuote[1]) {
      cleaned = matchQuote[1];
    } else {
      const lines = cleaned.split('\n').filter(l => 
        !l.startsWith('User says:') && 
        !l.startsWith('Context:') && 
        !l.startsWith('Goal:') && 
        !l.startsWith('Greeting:') && 
        !l.startsWith('Language:') && 
        !l.startsWith('Offer assistance:') && 
        !l.startsWith('Current View:') &&
        !l.startsWith('No JSON needed')
      );
      cleaned = lines.join('\n').trim();
    }
  }

  return cleaned;
}

// ─── CONSULTA A TRAVÉS DEL PROXY SERVERLESS SEGURO ────────────────────────────
async function queryServerlessProxy(payload) {
  try {
    const res = await fetchWithTimeout('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 28000);

    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) throw new Error(errData.error);
    }
  } catch (proxyErr) {
    console.warn('[aiService] Servidor proxy no disponible o falló, intentando fallback directo...', proxyErr.message);
    throw proxyErr;
  }
}

// ─── MÉTODOS DE FALLBACK DIRECTO (Si el servidor proxy no está desplegado) ──
async function fallbackDirectQuery(provider, userKey, model, messages, systemPrompt) {
  const cleanKey = (userKey || '').trim().replace(/^["']|["']$/g, '');
  if (!cleanKey) {
    throw new Error(`Configura la API Key de ${provider} en Ajustes > IA para el modo directo.`);
  }

  if (provider === 'gemini') {
    const sysMsg = systemPrompt || messages.find(m => m.role === 'system')?.content || '';
    const otherMsgs = messages.filter(m => m.role !== 'system');
    const userMsg = otherMsgs.filter(m => m.role === 'user').pop()?.content || 'Hola';
    const historyText = otherMsgs
      .slice(0, -1)
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.content}`)
      .join('\n\n');
    const promptToSend = historyText ? `${historyText}\n\nUsuario: ${userMsg}` : userMsg;

    const mName = model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${cleanKey}`;
    const payload = {
      contents: [{ parts: [{ text: promptToSend }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    };
    if (sysMsg) {
      payload.systemInstruction = { parts: [{ text: sysMsg }] };
    }

    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 25000);

    const data = await res.json();
    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error(data.error?.message || 'Error en respuesta de Google Gemini.');
  }

  if (provider === 'deepseek') {
    const res = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanKey}` },
      body: JSON.stringify({ model: model || 'deepseek-chat', messages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return data.choices[0].message.content;
  }

  if (provider === 'openrouter') {
    const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`,
        'HTTP-Referer': 'https://sync-pro-os.vercel.app',
        'X-Title': 'Inefable'
      },
      body: JSON.stringify({ model: model || 'google/gemini-2.5-flash', messages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return data.choices[0].message.content;
  }

  throw new Error(`Proveedor de IA '${provider}' no soportado.`);
}

export const aiService = {
  fetchBalance: async (settings = {}) => {
    const provider = settings.aiProvider || 'gemini';

    if (provider === 'deepseek' && settings.deepseekKey) {
      try {
        const res = await fetchWithTimeout('https://api.deepseek.com/user/balance', {
          headers: { 'Authorization': `Bearer ${settings.deepseekKey}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.is_error || !data.balance_infos) return '0.00';
        const total = data.balance_infos.reduce((acc, curr) => acc + parseFloat(curr.total_balance || 0), 0);
        return total.toFixed(2);
      } catch (e) {
        return 'Error';
      }
    }

    if (provider === 'openrouter' && settings.openrouterKey) {
      try {
        const res = await fetchWithTimeout('https://openrouter.ai/api/v1/auth/key', {
          headers: { 'Authorization': `Bearer ${settings.openrouterKey}` }
        });
        const data = await res.json();
        if (data.data) {
          const { limit, usage } = data.data;
          if (limit === null || parseFloat(limit) === 0) {
            return `PPU ($${parseFloat(usage).toFixed(4)})`;
          }
          const rem = parseFloat(limit) - parseFloat(usage);
          return `$${rem.toFixed(4)}`;
        }
        return '0.00';
      } catch (e) {
        return 'Error';
      }
    }

    return 'Ilimitado';
  },

  askAgent: async (message, history = [], context = {}) => {
    const s = context.settings || {};
    const provider = s.aiProvider || 'gemini';
    const activeView = context.activeView || 'General';

    const systemPrompt = `Eres "Agente", el asistente inteligente, rápido y amigable de la aplicación Inefable.

REGLAS DE COMUNICACIÓN OBLIGATORIAS:
1. Responde SIEMPRE y ÚNICAMENTE en español.
2. Sé directo, conciso y cordial (para saludos o preguntas sencillas responde en 1 o 2 oraciones).
3. NUNCA escribas tu razonamiento, ni notas de contexto, ni repitas lo que el usuario dijo, ni uses palabras en inglés.
4. Vista actual del usuario: ${activeView}.

ACCIONES AUTOMATIZADAS (solo si el usuario pide explícitamente crear algo, adjunta el JSON exacto al final entre [[[ACTION{...}]]]):
- CREAR RECORDATORIO: [[[ACTION{"action":"CREATE_REMINDER","data":{"titulo":"...","monto":0,"fecha":"YYYY-MM-DD"}}]]]
- REGISTRAR PRÉSTAMO: [[[ACTION{"action":"CREATE_LOAN","data":{"nombre":"...","capital":1000,"interes":10}}]]]
- REGISTRAR GASTO/EGRESO: [[[ACTION{"action":"CREATE_EXPENSE","data":{"nombre":"...","monto":50,"fecha_pago":"YYYY-MM-DD"}}]]]
- CREAR PRODUCTO: [[[ACTION{"action":"CREATE_PRODUCT","data":{"nombre":"...","precio_venta":100,"stock_actual":1}}]]]`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
      { role: 'user', content: message }
    ];

    const userApiKey = provider === 'deepseek' ? s.deepseekKey : (provider === 'openrouter' ? s.openrouterKey : s.geminiKey);
    const model = provider === 'deepseek' ? s.deepseekModel : (provider === 'openrouter' ? s.openrouterModel : s.geminiModel);

    try {
      // 1. Intento primario a través del Proxy Serverless Seguro
      try {
        const rawRes = await queryServerlessProxy({
          provider,
          action: 'chat',
          messages,
          systemPrompt,
          userPrompt: message,
          model,
          userApiKey,
          temperature: s.aiTemperature || 0.7,
          maxTokens: s.aiMaxTokens || 2048
        });
        return cleanAiResponse(rawRes);
      } catch (proxyError) {
        // 2. Fallback directo si no hay servidor serverless activo
        const directRes = await fallbackDirectQuery(provider, userApiKey, model, messages, systemPrompt);
        return cleanAiResponse(directRes);
      }
    } catch (e) {
      return `❌ ${sanitizeError(e, provider)}`;
    }
  },

  askRaw: async (systemPrompt, userPrompt, settings = {}) => {
    const provider = settings.aiProvider || 'gemini';
    const userApiKey = provider === 'deepseek' ? settings.deepseekKey : (provider === 'openrouter' ? settings.openrouterKey : settings.geminiKey);
    const model = provider === 'deepseek' ? settings.deepseekModel : (provider === 'openrouter' ? settings.openrouterModel : settings.geminiModel);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      try {
        const rawRes = await queryServerlessProxy({
          provider,
          action: 'raw',
          messages,
          systemPrompt,
          userPrompt,
          model,
          userApiKey,
          temperature: settings.aiTemperature || 0.7,
          maxTokens: settings.aiMaxTokens || 2048
        });
        return cleanAiResponse(rawRes);
      } catch (proxyError) {
        const directRes = await fallbackDirectQuery(provider, userApiKey, model, messages, systemPrompt);
        return cleanAiResponse(directRes);
      }
    } catch (e) {
      return `❌ ${sanitizeError(e, provider)}`;
    }
  },

  testConnection: async (provider, apiKey, model) => {
    try {
      // 1. Intentar prueba con el proxy serverless
      try {
        const res = await fetchWithTimeout('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            action: 'test',
            userApiKey: apiKey,
            model
          })
        }, 10000);

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            return {
              success: true,
              message: data.message || `Conexión exitosa con ${provider.toUpperCase()} (Proxy Seguro Activo).`,
              models: data.models || []
            };
          }
        }
      } catch (proxyErr) {
        console.warn('[aiService] Fallback de prueba directa:', proxyErr.message);
      }

      // 2. Fallback de prueba directa si falla el proxy
      const fallbackRes = await fallbackDirectQuery(provider, apiKey, model, [
        { role: 'user', content: 'Responde únicamente con la palabra OK' }
      ], '');
      
      if (fallbackRes && !fallbackRes.startsWith('❌')) {
        return {
          success: true,
          message: `Conexión directa exitosa con ${provider.toUpperCase()}.`
        };
      }
      return { success: false, message: fallbackRes };
    } catch (e) {
      return { success: false, message: e.message || String(e) };
    }
  }
};