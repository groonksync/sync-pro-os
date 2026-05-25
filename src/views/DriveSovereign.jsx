import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Cloud, Folder, File, FileText, Image as ImageIcon, Video, ChevronRight, Search, Download, ExternalLink, Plus, ArrowLeft, MoreVertical, RefreshCw, Trash2, Upload, Grid, List, AlignJustify, X, CheckCircle2, AlertCircle, FolderPlus } from 'lucide-react';
import { getDriveFiles, createDriveFolder, uploadFileToDrive, downloadDriveFile, deleteDriveFile } from '../lib/googleApi';
import { getTheme } from '../lib/theme';

const ICON = (mimeType, size = 24, isDark = true) => {
  const theme = getTheme(isDark);
  if (mimeType === 'application/vnd.google-apps.folder') return <Folder color={theme.accent} size={size} />;
  if (mimeType?.includes('image')) return <ImageIcon color={theme.accent} size={size} />;
  if (mimeType?.includes('video')) return <Video color={theme.accent} size={size} />;
  if (mimeType?.includes('pdf') || mimeType?.includes('document')) return <FileText color={theme.textMuted} size={size} />;
  return <File color={theme.textMuted} size={size} />;
};

const fmtSize = (b) => { if (!b) return '--'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return parseFloat((b/Math.pow(k,i)).toFixed(1))+' '+s[i]; };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) : '--';

export default function DriveSovereign({ token, user, onLoginSuccess, isDark = true }) {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [files, setFiles] = useState([]);
  const [folder, setFolder] = useState({ id: 'root', name: 'Mi Unidad' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [toast, setToast] = useState(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [menuFile, setMenuFile] = useState(null);
  const fileInputRef = useRef();

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = async (fid = folder.id) => {
    setLoading(true);
    try { setFiles(await getDriveFiles(token, fid)); }
    catch { showToast('Error cargando archivos', 'err'); }
    setLoading(false);
  };

  useEffect(() => { if (token) load(); }, [token, folder.id]);

  const navigate = (f) => { setHistory(h => [...h, folder]); setFolder(f); setSelected(null); };
  const goBack = () => { if (!history.length) return; setFolder(history[history.length-1]); setHistory(h => h.slice(0,-1)); setSelected(null); };

  const handleUpload = async (fileList) => {
    const arr = Array.from(fileList);
    setUploading(true); setUploadPct(0);
    try {
      for (const f of arr) await uploadFileToDrive(token, f, folder.id, setUploadPct);
      showToast(`${arr.length} archivo(s) subido(s) ✓`);
      load();
    } catch { showToast('Error al subir', 'err'); }
    setUploading(false);
  };

  const handleDelete = async (f) => {
    if (!confirm(`¿Eliminar "${f.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDriveFile(token, f.id);
      showToast(`"${f.name}" eliminado`);
      if (selected?.id === f.id) setSelected(null);
      load();
    } catch { showToast('Error al eliminar', 'err'); }
  };

  const handleDownload = async (f) => {
    try { await downloadDriveFile(token, f); showToast(`Descargando "${f.name}"...`); }
    catch { showToast('Error al descargar', 'err'); }
  };

  const handleNewFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createDriveFolder(token, newFolderName.trim(), folder.id);
      showToast(`Carpeta "${newFolderName}" creada ✓`);
      setNewFolderMode(false); setNewFolderName(''); load();
    } catch { showToast('Error al crear carpeta', 'err'); }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); };

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const breadcrumb = [...history, folder];

  if (!token) return (
    <div className="flex items-center justify-center h-full">
      <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <div style={{ width: 72, height: 72, backgroundColor: t.accentSoft, borderRadius: 16, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Cloud size={40} color={t.textMuted}/></div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: 12 }}>Almacenamiento</h2>
        <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 32 }}>Conecta tu cuenta para acceder a tu unidad de Google Drive.</p>
        <p style={{ fontSize: 9, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Vincula tu cuenta desde Configuración</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-500 relative"
      style={{ backgroundColor: t.bg }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {/* DRAG OVERLAY */}
      {dragging && (
        <div className="absolute inset-0 z-50 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(160,160,160,0.10)', border: '3px dashed rgba(160,160,160,0.5)' }}>
          <div className="text-center"><Upload size={48} color={t.accent} className="mx-auto mb-4"/><p style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Suelta para subir a Drive</p></div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm font-bold animate-in slide-in-from-top-2 duration-300"
          style={toast.type === 'err' ? { backgroundColor: '#2a0f0f', borderColor: '#5c1a1a', color: '#f0b0b0' } : { backgroundColor: '#1a2a1a', borderColor: '#1a5c1a', color: '#b0f0b0' }}>
          {toast.type === 'err' ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>} {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="mb-6 flex justify-between items-center" style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Almacenamiento</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Google Drive integrado</p>
          {/* BREADCRUMB */}
          <div className="flex items-center gap-2">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                <button onClick={() => { if (i < breadcrumb.length-1) { setFolder(b); setHistory(breadcrumb.slice(0,i)); }}}
                  style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: i === breadcrumb.length-1 ? t.accent : t.textDim, transition: 'color 0.2s' }}>{b.name}</button>
                {i < breadcrumb.length-1 && <ChevronRight size={10} color={t.textDim}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH */}
          <div className="relative">
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textDim }} size={14}/>
            <input type="text" placeholder="FILTRAR..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: '10px 12px 10px 36px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#fff', outline: 'none', width: 200 }}/>
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex" style={{ backgroundColor: t.panel, borderRadius: 12, border: `1px solid ${t.border}`, padding: 3 }}>
            {[['grid', Grid],['list', List],['detail', AlignJustify]].map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: 8, borderRadius: 10, transition: 'all 0.2s', backgroundColor: view===v ? t.accent : 'transparent', color: view===v ? '#000' : t.textDim }}>
                <Icon size={14}/>
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 28, backgroundColor: t.borderLight, margin: '0 8px' }}></div>

          {/* ACTIONS */}
          <button onClick={() => setNewFolderMode(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.textMuted }}>
            <FolderPlus size={14}/> Carpeta
          </button>
          <button onClick={() => fileInputRef.current.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: t.accent, border: 'none', borderRadius: 12, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#000' }}>
            <Upload size={14}/> Subir
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)}/>
          <button onClick={() => load()}
            style={{ padding: 10, backgroundColor: t.panel, borderRadius: 12, border: `1px solid ${t.border}`, color: t.textMuted }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </header>

      {/* NEW FOLDER INPUT */}
      {newFolderMode && (
        <div className="flex items-center gap-3 mb-4" style={{ padding: 12, backgroundColor: t.accentSoft, borderRadius: 12, border: `1px solid ${t.borderLight}` }}>
          <FolderPlus size={14} color={t.accent}/>
          <input autoFocus type="text" placeholder="Nombre de la carpeta..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => { if(e.key==='Enter') handleNewFolder(); if(e.key==='Escape') setNewFolderMode(false); }}
            style={{ flex: 1, backgroundColor: 'transparent', outline: 'none', fontSize: 13, color: '#fff', border: 'none' }}/>
          <button onClick={handleNewFolder}
            style={{ padding: '6px 14px', backgroundColor: t.accent, color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', borderRadius: 8, border: 'none' }}>Crear</button>
          <button onClick={() => setNewFolderMode(false)} style={{ color: t.textDim, background: 'none', border: 'none', cursor: 'pointer' }}><X size={14}/></button>
        </div>
      )}

      {/* UPLOAD PROGRESS */}
      {uploading && (
        <div className="mb-4" style={{ padding: 12, backgroundColor: t.accentSoft, borderRadius: 12, border: `1px solid ${t.borderLight}` }}>
          <div className="flex justify-between" style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>
            <span style={{ color: t.accent }}>Subiendo archivos...</span>
            <span style={{ color: '#fff' }}>{uploadPct}%</span>
          </div>
          <div style={{ height: 4, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: t.accent, borderRadius: 4, width: `${uploadPct}%`, transition: 'width 0.3s' }}></div>
          </div>
        </div>
      )}

      {/* FILE AREA */}
      <div className={`flex-1 overflow-hidden ${view === 'detail' ? 'flex gap-4' : ''}`}>
        <div className={`${view === 'detail' ? 'flex-1' : 'h-full'} overflow-y-auto mac-scrollbar pr-2`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw size={28} color={t.textDim} className="animate-spin"/>
              <p style={{ fontSize: 9, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Cargando desde Google Drive...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24"
              style={{ border: `1px dashed ${t.border}`, borderRadius: 16 }}>
              <Cloud size={36} color={t.textDim} style={{ marginBottom: 12 }}/>
              <p style={{ color: t.textMuted, fontSize: 13, fontWeight: 500 }}>{search ? 'Sin resultados' : 'Carpeta vacía — arrastra archivos aquí'}</p>
            </div>
          ) : view === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map(f => (
                <div key={f.id} onDoubleClick={() => f.mimeType === 'application/vnd.google-apps.folder' ? navigate({id:f.id,name:f.name}) : setSelected(f)}
                  onClick={() => setSelected(f)}
                  style={{ backgroundColor: t.panel, border: `1px solid ${selected?.id===f.id ? t.accent + '80' : t.border}`, borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div style={{ padding: 12, backgroundColor: t.accentSoft, borderRadius: 12 }}>{ICON(f.mimeType, 24, isDark)}</div>
                    <button onClick={e => { e.stopPropagation(); setMenuFile(menuFile?.id===f.id ? null : f); }}
                      className="opacity-0 group-hover:opacity-100" style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: t.textDim }}>
                      <MoreVertical size={14}/>
                    </button>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{f.name}</p>
                  <p style={{ fontSize: 8, color: t.textDim, fontWeight: 700, textTransform: 'uppercase' }}>{fmtSize(f.size)}</p>
                  {menuFile?.id === f.id && (
                    <div style={{ position: 'absolute', top: 8, right: 32, zIndex: 30, backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: 6, minWidth: 130 }}>
                      {f.mimeType !== 'application/vnd.google-apps.folder' && <button onClick={e=>{e.stopPropagation();handleDownload(f);setMenuFile(null);}} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', fontSize: 9, color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}><Download size={12}/>Descargar</button>}
                      <button onClick={e=>{e.stopPropagation();window.open(f.webViewLink,'_blank');setMenuFile(null);}} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', fontSize: 9, color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}><ExternalLink size={12}/>Abrir en Drive</button>
                      <button onClick={e=>{e.stopPropagation();handleDelete(f);setMenuFile(null);}} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', fontSize: 9, color: '#e04a4a', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}><Trash2 size={12}/>Eliminar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* LIST / DETAIL VIEW */
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div className="grid grid-cols-12 px-4 py-2" style={{ backgroundColor: t.accentSoft, borderBottom: `1px solid ${t.border}`, fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                <span className="col-span-6">Nombre</span>
                <span className="col-span-2">Tipo</span>
                <span className="col-span-2">Tamaño</span>
                <span className="col-span-1">Fecha</span>
                <span className="col-span-1 text-right">Acc.</span>
              </div>
              {filtered.map(f => (
                <div key={f.id} onDoubleClick={() => f.mimeType==='application/vnd.google-apps.folder' ? navigate({id:f.id,name:f.name}) : null}
                  onClick={() => setSelected(f)}
                  className="grid grid-cols-12 px-4 py-3 items-center cursor-pointer"
                  style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: selected?.id===f.id ? t.accentSoft : 'transparent' }}>
                  <div className="col-span-6 flex items-center gap-3">
                    {ICON(f.mimeType, 16, isDark)}
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  </div>
                  <span className="col-span-2" style={{ fontSize: 8, color: t.textDim }}>{f.mimeType.split('/').pop().split('.').pop()}</span>
                  <span className="col-span-2" style={{ fontSize: 8, color: t.textDim }}>{fmtSize(f.size)}</span>
                  <span className="col-span-1" style={{ fontSize: 8, color: t.textDim }}>{fmtDate(f.modifiedTime)}</span>
                  <div className="col-span-1 flex justify-end gap-1">
                    {f.mimeType!=='application/vnd.google-apps.folder' && <button onClick={e=>{e.stopPropagation();handleDownload(f);}} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: t.textDim }}><Download size={12}/></button>}
                    <button onClick={e=>{e.stopPropagation();handleDelete(f);}} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: t.textDim }}><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAIL PANEL */}
        {view === 'detail' && selected && (
          <div style={{ width: 260, backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Detalle</span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textDim }}><X size={14}/></button>
            </div>
            <div className="flex flex-col items-center py-4 gap-3">
              {ICON(selected.mimeType, 40, isDark)}
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{selected.name}</p>
            </div>
            <div className="space-y-2" style={{ fontSize: 9 }}>
              <div className="flex justify-between"><span style={{ color: t.textDim, fontWeight: 700, textTransform: 'uppercase' }}>Tamaño</span><span style={{ color: '#fff', fontWeight: 700 }}>{fmtSize(selected.size)}</span></div>
              <div className="flex justify-between"><span style={{ color: t.textDim, fontWeight: 700, textTransform: 'uppercase' }}>Modificado</span><span style={{ color: '#fff', fontWeight: 700 }}>{fmtDate(selected.modifiedTime)}</span></div>
              <div className="flex justify-between"><span style={{ color: t.textDim, fontWeight: 700, textTransform: 'uppercase' }}>Tipo</span><span style={{ color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{selected.mimeType.split('/').pop()}</span></div>
            </div>
            <div className="mt-auto space-y-2">
              <button onClick={() => window.open(selected.webViewLink,'_blank')}
                style={{ width: '100%', padding: 12, backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, borderRadius: 12, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ExternalLink size={13}/>Abrir en Drive
              </button>
              {selected.mimeType!=='application/vnd.google-apps.folder' && <button onClick={()=>handleDownload(selected)}
                style={{ width: '100%', padding: 12, backgroundColor: t.accent, border: 'none', borderRadius: 12, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download size={13}/>Descargar
              </button>}
              <button onClick={()=>handleDelete(selected)}
                style={{ width: '100%', padding: 12, backgroundColor: 'rgba(224,74,74,0.08)', border: '1px solid rgba(224,74,74,0.15)', borderRadius: 12, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#e04a4a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Trash2 size={13}/>Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CLICK OUTSIDE MENU */}
      {menuFile && <div className="fixed inset-0 z-20" onClick={() => setMenuFile(null)}/>}
    </div>
  );
}
