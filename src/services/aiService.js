
/**
 * Servicio de IA con Autodetección de Modelos y Reintentos (Resiliente)
 */
let cachedModel = null;

export const aiService = {
  generateScript: async (prompt, context = "", tone = "Profesional") => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!API_KEY) {
      console.error("CRITICAL: Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in Vercel/Environment.");
      return "Error: Configuración de IA incompleta (Falta API Key).";
    }
    
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        if (!cachedModel) {
          try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
            const listData = await listRes.json();
            if (listData.models) {
              const names = listData.models.map(m => m.name.replace('models/', ''));
              cachedModel = names.includes('gemini-1.5-flash') ? 'gemini-1.5-flash' : (names[0] || 'gemini-pro');
            }
          } catch (e) { cachedModel = 'gemini-1.5-flash'; }
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/${cachedModel || 'gemini-1.5-flash'}:generateContent?key=${API_KEY}`;
        const systemInstruction = `
          Eres un experto en guionismo de video de alta retención. 
          Tono: ${tone}. 
          REGLAS: Solo texto, sin explicaciones, sin asteriscos, directo al grano.
          Contexto: ${context}
        `;
        
        const body = {
          contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\nINSTRUCCIÓN: ${prompt}` }] }]
        };

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (data.error && data.error.message.includes('high demand')) {
          attempts++;
          cachedModel = 'gemini-pro';
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;

      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) throw error;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
};
