import React from 'react';

const TONES = {
  ok: '#10B981',
  warn: '#F59E0B',
  bad: '#EF4444',
  idle: '#6A6A70',
};

/** Punto de estado de 8px. tone: 'ok' | 'warn' | 'bad' | 'idle' */
export default function StatusDot({ tone = 'idle', size = 8 }) {
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: TONES[tone] || TONES.idle }}
    />
  );
}
