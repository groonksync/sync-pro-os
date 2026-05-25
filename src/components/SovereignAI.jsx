import React, { useState } from 'react';
import { aiService } from '../services/aiService';

const SovereignAI = ({ businessData = {} }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const result = await aiService.askLocalGemma(prompt, businessData);
      setResponse(result);
    } catch (error) {
      setResponse("Error al conectar con Gemma 4.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '20px' }}>
      <h3 style={{ color: '#10b981', margin: 0 }}>Antigravity AI (Gemma 4)</h3>
      <div style={{ margin: '15px 0', minHeight: '50px', color: '#ccc', fontSize: '14px' }}>
        {loading ? 'Pensando...' : (response || 'Hazme una pregunta sobre tu negocio...')}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe aquí..."
          style={{ flex: 1, background: '#222', border: '1px solid #444', color: 'white', padding: '10px', borderRadius: '12px' }}
        />
        <button onClick={handleAsk} style={{ background: '#10b981', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' }}>
          Enviar
        </button>
      </div>
    </div>
  );
};

export default SovereignAI;
