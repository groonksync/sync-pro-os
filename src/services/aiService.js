/**
 * Servicio de IA con Autodetección de Modelos y Reintentos (Resiliente)
 */

export const aiService = {
  /**
   * Obtener balance de créditos oficial
   */
  fetchBalance: async (settings) => {
    const provider = settings.aiProvider || 'gemini';
    
    if (provider === 'deepseek' && settings.deepseekKey) {
      try {
        const res = await fetch("https://api.deepseek.com/user/balance", {
          headers: { 
            "Authorization": `Bearer ${settings.deepseekKey}`,
            "Content-Type": "application/json"
          }
        });
        const data = await res.json();
        if (data.is_error || !data.balance_infos) return "0.00";
        // DeepSeek devuelve una lista de balances (fiat, etc)
        const total = data.balance_infos.reduce((acc, curr) => acc + parseFloat(curr.total_balance || 0), 0);
        return total.toFixed(2);
      } catch (e) { 
        console.error("Error fetching DeepSeek balance:", e);
        return "Error"; 
      }
    }

    if (provider === 'openrouter' && settings.openrouterKey) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { 
            "Authorization": `Bearer ${settings.openrouterKey}`
          }
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
        return "0.00";
      } catch (e) {
        console.error("Error fetching OpenRouter balance:", e);
        return "Error";
      }
    }
    
    return "Ilimitado"; // Gemini Free/Pay-as-you-go en AI Studio
  },

  /**
   * Agente Maestro Sovereign (Cerebro Central)
   */
  askAgent: async (message, history = [], context = {}) => {
    const s = context.settings || {};
    const provider = s.aiProvider || 'gemini';
    const geminiKey = s.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
    const deepseekKey = s.deepseekKey;
    const openrouterKey = s.openrouterKey;

    const activeView = context.activeView || 'General';
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
      5. Responde de forma amigable, directa y muy clara, sin usar tecnicismos undeniables, como si le hablaras a un buen amigo.

      SISTEMA: ${JSON.stringify(context)}
    `;

    // LÓGICA DE DEEPSEEK
    if (provider === 'deepseek') {
      if (!deepseekKey) return "⚠️ Error: Falta la API Key de DeepSeek en Ajustes.";
      const activeModel = s.deepseekModel || 'deepseek-chat';
      try {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${deepseekKey}` },
          body: JSON.stringify({
            model: activeModel,
            messages: [
              { role: "system", content: systemPrompt },
              ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
              { role: "user", content: message }
            ]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
      } catch (e) {
        return `❌ Error DeepSeek: ${e.message}`;
      }
    }

    // LÓGICA DE OPENROUTER
    if (provider === 'openrouter') {
      if (!openrouterKey) return "⚠️ Error: Falta la API Key de OpenRouter en Ajustes.";
      const activeModel = s.openrouterModel || 'google/gemini-2.5-flash';
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://sync-pro-os.vercel.app",
            "X-Title": "Inefable"
          },
          body: JSON.stringify({
            model: activeModel,
            messages: [
              { role: "system", content: systemPrompt },
              ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
              { role: "user", content: message }
            ]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
      } catch (e) {
        return `❌ Error OpenRouter: ${e.message}`;
      }
    }

    // LÓGICA DE GEMINI (Enlace Neural Profesional v13 - SDK Oficial)
    const cleanKey = geminiKey.trim();
    if (!cleanKey) return "⚠️ Error: Falta la API Key de Gemini en Ajustes.";
    
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(cleanKey);
      
      // BRUTE FORCE FALLBACK: Intentar todos los modelos posibles
      const modelsToTry = [
        "gemini-1.5-flash", 
        "gemini-1.5-pro", 
        "gemini-1.5-flash-latest",
        "gemini-1.0-pro",
        "gemini-pro"
      ];
      
      let text = null;
      let lastError = null;

      for (const mName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: mName });
          const result = await model.generateContent(`INSTRUCCIÓN: ${systemPrompt}\n\nMENSAJE: ${message}`);
          const response = await result.response;
          text = response.text();
          if (text) break; // Éxito
        } catch (e) {
          lastError = e;
          console.warn(`Intento fallido con ${mName}:`, e.message);
        }
      }
      
      if (text) return text;
      throw lastError || new Error("Respuesta vacía de la IA o todos los modelos fallaron.");

    } catch (e) {
      console.error("Gemini SDK Error:", e);
      let errorMsg = e.message;
      
      if (errorMsg.includes("403")) errorMsg = "Permiso denegado. Verifica que tu API esté habilitada en Google Cloud.";
      if (errorMsg.includes("404")) errorMsg = "Modelo no encontrado. Prueba a esperar 5 minutos si tu llave es nueva.";
      if (errorMsg.includes("API_KEY_INVALID")) errorMsg = "La API Key no es válida. Cópiala de nuevo desde AI Studio.";

      return `❌ Error de Sincronización SDK: ${errorMsg}. \n\nSugerencia: Si usas AI Studio, asegúrate de que la llave esté activa.`;
    }
  }
};
