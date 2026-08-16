const REQUEST_TIMEOUT_MS = 30000

function validateKey(key, providerName) {
  if (!key || typeof key !== 'string' || !key.trim()) {
    return `Configura la API Key de ${providerName} en Ajustes > IA.`
  }
  return null
}

function sanitizeError(error, provider) {
  if (!error) return 'Error desconocido.'
  const msg = error.message || String(error)
  const keyPatterns = [
    /(?:key|token|secret|auth|password)[=:][^\s&]+/gi,
    /AIza[0-9A-Za-z_-]{35}/g,
    /sk-[0-9a-zA-Z]{20,}/g,
    /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g
  ]
  let sanitized = msg
  for (const pattern of keyPatterns) {
    sanitized = sanitized.replace(pattern, '[KEY_OMITIDA]')
  }
  return `Error ${provider}: ${sanitized.split('. ').pop().substring(0, 200)}`
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildOpenRouterHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://sync-pro-os.vercel.app',
    'X-Title': 'Inefable'
  }
}

async function queryDeepSeek(apiKey, model, messages) {
  const error = validateKey(apiKey, 'DeepSeek')
  if (error) return error

  const res = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
  return data.choices[0].message.content
}

async function queryOpenRouter(apiKey, model, messages) {
  const error = validateKey(apiKey, 'OpenRouter')
  if (error) return error

  const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: buildOpenRouterHeaders(apiKey),
    body: JSON.stringify({ model, messages })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
  return data.choices[0].message.content
}

async function queryGemini(apiKey, model, messages) {
  const error = validateKey(apiKey, 'Gemini');
  if (error) return error;

  const cleanKey = apiKey.trim();

  // Modelos modernos soportados por Google API
  const candidateModels = [];
  if (model && !['gemini-pro', 'gemini-1.0-pro', 'gemini-1.0-pro-001'].includes(model.toLowerCase())) {
    candidateModels.push(model.replace(/^models\//, ''));
  }
  // Modelos oficiales vigentes en orden de velocidad y cuota
  candidateModels.push('gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro');

  const modelsToTry = [...new Set(candidateModels)];

  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMsg = messages.filter(m => m.role === 'user').pop()?.content || 'Hola';

  // 1. Intento primario: Google Generative Language REST API (ultra-estable sin bloqueos de versión)
  const contents = [];
  messages.forEach(m => {
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: m.content }] });
    }
  });
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: userMsg }] });
  }

  let lastError = null;
  for (const mName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${cleanKey}`;
      const payload = {
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      };
      if (systemMsg) {
        payload.systemInstruction = {
          parts: [{ text: systemMsg }]
        };
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
      if (data.error?.message) {
        lastError = new Error(data.error.message);
      }
    } catch (e) {
      lastError = e;
    }
  }

  // 2. Intento secundario: SDK @google/generative-ai con modelos vigentes
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(cleanKey);
    for (const mName of ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']) {
      try {
        const geminiModel = genAI.getGenerativeModel({ model: mName });
        const result = await geminiModel.generateContent(
          systemMsg ? `INSTRUCCIÓN: ${systemMsg}\n\nMENSAJE: ${userMsg}` : userMsg
        );
        const response = await result.response;
        const text = response.text();
        if (text) return text;
      } catch (sdkModelErr) {
        lastError = sdkModelErr;
      }
    }
  } catch (sdkErr) {
    lastError = sdkErr;
  }

  throw lastError || new Error('No se pudo comunicar con los modelos activos de Google Gemini.');
}

async function queryBalanceDeepSeek(apiKey) {
  const res = await fetchWithTimeout('https://api.deepseek.com/user/balance', {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  })
  const data = await res.json()
  if (data.is_error || !data.balance_infos) return '0.00'
  const total = data.balance_infos.reduce((acc, curr) => acc + parseFloat(curr.total_balance || 0), 0)
  return total.toFixed(2)
}

async function queryBalanceOpenRouter(apiKey) {
  const res = await fetchWithTimeout('https://openrouter.ai/api/v1/auth/key', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const data = await res.json()
  if (data.data) {
    const { limit, usage } = data.data
    if (limit === null || parseFloat(limit) === 0) {
      return `PPU ($${parseFloat(usage).toFixed(4)})`
    }
    const rem = parseFloat(limit) - parseFloat(usage)
    return `$${rem.toFixed(4)}`
  }
  return '0.00'
}

export const aiService = {
  fetchBalance: async (settings) => {
    const provider = settings.aiProvider || 'gemini'

    if (provider === 'deepseek' && settings.deepseekKey) {
      try {
        return await queryBalanceDeepSeek(settings.deepseekKey)
      } catch (e) {
        return 'Error'
      }
    }

    if (provider === 'openrouter' && settings.openrouterKey) {
      try {
        return await queryBalanceOpenRouter(settings.openrouterKey)
      } catch (e) {
        return 'Error'
      }
    }

    return 'Ilimitado'
  },

  askAgent: async (message, history = [], context = {}) => {
    const s = context.settings || {}
    const provider = s.aiProvider || 'gemini'
    const activeView = context.activeView || 'General'

    const systemPrompt = `
      Eres "Agente", tu asistente personal y amigo.
      
      ACCIONES (JSON MANDATORIO AL FINAL):
      - CREAR_RECORDATORIO: { "action": "CREATE_REMINDER", "data": { "titulo", "monto", "nombre_contacto", "recurrencia", "fecha", "fecha_fin", "categoria": "Tarea|Compra|Idea|Nota", "subtareas": ["item1", "item2"] } }
      - CREAR_PRODUCTO: { "action": "CREATE_PRODUCT", "data": { "nombre", "precio_venta", "stock_actual" } }
      - CREAR_PRESTAMO: { "action": "CREATE_LOAN", "data": { "nombre", "capital", "interes", "inicio", "fin" } }
      - CREAR_EGRESO: { "action": "CREATE_EXPENSE", "data": { "nombre", "monto", "fecha_pago", "metodo", "contacto", "notas" } }
      - CREAR_NOTA: { "action": "CREATE_NOTE", "data": { "titulo", "icono", "contenido_texto" } }
      - BUSCAR_DRIVE: { "action": "SEARCH_DRIVE", "query": "nombre" }
      
      REGLAS CRÍTICAS:
      1. SI LA VISTA ACTUAL ES "Recordatorios", PRIORIZA "CREAR_RECORDATORIO".
      2. Usa la categoría "Nota" para apuntes personales o reflexiones.
      3. NUNCA muestres el código JSON al usuario.
      4. TODO JSON debe ir envuelto estrictamente entre estos marcadores: [[[ACTION{tu_json_aqui}]]].
      5. Responde de forma amigable, directa y muy clara.

      SISTEMA: ${JSON.stringify(context)}
    `

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
      { role: 'user', content: message }
    ]

    try {
      if (provider === 'deepseek') {
        return await queryDeepSeek(
          s.deepseekKey,
          s.deepseekModel || 'deepseek-chat',
          messages
        )
      }

      if (provider === 'openrouter') {
        return await queryOpenRouter(
          s.openrouterKey,
          s.openrouterModel || 'google/gemini-2.5-flash',
          messages
        )
      }

      return await queryGemini(s.geminiKey, s.geminiModel || '', messages)
    } catch (e) {
      return `❌ ${sanitizeError(e, provider)}`
    }
  },

  askRaw: async (systemPrompt, userPrompt, settings = {}) => {
    const provider = settings.aiProvider || 'gemini'

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    try {
      if (provider === 'deepseek') {
        return await queryDeepSeek(
          settings.deepseekKey,
          settings.deepseekModel || 'deepseek-chat',
          messages
        )
      }

      if (provider === 'openrouter') {
        return await queryOpenRouter(
          settings.openrouterKey,
          settings.openrouterModel || 'google/gemini-2.5-flash',
          messages
        )
      }

      return await queryGemini(settings.geminiKey, settings.geminiModel || '', messages)
    } catch (e) {
      return `❌ ${sanitizeError(e, provider)}`
    }
  }
}