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
  ChevronRight,
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
  Upload,
  Sidebar
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
  
  // --- Apple Notes: sidebar expanded sections ---
  const [expandedSections, setExpandedSections] = useState({
    icloud: true,
    carpetas: true
  });
  
  // --- Collapse sidebar + note list (Apple Notes: Cmd+Option+E style) ---
  const [sidebarVisible, setSidebarVisible] = useState(true);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return d.toLocaleDateString('es-ES', { weekday: 'short' });
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Apple Notes folder sections
  const systemFolders = folders.filter(f => f.isSystem);
  const customFolders = folders.filter(f => !f.isSystem);

  // Count per folder
  const folderCount = (folderId) => {
    if (folderId === 'all') return notas.length;
    if (folderId === 'favs') return notas.filter(n => n.favorito).length;
    return notas.filter(n => n.folderId === folderId).length;
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 overflow-hidden"
      style={{ backgroundColor: t.bg }}>

      {/* === 3-PANEL APPLE NOTES LAYOUT === */}
      <div className="flex-1 flex min-h-0">

        {/* ===== LEFT SIDEBAR — Folders (Apple Notes style) ===== */}
        {sidebarVisible && (
        <div className="w-[200px] shrink-0 flex flex-col border-r min-h-0 overflow-hidden transition-all duration-200"
          style={{ borderColor: t.border, backgroundColor: t.bg }}>
          
          {/* Header with title */}
          <div className="flex items-center justify-between px-3.5 py-3 shrink-0">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0, letterSpacing: '-0.01em' }}>Notas</h3>
            <div className="flex items-center gap-1">
              {/* Sync status dot */}
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: saveStatus === 'synced' ? '#34d399' :
                  saveStatus === 'saving' ? '#fbbf24' : '#ef4444',
                opacity: saveStatus === 'saving' ? 0.7 : 1
              }} />
              {/* New note button */}
              <div className="relative">
                <button
                  onClick={() => setShowTypeMenu(!showTypeMenu)}
                  className="p-1 rounded-md transition-all"
                  style={{ color: t.accent }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accentSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Plus size={16} />
                </button>
                {showTypeMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-lg overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
                      style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}` }}>
                      {[
                        { tipo: 'normal', icon: FileText, label: 'Nota', color: '#4ec9b0' },
                        { tipo: 'guion', icon: Table2, label: 'Guión Técnico', color: '#a855f7' },
                        { tipo: 'prompt', icon: Brain, label: 'Prompt IA', color: '#3b82f6' },
                        { tipo: 'compras', icon: ShoppingCart, label: 'Lista de Compras', color: '#22c55e' },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.tipo}
                            onClick={() => { handleCreateNote(item.tipo); setShowTypeMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-all text-left"
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
          </div>

          {/* Folder list */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin px-1.5 pb-2">
            
            {/* iCloud Section */}
            <div className="mb-0.5">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, icloud: !prev.icloud }))}
                className="w-full flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all"
                style={{ color: t.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.color = t.text; }}
                onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; }}
              >
                <ChevronRight size={10} style={{
                  transform: expandedSections.icloud ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease'
                }} />
                iCloud
              </button>
              {expandedSections.icloud && systemFolders.map(folder => {
                const isActive = activeFolderId === folder.id;
                const count = folderCount(folder.id);
                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolderId(folder.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all text-left"
                    style={{
                      backgroundColor: isActive ? t.accentSoft : 'transparent',
                      color: isActive ? t.accent : t.text,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.backgroundColor = t.hover;
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {folder.id === 'favs' ? (
                      <Star size={13} style={{ color: isActive ? t.accent : '#eab308', fill: '#eab308' }} />
                    ) : (
                      <Folder size={13} style={{ color: folder.color }} />
                    )}
                    <span style={{ fontSize: '11.5px', fontWeight: isActive ? 600 : 400, flex: 1 }}>{folder.nombre}</span>
                    {count > 0 && (
                      <span style={{ fontSize: '10px', color: t.textDim }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Carpetas Section */}
            <div className="mb-0.5 mt-3">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, carpetas: !prev.carpetas }))}
                className="w-full flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all"
                style={{ color: t.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.color = t.text; }}
                onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; }}
              >
                <ChevronRight size={10} style={{
                  transform: expandedSections.carpetas ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease'
                }} />
                Carpetas
              </button>
              {expandedSections.carpetas && (
                <>
                  {customFolders.length > 0 ? customFolders.map(folder => {
                    const isActive = activeFolderId === folder.id;
                    const count = folderCount(folder.id);
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setActiveFolderId(folder.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all text-left"
                        style={{
                          backgroundColor: isActive ? t.accentSoft : 'transparent',
                          color: isActive ? t.accent : t.text,
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.backgroundColor = t.hover;
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Folder size={13} style={{ color: folder.color }} />
                        <span style={{ fontSize: '11.5px', fontWeight: isActive ? 600 : 400, flex: 1 }}>{folder.nombre}</span>
                        {count > 0 && (
                          <span style={{ fontSize: '10px', color: t.textDim }}>{count}</span>
                        )}
                      </button>
                    );
                  }) : (
                    <div className="px-2.5 py-2 text-[10px]" style={{ color: t.textMuted }}>
                      Sin carpetas
                    </div>
                  )}
                  <button
                    onClick={() => setIsNewFolderModalOpen(true)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all"
                    style={{ color: t.textDim }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; e.currentTarget.style.color = t.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textDim; }}
                  >
                    <FolderPlus size={13} />
                    <span style={{ fontSize: '11px' }}>Nueva Carpeta</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DB Alert minimal */}
          {dbError && (
            <div className="shrink-0 px-2.5 py-2 border-t" style={{ borderColor: t.border }}>
              <button
                onClick={copySqlToClipboard}
                className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-medium"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
              >
                <AlertCircle size={10} />
                <span className="flex-1">Offline</span>
                {copiedSql ? <Check size={8} /> : <Copy size={8} />}
              </button>
            </div>
          )}
        </div>
        )}

        {/* ===== MIDDLE PANEL — Note List (Apple Notes style) ===== */}
        {sidebarVisible && (
        <div className="w-[280px] shrink-0 flex flex-col border-r min-h-0 overflow-hidden transition-all duration-200"
          style={{ borderColor: t.border, backgroundColor: t.bg }}>

          {/* Search Bar — like Apple Notes inline */}
          <div className="px-3 pt-2.5 pb-2 shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-md py-1.5 pl-7 pr-2.5 text-[11px] outline-none transition-all"
                style={{
                  backgroundColor: t.surface,
                  border: `1px solid ${t.border}`,
                  color: t.text,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = t.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = t.border; }}
              />
            </div>
          </div>

          {/* Note list header — count */}
          <div className="flex items-center justify-between px-3 py-1 shrink-0 border-b" style={{ borderColor: t.border }}>
            <span style={{ fontSize: '10px', color: t.textDim, fontWeight: 500 }}>
              {filteredNotas.length} {filteredNotas.length === 1 ? 'nota' : 'notas'}
            </span>
            {/* Status filter — subtle inline */}
            <div className="flex items-center gap-1">
              {['todos', 'pendiente', 'proceso', 'completado'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: statusFilter === st ?
                      (st === 'todos' ? t.accent : getEstadoColor(st)) :
                      t.border,
                    opacity: statusFilter === st ? 1 : 0.4,
                    transition: 'all 0.15s'
                  }}
                  title={st === 'todos' ? 'Todas' : st === 'pendiente' ? 'Pendiente' : st === 'proceso' ? 'En Proceso' : 'Completado'}
                />
              ))}
            </div>
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
              </div>
            ) : filteredNotas.length > 0 ? (
              filteredNotas.map((note, idx) => {
                const isActive = activeNoteId === note.id;
                const folder = folders.find(f => f.id === note.folderId);
                const hasImages = note.imagenes && note.imagenes.length > 0;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className="w-full text-left cursor-pointer border-b transition-all"
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
                    <div className="px-3 py-2.5">
                      {/* Title + Date row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {/* Tipo color dot */}
                          <span style={{
                            width: '5px', height: '5px', borderRadius: '50%',
                            backgroundColor: note.color || t.textDim,
                            marginTop: '4px',
                            flexShrink: 0
                          }} />
                          <span style={{
                            fontSize: '12px',
                            fontWeight: isActive ? 600 : 500,
                            color: t.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.3'
                          }}>
                            {note.titulo}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '9px',
                          color: t.textMuted,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {formatDate(note.updated_at)}
                        </span>
                      </div>
                      {/* Preview + indicators row */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{
                          fontSize: '10px',
                          color: t.textMuted,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          lineHeight: '1.4'
                        }}>
                          {note.contenido.replace(/[#*`>_\-]/g, '').substring(0, 60) || 'Sin contenido'}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Estado indicator */}
                          <span style={{
                            width: '4px', height: '4px', borderRadius: '50%',
                            backgroundColor: getEstadoColor(note.estado),
                          }} />
                          {hasImages && (
                            <ImageIcon size={8} style={{ color: t.textMuted }} />
                          )}
                          {note.favorito && (
                            <Star size={7} style={{ color: '#eab308', fill: '#eab308' }} />
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Subtle delete on hover */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all">
                      {/* delete hidden for cleanliness; shown on hover via CSS group */}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <FileText size={24} style={{ color: t.textDim }} />
                <p className="mt-3 text-[11px] font-medium" style={{ color: t.textMuted }}>
                  {searchQuery ? 'Sin resultados' : 'No hay notas'}
                </p>
                <p className="text-[9px] mt-1" style={{ color: t.textDim }}>
                  {searchQuery ? 'Prueba otra búsqueda' : 'Crea una nota para empezar'}
                </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* ===== RIGHT PANEL — Editor (Apple Notes canvas) ===== */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-200"
          style={{ backgroundColor: t.bg }}>

          {activeNote ? (
            <div className="flex-1 flex flex-col min-h-0">

              {/* Apple Notes — Minimal toolbar */}
              <div className="flex items-center justify-between px-3 py-2 shrink-0 border-b"
                style={{ borderColor: t.border, backgroundColor: t.bg }}>
                {/* Collapse button — toggle both left panels */}
                <button
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  className="p-1.5 rounded-md transition-all shrink-0"
                  style={{ color: sidebarVisible ? t.accent : t.textDim }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  title={sidebarVisible ? 'Ocultar paneles' : 'Mostrar paneles'}
                >
                  <Sidebar size={14} />
                </button>
                <div className="flex items-center gap-1.5">
                  {/* Folder selector */}
                  <div className="relative">
                    <select
                      value={activeNote.folderId}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'folderId', e.target.value)}
                      className="appearance-none rounded px-2 py-1 text-[10px] font-medium outline-none cursor-pointer pr-5"
                      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
                    >
                      {folders.filter(f => !f.isSystem).map(f => (
                        <option key={f.id} value={f.id}>{f.nombre}</option>
                      ))}
                      <option value="all">General</option>
                    </select>
                    <ChevronDown size={8} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textDim }} />
                  </div>
                  {/* Status */}
                  <div className="relative">
                    <select
                      value={activeNote.estado}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'estado', e.target.value)}
                      className="appearance-none rounded px-2 py-1 text-[10px] font-medium outline-none cursor-pointer pr-5"
                      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                    </select>
                    <ChevronDown size={8} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textDim }} />
                  </div>
                  {/* Color dots */}
                  <div className="flex items-center gap-1 px-1.5 py-1 rounded" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                    {['#4ec9b0', t.accent, '#ef4444', '#eab308', '#a855f7', '#f43f5e'].map(color => (
                      <button
                        key={color}
                        onClick={() => handleUpdateNoteField(activeNote.id, 'color', color)}
                        style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          backgroundColor: color,
                          border: activeNote.color === color ? `1.5px solid ${t.text}` : '1.5px solid transparent',
                          transform: activeNote.color === color ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.15s'
                        }}
                      />
                    ))}
                  </div>
                  {/* Date */}
                  <div className="flex items-center gap-1 px-1.5 py-1 rounded" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                    <Calendar size={9} style={{ color: t.textDim }} />
                    <input
                      type="date"
                      value={activeNote.fecha_evento || ''}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'fecha_evento', e.target.value || null)}
                      className="bg-transparent border-0 text-[9px] font-medium outline-none"
                      style={{ color: t.text, width: '75px' }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Favorite */}
                  <button
                    onClick={() => handleUpdateNoteField(activeNote.id, 'favorito', !activeNote.favorito)}
                    className="p-1.5 rounded-md transition-all"
                    style={{ color: activeNote.favorito ? '#eab308' : t.textDim }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Star size={12} className={activeNote.favorito ? 'fill-[#eab308]' : ''} />
                  </button>
                  {/* Editor mode toggle for normal */}
                  {activeNote.tipo === 'normal' && (
                    <div className="flex rounded-md p-0.5 gap-0.5" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                      <button
                        onClick={() => setEditMode('write')}
                        className="px-1.5 py-1 rounded text-[8px] font-semibold transition-all"
                        style={{
                          backgroundColor: editMode === 'write' ? t.accent : 'transparent',
                          color: editMode === 'write' ? t.bg : t.textDim
                        }}
                      >
                        <Edit3 size={9} />
                      </button>
                      <button
                        onClick={() => setEditMode('preview')}
                        className="px-1.5 py-1 rounded text-[8px] font-semibold transition-all"
                        style={{
                          backgroundColor: editMode === 'preview' ? t.accent : 'transparent',
                          color: editMode === 'preview' ? t.bg : t.textDim
                        }}
                      >
                        <Eye size={9} />
                      </button>
                    </div>
                  )}
                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-1.5 rounded-md transition-all"
                    style={{ color: t.textDim }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textDim; }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Editor Canvas */}
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto"
                style={{ backgroundColor: t.bg }}>
                
                <div className="max-w-[720px] w-full mx-auto px-8 py-6 flex-1 flex flex-col">
                  {/* Title */}
                  <input
                    type="text"
                    value={activeNote.titulo}
                    onChange={e => handleUpdateNoteField(activeNote.id, 'titulo', e.target.value)}
                    placeholder="Título"
                    className="w-full bg-transparent border-0 text-2xl font-bold outline-none px-0 py-0 shrink-0 mb-6"
                    style={{
                      color: t.text,
                      letterSpacing: '-0.02em',
                      fontWeight: 700,
                    }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-h-0">
                    {activeNote.tipo === 'guion' ? (
                      <div className="h-full rounded-lg overflow-hidden" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                        <div className="h-full p-5 overflow-y-auto">
                          <NotaGuionTecnico
                            bloques={activeNote.contenido}
                            onChange={(val) => handleUpdateNoteField(activeNote.id, 'contenido', JSON.stringify(val))}
                            isDark={isDark}
                          />
                        </div>
                      </div>
                    ) : activeNote.tipo === 'prompt' ? (
                      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                        <NotaPromptIA
                          contenido={activeNote.contenido}
                          onChange={(val) => handleUpdateNoteField(activeNote.id, 'contenido', val)}
                          isDark={isDark}
                        />
                      </div>
                    ) : activeNote.tipo === 'compras' ? (
                      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                        <div className="h-full p-5 overflow-y-auto">
                          <NotaListaCompras
                            items={activeNote.contenido}
                            onChange={(val) => handleUpdateNoteField(activeNote.id, 'contenido', JSON.stringify(val))}
                            isDark={isDark}
                          />
                        </div>
                      </div>
                    ) : (
                      editMode === 'write' ? (
                        <textarea
                          value={activeNote.contenido}
                          onChange={e => handleUpdateNoteField(activeNote.id, 'contenido', e.target.value)}
                          placeholder="Escribe aquí..."
                          className="w-full bg-transparent text-sm leading-relaxed outline-none border-0 resize-none"
                          style={{
                            color: t.text,
                            lineHeight: '1.8',
                            minHeight: '200px',
                            fontWeight: 400,
                          }}
                        />
                      ) : (
                        <div className="prose prose-sm max-w-none markdown-preview"
                          style={{
                            color: t.text,
                            lineHeight: '1.8',
                            fontSize: '13px',
                          }}>
                          {activeNote.contenido ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {activeNote.contenido}
                            </ReactMarkdown>
                          ) : (
                            <p style={{ color: t.textDim, fontSize: '11px' }}>Sin contenido para previsualizar</p>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* Images gallery — inline like Apple Notes */}
                  {(activeNote.imagenes && activeNote.imagenes.length > 0) || (
                    <div className="mt-4" />
                  )}
                  {activeNote.imagenes && activeNote.imagenes.length > 0 && (
                    <div className="mt-6 shrink-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        <ImageIcon size={11} style={{ color: t.textDim }} />
                        <span style={{ fontSize: '10px', color: t.textMuted, fontWeight: 500 }}>
                          {activeNote.imagenes.length} {activeNote.imagenes.length === 1 ? 'imagen' : 'imágenes'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeNote.imagenes.map((url, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={url}
                              alt={`Img ${i + 1}`}
                              className="rounded-lg object-cover border"
                              style={{
                                width: '120px', height: '90px',
                                borderColor: t.border,
                              }}
                            />
                            <button
                              onClick={() => handleImageDelete(url)}
                              className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}
                            >
                              <Trash2 size={8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload button */}
                  <div className="mt-4 shrink-0 pb-6">
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
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all"
                      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.textDim }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textDim; }}
                    >
                      {uploadingImage ? (
                        <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
                      ) : (
                        <Upload size={11} />
                      )}
                      {uploadingImage ? 'Subiendo...' : 'Adjuntar imagen'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State — Apple Notes style */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <FileText size={32} style={{ color: t.textDim }} />
              <h4 style={{
                fontSize: '15px', fontWeight: 600, color: t.text, marginTop: '12px', letterSpacing: '-0.01em'
              }}>Sin Nota Seleccionada</h4>
              <p style={{ fontSize: '11px', color: t.textMuted, marginTop: '6px', lineHeight: '1.5', maxWidth: '280px' }}>
                Selecciona una nota de la lista o crea una nueva para empezar a escribir.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* NEW FOLDER MODAL */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-lg p-6 w-full max-w-sm shadow-2xl" style={{ backgroundColor: t.surface, border: `1px solid ${t.borderLight}` }}>
            <h4 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: t.text }}>
              <FolderPlus size={16} style={{ color: t.accent }} /> Nueva Carpeta
            </h4>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: t.textDim }}>Nombre</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Ej. Finanzas, Recetas..."
                  className="w-full rounded-lg py-2 px-3 text-xs outline-none transition-all"
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
                  className="flex-1 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
                  style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.textDim }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.surface; }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
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
