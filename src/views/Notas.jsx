import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FolderPlus,
  Plus,
  Search,
  Star,
  Trash2,
  Edit3,
  Eye,
  Clock,
  Sparkles,
  BookOpen,
  Calendar,
  AlertCircle,
  Check,
  Copy,
  ChevronDown,
  Folder,
  FileText,
  Tag,
  MoreHorizontal,
  List,
  Grid,
  Image as ImageIcon,
  ShoppingCart,
  Brain,
  Table2,
  FileType,
  Upload
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';
import NotaGuionTecnico from '../components/NotaGuionTecnico';
import NotaPromptIA from '../components/NotaPromptIA';
import NotaListaCompras from '../components/NotaListaCompras';

const Notas = ({ settings, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  // --- Estados de Datos ---
  const [notas, setNotas] = useState([]);
  const [folders, setFolders] = useState([
    { id: 'all', nombre: 'Todas las Notas', isSystem: true, color: t.accent },
    { id: 'favs', nombre: 'Favoritos', isSystem: true, color: '#eab308' },
    { id: 'folder-personal', nombre: 'Personal', color: '#4ec9b0' },
    { id: 'folder-trabajo', nombre: 'Trabajo', color: t.accent },
    { id: 'folder-ideas', nombre: 'Ideas', color: '#a855f7' }
  ]);
  
  // --- Estados de Navegación y Filtros ---
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [editMode, setEditMode] = useState('write');
  
  // --- Modales y Formularios ---
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#4ec9b0');
  
  // --- Estados de Red / DB ---
  const [dbError, setDbError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('synced');
  const [copiedSql, setCopiedSql] = useState(false);

  const autoSaveTimer = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const sqlSchemaCode = `-- SOVEREIGN STUDIO - NOTAS SCHEMA
CREATE TABLE IF NOT EXISTS notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT DEFAULT 'Sin Título',
    icono TEXT DEFAULT 'file',
    contenido JSONB DEFAULT '[]'::jsonb,
    is_folder BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES notas(id) ON DELETE CASCADE,
    favorito BOOLEAN DEFAULT false,
    fecha_evento DATE,
    color TEXT DEFAULT '#4ec9b0',
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total" ON notas FOR ALL USING (true) WITH CHECK (true);`;

  // --- Carga Inicial ---
  useEffect(() => {
    fetchNotasAndFolders();
  }, []);

  const fetchNotasAndFolders = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data: dbNotas, error: notasError } = await supabase
        .from('notas')
        .select('*')
        .order('updated_at', { ascending: false });

      if (notasError) throw notasError;

      if (dbNotas) {
        const dbFolders = dbNotas.filter(n => n.is_folder);
        const dbPlainNotas = dbNotas.filter(n => !n.is_folder);

        const sysFolders = [
          { id: 'all', nombre: 'Todas las Notas', isSystem: true, color: t.accent },
          { id: 'favs', nombre: 'Favoritos', isSystem: true, color: '#eab308' }
        ];
        
        const customFoldersFromDb = dbFolders.map(f => ({
          id: f.id,
          nombre: f.titulo,
          color: f.color || '#4ec9b0',
          isSystem: false
        }));

        setFolders([...sysFolders, ...customFoldersFromDb]);

        const formattedPlainNotas = dbPlainNotas.map(n => ({
          id: n.id,
          titulo: n.titulo || 'Sin Título',
          contenido: Array.isArray(n.contenido) ? (n.contenido[0]?.text || '') : (typeof n.contenido === 'string' ? n.contenido : ''),
          folderId: n.parent_id || 'all',
          favorito: n.favorito || false,
          color: n.color || '#4ec9b0',
          estado: n.estado || 'pendiente',
          tipo: n.tipo || 'normal',
          imagenes: n.imagenes || [],
          fecha_evento: n.fecha_evento || null,
          updated_at: n.updated_at
        }));

        setNotas(formattedPlainNotas);

        if (formattedPlainNotas.length > 0 && !activeNoteId) {
          setActiveNoteId(formattedPlainNotas[0].id);
        }
      }
    } catch (error) {
      console.warn("Supabase no disponible, usando localStorage:", error.message);
      setDbError(true);
      
      const localNotas = localStorage.getItem('sovereign_notas');
      const localFolders = localStorage.getItem('sovereign_folders');

      if (localFolders) {
        setFolders(JSON.parse(localFolders));
      }
      if (localNotas) {
        const parsed = JSON.parse(localNotas);
        setNotas(parsed);
        if (parsed.length > 0 && !activeNoteId) {
          setActiveNoteId(parsed[0].id);
        }
      } else {
        const demoNote = {
          id: 'demo-1',
          titulo: 'Bienvenido a Notas',
          contenido: '# Bienvenido a tu Bóveda de Notas\n\nSistema de notas avanzado con Markdown.\n\n### Características:\n1. **Editor Markdown** en tiempo real\n2. **Estados**: pendiente, en proceso, completado\n3. **Carpetas** personalizables\n4. **Favoritos** y filtros\n5. **Tipos de nota**: Normal, Guión Técnico, Prompt IA, Lista de Compras\n6. **Sincronización** con Supabase\n\nEdita este texto para empezar.',
          folderId: 'folder-personal',
          favorito: true,
          color: '#4ec9b0',
          estado: 'pendiente',
          tipo: 'normal',
          imagenes: [],
          fecha_evento: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        };
        setNotas([demoNote]);
        setActiveNoteId(demoNote.id);
        localStorage.setItem('sovereign_notas', JSON.stringify([demoNote]));
      }
    }
    setLoading(false);
  };

  // --- Auto Guardado ---
  const triggerAutoSave = (updatedNotasList) => {
    setSaveStatus('saving');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    
    autoSaveTimer.current = setTimeout(async () => {
      localStorage.setItem('sovereign_notas', JSON.stringify(updatedNotasList));
      localStorage.setItem('sovereign_folders', JSON.stringify(folders));

      if (!dbError) {
        try {
          const batch = updatedNotasList.map(n => ({
            id: n.id.startsWith('demo-') ? undefined : n.id,
            titulo: n.titulo,
            contenido: typeof n.contenido === 'string' ? n.contenido : JSON.stringify(n.contenido),
            is_folder: false,
            parent_id: n.folderId === 'all' ? null : (n.folderId.startsWith('folder-') ? null : n.folderId),
            favorito: n.favorito,
            color: n.color,
            estado: n.estado,
            fecha_evento: n.fecha_evento || null,
            updated_at: new Date().toISOString()
          }));

          const upsertBatch = batch.filter(b => b.id);
          if (upsertBatch.length > 0) {
            const { error } = await supabase.from('notas').upsert(upsertBatch);
            if (error) throw error;
          }
          setSaveStatus('synced');
        } catch (e) {
          console.error("Sync error:", e);
          setSaveStatus('error');
        }
      } else {
        setSaveStatus('synced');
      }
    }, 1000);
  };

  // --- Gestión de Notas ---
  const handleCreateNote = (tipo = 'normal') => {
    const contenidosIniciales = {
      normal: '',
      guion: JSON.stringify([{ id: 'b1', tipo: 'texto', contenido: '## Nueva escena\n\nDescribe aquí la escena...' }]),
      prompt: '',
      compras: JSON.stringify([{ id: '1', texto: 'Nuevo item', cantidad: 1, precio: 0, comprado: false }]),
    };
    const newNote = {
      id: 'note-' + Date.now(),
      titulo: tipo === 'normal' ? 'Nueva Nota' :
              tipo === 'guion' ? 'Nuevo Guión Técnico' :
              tipo === 'prompt' ? 'Nuevo Prompt IA' : 'Nueva Lista de Compras',
      contenido: contenidosIniciales[tipo] || '',
      folderId: activeFolderId === 'all' || activeFolderId === 'favs' ? 'all' : activeFolderId,
      favorito: activeFolderId === 'favs',
      color: tipo === 'guion' ? '#a855f7' : tipo === 'prompt' ? '#3b82f6' : tipo === 'compras' ? '#22c55e' : '#4ec9b0',
      estado: 'pendiente',
      tipo: tipo,
      imagenes: [],
      fecha_evento: null,
      updated_at: new Date().toISOString()
    };
    
    const updated = [newNote, ...notas];
    setNotas(updated);
    setActiveNoteId(newNote.id);
    triggerAutoSave(updated);
  };

  const handleUpdateNoteField = (noteId, field, value) => {
    const updated = notas.map(n => {
      if (n.id === noteId) {
        return { ...n, [field]: value, updated_at: new Date().toISOString() };
      }
      return n;
    });
    setNotas(updated);
    triggerAutoSave(updated);
  };

  const handleDeleteNote = async (noteId) => {
    const target = notas.find(n => n.id === noteId);
    if (!target) return;
    
    if (!confirm(`¿Mover "${target.titulo}" a la Papelera?`)) return;

    try {
      if (!dbError) {
        await supabase.from('papelera').insert({
          nombre_item: target.titulo,
          tipo_dato: 'nota',
          datos_originales: target,
          expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        await supabase.from('notas').delete().eq('id', noteId);
      } else {
        const localTrash = JSON.parse(localStorage.getItem('sovereign_local_trash') || '[]');
        localTrash.push({
          id: 'trash-' + Date.now(),
          nombre_item: target.titulo,
          tipo_dato: 'nota',
          datos_originales: target,
          expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          borrado_el: new Date().toISOString()
        });
        localStorage.setItem('sovereign_local_trash', JSON.stringify(localTrash));
      }

      const updated = notas.filter(n => n.id !== noteId);
      setNotas(updated);
      triggerAutoSave(updated);
      
      if (updated.length > 0) {
        setActiveNoteId(updated[0].id);
      } else {
        setActiveNoteId(null);
      }
    } catch (e) {
      alert("Error al borrar: " + e.message);
    }
  };

  // --- Gestión de Carpetas ---
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const newFolderId = 'folder-' + Date.now();
    const newFolder = {
      id: newFolderId,
      nombre: newFolderName,
      color: newFolderColor,
      isSystem: false
    };

    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('sovereign_folders', JSON.stringify(updatedFolders));

    if (!dbError) {
      try {
        await supabase.from('notas').insert({
          id: newFolderId,
          titulo: newFolderName,
          is_folder: true,
          color: newFolderColor,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.error(e);
      }
    }

    setNewFolderName('');
    setIsNewFolderModalOpen(false);
    setActiveFolderId(newFolderId);
  };

  // --- Gestión de Imágenes ---
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fileName = `notas/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      const currentImages = activeNote?.imagenes || [];
      handleUpdateNoteField(activeNote.id, 'imagenes', [...currentImages, ...uploadedUrls]);
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageDelete = (url) => {
    if (!activeNote) return;
    const updated = (activeNote.imagenes || []).filter(img => img !== url);
    handleUpdateNoteField(activeNote.id, 'imagenes', updated);
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // --- Filtrado ---
  const activeNote = notas.find(n => n.id === activeNoteId);
  
  const filteredNotas = notas.filter(note => {
    if (activeFolderId === 'favs') {
      if (!note.favorito) return false;
    } else if (activeFolderId !== 'all') {
      if (note.folderId !== activeFolderId) return false;
    }

    if (statusFilter !== 'todos' && note.estado !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.titulo.toLowerCase().includes(q);
      const matchContent = note.contenido.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }

    return true;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return '#eab308';
      case 'proceso': return t.accent;
      case 'completado': return '#4ec9b0';
      default: return t.textDim;
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'proceso': return 'En Proceso';
      case 'completado': return 'Completado';
      default: return estado;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full max-w-[1600px] mx-auto animate-in fade-in duration-300 overflow-hidden px-6">
      
      {/* HEADER — Minimal */}
      <header className="flex items-center justify-between mb-4 pb-2 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Notas</h2>
            <p style={{ fontSize: '0.65rem', color: t.textDim, marginTop: '2px', fontWeight: 500 }}>
              {activeNote?.tipo === 'guion' ? 'Guión Técnico' :
               activeNote?.tipo === 'prompt' ? 'Prompt IA' :
               activeNote?.tipo === 'compras' ? 'Lista de Compras' : 'Markdown'}
            </p>
          </div>
          {/* Folder Pills (horizontal) */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[400px] scrollbar-thin py-1">
            {folders.map(folder => {
              const count = folder.id === 'all' ? notas.length :
                folder.id === 'favs' ? notas.filter(n => n.favorito).length :
                notas.filter(n => n.folderId === folder.id).length;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all shrink-0"
                  style={{
                    backgroundColor: activeFolderId === folder.id ? t.accent : 'transparent',
                    border: `1px solid ${activeFolderId === folder.id ? t.accent : t.border}`,
                    color: activeFolderId === folder.id ? t.bg : t.textDim,
                  }}
                  onMouseEnter={e => {
                    if (activeFolderId !== folder.id) e.currentTarget.style.borderColor = t.accent;
                  }}
                  onMouseLeave={e => {
                    if (activeFolderId !== folder.id) e.currentTarget.style.borderColor = t.border;
                  }}
                >
                  {folder.id === 'favs' ? (
                    <Star size={9} style={{ color: activeFolderId === folder.id ? t.bg : '#eab308' }} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: folder.color }} />
                  )}
                  {folder.nombre}
                  {count > 0 && (
                    <span className="px-1 rounded-sm" style={{
                      backgroundColor: activeFolderId === folder.id ? 'rgba(255,255,255,0.15)' : t.accentSoft,
                      fontSize: '7px',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="p-1.5 rounded-xl transition-all shrink-0"
              style={{ color: t.textDim, border: `1px dashed ${t.border}` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textDim; }}
            >
              <FolderPlus size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-[180px]">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: t.textDim }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-1.5 pl-8 pr-2.5 text-[10px] outline-none transition-all"
              style={{
                backgroundColor: t.surface,
                border: `1px solid ${t.border}`,
                color: t.text,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = t.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = t.border; }}
            />
          </div>

          {/* Status filter pill */}
          <div className="flex rounded-xl p-0.5 gap-0.5" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
            {[
              { key: 'todos', label: 'Todas' },
              { key: 'pendiente', label: 'Pend' },
              { key: 'proceso', label: 'Proceso' },
              { key: 'completado', label: 'Listo' },
            ].map(st => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key)}
                className="px-2 py-1 rounded-md text-[8px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: statusFilter === st.key ? t.accent : 'transparent',
                  color: statusFilter === st.key ? t.bg : t.textDim,
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sync Status */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
            <span className={`w-1 h-1 rounded-xl ${
              saveStatus === 'synced' ? 'bg-emerald-500' :
              saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
            }`} />
          </div>

          {/* Type Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="px-3 py-1.5 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
              style={{ backgroundColor: t.accent, color: t.bg }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accentHover; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.accent; }}
            >
              <Plus size={12} /> Nueva
            </button>
            {showTypeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}` }}>
                  {[
                    { tipo: 'normal', icon: FileText, label: 'Normal', color: '#4ec9b0' },
                    { tipo: 'guion', icon: Table2, label: 'Guión Técnico', color: '#a855f7' },
                    { tipo: 'prompt', icon: Brain, label: 'Prompt IA', color: '#3b82f6' },
                    { tipo: 'compras', icon: ShoppingCart, label: 'Lista de Compras', color: '#22c55e' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.tipo}
                        onClick={() => { handleCreateNote(item.tipo); setShowTypeMenu(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[10px] font-medium transition-all"
                        style={{ color: t.text, borderBottom: i < 3 ? `1px solid ${t.border}` : 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Icon size={13} style={{ color: item.color }} /> {item.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* DB ALERT */}
      {dbError && (
        <div className="mb-3 p-2.5 rounded-xl flex items-center justify-between text-[9px] font-semibold tracking-wide shrink-0"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={12} />
            <span>Modo offline — Datos locales. Sincroniza con SQL en Supabase.</span>
          </div>
          <button
            onClick={copySqlToClipboard}
            className="px-2.5 py-1 rounded-xl text-[8px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
          >
            {copiedSql ? <Check size={10} /> : <Copy size={10} />}
            {copiedSql ? 'Copiado' : 'Copiar SQL'}
          </button>
        </div>
      )}

      {/* MAIN 2-PANEL LAYOUT: Sidebar Explorer + Canvas Editor */}
      <div className="flex-1 flex gap-3 overflow-hidden min-h-0">

        {/* LEFT: EXPLORER SIDEBAR — Note list compacta */}
        <div className="w-[260px] shrink-0 flex flex-col rounded-xl overflow-hidden"
          style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
          
          {/* Explorer Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0" style={{ borderColor: t.border }}>
            <span className="text-[8px] font-semibold uppercase tracking-widest" style={{ color: t.textDim }}>
              Explorador
            </span>
            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: t.accentSoft, color: t.textDim }}>
              {filteredNotas.length}
            </span>
          </div>

          {/* Note List */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-4 h-4 border-2 rounded-xl animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
              </div>
            ) : filteredNotas.length > 0 ? (
              filteredNotas.map(note => {
                const folder = folders.find(f => f.id === note.folderId);
                const estadoColor = getEstadoColor(note.estado);
                const isActive = activeNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className="w-full text-left px-3 py-2.5 transition-all cursor-pointer border-b"
                    style={{
                      backgroundColor: isActive ? t.accentSoft : 'transparent',
                      borderColor: t.border,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.backgroundColor = t.hover;
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {/* Status dot + folder indicator */}
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-xl shrink-0" style={{ backgroundColor: estadoColor }} />
                        {note.favorito && <Star size={7} style={{ color: '#eab308', fill: '#eab308' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Folder label */}
                        <div className="text-[7px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: folder?.color || t.textDim }}>
                          {folder ? folder.nombre : 'General'}
                        </div>
                        {/* Title */}
                        <div className="text-[11px] font-semibold truncate leading-tight" style={{ color: t.text }}>
                          {note.titulo}
                        </div>
                        {/* Preview line */}
                        <div className="text-[9px] mt-1 leading-relaxed line-clamp-1" style={{ color: t.textMuted }}>
                          {note.contenido.replace(/[#*`>_\-]/g, '').substring(0, 80) || 'Sin contenido'}
                        </div>
                        {/* Date */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock size={8} style={{ color: t.textDim }} />
                          <span className="text-[7px] font-medium" style={{ color: t.textDim }}>
                            {new Date(note.updated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-1 rounded-md opacity-0 hover:opacity-100 transition-all shrink-0 mt-0.5"
                        style={{ color: t.textDim }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textDim; }}
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText size={28} style={{ color: t.textDim }} className="mb-2" />
                <p className="text-[10px] font-medium" style={{ color: t.textMuted }}>Sin resultados</p>
                <p className="text-[8px] mt-1" style={{ color: t.textDim }}>Crea una nota o cambia filtros</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: CANVAS EDITOR */}
        <div className="flex-1 flex flex-col rounded-xl overflow-hidden min-h-0"
          style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
          
          {activeNote ? (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Floating Metadata Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0" style={{ borderColor: t.border }}>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Folder selector */}
                  <div className="relative">
                    <select
                      value={activeNote.folderId}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'folderId', e.target.value)}
                      className="appearance-none rounded-lg px-2 py-1 text-[8px] font-semibold uppercase tracking-wider outline-none cursor-pointer pr-5"
                      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
                    >
                      {folders.filter(f => !f.isSystem).map(f => (
                        <option key={f.id} value={f.id}>{f.nombre}</option>
                      ))}
                      <option value="all">General</option>
                    </select>
                    <ChevronDown size={8} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textDim }} />
                  </div>

                  {/* Status selector */}
                  <div className="relative">
                    <select
                      value={activeNote.estado}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'estado', e.target.value)}
                      className="appearance-none rounded-lg px-2 py-1 text-[8px] font-semibold uppercase tracking-wider outline-none cursor-pointer pr-5"
                      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                    </select>
                    <ChevronDown size={8} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textDim }} />
                  </div>

                  {/* Color dots */}
                  <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                    {['#4ec9b0', t.accent, '#ef4444', '#eab308', '#a855f7', '#f43f5e'].map(color => (
                      <button
                        key={color}
                        onClick={() => handleUpdateNoteField(activeNote.id, 'color', color)}
                        className="w-2.5 h-2.5 rounded-xl transition-all"
                        style={{
                          backgroundColor: color,
                          border: activeNote.color === color ? `1.5px solid ${t.text}` : '1.5px solid transparent',
                          transform: activeNote.color === color ? 'scale(1.2)' : 'scale(1)'
                        }}
                      />
                    ))}
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                    <Calendar size={10} style={{ color: t.textDim }} />
                    <input
                      type="date"
                      value={activeNote.fecha_evento || ''}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'fecha_evento', e.target.value || null)}
                      className="bg-transparent border-0 text-[8px] font-semibold outline-none w-[80px]"
                      style={{ color: t.text }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Favorite toggle */}
                  <button
                    onClick={() => handleUpdateNoteField(activeNote.id, 'favorito', !activeNote.favorito)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: activeNote.favorito ? 'rgba(234,179,8,0.12)' : 'transparent',
                      color: activeNote.favorito ? '#eab308' : t.textDim
                    }}
                    onMouseEnter={e => { if (!activeNote.favorito) e.currentTarget.style.backgroundColor = t.hover; }}
                    onMouseLeave={e => { if (!activeNote.favorito) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Star size={11} className={activeNote.favorito ? 'fill-[#eab308]' : ''} />
                  </button>
                  {/* Editor tabs for normal */}
                  {activeNote.tipo === 'normal' && (
                    <div className="flex rounded-lg p-0.5 gap-0.5 ml-1" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                      <button
                        onClick={() => setEditMode('write')}
                        className="px-2 py-1 rounded-md text-[7px] font-semibold uppercase tracking-wider transition-all"
                        style={{
                          backgroundColor: editMode === 'write' ? t.accent : 'transparent',
                          color: editMode === 'write' ? t.bg : t.textDim
                        }}
                      >
                        <Edit3 size={9} />
                      </button>
                      <button
                        onClick={() => setEditMode('preview')}
                        className="px-2 py-1 rounded-md text-[7px] font-semibold uppercase tracking-wider transition-all"
                        style={{
                          backgroundColor: editMode === 'preview' ? t.accent : 'transparent',
                          color: editMode === 'preview' ? t.bg : t.textDim
                        }}
                      >
                        <Eye size={9} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* CANVAS CONTENT */}
              <div className="flex-1 flex flex-col min-h-0 p-5">
                {/* Title */}
                <input
                  type="text"
                  value={activeNote.titulo}
                  onChange={e => handleUpdateNoteField(activeNote.id, 'titulo', e.target.value)}
                  placeholder="Título de la Nota"
                  className="w-full bg-transparent border-0 text-lg font-bold outline-none px-0 py-0 shrink-0 mb-4"
                  style={{ color: t.text, letterSpacing: '-0.01em' }}
                />

                {/* Editor Dinámico */}
                <div className="flex-1 min-h-0 rounded-xl overflow-hidden" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                  {activeNote.tipo === 'guion' ? (
                    <div className="h-full p-4 overflow-y-auto">
                      <NotaGuionTecnico
                        bloques={activeNote.contenido}
                        onChange={(val) => handleUpdateNoteField(activeNote.id, 'contenido', JSON.stringify(val))}
                        isDark={isDark}
                      />
                    </div>
                  ) : activeNote.tipo === 'prompt' ? (
                    <NotaPromptIA
                      contenido={activeNote.contenido}
                      onChange={(val) => handleUpdateNoteField(activeNote.id, 'contenido', val)}
                      isDark={isDark}
                    />
                  ) : activeNote.tipo === 'compras' ? (
                    <div className="h-full p-4 overflow-y-auto">
                      <NotaListaCompras
                        items={activeNote.contenido}
                        onChange={(val) => handleUpdateNoteField(activeNote.id, 'contenido', JSON.stringify(val))}
                        isDark={isDark}
                      />
                    </div>
                  ) : (
                    editMode === 'write' ? (
                      <textarea
                        value={activeNote.contenido}
                        onChange={e => handleUpdateNoteField(activeNote.id, 'contenido', e.target.value)}
                        placeholder="Escribe en Markdown..."
                        className="w-full h-full p-5 bg-transparent text-sm leading-relaxed outline-none border-0 resize-none font-mono"
                        style={{ color: t.textMuted, lineHeight: '1.7' }}
                      />
                    ) : (
                      <div className="h-full overflow-y-auto p-5 prose prose-invert max-w-none text-sm leading-relaxed markdown-preview scrollbar-thin"
                        style={{ color: t.textMuted }}>
                        {activeNote.contenido ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {activeNote.contenido}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-center py-16 text-[9px] font-semibold uppercase tracking-wider" style={{ color: t.textDim }}>
                            Sin contenido para previsualizar
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* Image Gallery + Upload */}
                <div className="flex items-center gap-3 mt-3 shrink-0">
                  {/* Image Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[7px] font-semibold tracking-wider transition-all"
                    style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.textDim }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textDim; }}
                  >
                    {uploadingImage ? (
                      <div className="w-2.5 h-2.5 border-2 rounded-xl animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
                    ) : (
                      <Upload size={10} />
                    )}
                    {uploadingImage ? 'Subiendo...' : 'Adjuntar'}
                  </button>

                  {/* Image Gallery */}
                  {activeNote.imagenes && activeNote.imagenes.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <ImageIcon size={10} style={{ color: t.textDim }} />
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
                        {activeNote.imagenes.map((url, i) => (
                          <div key={i} className="relative group shrink-0">
                            <img
                              src={url}
                              alt={`Img ${i + 1}`}
                              className="w-7 h-7 rounded-md object-cover border"
                              style={{ borderColor: t.border }}
                            />
                            <button
                              onClick={() => handleImageDelete(url)}
                              className="absolute -top-1 -right-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                              style={{ backgroundColor: t.danger, color: '#fff' }}
                            >
                              <Trash2 size={7} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Empty State — Canvas central */
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div style={{
                width: '64px', height: '64px', borderRadius: '20px',
                backgroundColor: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <Sparkles size={28} style={{ color: t.accent }} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: t.text, margin: 0 }}>Canvas de Notas</h4>
              <p style={{ fontSize: '0.7rem', color: t.textDim, marginTop: '8px', maxWidth: '280px', lineHeight: '1.5' }}>
                Selecciona una nota del explorador o crea una nueva para empezar a escribir.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* NEW FOLDER MODAL */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-xl p-6 w-full max-w-sm shadow-2xl" style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}` }}>
            <h4 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: t.text }}>
              <FolderPlus size={18} style={{ color: t.accent }} /> Nueva Carpeta
            </h4>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: t.textDim }}>Nombre</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Ej. Finanzas, Recetas..."
                  className="w-full rounded-xl py-2.5 px-3 text-xs outline-none transition-all"
                  style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
                  onFocus={e => { e.currentTarget.style.borderColor = t.accent; }}
                  onBlur={e => { e.currentTarget.style.borderColor = t.border; }}
                />
              </div>

              <div>
                <label className="text-[9px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: t.textDim }}>Color</label>
                <div className="flex gap-2">
                  {['#4ec9b0', t.accent, '#ef4444', '#eab308', '#a855f7', '#f43f5e', t.text].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className="w-5 h-5 rounded-xl transition-all"
                      style={{
                        backgroundColor: color,
                        border: newFolderColor === color ? `2px solid ${t.text}` : '2px solid transparent',
                        transform: newFolderColor === color ? 'scale(1.2)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all"
                  style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.textDim }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accentSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.surface; }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all"
                  style={{ backgroundColor: t.accent, color: t.bg }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accentHover; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.accent; }}
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Notas;
