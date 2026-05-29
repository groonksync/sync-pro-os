import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, RefreshCw, AlertCircle, Zap } from 'lucide-react';

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export default function UpdaterPanel({ t }) {
  const [status, setStatus] = useState('idle');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isElectron) return;

    window.electronAPI.onUpdateAvailable((info) => {
      setStatus('available');
      setUpdateInfo(info);
    });
    window.electronAPI.onUpdateNotAvailable(() => {
      setStatus('not-available');
      setTimeout(() => setStatus('idle'), 3000);
    });
    window.electronAPI.onDownloadProgress((prog) => {
      setStatus('downloading');
      setProgress(prog.percent);
    });
    window.electronAPI.onUpdateDownloaded(() => {
      setStatus('downloaded');
    });
    window.electronAPI.onUpdateError((msg) => {
      setStatus('error');
      setErrorMsg(msg);
    });

    return () => window.electronAPI.removeAllUpdateListeners();
  }, []);

  const handleCheck = async () => {
    setStatus('checking');
    await window.electronAPI.checkForUpdates();
  };

  const handleDownload = async () => {
    setStatus('downloading');
    await window.electronAPI.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI.installUpdate();
  };

  if (!isElectron) return null;

  return (
    <div style={{
      border: `1px solid ${t.border}`,
      borderRadius: '16px',
      padding: '24px',
      backgroundColor: t.panel || '#141414'
    }}>
      <h3 style={{
        color: t.text,
        fontSize: '13px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '12px'
      }}>
        Actualizaciones de la App
      </h3>

      {status === 'idle' && (
        <div>
          <p style={{ color: t.textMuted, fontSize: '12px', marginBottom: '16px' }}>
            Versión actual: 1.0.0
          </p>
          <button
            onClick={handleCheck}
            style={{
              backgroundColor: t.inputBg,
              border: `1px solid ${t.border}`,
              borderRadius: '10px',
              padding: '10px 20px',
              color: t.text,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} /> Buscar actualizaciones
          </button>
        </div>
      )}

      {status === 'checking' && (
        <p style={{ color: t.textMuted, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={14} className="animate-spin" />
          Verificando actualizaciones...
        </p>
      )}

      {status === 'not-available' && (
        <p style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={14} />
          Tu app está actualizada
        </p>
      )}

      {status === 'available' && updateInfo && (
        <div>
          <p style={{ color: t.text, fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
            ✨ Nueva versión disponible: {updateInfo.version}
          </p>
          {updateInfo.releaseNotes && (
            <p style={{ color: t.textMuted, fontSize: '11px', marginBottom: '16px', whiteSpace: 'pre-line' }}>
              {updateInfo.releaseNotes}
            </p>
          )}
          <button
            onClick={handleDownload}
            style={{
              backgroundColor: t.accent || '#10b981',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              color: '#000',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Download size={14} /> Descargar actualización
          </button>
        </div>
      )}

      {status === 'downloading' && (
        <div>
          <p style={{ color: t.textMuted, fontSize: '12px', marginBottom: '12px' }}>
            Descargando... {progress}%
          </p>
          <div style={{
            height: '6px',
            borderRadius: '3px',
            backgroundColor: t.border,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: t.accent || '#10b981',
              transition: 'width 0.3s ease',
              borderRadius: '3px'
            }} />
          </div>
        </div>
      )}

      {status === 'downloaded' && (
        <div>
          <p style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CheckCircle size={14} />
            Actualización lista para instalar
          </p>
          <button
            onClick={handleInstall}
            style={{
              backgroundColor: t.accent || '#10b981',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              color: '#000',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Zap size={14} /> Instalar y reiniciar
          </button>
        </div>
      )}

      {status === 'error' && (
        <p style={{ color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={14} />
          Error: {errorMsg}
        </p>
      )}
    </div>
  );
}
