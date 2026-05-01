import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Folder, File, FileText, Image as ImageIcon, Video, ChevronRight, Search, Download, ExternalLink, Plus, ArrowLeft, MoreVertical, RefreshCw, Trash2, Upload, Grid, List, AlignJustify, X, CheckCircle2, AlertCircle, FolderPlus } from 'lucide-react';
import { getDriveFiles, createDriveFolder, uploadFileToDrive, downloadDriveFile, deleteDriveFile } from '../lib/googleApi';

const ICON = (mimeType, size = 24) => {
  if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="text-amber-400" size={size} />;
  if (mimeType?.includes('image')) return <ImageIcon className="text-emerald-400" size={size} />;
  if (mimeType?.includes('video')) return <Video className="text-rose-400" size={size} />;
  if (mimeType?.includes('pdf') || mimeType?.includes('document')) return <FileText className="text-blue-400" size={size} />;
  return <File className="text-neutral-500" size={size} />;
};

const fmtSize = (b) => { if (!b) return '--'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return parseFloat((b/Math.pow(k,i)).toFixed(1))+' '+s[i]; };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) : '--';

export default function DriveSovereign({ token, user, onLoginSuccess }) {
  const [files, setFiles] = useState([]);
  const [folder, setFolder] = useState({ id: 'root', name: 'Mi Unidad' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid'); // grid | list | detail
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
      <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[40px] text-center max-w-md w-full">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10"><Cloud size={40} className="text-neutral-400"/></div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Drive Sovereign</h2>
        <p className="text-xs text-neutral-500 mb-10">Conecta tu cuenta para acceder a tu unidad de Google Drive.</p>
        <p className="text-[9px] text-neutral-600 uppercase tracking-widest">Vincula tu cuenta desde Configuración</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-500 relative"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {/* DRAG OVERLAY */}
      {dragging && (
        <div className="absolute inset-0 z-50 bg-blue-600/20 border-4 border-dashed border-blue-500 rounded-3xl flex items-center justify-center">
          <div className="text-center"><Upload size={48} className="text-blue-400 mx-auto mb-4"/><p className="text-xl font-black text-white">Suelta para subir a Drive</p></div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${toast.type === 'err' ? 'bg-red-950 border-red-800 text-red-200' : 'bg-emerald-950 border-emerald-800 text-emerald-200'}`}>
          {toast.type === 'err' ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>} {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="mb-6 flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/5 rounded-xl"><Cloud size={18} className="text-blue-400"/></div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Drive <span className="text-neutral-700">Pro</span></h2>
          </div>
          {/* BREADCRUMB */}
          <div className="flex items-center gap-1.5">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                <button onClick={() => { if (i < breadcrumb.length-1) { setFolder(b); setHistory(breadcrumb.slice(0,i)); }}} className={`text-[9px] font-black uppercase tracking-widest transition-colors ${i === breadcrumb.length-1 ? 'text-white' : 'text-neutral-600 hover:text-neutral-300'}`}>{b.name}</button>
                {i < breadcrumb.length-1 && <ChevronRight size={10} className="text-neutral-700"/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={13}/>
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white/5 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-[10px] text-white outline-none focus:border-white/20 w-52"/>
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex bg-white/5 rounded-xl border border-white/5 p-1">
            {[['grid', Grid],['list', List],['detail', AlignJustify]].map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} className={`p-2 rounded-lg transition-all ${view===v ? 'bg-white/10 text-white' : 'text-neutral-600 hover:text-neutral-400'}`}><Icon size={14}/></button>
            ))}
          </div>

          {/* ACTIONS */}
          <button onClick={() => setNewFolderMode(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase text-neutral-300 hover:bg-white/10 transition-all">
            <FolderPlus size={15}/> Carpeta
          </button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-[10px] font-black uppercase text-white hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Upload size={15}/> Subir
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)}/>
          <button onClick={() => load()} className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 text-neutral-500">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
          </button>
          {history.length > 0 && <button onClick={goBack} className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 text-neutral-500"><ArrowLeft size={15}/></button>}
        </div>
      </header>

      {/* NEW FOLDER INPUT */}
      {newFolderMode && (
        <div className="flex items-center gap-3 mb-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <FolderPlus size={16} className="text-amber-400"/>
          <input autoFocus type="text" placeholder="Nombre de la carpeta..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => { if(e.key==='Enter') handleNewFolder(); if(e.key==='Escape') setNewFolderMode(false); }} className="flex-1 bg-transparent outline-none text-sm text-white placeholder-neutral-700"/>
          <button onClick={handleNewFolder} className="px-4 py-1.5 bg-amber-500 text-black text-[9px] font-black uppercase rounded-lg">Crear</button>
          <button onClick={() => setNewFolderMode(false)} className="text-neutral-600 hover:text-white"><X size={16}/></button>
        </div>
      )}

      {/* UPLOAD PROGRESS */}
      {uploading && (
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/20 rounded-2xl">
          <div className="flex justify-between text-[9px] font-black uppercase mb-2"><span className="text-blue-400">Subiendo archivos...</span><span className="text-white">{uploadPct}%</span></div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all rounded-full" style={{ width: `${uploadPct}%` }}></div></div>
        </div>
      )}

      {/* FILE AREA */}
      <div className={`flex-1 overflow-hidden ${view === 'detail' ? 'flex gap-4' : ''}`}>
        <div className={`${view === 'detail' ? 'flex-1' : 'h-full'} overflow-y-auto mac-scrollbar pr-2`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <RefreshCw size={32} className="text-neutral-700 animate-spin"/>
              <p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest">Cargando desde Google Drive...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/5 rounded-3xl">
              <Cloud size={40} className="text-neutral-800 mb-4"/>
              <p className="text-neutral-600 text-sm font-medium">{search ? 'Sin resultados' : 'Carpeta vacía — arrastra archivos aquí'}</p>
            </div>
          ) : view === 'grid' ? (
            /* ── GRID VIEW ── */
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map(f => (
                <div key={f.id} onDoubleClick={() => f.mimeType === 'application/vnd.google-apps.folder' ? navigate({id:f.id,name:f.name}) : setSelected(f)}
                  onClick={() => setSelected(f)}
                  className={`bg-[#0a0a0a] border rounded-2xl p-4 hover:border-white/20 transition-all group cursor-pointer relative ${selected?.id===f.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/[0.04]'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-black rounded-xl border border-white/5 group-hover:scale-110 transition-transform duration-300">{ICON(f.mimeType)}</div>
                    <button onClick={e => { e.stopPropagation(); setMenuFile(menuFile?.id===f.id ? null : f); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg text-neutral-600 hover:text-white transition-all"><MoreVertical size={13}/></button>
                  </div>
                  <p className="text-[11px] font-bold text-white truncate mb-1">{f.name}</p>
                  <p className="text-[9px] text-neutral-700">{fmtSize(f.size)}</p>
                  {menuFile?.id === f.id && (
                    <div className="absolute top-2 right-8 z-30 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[140px]">
                      {f.mimeType !== 'application/vnd.google-apps.folder' && <button onClick={e=>{e.stopPropagation();handleDownload(f);setMenuFile(null);}} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-neutral-300 hover:bg-white/5 rounded-lg"><Download size={12}/>Descargar</button>}
                      <button onClick={e=>{e.stopPropagation();window.open(f.webViewLink,'_blank');setMenuFile(null);}} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-neutral-300 hover:bg-white/5 rounded-lg"><ExternalLink size={12}/>Abrir en Drive</button>
                      <button onClick={e=>{e.stopPropagation();handleDelete(f);setMenuFile(null);}} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={12}/>Eliminar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* ── LIST / DETAIL VIEW ── */
            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                <span className="col-span-6">Nombre</span>
                <span className="col-span-2">Tipo</span>
                <span className="col-span-2">Tamaño</span>
                <span className="col-span-1">Fecha</span>
                <span className="col-span-1 text-right">Acc.</span>
              </div>
              {filtered.map(f => (
                <div key={f.id} onDoubleClick={() => f.mimeType==='application/vnd.google-apps.folder' ? navigate({id:f.id,name:f.name}) : null}
                  onClick={() => setSelected(f)}
                  className={`grid grid-cols-12 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all cursor-pointer group items-center ${selected?.id===f.id ? 'bg-blue-500/5 border-blue-500/20' : ''}`}>
                  <div className="col-span-6 flex items-center gap-3">
                    {ICON(f.mimeType, 16)}
                    <span className="text-[11px] font-bold text-white truncate">{f.name}</span>
                  </div>
                  <span className="col-span-2 text-[9px] text-neutral-600 truncate">{f.mimeType.split('/').pop().split('.').pop()}</span>
                  <span className="col-span-2 text-[9px] text-neutral-600">{fmtSize(f.size)}</span>
                  <span className="col-span-1 text-[9px] text-neutral-600">{fmtDate(f.modifiedTime)}</span>
                  <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {f.mimeType!=='application/vnd.google-apps.folder' && <button onClick={e=>{e.stopPropagation();handleDownload(f);}} className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-600 hover:text-white"><Download size={12}/></button>}
                    <button onClick={e=>{e.stopPropagation();handleDelete(f);}} className="p-1.5 hover:bg-red-500/10 rounded-lg text-neutral-600 hover:text-red-400"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAIL PANEL */}
        {view === 'detail' && selected && (
          <div className="w-72 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Detalle</span>
              <button onClick={() => setSelected(null)} className="text-neutral-600 hover:text-white"><X size={14}/></button>
            </div>
            <div className="flex flex-col items-center py-6 gap-3">
              {ICON(selected.mimeType, 48)}
              <p className="text-sm font-bold text-white text-center leading-snug">{selected.name}</p>
            </div>
            <div className="space-y-3 text-[10px]">
              <div className="flex justify-between"><span className="text-neutral-600 font-bold uppercase">Tamaño</span><span className="text-white font-bold">{fmtSize(selected.size)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-600 font-bold uppercase">Modificado</span><span className="text-white font-bold">{fmtDate(selected.modifiedTime)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-600 font-bold uppercase">Tipo</span><span className="text-white font-bold truncate max-w-[120px] text-right">{selected.mimeType.split('/').pop()}</span></div>
            </div>
            <div className="mt-auto space-y-2">
              <button onClick={() => window.open(selected.webViewLink,'_blank')} className="w-full py-3 bg-white/5 border border-white/5 rounded-2xl text-[9px] font-black uppercase text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"><ExternalLink size={13}/>Abrir en Drive</button>
              {selected.mimeType!=='application/vnd.google-apps.folder' && <button onClick={()=>handleDownload(selected)} className="w-full py-3 bg-blue-600 rounded-2xl text-[9px] font-black uppercase text-white hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.25)]"><Download size={13}/>Descargar</button>}
              <button onClick={()=>handleDelete(selected)} className="w-full py-3 bg-red-600/10 border border-red-500/10 rounded-2xl text-[9px] font-black uppercase text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"><Trash2 size={13}/>Eliminar</button>
            </div>
          </div>
        )}
      </div>

      {/* CLICK OUTSIDE MENU */}
      {menuFile && <div className="fixed inset-0 z-20" onClick={() => setMenuFile(null)}/>}
    </div>
  );
}
