import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Inventario from '../src/views/Inventario.jsx';

// Mock Supabase
jest.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      })
    })
  }
}));

try {
  console.log('Starting render test...');
  const html = ReactDOMServer.renderToString(React.createElement(Inventario, { isDark: true }));
  console.log('Render test passed successfully! Output length:', html.length);
} catch (e) {
  console.error('RENDER ERROR FOUND:', e);
}
