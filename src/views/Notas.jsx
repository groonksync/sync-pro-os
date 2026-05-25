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
  Grid
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

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
          contenido: '# Bienvenido a tu Bóveda de Notas\n\nSistema de notas avanzado con Markdown.\n\n### Características:\n1. **Editor Markdown** en tiempo real\n2. **Estados**: pendiente, en proceso, completado\n3. **Carpetas** personalizables\n4. **Favoritos** y filtros\n5. **Sincronización** con Supabase\n\nEdita este texto para empezar.',
          folderId: 'folder-personal',
          favorito: true,
          color: '#4ec9b0',
          estado: 'pendiente',
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
  const handleCreateNote = () => {
    const newNote = {
      id: 'note-' + Date.now(),
      titulo: 'Nueva Nota',
      contenido: '',
      folderId: activeFolderId === 'all' || activeFolderId === 'favs' ? 'all' : activeFolderId,
      favorito: activeFolderId === 'favs',
      color: '#4ec9b0',
      estado: 'pendiente',
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
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full max-w-[1600px] mx-auto animate-in fade-in duration-300 overflow-hidden px-1">
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: t.border }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Notas</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Editor Markdown</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Status */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === 'synced' ? 'bg-emerald-500' :
              saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
            }`} />
            <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: t.textDim }}>
              {saveStatus === 'synced' ? 'Sincronizado' :
               saveStatus === 'saving' ? 'Guardando...' : 'Error'}
            </span>
          </div>

          <button
            onClick={handleCreateNote}
            className="px-5 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center gap-2"
            style={{ backgroundColor: t.accent, color: t.bg, border: `1px solid transparent` }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accentHover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.accent; }}
          >
            <Plus size={14} /> Nueva Nota
          </button>
        </div>
      </header>

      {/* DB ALERT */}
      {dbError && (
        <div className="mb-3 p-3 rounded-xl flex items-center justify-between text-[10px] font-semibold tracking-wide"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>Modo offline — Datos guardados localmente. Para sincronizar, ejecuta el SQL en Supabase.</span>
          </div>
          <button 
            onClick={copySqlToClipboard}
            className="px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
          >
            {copiedSql ? <Check size={12} /> : <Copy size={12} />}
            {copiedSql ? 'Copiado' : 'Copiar SQL'}
          </button>
        </div>
      )}

      {/* MAIN 3-COLUMN GRID */}
      <div className="flex-1 grid grid-cols-[220px_1fr_1fr] gap-4 overflow-hidden min-h-0">

        {/* COLUMN 1: FOLDERS + FILTERS */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0 rounded-xl p-3 scrollbar-thin"
          style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>

          {/* Folders Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h4 className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: t.textDim }}>Carpetas</h4>
              <button
                onClick={() => setIsNewFolderModalOpen(true)}
                className="p-1 rounded-md transition-all"
                style={{ color: t.textDim }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accentSoft; e.currentTarget.style.color = t.accent; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textDim; }}
              >
                <FolderPlus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {folders.map(folder => {
                const count = folder.id === 'all' ? notas.length : 
                  folder.id === 'favs' ? notas.filter(n => n.favorito).length : 
                  notas.filter(n => n.folderId === folder.id).length;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolderId(folder.id)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all text-[11px]"
                    style={{
                      backgroundColor: activeFolderId === folder.id ? t.accentSoft : 'transparent',
                      border: `1px solid ${activeFolderId === folder.id ? t.borderLight : 'transparent'}`,
                      color: activeFolderId === folder.id ? t.text : t.textDim
                    }}
                    onMouseEnter={e => { if (activeFolderId !== folder.id) e.currentTarget.style.backgroundColor = t.hover; }}
                    onMouseLeave={e => { if (activeFolderId !== folder.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                      <span className="truncate font-medium">{folder.nombre}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: t.accentSoft, color: t.textDim }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="pt-2 border-t" style={{ borderColor: t.border }}>
            <h4 className="text-[9px] font-semibold uppercase tracking-widest mb-2.5 px-1" style={{ color: t.textDim }}>Estado</h4>
            <div className="space-y-0.5">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'pendiente', label: 'Pendiente' },
                { key: 'proceso', label: 'En Proceso' },
                { key: 'completado', label: 'Completado' },
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-[10px] font-medium"
                  style={{
                    backgroundColor: statusFilter === st.key ? t.accentSoft : 'transparent',
                    border: `1px solid ${statusFilter === st.key ? t.borderLight : 'transparent'}`,
                    color: statusFilter === st.key ? t.text : t.textDim
                  }}
                  onMouseEnter={e => { if (statusFilter !== st.key) e.currentTarget.style.backgroundColor = t.hover; }}
                  onMouseLeave={e => { if (statusFilter !== st.key) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span className="w-2 h-2 rounded-sm" style={{
                    backgroundColor: st.key === 'todos' ? t.accent :
                      st.key === 'pendiente' ? '#eab308' :
                      st.key === 'proceso' ? t.accent : '#4ec9b0',
                    opacity: 0.6
                  }} />
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: NOTE LIST */}
        <div className="flex flex-col gap-3 overflow-hidden min-h-0 rounded-xl p-3"
          style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>

          {/* Search */}
          <div className="relative shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textDim }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar notas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg py-2 pl-9 pr-3 text-xs outline-none transition-all"
              style={{
                backgroundColor: t.surface,
                border: `1px solid ${t.border}`,
                color: t.text,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = t.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = t.border; }}
            />
          </div>

          {/* Note List */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 scrollbar-thin pr-0.5">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
              </div>
            ) : filteredNotas.length > 0 ? (
              filteredNotas.map(note => {
                const folder = folders.find(f => f.id === note.folderId);
                const estadoColor = getEstadoColor(note.estado);
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className="p-3 rounded-xl transition-all cursor-pointer border"
                    style={{
                      backgroundColor: activeNoteId === note.id ? t.accentSoft : 'transparent',
                      borderColor: activeNoteId === note.id ? t.borderLight : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (activeNoteId !== note.id) {
                        e.currentTarget.style.backgroundColor = t.hover;
                        e.currentTarget.style.borderColor = t.border;
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeNoteId !== note.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    {/* Status line */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: estadoColor }} />
                      <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: t.textDim }}>
                        {folder ? folder.nombre : 'General'}
                      </span>
                      {note.favorito && <Star size={9} style={{ color: '#eab308', fill: '#eab308' }} />}
                    </div>

                    {/* Title + action */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[12px] font-semibold truncate" style={{ color: t.text }}>
                        {note.titulo}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        style={{ color: t.textDim }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textDim; }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Preview */}
                    <p className="text-[10px] leading-relaxed mt-1.5 line-clamp-2" style={{ color: t.textDim }}>
                      {note.contenido.replace(/[#*`>_\-]/g, '').substring(0, 120) || 'Sin contenido'}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t" style={{ borderColor: t.border }}>
                      <div className="flex items-center gap-1.5 text-[9px]" style={{ color: t.textDim }}>
                        <Clock size={10} />
                        {new Date(note.updated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      </div>
                      <span className="text-[8px] font-semibold uppercase px-2 py-0.5 rounded-md" style={{
                        backgroundColor: `${estadoColor}15`,
                        color: estadoColor,
                        border: `1px solid ${estadoColor}30`
                      }}>
                        {getEstadoLabel(note.estado)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText size={32} style={{ color: t.textDim }} className="mb-3" />
                <p className="text-xs font-medium" style={{ color: t.textMuted }}>No se encontraron notas</p>
                <p className="text-[10px] mt-1" style={{ color: t.textDim }}>Crea una nota o cambia los filtros</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: EDITOR */}
        <div className="flex flex-col overflow-hidden min-h-0 rounded-xl p-3"
          style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
          
          {activeNote ? (
            <div className="flex-1 flex flex-col min-h-0 gap-3">
              
              {/* Note Metadata Bar */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b shrink-0" style={{ borderColor: t.border }}>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Folder selector */}
                  <div className="relative">
                    <select
                      value={activeNote.folderId}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'folderId', e.target.value)}
                      className="appearance-none rounded-lg px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider outline-none cursor-pointer pr-6"
                      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
                    >
                      {folders.filter(f => !f.isSystem).map(f => (
                        <option key={f.id} value={f.id}>{f.nombre}</option>
                      ))}
                      <option value="all">General</option>
                    </select>
                    <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textDim }} />
                  </div>

                  {/* Status selector */}
                  <div className="relative">
                    <select
                      value={activeNote.estado}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'estado', e.target.value)}
                      className="appearance-none rounded-lg px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider outline-none cursor-pointer pr-6"
                      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                    </select>
                    <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textDim }} />
                  </div>

                  {/* Color picker */}
                  <div className="flex items-center gap-1 rounded-lg px-2 py-1.5" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                    {['#4ec9b0', t.accent, '#ef4444', '#eab308', '#a855f7', '#f43f5e'].map(color => (
                      <button
                        key={color}
                        onClick={() => handleUpdateNoteField(activeNote.id, 'color', color)}
                        className="w-3 h-3 rounded-full transition-all"
                        style={{
                          backgroundColor: color,
                          border: activeNote.color === color ? `2px solid ${t.text}` : '2px solid transparent',
                          transform: activeNote.color === color ? 'scale(1.15)' : 'scale(1)'
                        }}
                      />
                    ))}
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                    <Calendar size={12} style={{ color: t.textDim }} />
                    <input
                      type="date"
                      value={activeNote.fecha_evento || ''}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'fecha_evento', e.target.value || null)}
                      className="bg-transparent border-0 text-[9px] font-semibold outline-none w-[90px]"
                      style={{ color: t.text }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Favorite toggle */}
                  <button
                    onClick={() => handleUpdateNoteField(activeNote.id, 'favorito', !activeNote.favorito)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: activeNote.favorito ? 'rgba(234,179,8,0.12)' : 'transparent',
                      border: `1px solid ${activeNote.favorito ? 'rgba(234,179,8,0.25)' : 'transparent'}`,
                      color: activeNote.favorito ? '#eab308' : t.textDim
                    }}
                    onMouseEnter={e => { if (!activeNote.favorito) e.currentTarget.style.backgroundColor = t.hover; }}
                    onMouseLeave={e => { if (!activeNote.favorito) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Star size={13} className={activeNote.favorito ? 'fill-[#eab308]' : ''} />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                value={activeNote.titulo}
                onChange={e => handleUpdateNoteField(activeNote.id, 'titulo', e.target.value)}
                placeholder="Título de la Nota"
                className="w-full bg-transparent border-0 text-base font-semibold outline-none px-0 py-0 shrink-0"
                style={{ color: t.text }}
              />

              {/* Editor Tabs */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                  <button
                    onClick={() => setEditMode('write')}
                    className="px-3 py-1.5 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: editMode === 'write' ? t.accent : 'transparent',
                      color: editMode === 'write' ? t.bg : t.textDim
                    }}
                  >
                    <span className="flex items-center gap-1"><Edit3 size={10} /> Editar</span>
                  </button>
                  <button
                    onClick={() => setEditMode('preview')}
                    className="px-3 py-1.5 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: editMode === 'preview' ? t.accent : 'transparent',
                      color: editMode === 'preview' ? t.bg : t.textDim
                    }}
                  >
                    <span className="flex items-center gap-1"><Eye size={10} /> Vista</span>
                  </button>
                </div>
                <span className="text-[8px] font-medium" style={{ color: t.textDim }}>Markdown</span>
              </div>

              {/* Editor / Preview */}
              <div className="flex-1 min-h-0 rounded-xl overflow-hidden" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                {editMode === 'write' ? (
                  <textarea
                    value={activeNote.contenido}
                    onChange={e => handleUpdateNoteField(activeNote.id, 'contenido', e.target.value)}
                    placeholder="Escribe en Markdown..."
                    className="w-full h-full p-4 bg-transparent text-xs leading-relaxed outline-none border-0 resize-none font-mono"
                    style={{ color: t.textMuted }}
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-4 prose prose-invert max-w-none text-xs leading-relaxed markdown-preview scrollbar-thin"
                    style={{ color: t.textMuted }}>
                    {activeNote.contenido ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeNote.contenido}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-center py-16 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textDim }}>
                        Sin contenido para previsualizar
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Sparkles size={36} style={{ color: t.textDim }} className="mb-4" />
              <h4 className="text-sm font-semibold" style={{ color: t.textMuted }}>Selecciona una nota</h4>
              <p className="text-[10px] mt-1.5 max-w-xs leading-relaxed" style={{ color: t.textDim }}>
                Elige una nota de la lista o crea una nueva para empezar a escribir.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* NEW FOLDER MODAL */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}` }}>
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
                  className="w-full rounded-lg py-2.5 px-3 text-xs outline-none transition-all"
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
                      className="w-5 h-5 rounded-full transition-all"
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
                  className="flex-1 py-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
                  style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.textDim }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accentSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.surface; }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 py-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
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
