import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, 
  Plus, 
  Search, 
  Star, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckSquare, 
  Clock, 
  Sparkles,
  Save, 
  Share2, 
  ChevronRight, 
  BookOpen, 
  Calendar,
  AlertCircle,
  Check,
  Copy,
  ChevronDown,
  Paperclip,
  Maximize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabaseClient';

const Notas = ({ settings, isDark }) => {
  // --- Estados de Datos ---
  const [notas, setNotas] = useState([]);
  const [folders, setFolders] = useState([
    { id: 'all', nombre: 'Todas las Notas', isSystem: true, color: '#ffffff' },
    { id: 'favs', nombre: 'Favoritos', isSystem: true, color: '#f59e0b' },
    { id: 'folder-personal', nombre: 'Personal', color: '#10b981' },
    { id: 'folder-trabajo', nombre: 'Trabajo', color: '#3b82f6' },
    { id: 'folder-ideas', nombre: 'Ideas & Presets', color: '#a855f7' }
  ]);
  
  // --- Estados de Navegación y Filtros ---
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos', 'pendiente', 'proceso', 'completado'
  const [editMode, setEditMode] = useState('write'); // 'write', 'preview'
  
  // --- Modales y Formularios ---
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#10b981');
  
  // --- Estados de Estado de Red / DB ---
  const [dbError, setDbError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('synced'); // 'synced', 'saving', 'error'
  const [copiedSql, setCopiedSql] = useState(false);
  
  // --- Ref de Debounce para guardado ---
  const autoSaveTimer = useRef(null);

  // SQL Script para copiar en caso de error
  const sqlSchemaCode = `-- SOVEREIGN STUDIO - NOTAS MIGRACIÓN
CREATE TABLE IF NOT EXISTS notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT DEFAULT 'Sin Título',
    icono TEXT DEFAULT 'file',
    contenido JSONB DEFAULT '[]'::jsonb,
    is_folder BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES notas(id) ON DELETE CASCADE,
    favorito BOOLEAN DEFAULT false,
    fecha_evento DATE,
    color TEXT DEFAULT '#10b981',
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo" ON notas FOR ALL USING (true) WITH CHECK (true);`;

  // --- Carga Inicial ---
  useEffect(() => {
    fetchNotasAndFolders();
  }, []);

  const fetchNotasAndFolders = async () => {
    setLoading(true);
    setDbError(false);
    try {
      // Intentar cargar de Supabase
      const { data: dbNotas, error: notasError } = await supabase
        .from('notas')
        .select('*')
        .order('updated_at', { ascending: false });

      if (notasError) throw notasError;

      if (dbNotas) {
        // Dividir notas y carpetas reales guardadas en DB
        const dbFolders = dbNotas.filter(n => n.is_folder);
        const dbPlainNotas = dbNotas.filter(n => !n.is_folder);

        // Actualizar carpetas (combinando del sistema y de DB)
        const sysFolders = [
          { id: 'all', nombre: 'Todas las Notas', isSystem: true, color: '#ffffff' },
          { id: 'favs', nombre: 'Favoritos', isSystem: true, color: '#f59e0b' }
        ];
        
        const customFoldersFromDb = dbFolders.map(f => ({
          id: f.id,
          nombre: f.titulo,
          color: f.color || '#10b981',
          isSystem: false
        }));

        setFolders([...sysFolders, ...customFoldersFromDb]);

        // Formatear notas para UI
        const formattedPlainNotas = dbPlainNotas.map(n => ({
          id: n.id,
          titulo: n.titulo || 'Sin Título',
          contenido: Array.isArray(n.contenido) ? (n.contenido[0]?.text || '') : (typeof n.contenido === 'string' ? n.contenido : ''),
          folderId: n.parent_id || 'all',
          favorito: n.favorito || false,
          color: n.color || '#10b981',
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
      console.warn("Supabase no configurado para notas, recurriendo a localStorage fallback. Detalles:", error.message);
      setDbError(true);
      
      // Fallback a localStorage
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
        // Crear nota demo inicial si está vacío
        const demoNote = {
          id: 'demo-1',
          titulo: 'Bienvenido a Notas Pro 🚀',
          contenido: '# Bienvenido a tu Bóveda de Notas\n\nEste es un clon súper avanzado de **Apple Notes** desarrollado en un estilo **HUD Glassmorphism** prémium.\n\n### Características:\n1. **Editor Markdown**: Escribe en texto enriquecido usando código estándar.\n2. **Estados del Negocio**: Filtra tareas como `pendiente`, `en proceso` o `completado` con bordes visuales neon.\n3. **Cifrado local & Sincronización**: Fallback inmediato si no hay internet.\n\nPrueba a modificar este texto en la columna de la derecha.',
          folderId: 'folder-personal',
          favorito: true,
          color: '#10b981',
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

  // --- Auto Guardado con Debounce ---
  const triggerAutoSave = (updatedNotasList) => {
    setSaveStatus('saving');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    
    autoSaveTimer.current = setTimeout(async () => {
      // 1. Guardar localmente
      localStorage.setItem('sovereign_notas', JSON.stringify(updatedNotasList));
      localStorage.setItem('sovereign_folders', JSON.stringify(folders));

      // 2. Si no hay error de DB, guardar en Supabase
      if (!dbError) {
        try {
          // Guardar todas las notas modificadas una por una o en batch
          // Para mayor seguridad en esta versión personal, sincronizamos la base completa o realizamos upsert de las notas activas
          const batch = updatedNotasList.map(n => ({
            id: n.id.startsWith('demo-') ? undefined : n.id, // dejar que Supabase cree el UUID si es temporal
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

          // Filtrar items sin ID definidos
          const upsertBatch = batch.filter(b => b.id);
          if (upsertBatch.length > 0) {
            const { error } = await supabase.from('notas').upsert(upsertBatch);
            if (error) throw error;
          }
          setSaveStatus('synced');
        } catch (e) {
          console.error("Fallo de sync automática con Supabase:", e);
          setSaveStatus('error');
        }
      } else {
        // En modo local siempre queda sincronizado en caché local
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
      color: '#10b981',
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
      // Enviar a papelera de Supabase si está disponible
      if (!dbError) {
        await supabase.from('papelera').insert({
          nombre_item: target.titulo,
          tipo_dato: 'nota',
          datos_originales: target,
          expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        await supabase.from('notas').delete().eq('id', noteId);
      } else {
        // Fallback local: Papelera en localStorage
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

  // --- Utilidades ---
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // --- Filtrado Inteligente de Notas ---
  const activeNote = notas.find(n => n.id === activeNoteId);
  
  const filteredNotas = notas.filter(note => {
    // 1. Filtro por Carpeta Activa
    if (activeFolderId === 'favs') {
      if (!note.favorito) return false;
    } else if (activeFolderId !== 'all') {
      if (note.folderId !== activeFolderId) return false;
    }

    // 2. Filtro por Estado
    if (statusFilter !== 'todos' && note.estado !== statusFilter) return false;

    // 3. Filtro por Búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.titulo.toLowerCase().includes(q);
      const matchContent = note.contenido.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-[1800px] mx-auto animate-in fade-in duration-500 overflow-hidden">
      
      {/* ALERTA DE CONFIGURACIÓN DE BASE DE DATOS */}
      {dbError && (
        <div className="mb-6 p-4 bg-[#f43f5e]/5 border border-[#f43f5e]/10 rounded-3xl flex items-center justify-between text-xs text-[#f43f5e] font-black uppercase tracking-wider backdrop-blur-md animate-bounce">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span>Base de datos local activa (Modo Offline/localStorage). Para sincronizar la nube en Supabase, ejecuta el esquema SQL.</span>
          </div>
          <button 
            onClick={copySqlToClipboard}
            className="px-4 py-2 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-xl hover:bg-[#f43f5e] hover:text-black transition-all flex items-center gap-1.5"
          >
            {copiedSql ? <Check size={14} /> : <Copy size={14} />}
            {copiedSql ? 'Copiado' : 'Copiar SQL'}
          </button>
        </div>
      )}

      {/* HEADER HUD */}
      <header className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <BookOpen size={24}/>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Bloc Notas <span className="text-neutral-800">Pro</span></h2>
          </div>
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-3">Espacio creativo enriquecido en Markdown</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Indicador de Auto Guardado */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#080808]/80 border border-white/5 rounded-full">
            <span className={`w-2 h-2 rounded-full ${
              saveStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
              saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
            }`} />
            <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">
              {saveStatus === 'synced' ? 'Sincronizado' : 
               saveStatus === 'saving' ? 'Guardando...' : 'Error de Sync'}
            </span>
          </div>

          <button 
            onClick={handleCreateNote}
            className="px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus size={18}/> Nueva Nota
          </button>
        </div>
      </header>

      {/* ÁREA DE TRABAJO EN 3 COLUMNAS */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* COLUMNA 1: CARPETAS Y FILTROS (Ancho: 1/5) */}
        <div className="w-1/5 bg-[#080808]/80 border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-6 min-h-0 overflow-y-auto mac-scrollbar backdrop-blur-3xl">
          <div>
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Carpetas</h4>
            <div className="space-y-1.5">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group ${
                    activeFolderId === folder.id ? 'bg-white/5 border border-white/10 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                    <span className="text-[11px] font-black uppercase tracking-wider truncate">{folder.nombre}</span>
                  </div>
                  <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full font-black text-neutral-600 group-hover:text-white transition-all">
                    {folder.id === 'all' ? notas.length : 
                     folder.id === 'favs' ? notas.filter(n => n.favorito).length : 
                     notas.filter(n => n.folderId === folder.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="w-full py-3 bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/5 hover:border-emerald-500 rounded-2xl text-[9px] font-black uppercase tracking-widest text-neutral-400 transition-all flex items-center justify-center gap-2"
            >
              <FolderPlus size={14} /> Nueva Carpeta
            </button>
          </div>

          {/* Filtro por estado del negocio */}
          <div className="border-t border-white/5 pt-6">
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Filtrar Estado</h4>
            <div className="space-y-2">
              {['todos', 'pendiente', 'proceso', 'completado'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${
                    statusFilter === st ? 'bg-white/5 border-white/15 text-white' : 'border-transparent text-neutral-600 hover:text-white'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-md border ${
                    st === 'todos' ? 'bg-white border-white/20' :
                    st === 'pendiente' ? 'bg-[#f59e0b]/10 border-[#f59e0b]' :
                    st === 'proceso' ? 'bg-[#3b82f6]/10 border-[#3b82f6]' :
                    'bg-[#10b981]/10 border-[#10b981]'
                  }`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{st}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA 2: LISTADO DE NOTAS (Ancho: 2/5) */}
        <div className="w-2/5 bg-[#080808]/80 border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-6 min-h-0 backdrop-blur-3xl">
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700" size={16} />
            <input
              type="text"
              placeholder="Buscar notas por título o texto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#040404]/90 border border-white/5 hover:border-white/10 focus:border-emerald-500 rounded-2xl py-4 pl-12 pr-4 text-xs font-black uppercase tracking-wider text-white placeholder-neutral-700 outline-none transition-all"
            />
          </div>

          {/* Listado de Notas */}
          <div className="flex-1 overflow-y-auto mac-scrollbar pr-1 space-y-4">
            {filteredNotas.length > 0 ? (
              filteredNotas.map(note => {
                const folder = folders.find(f => f.id === note.folderId);
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex flex-col relative overflow-hidden group ${
                      activeNoteId === note.id ? 'bg-[#0f1d18]/40 border-emerald-500/30' : 'bg-[#040404] border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Indicador de Estado lateral */}
                    <div className="absolute inset-y-0 left-0 w-1.5 transition-all" style={{ 
                      backgroundColor: note.estado === 'pendiente' ? '#f59e0b' : 
                                      note.estado === 'proceso' ? '#3b82f6' : '#10b981' 
                    }} />

                    {/* Fila superior: Título, Estrella y Categoría */}
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[7px] font-black uppercase text-neutral-600 tracking-wider">
                            {folder ? folder.nombre : 'Sin Carpeta'}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: note.color }} />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[200px]">
                          {note.titulo}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {note.favorito && <Star size={12} className="text-amber-400 fill-amber-400" />}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="p-2 bg-white/5 rounded-xl border border-white/5 text-neutral-700 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Fila Media: Snippet de Markdown */}
                    <p className="text-[10px] text-neutral-600 line-clamp-2 mb-4 leading-normal font-bold lowercase">
                      {note.contenido.replace(/[#*`>_\-]/g, '').substring(0, 100) || 'Sin contenido adicional...'}
                    </p>

                    {/* Fila Inferior: Fecha y Tags */}
                    <div className="flex justify-between items-center mt-auto border-t border-white/5 pt-3">
                      <div className="flex items-center gap-1.5 text-neutral-700">
                        <Clock size={10} />
                        <span className="text-[8px] font-black uppercase">
                          {new Date(note.updated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Estatus Badge */}
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        note.estado === 'pendiente' ? 'bg-[#f59e0b]/5 border-[#f59e0b]/20 text-[#f59e0b]' :
                        note.estado === 'proceso' ? 'bg-[#3b82f6]/5 border-[#3b82f6]/20 text-[#3b82f6]' :
                        'bg-[#10b981]/5 border-[#10b981]/20 text-[#10b981]'
                      }`}>
                        {note.estado}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                <BookOpen size={36} className="text-neutral-800 mx-auto mb-4" />
                <h5 className="text-xs font-black text-white uppercase tracking-wider">No se encontraron notas</h5>
                <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mt-1">Crea una nota o cambia los filtros</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: EDITOR EXPANDIDO (Ancho: 2/5) */}
        <div className="flex-1 bg-[#080808]/80 border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-6 min-h-0 backdrop-blur-3xl">
          {activeNote ? (
            <div className="flex-1 flex flex-col min-h-0 gap-6">
              
              {/* METADATA Y ACCIONES DE LA NOTA ACTIVA */}
              <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
                
                {/* Fila 1: Selector de Carpeta, Favorito y Color */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    {/* Carpeta */}
                    <div className="relative">
                      <select
                        value={activeNote.folderId}
                        onChange={e => handleUpdateNoteField(activeNote.id, 'folderId', e.target.value)}
                        className="bg-[#040404] border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white outline-none cursor-pointer appearance-none pr-8"
                      >
                        {folders.filter(f => !f.isSystem).map(f => (
                          <option key={f.id} value={f.id}>{f.nombre}</option>
                        ))}
                        <option value="all">Suelto (General)</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
                    </div>

                    {/* Estado */}
                    <div className="relative">
                      <select
                        value={activeNote.estado}
                        onChange={e => handleUpdateNoteField(activeNote.id, 'estado', e.target.value)}
                        className="bg-[#040404] border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white outline-none cursor-pointer appearance-none pr-8"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="proceso">En Proceso</option>
                        <option value="completado">Completado</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
                    </div>

                    {/* Selector de Color */}
                    <div className="flex items-center gap-1.5 bg-[#040404] border border-white/5 rounded-xl px-2.5 py-1.5">
                      {['#10b981', '#3b82f6', '#ef4444', '#eab308', '#a855f7', '#f43f5e'].map(c => (
                        <button
                          key={c}
                          onClick={() => handleUpdateNoteField(activeNote.id, 'color', c)}
                          className={`w-3.5 h-3.5 rounded-full transition-all border ${
                            activeNote.color === c ? 'border-white scale-110 shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Favorito Toggle */}
                    <button
                      onClick={() => handleUpdateNoteField(activeNote.id, 'favorito', !activeNote.favorito)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        activeNote.favorito ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' : 'bg-white/5 border-white/5 text-neutral-600 hover:text-white'
                      }`}
                    >
                      <Star size={16} className={activeNote.favorito ? 'fill-amber-400' : ''} />
                    </button>
                  </div>
                </div>

                {/* Fila 2: Inputs de Titulo y Fecha de Evento */}
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={activeNote.titulo}
                    onChange={e => handleUpdateNoteField(activeNote.id, 'titulo', e.target.value)}
                    placeholder="Título de la Nota"
                    className="flex-1 bg-[#040404] border border-white/5 focus:border-emerald-500 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white placeholder-neutral-700 outline-none transition-all"
                  />

                  {/* Fecha de evento */}
                  <div className="flex items-center gap-2 bg-[#040404] border border-white/5 rounded-2xl px-3 py-2">
                    <Calendar size={14} className="text-neutral-600" />
                    <input
                      type="date"
                      value={activeNote.fecha_evento || ''}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'fecha_evento', e.target.value || null)}
                      className="bg-transparent border-0 text-[10px] font-black uppercase text-white outline-none max-w-[110px]"
                    />
                  </div>
                </div>
              </div>

              {/* EDITOR E INTERRUPTOR DE VISTA PREVIA */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Pestañas de Modo */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex bg-[#040404] border border-white/5 p-1 rounded-xl">
                    <button
                      onClick={() => setEditMode('write')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        editMode === 'write' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5"><Edit3 size={10} /> Editor</span>
                    </button>
                    <button
                      onClick={() => setEditMode('preview')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        editMode === 'preview' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5"><Eye size={10} /> Vista Previa</span>
                    </button>
                  </div>

                  <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Markdown Soportado</span>
                </div>

                {/* Editor Textarea o Render de Markdown */}
                <div className="flex-1 min-h-0 bg-[#040404]/90 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col">
                  {editMode === 'write' ? (
                    <textarea
                      value={activeNote.contenido}
                      onChange={e => handleUpdateNoteField(activeNote.id, 'contenido', e.target.value)}
                      placeholder="Escribe algo increíble usando Markdown..."
                      className="flex-1 w-full p-6 bg-transparent text-neutral-200 text-xs font-semibold leading-relaxed outline-none border-0 resize-none font-mono"
                    />
                  ) : (
                    <div className="flex-1 overflow-y-auto mac-scrollbar p-6 prose prose-invert max-w-none text-xs text-neutral-300 font-semibold leading-relaxed markdown-preview">
                      {activeNote.contenido ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {activeNote.contenido}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-neutral-600 font-black uppercase text-[10px] tracking-widest text-center py-20">Nada que mostrar en la vista previa</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-40 text-center border border-dashed border-white/5 rounded-[2.5rem]">
              <Sparkles size={48} className="text-neutral-800 mb-6" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">Sin nota activa</h4>
              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mt-2 max-w-xs leading-normal">
                Selecciona una nota de la columna central o crea una nota nueva para comenzar.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE NUEVA CARPETA */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[2000] animate-in fade-in duration-300">
          <div className="bg-[#080808] border border-white/10 rounded-[3rem] p-8 w-full max-w-md shadow-2xl relative">
            <h4 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
              <FolderPlus className="text-emerald-500" /> Crear Carpeta
            </h4>

            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Nombre de la Carpeta</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Ej. Finanzas, Recetas..."
                  className="w-full bg-[#040404] border border-white/5 focus:border-emerald-500 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white placeholder-neutral-700 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Color de Etiqueta</label>
                <div className="flex gap-2">
                  {['#10b981', '#3b82f6', '#ef4444', '#eab308', '#a855f7', '#f43f5e', '#ffffff'].map(c => (
                    <button
                      key={c}
                      onClick={() => setNewFolderColor(c)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        newFolderColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="flex-1 py-4 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 py-4 bg-emerald-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
                >
                  Crear Carpeta
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
