import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Lock,
  Unlock,
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  Globe,
  ShieldCheck,
  Database,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sliders,
  AlertCircle,
  Shield,
  Edit3,
  BarChart3,
  Clock,
  LockKeyhole,
  AlertTriangle
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

// --- Password Strength Utility ---
const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: 'N/A', color: '#555', width: '0%' };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (pass.length >= 16) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  if (pass.length >= 20) score += 1;
  const maxScore = 8;
  const pct = Math.min(score / maxScore, 1);
  if (pct < 0.3) return { score: pct, label: 'DÉBIL', color: '#ef4444', width: `${pct * 100}%` };
  if (pct < 0.5) return { score: pct, label: 'MEDIA', color: '#f59e0b', width: `${pct * 100}%` };
  if (pct < 0.75) return { score: pct, label: 'FUERTE', color: '#22c55e', width: `${pct * 100}%` };
  return { score: pct, label: 'INQUEBRANTABLE', color: '#4ec9b0', width: `${pct * 100}%` };
};

const BovedaPass = ({ settings, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [isMasterPasswordCreated, setIsMasterPasswordCreated] = useState(() => {
    return !!localStorage.getItem('sovereign_boveda_master_hash');
  });
  
  const [credentials, setCredentials] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  const [visiblePasswords, setVisiblePasswords] = useState({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState(null); // null = new, object = editing
  const [isGenerating, setIsGenerating] = useState(false);
  const [newCred, setNewCred] = useState({
    sitio_web: '',
    url: '',
    usuario: '',
    contrasena: '',
    categoria: 'General',
    notas: ''
  });
  
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  // --- Master Password Change Modal ---
  const [showChangeMasterModal, setShowChangeMasterModal] = useState(false);
  const [oldMasterPassword, setOldMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [changingMaster, setChangingMaster] = useState(false);

  // --- Dynamic Categories ---
  const categories = useMemo(() => {
    const cats = credentials.map(c => c.categoria).filter(Boolean);
    const unique = [...new Set(cats)];
    return ['Todos', ...unique.sort()];
  }, [credentials]);

  useEffect(() => {
    if (isUnlocked && masterPassword) {
      fetchCredentials();
    }
  }, [isUnlocked]);

  // --- Stats ---
  const stats = useMemo(() => {
    const total = credentials.length;
    let totalScore = 0;
    let weak = 0, medium = 0, strong = 0, unbreakable = 0;
    credentials.forEach(c => {
      const s = getPasswordStrength(c.contrasena_plana || '');
      totalScore += s.score;
      if (s.score < 0.3) weak++;
      else if (s.score < 0.5) medium++;
      else if (s.score < 0.75) strong++;
      else unbreakable++;
    });
    return {
      total,
      avgStrength: total > 0 ? Math.round((totalScore / total) * 100) : 0,
      weak, medium, strong, unbreakable,
      categories: categories.length - 1 // exclude 'Todos'
    };
  }, [credentials, categories]);

  const fetchCredentials = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from('boveda_pass')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const decryptedData = data.map(item => {
          try {
            const bytes = CryptoJS.AES.decrypt(item.contrasena, masterPassword);
            const decryptedPass = bytes.toString(CryptoJS.enc.Utf8);
            return { ...item, contrasena_plana: decryptedPass || 'Error de Desencriptación' };
          } catch (e) {
            return { ...item, contrasena_plana: 'Error: Master Password incorrecta' };
          }
        });
        setCredentials(decryptedData);
      }
    } catch (e) {
      console.warn("Contraseñas: tabla Supabase no detectada, utilizando fallback de localStorage.");
      setDbError(true);
      
      const localCreds = localStorage.getItem('sovereign_creds');
      if (localCreds) {
        const parsed = JSON.parse(localCreds);
        const decryptedData = parsed.map(item => {
          try {
            const bytes = CryptoJS.AES.decrypt(item.contrasena, masterPassword);
            const decryptedPass = bytes.toString(CryptoJS.enc.Utf8);
            return { ...item, contrasena_plana: decryptedPass || 'Error de Desencriptación' };
          } catch (err) {
            return { ...item, contrasena_plana: 'Error: Master Password incorrecta' };
          }
        });
        setCredentials(decryptedData);
      }
    }
    setLoading(false);
  };

  // --- Change Master Password ---
  const handleChangeMasterPassword = async () => {
    if (!oldMasterPassword || !newMasterPassword || !confirmMasterPassword) {
      alert("Completa todos los campos.");
      return;
    }
    const savedHash = localStorage.getItem('sovereign_boveda_master_hash');
    const oldHash = CryptoJS.SHA256(oldMasterPassword).toString();
    if (savedHash !== oldHash) {
      alert("La contraseña maestra actual es incorrecta.");
      return;
    }
    if (newMasterPassword !== confirmMasterPassword) {
      alert("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (newMasterPassword.length < 6) {
      alert("La nueva llave maestra debe tener al menos 6 caracteres.");
      return;
    }

    setChangingMaster(true);
    try {
      // Re-encrypt all credentials with new master password
      const reEncrypted = credentials.map(item => {
        const newEncrypted = CryptoJS.AES.encrypt(item.contrasena_plana, newMasterPassword).toString();
        return { ...item, contrasena: newEncrypted };
      });

      // Update Supabase if available
      if (!dbError) {
        for (const item of reEncrypted) {
          await supabase.from('boveda_pass').update({ contrasena: item.contrasena }).eq('id', item.id);
        }
      }

      // Update localStorage hash
      const newHash = CryptoJS.SHA256(newMasterPassword).toString();
      localStorage.setItem('sovereign_boveda_master_hash', newHash);
      localStorage.setItem('sovereign_creds', JSON.stringify(reEncrypted));

      // Update state
      setCredentials(reEncrypted);
      setMasterPassword(newMasterPassword);
      setShowChangeMasterModal(false);
      setOldMasterPassword('');
      setNewMasterPassword('');
      setConfirmMasterPassword('');
      alert("Llave Maestra cambiada exitosamente. Todas las credenciales fueron re-encriptadas.");
    } catch (e) {
      alert("Error al cambiar la llave maestra: " + e.message);
    }
    setChangingMaster(false);
  };

  const handleCreateMasterPassword = () => {
    if (!masterPassword.trim()) return;
    const hash = CryptoJS.SHA256(masterPassword).toString();
    localStorage.setItem('sovereign_boveda_master_hash', hash);
    setIsMasterPasswordCreated(true);
    setIsUnlocked(true);
  };

  const handleUnlockBoveda = () => {
    const savedHash = localStorage.getItem('sovereign_boveda_master_hash');
    const inputHash = CryptoJS.SHA256(masterPassword).toString();
    if (savedHash === inputHash) {
      setIsUnlocked(true);
    } else {
      alert("Llave Maestra INCORRECTA. Por favor verifica de nuevo.");
    }
  };

  const openNewCredential = () => {
    setEditingCred(null);
    setNewCred({ sitio_web: '', url: '', usuario: '', contrasena: '', categoria: 'General', notas: '' });
    setIsModalOpen(true);
  };

  const openEditCredential = (item) => {
    setEditingCred(item);
    setNewCred({
      sitio_web: item.sitio_web || '',
      url: item.url || '',
      usuario: item.usuario || '',
      contrasena: item.contrasena_plana || '',
      categoria: item.categoria || 'General',
      notas: item.notas || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCredential = async () => {
    if (!newCred.sitio_web || !newCred.usuario || !newCred.contrasena) {
      alert("Por favor completa los campos de Sitio Web, Usuario y Contraseña.");
      return;
    }

    setLoading(true);
    try {
      const encryptedPassword = CryptoJS.AES.encrypt(newCred.contrasena, masterPassword).toString();
      
      const payload = {
        sitio_web: newCred.sitio_web,
        url: newCred.url,
        usuario: newCred.usuario,
        contrasena: encryptedPassword,
        categoria: newCred.categoria,
        notas: newCred.notas
      };

      if (editingCred) {
        // --- EDIT mode ---
        if (!dbError) {
          const { error } = await supabase
            .from('boveda_pass')
            .update(payload)
            .eq('id', editingCred.id);
          if (error) throw error;
        }

        const updated = credentials.map(c => {
          if (c.id === editingCred.id) {
            return { ...c, ...payload, contrasena_plana: newCred.contrasena };
          }
          return c;
        });
        setCredentials(updated);
        if (dbError) localStorage.setItem('sovereign_creds', JSON.stringify(updated));
      } else {
        // --- CREATE mode ---
        let returnedId = 'local-' + Date.now();

        if (!dbError) {
          const { data, error } = await supabase
            .from('boveda_pass')
            .insert(payload)
            .select();
          if (error) throw error;
          if (data && data[0]) returnedId = data[0].id;
        }

        const newLocalItem = { ...payload, id: returnedId, contrasena_plana: newCred.contrasena };
        const updatedList = [newLocalItem, ...credentials];
        setCredentials(updatedList);

        if (dbError) {
          localStorage.setItem('sovereign_creds', JSON.stringify(updatedList));
        }
      }

      setNewCred({ sitio_web: '', url: '', usuario: '', contrasena: '', categoria: 'General', notas: '' });
      setEditingCred(null);
      setIsModalOpen(false);
    } catch (e) {
      alert("Error al guardar credencial: " + e.message);
    }
    setLoading(false);
  };

  const handleDeleteCredential = async (id) => {
    if (!confirm("¿Eliminar esta credencial de forma permanente?")) return;
    setLoading(true);
    try {
      if (!dbError) {
        const target = credentials.find(c => c.id === id);
        if (target) {
          await supabase.from('papelera').insert({
            nombre_item: `${target.sitio_web} (${target.usuario})`,
            tipo_dato: 'credencial',
            datos_originales: target,
            expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          await supabase.from('boveda_pass').delete().eq('id', id);
        }
      } else {
        const target = credentials.find(c => c.id === id);
        if (target) {
          const localTrash = JSON.parse(localStorage.getItem('sovereign_local_trash') || '[]');
          localTrash.push({
            id: 'trash-' + Date.now(),
            nombre_item: `${target.sitio_web} (${target.usuario})`,
            tipo_dato: 'credencial',
            datos_originales: target,
            expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            borrado_el: new Date().toISOString()
          });
          localStorage.setItem('sovereign_local_trash', JSON.stringify(localTrash));
        }
      }

      const updated = credentials.filter(c => c.id !== id);
      setCredentials(updated);
      if (dbError) localStorage.setItem('sovereign_creds', JSON.stringify(updated));
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    }
    setLoading(false);
  };

  const generatePassword = () => {
    let charset = "abcdefghijklmnopqrstuvwxyz";
    if (genUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (genNumbers) charset += "0123456789";
    if (genSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pass = "";
    for (let i = 0; i < genLength; i++) pass += charset.charAt(Math.floor(Math.random() * charset.length));
    setNewCred(prev => ({ ...prev, contrasena: pass }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCreds = credentials.filter(c => {
    const matchCategory = activeCategory === 'Todos' || c.categoria === activeCategory;
    const matchSearch = c.sitio_web.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        c.usuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.notas && c.notas.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now - d;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Hoy';
      if (days === 1) return 'Ayer';
      if (days < 7) return `Hace ${days} días`;
      if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch { return ''; }
  };

  // LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] w-full max-w-lg mx-auto p-6 animate-in fade-in zoom-in-95 duration-500" style={{ backgroundColor: t.bg, borderRadius: 16 }}>
        <div className="mb-8 text-center flex flex-col items-center">
          <div style={{ width: 56, height: 56, backgroundColor: t.accentSoft, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.borderLight}`, marginBottom: 20 }}>
            <Lock size={28} color={t.accent} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>Contraseñas</h2>
          <p style={{ fontSize: 8, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 8 }}>Cifrado AES-256 en Cliente</p>
        </div>

        <div className="w-full" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 20, padding: 28 }}>
          {isMasterPasswordCreated ? (
            <div className="space-y-5">
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Desbloquear Bóveda</h4>
                <p style={{ fontSize: 8, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.5 }}>
                  Ingresa tu Llave Maestra local.
                </p>
              </div>
              <input type="password" placeholder="LLAVE MAESTRA" value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnlockBoveda()}
                style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 20px', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', color: t.text, outline: 'none' }}/>
              <button onClick={handleUnlockBoveda}
                style={{ width: '100%', padding: '14px 0', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Unlock size={14}/> Desbloquear
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div style={{ padding: 12, backgroundColor: t.accentSoft, borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <ShieldAlert color={t.accent} size={14} style={{ marginTop: 2 }}/>
                <div>
                  <h5 style={{ fontSize: 9, fontWeight: 900, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Criptografía Extrema</h5>
                  <p style={{ fontSize: 7, color: t.textDim, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.5, marginTop: 4 }}>
                    Tus contraseñas se cifran en cliente. Si olvidas tu Llave Maestra, los datos serán irrecuperables.
                  </p>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Configurar Llave Maestra</h4>
                <p style={{ fontSize: 8, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Crea una contraseña maestra ultra fuerte.</p>
              </div>
              <input type="password" placeholder="NUEVA LLAVE MAESTRA" value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
                style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 20px', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', color: t.text, outline: 'none' }}/>
              <button onClick={handleCreateMasterPassword}
                style={{ width: '100%', padding: '14px 0', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ShieldCheck size={14}/> Crear & Desbloquear
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN VIEW
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 overflow-hidden" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
      
      {/* DB ALERT */}
      {dbError && (
        <div className="mb-4 flex items-center justify-between" style={{ padding: '10px 14px', backgroundColor: t.accentSoft, borderRadius: 12, border: `1px solid ${t.borderLight}`, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.accent }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>Bóveda local activa (localStorage).</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-end mb-4" style={{ paddingBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Bóveda de Contraseñas</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>
            {stats.total} credenciales · {stats.categories} categorías · Fortaleza {stats.avgStrength}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowChangeMasterModal(true)}
            style={{ padding: '8px 14px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <LockKeyhole size={12}/> Cambiar Llave
          </button>
          <button onClick={openNewCredential}
            style={{ padding: '10px 20px', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16}/> Agregar Llave
          </button>
        </div>
      </header>

      {/* DASHBOARD KPIS */}
      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, backgroundColor: t.accentSoft, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={16} color={t.accent} />
            </div>
            <div>
              <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.12em', display: 'block' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{stats.total}</span>
            </div>
          </div>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, backgroundColor: 'rgba(78,201,176,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="#4ec9b0" />
            </div>
            <div>
              <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.12em', display: 'block' }}>Fortaleza</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{stats.avgStrength}%</span>
            </div>
          </div>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} color="#ef4444" />
            </div>
            <div>
              <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.12em', display: 'block' }}>Débiles</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: stats.weak > 0 ? '#ef4444' : '#22c55e' }}>{stats.weak}</span>
            </div>
          </div>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="#22c55e" />
            </div>
            <div>
              <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.12em', display: 'block' }}>Inquebrantables</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{stats.unbreakable}</span>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        
        {/* CATEGORIES */}
        <div className="w-56" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Categorías</h4>
          <div className="space-y-1 flex-1 overflow-y-auto mac-scrollbar">
            {categories.map(cat => {
              const count = cat === 'Todos' ? credentials.length : credentials.filter(c => c.categoria === cat).length;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer', backgroundColor: activeCategory === cat ? t.accentSoft : 'transparent', color: activeCategory === cat ? t.accent : t.textDim, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{cat}</span>
                  <span style={{ fontSize: 7, color: t.textDim, fontWeight: 700 }}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto p-3" style={{ backgroundColor: t.accentSoft, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck color={t.accent} size={12}/>
            <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.08em' }}>
              Cifrado activo AES-256
            </span>
          </div>
        </div>

        {/* CREDENTIALS LIST */}
        <div className="flex-1" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* Search */}
          <div className="relative">
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textDim }} size={14} />
            <input type="text" placeholder="Buscar por sitio, usuario, notas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 12px 10px 36px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', outline: 'none' }}/>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto mac-scrollbar pr-1">
            {filteredCreds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCreds.map(item => {
                  const strength = getPasswordStrength(item.contrasena_plana || '');
                  return (
                    <div key={item.id}
                      style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      
                      {/* Strength bar */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: t.border, borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: strength.width, backgroundColor: strength.color, borderRadius: '12px 0 0 0', transition: 'width 0.3s ease' }} />
                      </div>

                      {/* Header */}
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div style={{ width: 36, height: 36, backgroundColor: t.panel, borderRadius: 10, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Globe size={16} color={t.textMuted} />
                          </div>
                          <div>
                            <span style={{ fontSize: 6, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.1em', display: 'block', marginBottom: 2 }}>{item.categoria}</span>
                            <h4 style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{item.sitio_web}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditCredential(item)}
                            style={{ padding: 6, backgroundColor: t.panel, borderRadius: 8, border: `1px solid ${t.border}`, cursor: 'pointer', color: t.textDim }}>
                            <Edit3 size={10} />
                          </button>
                          <button onClick={() => handleDeleteCredential(item.id)}
                            style={{ padding: 6, backgroundColor: t.panel, borderRadius: 8, border: `1px solid ${t.border}`, cursor: 'pointer', color: t.textDim }}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Strength label */}
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontSize: 6, fontWeight: 900, textTransform: 'uppercase', color: strength.color, letterSpacing: '0.08em' }}>
                          {strength.label}
                        </span>
                        {item.updated_at && (
                          <span style={{ fontSize: 6, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={7}/> {formatDate(item.updated_at)}
                          </span>
                        )}
                      </div>

                      {/* Fields */}
                      <div className="space-y-2.5" style={{ backgroundColor: t.panel, padding: 10, borderRadius: 10, border: `1px solid ${t.border}`, marginBottom: 10 }}>
                        
                        {/* User */}
                        <div>
                          <span style={{ fontSize: 6, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.12em', display: 'block', marginBottom: 3 }}>Usuario / Correo</span>
                          <div className="flex justify-between items-center gap-2">
                            <span style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.usuario}</span>
                            <button onClick={() => copyToClipboard(item.usuario, item.id + '-user')}
                              style={{ padding: 4, backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}`, cursor: 'pointer', color: t.textDim }}>
                              {copiedId === item.id + '-user' ? <Check size={8} color={t.accent}/> : <Copy size={8}/>}
                            </button>
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <span style={{ fontSize: 6, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.12em', display: 'block', marginBottom: 3 }}>Contraseña</span>
                          <div className="flex justify-between items-center gap-2">
                            <input type={visiblePasswords[item.id] ? 'text' : 'password'} value={item.contrasena_plana} readOnly
                              style={{ backgroundColor: 'transparent', border: 'none', fontSize: 9, fontFamily: 'monospace', color: t.accent, outline: 'none', width: '100%' }}/>
                            <div className="flex items-center gap-1">
                              <button onClick={() => togglePasswordVisibility(item.id)}
                                style={{ padding: 4, backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}`, cursor: 'pointer', color: t.textDim }}>
                                {visiblePasswords[item.id] ? <EyeOff size={8}/> : <Eye size={8}/>}
                              </button>
                              <button onClick={() => copyToClipboard(item.contrasena_plana, item.id + '-pass')}
                                style={{ padding: 4, backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}`, cursor: 'pointer', color: t.textDim }}>
                                {copiedId === item.id + '-pass' ? <Check size={8} color={t.accent}/> : <Copy size={8}/>}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {item.notas && (
                        <p style={{ fontSize: 8, fontWeight: 600, color: t.textDim, lineHeight: 1.4, marginBottom: 8, borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
                          {item.notas}
                        </p>
                      )}

                      {/* URL */}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer"
                          style={{ marginTop: 'auto', padding: '8px 0', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <ExternalLink size={8}/> Abrir Enlace
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center" style={{ border: `1px dashed ${t.border}`, borderRadius: 14 }}>
                <Key size={32} color={t.textDim} className="mx-auto mb-3" />
                <h5 style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No hay contraseñas</h5>
                <p style={{ fontSize: 7, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>Agrega una llave o cambia el filtro</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CREDENTIAL MODAL (Create/Edit) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[2000]" style={{ backgroundColor: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(12px)' }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, borderRadius: 20, padding: 24, width: '100%', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto' }}>
            <h4 style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key color={t.accent} size={18}/> {editingCred ? 'Editar Contraseña' : 'Nueva Contraseña'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left */}
              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Nombre del Sitio</label>
                  <input type="text" value={newCred.sitio_web} onChange={e => setNewCred(prev => ({ ...prev, sitio_web: e.target.value }))} placeholder="Ej. Supabase, Instagram..."
                    style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', outline: 'none' }}/>
                </div>
                <div>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>URL</label>
                  <input type="url" value={newCred.url} onChange={e => setNewCred(prev => ({ ...prev, url: e.target.value }))} placeholder="https://..."
                    style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', outline: 'none' }}/>
                </div>
                <div>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Usuario / Email</label>
                  <input type="text" value={newCred.usuario} onChange={e => setNewCred(prev => ({ ...prev, usuario: e.target.value }))} placeholder="Ej. admin@studio.com"
                    style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', outline: 'none' }}/>
                </div>
                <div>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Contraseña</label>
                  <input type="text" value={newCred.contrasena} onChange={e => setNewCred(prev => ({ ...prev, contrasena: e.target.value }))} placeholder="Escribe o genera..."
                    style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 10, fontWeight: 900, color: t.accent, outline: 'none' }}/>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Categoría</label>
                  <select value={newCred.categoria} onChange={e => setNewCred(prev => ({ ...prev, categoria: e.target.value }))}
                    style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', outline: 'none' }}>
                    {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Password Generator */}
                <div style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, padding: 12, borderRadius: 12 }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sliders size={10}/> Generador
                    </span>
                    <button onClick={generatePassword}
                      style={{ padding: '6px 12px', backgroundColor: t.accentSoft, border: `1px solid ${t.borderLight}`, color: t.accent, borderRadius: 8, fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
                      Generar
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: 7, fontWeight: 700, color: t.textDim, textTransform: 'uppercase' }}>Longitud ({genLength})</span>
                      <input type="range" min="8" max="32" value={genLength} onChange={e => setGenLength(parseInt(e.target.value))}
                        style={{ width: 80, accentColor: t.accent }}/>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={genUpper} onChange={e => setGenUpper(e.target.checked)}
                          style={{ accentColor: t.accent, width: 10, height: 10 }}/>
                        <span style={{ fontSize: 6, fontWeight: 900, color: t.textDim, textTransform: 'uppercase' }}>MAYÚS</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={genNumbers} onChange={e => setGenNumbers(e.target.checked)}
                          style={{ accentColor: t.accent, width: 10, height: 10 }}/>
                        <span style={{ fontSize: 6, fontWeight: 900, color: t.textDim, textTransform: 'uppercase' }}>NÚM</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={genSymbols} onChange={e => setGenSymbols(e.target.checked)}
                          style={{ accentColor: t.accent, width: 10, height: 10 }}/>
                        <span style={{ fontSize: 6, fontWeight: 900, color: t.textDim, textTransform: 'uppercase' }}>SÍMB</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Notas</label>
                  <textarea value={newCred.notas} onChange={e => setNewCred(prev => ({ ...prev, notas: e.target.value }))} placeholder="Pines de recuperación..." rows="2"
                    style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 10, fontWeight: 600, color: t.text, outline: 'none', resize: 'none', fontFamily: 'monospace' }}/>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4" style={{ borderTop: `1px solid ${t.border}`, marginTop: 16 }}>
              <button onClick={() => { setIsModalOpen(false); setEditingCred(null); }}
                style={{ flex: 1, padding: '12px 0', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.textMuted, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSaveCredential}
                style={{ flex: 1, padding: '12px 0', backgroundColor: t.accent, border: 'none', borderRadius: 12, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#000', cursor: 'pointer' }}>
                {editingCred ? 'Actualizar & Cifrar' : 'Cifrar & Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHANGE MASTER PASSWORD MODAL --- */}
      {showChangeMasterModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[2000]" style={{ backgroundColor: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(12px)' }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, borderRadius: 20, padding: 24, width: '100%', maxWidth: 480 }}>
            <h4 style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LockKeyhole color={t.accent} size={18}/> Cambiar Llave Maestra
            </h4>
            <p style={{ fontSize: 8, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, lineHeight: 1.5 }}>
              Se re-encriptarán todas las credenciales ({stats.total}) con la nueva llave.
            </p>

            <div className="space-y-4">
              <div>
                <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Llave Maestra Actual</label>
                <input type="password" value={oldMasterPassword} onChange={e => setOldMasterPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', outline: 'none', textAlign: 'center' }}/>
              </div>
              <div>
                <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Nueva Llave Maestra</label>
                <input type="password" value={newMasterPassword} onChange={e => setNewMasterPassword(e.target.value)} placeholder="MIN. 6 CARACTERES"
                  style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.accent, outline: 'none', textAlign: 'center' }}/>
              </div>
              <div>
                <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Confirmar Nueva Llave</label>
                <input type="password" value={confirmMasterPassword} onChange={e => setConfirmMasterPassword(e.target.value)} placeholder="REPITE LA NUEVA LLAVE"
                  style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', outline: 'none', textAlign: 'center' }}/>
              </div>
            </div>

            <div className="flex gap-3 pt-4" style={{ borderTop: `1px solid ${t.border}`, marginTop: 20 }}>
              <button onClick={() => { setShowChangeMasterModal(false); setOldMasterPassword(''); setNewMasterPassword(''); setConfirmMasterPassword(''); }}
                style={{ flex: 1, padding: '12px 0', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.textMuted, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleChangeMasterPassword} disabled={changingMaster}
                style={{ flex: 1, padding: '12px 0', backgroundColor: t.accent, border: 'none', borderRadius: 12, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#000', cursor: 'pointer', opacity: changingMaster ? 0.6 : 1 }}>
                {changingMaster ? 'Re-encriptando...' : 'Cambiar & Re-encriptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BovedaPass;
