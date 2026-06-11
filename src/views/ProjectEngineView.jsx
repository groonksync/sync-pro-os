import React, { useState } from 'react';
import { 
  FolderOpen, Folder, File, ChevronDown, Grid
} from 'lucide-react';
import { useTheme } from '../lib/theme';

const ProjectEngineView = ({ isDark = true }) => {
  const themeObj = useTheme(isDark);
  // Fallback to theme or default values
  const t = themeObj || {
    bg: '#141414',
    text: '#d4d4d4',
    textDim: '#707070',
    accent: '#10b981',
    panel: '#1a1a1a',
    border: '#2e2e30'
  };

  const [cliente, setCliente] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [selectedPremiere, setSelectedPremiere] = useState('');
  const [selectedAE, setSelectedAE] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [destinationPath, setDestinationPath] = useState('');
  const [dirHandle, setDirHandle] = useState(null);

  const [treeCollapsed, setTreeCollapsed] = useState({
    client: false, project: false, pr: false, ae: false,
  });

  const templates = [
    '1080x1920_25fps', '1080x1920_30fps', '1080x1920_60fps',
    '1920x1080_25fps', '1920x1080_30fps', '1920x1080_60fps',
    '4K_Horizontal_25fps', '4K_Horizontal_30fps', '4K_Horizontal_60fps',
    '4K_Vertical_25fps', '4K_Vertical_30fps', '4K_Vertical_60fps'
  ];

  const cleanFolderName = (txt) => txt.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚüÜñÑ-]/g, '');
  const today = new Date().toISOString().split('T')[0];
  const effectiveDate = customDate || today;
  const safeCliente = cliente ? cleanFolderName(cliente) : '';
  const safeProyecto = cleanFolderName(proyecto || 'PROYECTO');
  const formatDateShort = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y.slice(-2)}`;
  };
  const finalProjectFolderName = `${safeProyecto}_${formatDateShort(effectiveDate)}`;

  const handleSelectDirectory = async () => {
    try {
      if (window.electronAPI) {
        const path = await window.electronAPI.selectDirectory();
        if (path) setDestinationPath(path);
      } else {
        if (!window.showDirectoryPicker) {
          alert('La creación real de carpetas solo está disponible en la app de escritorio o en navegadores compatibles.');
          return;
        }
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setDirHandle(handle);
        setDestinationPath(handle.name);
      }
    } catch (e) {
      if (e.name !== 'AbortError' && e.name !== 'SecurityError') {
        console.error(e);
      }
    }
  };

  const ensureDir = async (parentHandle, pathParts) => {
    let current = parentHandle;
    for (const part of pathParts) {
      if (part) {
        current = await current.getDirectoryHandle(part, { create: true });
      }
    }
    return current;
  };

  const writeFile = async (dirHandle, fileName, content) => {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  };

  const copyTemplateToDir = async (dir, fileName, templatePath) => {
    try {
      const res = await fetch(templatePath);
      if (res.ok) {
        const blob = await res.blob();
        await writeFile(dir, fileName, blob);
        return true;
      }
    } catch {}
    await writeFile(dir, fileName, '');
    return false;
  };

  const handleGenerate = async () => {
    if (!proyecto) {
      alert('El nombre del proyecto es obligatorio.');
      return;
    }
    if (!dirHandle && !window.electronAPI) {
      alert('Primero selecciona un directorio de destino con el botón "Vincular".');
      return;
    }
    if (window.electronAPI && !destinationPath) {
      alert('Primero selecciona un directorio de destino con el botón "Vincular".');
      return;
    }
    setIsGenerating(true);
    setStatusMsg('Creando estructura...');
    try {
      const folderName = finalProjectFolderName;

      if (window.electronAPI) {
        const result = await window.electronAPI.createFolderStructure({
          rootPath: destinationPath,
          cliente,
          proyecto,
          projectDate: effectiveDate,
          templates: { premiere: selectedPremiere, afterEffects: selectedAE }
        });
        if (result && result.success) {
          setStatusMsg(`Estructura creada exitosamente en: ${result.projectPath || destinationPath}`);
        } else {
          setStatusMsg(`Error: ${result ? result.error : 'Desconocido'}`);
        }
      } else if (dirHandle) {
        let rootDir = dirHandle;

        if (cliente) {
          rootDir = await ensureDir(rootDir, [safeCliente]);
        }

        const projectDir = await ensureDir(rootDir, [folderName]);

        const subdirs = ['01_PR', '02_AE', '03_Videos', '04_Audios', '05_Imágenes'];

        for (const sub of subdirs) {
          await ensureDir(projectDir, [sub]);
        }

        if (selectedPremiere) {
          const prDir = await ensureDir(projectDir, ['01_PR']);
          await copyTemplateToDir(prDir, `${folderName}.prproj`, `/plantillas_adobe/premiere_pro/${selectedPremiere}.prproj`);
        }

        if (selectedAE) {
          const aeDir = await ensureDir(projectDir, ['02_AE']);
          await copyTemplateToDir(aeDir, `${folderName}.aep`, `/plantillas_adobe/after_effects/${selectedAE}.aep`);
        }

        setStatusMsg(`Estructura creada exitosamente en: ${destinationPath}${cliente ? '/' + safeCliente : ''}/${folderName}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg(`Error al generar: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTree = (key) => {
    setTreeCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-grow flex flex-col p-6 space-y-6 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
      <header className="flex justify-between items-center pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-white">Generador de Estructura de Proyectos</h2>
          <p className="text-[7.5px] font-bold uppercase tracking-widest" style={{ color: t.textDim }}>
            Crea carpetas y archivos .prproj / .aep para Premiere Pro y After Effects
          </p>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black uppercase text-neutral-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          Sistema Activo
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="p-5 rounded-xl space-y-4" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
              <FolderOpen size={14} color={t.accent}/>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Configuración del Proyecto</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Directorio de Destino</label>
                <div className="flex gap-2">
                  <input type="text" value={destinationPath || 'No seleccionado...'} disabled
                    className="flex-1 rounded p-2 text-[9px] font-mono outline-none truncate"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.textDim }} />
                  <button onClick={handleSelectDirectory} className="px-3 rounded text-[8px] font-black uppercase transition-all"
                    style={{ border: `1px solid ${t.accent}`, color: t.accent, backgroundColor: t.panel }}>Vincular</button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">
                  Cliente / Empresa <span style={{ color: t.textDim }}>(opcional)</span>
                </label>
                <input type="text" value={cliente} onChange={e=>setCliente(e.target.value)} placeholder="Ej: Urbanización"
                  className="w-full rounded p-2 text-[10px] outline-none"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Nombre del Proyecto</label>
                <input type="text" value={proyecto} onChange={e=>setProyecto(e.target.value)} placeholder="Ej: Spot Comercial"
                  className="w-full rounded p-2 text-[10px] outline-none"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">
                  Fecha del Proyecto <span style={{ color: t.textDim }}>(vacío = hoy)</span>
                </label>
                <input type="date" value={customDate} onChange={e=>setCustomDate(e.target.value)}
                  className="w-full rounded p-2 text-[10px] outline-none"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Plantilla Premiere Pro</label>
                  <select value={selectedPremiere} onChange={e=>setSelectedPremiere(e.target.value)}
                    className="w-full rounded p-2 text-[9px] outline-none cursor-pointer"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}>
                    <option value="">Ninguna</option>
                    {templates.map(tmp => <option key={tmp} value={tmp}>{tmp}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Plantilla After Effects</label>
                  <select value={selectedAE} onChange={e=>setSelectedAE(e.target.value)}
                    className="w-full rounded p-2 text-[9px] outline-none cursor-pointer"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}>
                    <option value="">Ninguna</option>
                    {templates.map(tmp => <option key={tmp} value={tmp}>{tmp}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleGenerate} disabled={isGenerating || !proyecto || (!dirHandle && !window.electronAPI)}
                className="w-full py-2.5 rounded font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2"
                style={{
                  backgroundColor: isGenerating || !proyecto ? t.panel : t.accent,
                  border: `1px solid ${isGenerating || !proyecto ? t.border : t.accent}`,
                  color: isGenerating || !proyecto ? t.textDim : '#000',
                  cursor: isGenerating || !proyecto ? 'not-allowed' : 'pointer'
                }}>
                {isGenerating ? 'Generando...' : 'Generar Estructura'}
              </button>
              {statusMsg && <p className="text-center text-[7.5px] font-black uppercase tracking-wider text-emerald-500 mt-1">{statusMsg}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="p-5 rounded-xl space-y-3" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2">
                <Grid size={14} color={t.accent}/>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Vista Previa del Árbol</span>
              </div>
              <span className="text-[7px] font-mono text-neutral-400">Estructura Dinámica</span>
            </div>

            <div className="font-mono text-[9px] space-y-1.5 text-neutral-300 pl-1 select-none overflow-y-auto max-h-[500px] mac-scrollbar">
              <div>
                {cliente ? (
                  <div>
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('client')}>
                      <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.client ? '-rotate-90' : ''}`}/>
                      <Folder size={10} color={t.accent}/>
                      <span className="font-bold">{safeCliente}</span>
                    </div>
                    {!treeCollapsed.client && (
                      <div className="pl-4 border-l border-neutral-800 space-y-1.5 mt-1.5">
                        <ProjectTreeNode t={t} folderName={finalProjectFolderName} treeCollapsed={treeCollapsed} toggleTree={toggleTree}
                           hasPr={!!selectedPremiere} hasAe={!!selectedAE} />
                      </div>
                    )}
                  </div>
                ) : (
                  <ProjectTreeNode t={t} folderName={finalProjectFolderName} treeCollapsed={treeCollapsed} toggleTree={toggleTree}
                    hasPr={!!selectedPremiere} hasAe={!!selectedAE} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectTreeNode = ({ t, folderName, treeCollapsed, toggleTree, hasPr, hasAe }) => (
  <div>
    <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('project')}>
      <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.project ? '-rotate-90' : ''}`}/>
      <Folder size={10} color={t.accent}/>
      <span className="text-white truncate max-w-[300px]">{folderName}</span>
    </div>
    {!treeCollapsed.project && (
      <div className="pl-4 border-l border-neutral-800 space-y-1.5 mt-1.5">
        <div>
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('pr')}>
            <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.pr ? '-rotate-90' : ''}`}/>
            <Folder size={10} color="#94a3b8"/>
            <span>01_PR</span>
          </div>
          {!treeCollapsed.pr && hasPr && (
            <div className="pl-4 border-l border-neutral-800 mt-1">
              <div className="flex items-center gap-1 text-[8.5px] text-neutral-400">
                <File size={9}/>
                <span>{folderName}.prproj</span>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('ae')}>
            <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.ae ? '-rotate-90' : ''}`}/>
            <Folder size={10} color="#94a3b8"/>
            <span>02_AE</span>
          </div>
          {!treeCollapsed.ae && hasAe && (
            <div className="pl-4 border-l border-neutral-800 mt-1">
              <div className="flex items-center gap-1 text-[8.5px] text-neutral-400">
                <File size={9}/>
                <span>{folderName}.aep</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <Folder size={10} color="#94a3b8"/>
          <span>03_Videos</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <Folder size={10} color="#94a3b8"/>
          <span>04_Audios</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <Folder size={10} color="#94a3b8"/>
          <span>05_Imágenes</span>
        </div>
      </div>
    )}
  </div>
);

export default ProjectEngineView;
