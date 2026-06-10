import React, { useState, useMemo, useRef } from 'react';
import { 
  Folder, FolderPlus, ArrowRight, Settings, Sliders, Download, 
  RefreshCw, Play, Trash2, Image as ImageIcon, CheckCircle2, 
  AlertCircle, Loader2, Search, ChevronDown, Sparkles, Files
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import JSZip from 'jszip';

// Funciones helper para persistencia de Directory Handles usando IndexedDB
const saveDirectoryHandle = async (key, handle) => {
  try {
    const request = indexedDB.open('ConversorWebPDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
    return new Promise((resolve, reject) => {
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('handles', 'readwrite');
        const store = tx.objectStore('handles');
        store.put(handle, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error saving directory handle:', err);
    return false;
  }
};

const loadDirectoryHandle = async (key) => {
  try {
    const request = indexedDB.open('ConversorWebPDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
    return new Promise((resolve, reject) => {
      request.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('handles')) {
          resolve(null);
          return;
        }
        const tx = db.transaction('handles', 'readonly');
        const store = tx.objectStore('handles');
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => reject(getReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error loading directory handle:', err);
    return null;
  }
};

const ConversorWebP = ({ settings, isDark = true }) => {
  const t = useTheme(isDark);
  
  // Soporte nativo para File System Access API
  const isFileSystemAccessSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // Estados de carpetas locales
  const [targetDirHandle, setTargetDirHandle] = useState(null);
  const [targetDirName, setTargetDirName] = useState('');
  const [targetDirPermission, setTargetDirPermission] = useState('prompt');
  
  const isPickerActive = useRef(false);
  
  // Lista de archivos en memoria
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [customAlert, setCustomAlert] = useState(null);

  // Cargar handles guardados al montar
  React.useEffect(() => {
    const initHandles = async () => {
      if (!isFileSystemAccessSupported) return;
      try {
        const savedTarget = await loadDirectoryHandle('targetDir');
        if (savedTarget) {
          setTargetDirHandle(savedTarget);
          setTargetDirName(savedTarget.name);
          const perm = await savedTarget.queryPermission({ mode: 'readwrite' });
          setTargetDirPermission(perm);
        } else {
          const storedName = localStorage.getItem('saved_target_dir_name');
          if (storedName) setTargetDirName(storedName);
        }
      } catch (e) {
        console.error('Error al inicializar carpetas guardadas:', e);
      }
    };
    initHandles();
  }, [isFileSystemAccessSupported]);

  // Parámetros de Optimización y Renombrado
  const [baseName, setBaseName] = useState('');
  const [startIndex, setStartIndex] = useState(1);
  const [zeroPadding, setZeroPadding] = useState(2);
  const [opMode, setOpMode] = useState('webp'); // 'webp' (Optimizar a WebP) | 'rename' (Solo Renombrar, mantener formato)
  const [maxResolution, setMaxResolution] = useState('1200'); // '1200' (1K) | '2048' (2K) | '3840' (4K) | 'original'
  const [quality, setQuality] = useState(80);

  // Referencia al input de archivos oculto
  const fileInputRef = useRef(null);

  // Helper para formatear peso de archivo
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Obtener dimensiones reales de la imagen
  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Activar Carpeta de Destino con permisos
  const handleActivateTargetDir = async (explicitHandle = null) => {
    const activeHandle = explicitHandle || targetDirHandle;
    if (!activeHandle) return;
    try {
      const perm = await activeHandle.requestPermission({ mode: 'readwrite' });
      setTargetDirPermission(perm);
      if (perm === 'granted') {
        setCustomAlert({
          type: 'success',
          title: 'Carpeta Destino Activada',
          message: `Permisos concedidos de escritura para la carpeta "${activeHandle.name}".`
        });
      } else {
        setCustomAlert({
          type: 'error',
          title: 'Permiso Denegado',
          message: 'No se puede guardar en la carpeta de destino sin permisos de escritura.'
        });
      }
    } catch (err) {
      setCustomAlert({
        type: 'error',
        title: 'Error de Activación',
        message: 'No se pudo obtener acceso a la carpeta: ' + err.message
      });
    }
  };

  // Selector de Carpeta Destino (Nativo)
  const handleSelectTargetDir = async () => {
    if (isPickerActive.current) return;
    isPickerActive.current = true;
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setTargetDirHandle(handle);
      setTargetDirName(handle.name);
      setTargetDirPermission('granted');
      localStorage.setItem('saved_target_dir_name', handle.name);
      await saveDirectoryHandle('targetDir', handle);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setCustomAlert({
          type: 'error',
          title: 'Error de Acceso',
          message: 'Error al acceder a la carpeta de destino: ' + err.message
        });
      }
    } finally {
      isPickerActive.current = false;
    }
  };

  // Cargar archivos mediante Drag & Drop o Selector manual
  const handleManualFilesSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const list = [...files];

    for (const file of selectedFiles) {
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|heic|tiff)$/i.test(file.name)) {
        const dimensions = await getImageDimensions(file);
        list.push({
          id: crypto.randomUUID(),
          name: file.name,
          file,
          size: file.size,
          type: file.type,
          width: dimensions.width,
          height: dimensions.height,
          status: 'pending',
          resultBlob: null,
          resultSize: null,
          resultName: '',
          resultWidth: 0,
          resultHeight: 0,
          error: null
        });
      }
    }
    setFiles(list);
    if (e.target) e.target.value = '';
  };

  // Eliminar archivo de la lista antes de procesar
  const handleRemoveFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  // Limpiar toda la interfaz
  const handleClearAll = () => {
    setFiles([]);
    setProgress({ current: 0, total: 0 });
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCustomAlert({
      type: 'info',
      title: 'Archivos Eliminados',
      message: 'Se ha limpiado la lista de imágenes y se restableció el estado del proceso.'
    });
  };

  // Generar nombre de salida secuencial y sanitizar caracteres no permitidos
  const generateTargetName = (originalName, index) => {
    const ext = opMode === 'webp' ? 'webp' : originalName.split('.').pop();
    let nameWithoutExt = '';
    if (!baseName.trim()) {
      nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    } else {
      const num = String(startIndex + index).padStart(zeroPadding, '0');
      nameWithoutExt = `${baseName.trim()}_${num}`;
    }
    // Sanitizar caracteres prohibidos en sistemas de archivos ( \ / : * ? " < > | )
    const sanitizedName = nameWithoutExt.replace(/[\\/:*?"<>|]/g, '');
    return `${sanitizedName}.${ext}`;
  };

  // Procesar imagen individual (Conversión/Redimensionado u Solo renombrado)
  const processImage = (fileItem, index) => {
    return new Promise((resolve) => {
      const finalName = generateTargetName(fileItem.name, index);

      // Si el modo es "Solo Renombrar", devolvemos el archivo original tal cual con su extensión
      if (opMode === 'rename') {
        resolve({
          status: 'success',
          resultBlob: fileItem.file,
          resultSize: fileItem.file.size,
          resultName: finalName,
          resultWidth: fileItem.width,
          resultHeight: fileItem.height
        });
        return;
      }

      // Modo "Convertir a WebP"
      const img = new Image();
      img.src = URL.createObjectURL(fileItem.file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Escalar si se supera la resolución máxima
        if (maxResolution !== 'original') {
          const maxDim = parseInt(maxResolution);
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob de WebP
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ status: 'error', error: 'Fallo al exportar a WebP' });
            return;
          }
          resolve({
            status: 'success',
            resultBlob: blob,
            resultSize: blob.size,
            resultName: finalName,
            resultWidth: width,
            resultHeight: height
          });
        }, 'image/webp', quality / 100);
      };

      img.onerror = () => {
        resolve({ 
          status: 'error', 
          error: 'Formato no compatible (ej: HEIC de iPhone, RAW) o archivo dañado' 
        });
      };
    });
  };

  // Iniciar la conversión/renombrado en lote
  const handleStartProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });

    // Verificar y pedir permisos de escritura en la carpeta de destino si está cargada
    let activeTargetDir = targetDirHandle;
    if (activeTargetDir && targetDirPermission !== 'granted') {
      try {
        const perm = await activeTargetDir.requestPermission({ mode: 'readwrite' });
        setTargetDirPermission(perm);
        if (perm !== 'granted') {
          setCustomAlert({
            type: 'error',
            title: 'Permiso Requerido',
            message: 'No se puede guardar de forma local sin conceder permisos de escritura en la carpeta seleccionada.'
          });
          setIsProcessing(false);
          return;
        }
      } catch (err) {
        setCustomAlert({
          type: 'error',
          title: 'Error de Permiso',
          message: 'Error al solicitar acceso a la carpeta de destino: ' + err.message
        });
        setIsProcessing(false);
        return;
      }
    }

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const item = updatedFiles[i];
      if (item.status === 'success') continue;

      updatedFiles[i] = { ...item, status: 'processing' };
      setFiles([...updatedFiles]);

      const result = await processImage(item, i);

      if (result.status === 'success') {
        // Guardar directamente en carpeta local elegida
        if (activeTargetDir) {
          try {
            const fileHandle = await activeTargetDir.getFileHandle(result.resultName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(result.resultBlob);
            await writable.close();
            
            updatedFiles[i] = {
              ...item,
              status: 'success',
              resultBlob: result.resultBlob,
              resultSize: result.resultSize,
              resultName: result.resultName,
              resultWidth: result.resultWidth,
              resultHeight: result.resultHeight
            };
          } catch (writeErr) {
            updatedFiles[i] = {
              ...item,
              status: 'error',
              error: 'Error de escritura local: ' + writeErr.message
            };
          }
        } else {
          // Guardar en memoria temporal
          updatedFiles[i] = {
            ...item,
            status: 'success',
            resultBlob: result.resultBlob,
            resultSize: result.resultSize,
            resultName: result.resultName,
            resultWidth: result.resultWidth,
            resultHeight: result.resultHeight
          };
        }
      } else {
        updatedFiles[i] = {
          ...item,
          status: 'error',
          error: result.error
        };
      }

      setProgress({ current: i + 1, total: files.length });
      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);

    const successfulCount = updatedFiles.filter(f => f.status === 'success').length;
    const errorCount = updatedFiles.filter(f => f.status === 'error').length;

    if (errorCount > 0) {
      setCustomAlert({
        type: 'warning',
        title: 'Proceso Finalizado con Advertencias',
        message: `Se procesaron exitosamente ${successfulCount} archivo(s).\nHubo errores en ${errorCount} archivo(s).\n\nPor favor, verifica los mensajes de error en rojo en la lista.`
      });
    } else {
      setCustomAlert({
        type: 'success',
        title: 'Conversión Completada',
        message: activeTargetDir 
          ? `¡Conversión completada con éxito!\nSe guardaron ${successfulCount} archivo(s) directamente en la carpeta "${targetDirName}".`
          : `¡Conversión completada con éxito!\nSe procesaron ${successfulCount} archivo(s) en memoria.\n\nUsa el botón "Descargar ZIP" en la esquina superior para guardarlos en tu computadora.`
      });
    }
  };

  // Descargar el lote comprimido en ZIP (para navegadores incompatibles)
  const handleDownloadZip = async () => {
    const successFiles = files.filter(f => f.status === 'success' && f.resultBlob);
    if (successFiles.length === 0) return;

    const zip = new JSZip();
    successFiles.forEach(f => {
      zip.file(f.resultName, f.resultBlob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = (baseName.trim() || 'imagenes_optimizadas') + '.zip';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Descargar una imagen individual
  const handleDownloadSingle = (fileItem) => {
    if (!fileItem.resultBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fileItem.resultBlob);
    link.download = fileItem.resultName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Filtrado y agrupación para el Finder
  const filteredFiles = useMemo(() => {
    return files.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.resultName && f.resultName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [files, searchTerm]);

  const groupedFiles = useMemo(() => {
    const groups = {};
    filteredFiles.forEach(f => {
      const key = baseName.trim() ? baseName.trim() : 'Lote sin categorizar';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [filteredFiles, baseName]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-7xl mx-auto w-full pb-12">
      
      {/* Cabecera superior */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Taller de Optimización e Imagen Web</h2>
          <p className="text-[10px] text-neutral-400 mt-0.5">Optimiza formatos a WebP, escala resoluciones de 1K a 8K y renombra lotes en un solo paso</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleClearAll}
            className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300 transition-all flex items-center gap-1.5"
          >
            <Trash2 size={12} /> Limpiar Todo
          </button>
          {files.some(f => f.status === 'success') && !targetDirHandle && (
            <button 
              onClick={handleDownloadZip}
              className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all flex items-center gap-1.5 font-bold"
            >
              <Download size={12} /> Descargar ZIP Optimizado
            </button>
          )}
        </div>
      </header>

      {/* Zona de Carga / Drag and Drop Principal */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={async e => {
          e.preventDefault();
          const droppedFiles = Array.from(e.dataTransfer.files);
          const list = [...files];
          for (const file of droppedFiles) {
            if (file.type.startsWith('image/')) {
              const dimensions = await getImageDimensions(file);
              list.push({
                id: crypto.randomUUID(),
                name: file.name,
                file,
                size: file.size,
                type: file.type,
                width: dimensions.width,
                height: dimensions.height,
                status: 'pending',
                resultBlob: null,
                resultSize: null,
                resultName: '',
                resultWidth: 0,
                resultHeight: 0,
                error: null
              });
            }
          }
          setFiles(list);
        }}
        className="border border-dashed border-white/10 hover:border-white/25 cursor-pointer rounded-3xl p-10 flex flex-col items-center justify-center gap-4 bg-black/10 transition-all text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-neutral-400">
          <ImageIcon size={22} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">Arrastra tus fotos de alta resolución aquí o haz clic para subirlas</p>
          <p className="text-[9px] text-neutral-500 mt-1">Soporta PNG, JPG, WebP, AVIF, HEIC y resoluciones de 1K a 8K</p>
        </div>
      </div>
      
      <input 
        type="file" 
        multiple 
        accept="image/*"
        ref={fileInputRef}
        onChange={handleManualFilesSelect}
        className="hidden" 
      />

      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Panel Lateral: Parámetros del Proceso */}
          <div className="lg:col-span-4 p-6 rounded-3xl border border-white/5 flex flex-col gap-6" style={{ backgroundColor: t.panel }}>
            
            {/* Cabecera sección */}
            <div className="flex items-center gap-2 text-white border-b border-white/5 pb-2">
              <Settings size={14} className="text-neutral-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">Ajustes de Optimización</h4>
            </div>

            {/* Modo de Proceso */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider">Modo de Operación</label>
              <div className="grid grid-cols-2 gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                <button
                  onClick={() => setOpMode('webp')}
                  className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${opMode === 'webp' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                >
                  Convertir a WebP
                </button>
                <button
                  onClick={() => setOpMode('rename')}
                  className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${opMode === 'rename' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                >
                  Solo Renombrar
                </button>
              </div>
            </div>

            {/* Configuración de Nombre */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider">Nombre del Producto (ej. cajon)</label>
                <input 
                  type="text" 
                  placeholder="Ej. cajon"
                  value={baseName}
                  onChange={e => setBaseName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider">Índice Inicial</label>
                  <input 
                    type="number" 
                    min="0"
                    value={startIndex}
                    onChange={e => setStartIndex(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider">Ceros de Relleno</label>
                  <select 
                    value={zeroPadding}
                    onChange={e => setZeroPadding(parseInt(e.target.value))}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none"
                  >
                    <option value="1">1 (1, 2, 3)</option>
                    <option value="2">2 (01, 02, 03)</option>
                    <option value="3">3 (001, 002, 003)</option>
                  </select>
                </div>
              </div>

              {baseName.trim() && (
                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 text-center mt-1">
                  <span className="text-[8px] font-bold text-neutral-500 uppercase block tracking-wider mb-1">Nombre Resultante (Previa):</span>
                  <p className="text-[10px] font-mono text-emerald-400 font-bold">
                    {baseName.trim()}_{String(startIndex).padStart(zeroPadding, '0')}.{opMode === 'webp' ? 'webp' : 'formato'}
                  </p>
                </div>
              )}
            </div>

            {/* Ajustes WebP (Sólo si modo WebP activo) */}
            {opMode === 'webp' && (
              <div className="flex flex-col gap-5 border-t border-white/5 pt-4">
                
                {/* Calidad WebP */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase text-neutral-400 tracking-wider">
                    <span>Calidad de Compresión</span>
                    <span className="font-mono text-white text-[10px] font-bold">{quality}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="100" 
                    value={quality} 
                    onChange={e => setQuality(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-white" 
                  />
                  <p className="text-[8px] text-neutral-500 italic">80% es la relación ideal de calidad-peso</p>
                </div>

                {/* Resolución Límite */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider">Resolución Límite</label>
                  <select 
                    value={maxResolution} 
                    onChange={e => setMaxResolution(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none"
                  >
                    <option value="1200">1K (Máx 1200px - Ideal para Web y Catálogo)</option>
                    <option value="2048">2K (Máx 2048px - Definición Alta)</option>
                    <option value="3840">4K (Máx 3840px - Ultra HD)</option>
                    <option value="original">Resolución Original (Sin cambios de escala)</option>
                  </select>
                </div>

              </div>
            )}

          </div>

          {/* Panel Principal: Archivos y Carpeta de Destino */}
          <div className="lg:col-span-8 p-6 rounded-3xl border border-white/5 flex flex-col gap-6" style={{ backgroundColor: t.panel }}>
            
            {/* Carpeta Destino Local */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Carpeta de Destino Local</span>
                {targetDirName ? (
                  <div 
                    onClick={targetDirPermission !== 'granted' ? () => handleActivateTargetDir() : undefined}
                    className={`flex items-center gap-1.5 mt-1 font-bold text-[10px] ${targetDirPermission === 'granted' ? 'text-emerald-400' : 'text-amber-500 cursor-pointer hover:text-amber-400 transition-colors'}`}
                  >
                    <Folder size={14} /> 
                    <span>{targetDirName}</span>
                    {targetDirPermission === 'granted' ? (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">Activa</span>
                    ) : (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10 animate-pulse">Haga clic para activar</span>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] text-neutral-500 italic mt-1">Ninguna carpeta local elegida (Se descargará en ZIP por defecto)</p>
                )}
              </div>
              
              <div className="flex gap-2">
                {targetDirName && (
                  <button
                    onClick={() => {
                      setTargetDirHandle(null);
                      setTargetDirName('');
                      setTargetDirPermission('prompt');
                      localStorage.removeItem('saved_target_dir_name');
                      saveDirectoryHandle('targetDir', null);
                    }}
                    className="px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all flex items-center justify-center gap-1.5"
                  >
                    Quitar Carpeta
                  </button>
                )}
                {isFileSystemAccessSupported ? (
                  <button
                    onClick={handleSelectTargetDir}
                    className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center justify-center gap-1.5 self-start sm:self-center"
                  >
                    <Folder size={11} /> {targetDirName ? 'Cambiar Carpeta' : 'Seleccionar Carpeta Destino'}
                  </button>
                ) : (
                  <span className="text-[8px] text-neutral-500 italic font-mono">Safari/Firefox: Descarga ZIP automatizada</span>
                )}
              </div>
            </div>

            {/* Listado de archivos procesados y progreso */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-1 rounded text-white font-mono">
                    {files.length} seleccionados
                  </span>
                  <div className="relative max-w-xs w-48">
                    <Search className="absolute left-2.5 top-2 text-neutral-500" size={10} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-950/40 border border-white/5 rounded-xl pl-7 pr-3 py-1 text-[9px] text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isProcessing && (
                    <span className="text-[8px] font-black uppercase text-neutral-400">Procesando {progress.current}/{progress.total}</span>
                  )}
                  <button
                    onClick={handleStartProcess}
                    disabled={isProcessing}
                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 font-bold ${isProcessing ? 'bg-white/10 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200'}`}
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin text-neutral-400" /> : <Play size={12} />}
                    {targetDirHandle ? 'Procesar y Guardar en Carpeta' : 'Procesar Imágenes'}
                  </button>
                </div>
              </div>

              {/* Contenedor tipo Finder */}
              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1 mac-scrollbar">
                {Object.keys(groupedFiles).map(groupName => (
                  <div key={groupName} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 border-b border-white/5 pb-1">
                      <ChevronDown size={11} className="text-neutral-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">{groupName}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                          <tr className="border-b border-white/5 text-[8px] font-black uppercase text-neutral-500 tracking-wider">
                            <th className="py-2 pl-2">Foto Original</th>
                            <th className="py-2">Resolución</th>
                            <th className="py-2">Peso</th>
                            <th className="py-2"><ArrowRight size={10} className="inline mr-1" />Nombre de Salida</th>
                            <th className="py-2">Resultado</th>
                            <th className="py-2 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedFiles[groupName].map((fileItem, idx) => {
                            const isHeavy = fileItem.width > 2000;
                            const previewTarget = generateTargetName(fileItem.name, idx);

                            let compressionBadge = null;
                            if (fileItem.status === 'success' && fileItem.resultSize) {
                              const diff = fileItem.size - fileItem.resultSize;
                              if (diff > 0) {
                                const pct = ((diff / fileItem.size) * 100).toFixed(0);
                                compressionBadge = (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 ml-2">
                                    -{pct}%
                                  </span>
                                );
                              }
                            }

                            return (
                              <tr key={fileItem.id} className="border-b border-white/[0.02] text-[10px] hover:bg-white/[0.01] transition-all group">
                                
                                {/* Thumbnail */}
                                <td className="py-2.5 pl-2 flex items-center gap-3.5 max-w-xs">
                                  <div className="w-9 h-9 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img 
                                      src={URL.createObjectURL(fileItem.file)} 
                                      alt="" 
                                      className="object-cover w-full h-full"
                                      onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                    />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-white font-medium truncate" title={fileItem.name}>
                                      {fileItem.name}
                                    </span>
                                    {fileItem.status === 'error' && (
                                      <span className="text-rose-400 text-[8px] font-semibold mt-0.5 whitespace-normal break-words">
                                        {fileItem.error}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Resolución */}
                                <td className="py-2.5 text-neutral-400 font-mono">
                                  <span className={isHeavy ? 'text-amber-500 font-bold' : ''}>
                                    {fileItem.width}x{fileItem.height}
                                  </span>
                                </td>

                                {/* Peso entrada */}
                                <td className="py-2.5 text-neutral-400 font-mono">
                                  {formatBytes(fileItem.size)}
                                </td>

                                {/* Nombre salida */}
                                <td className="py-2.5 font-medium text-neutral-300 font-mono">
                                  {fileItem.status === 'success' ? (
                                    <span className="text-white font-bold">{fileItem.resultName}</span>
                                  ) : (
                                    <span className="text-neutral-500 italic">{previewTarget}</span>
                                  )}
                                </td>

                                {/* Resultado final y compresión */}
                                <td className="py-2.5 font-mono text-neutral-300">
                                  {fileItem.status === 'success' ? (
                                    <div className="flex items-center">
                                      <span className="text-emerald-400 font-bold">{formatBytes(fileItem.resultSize)}</span>
                                      {compressionBadge}
                                    </div>
                                  ) : (
                                    <span className="text-neutral-600">—</span>
                                  )}
                                </td>

                                {/* Estado del proceso */}
                                <td className="py-2.5 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {fileItem.status === 'pending' && (
                                      <span className="text-[8px] font-black uppercase text-neutral-500 border border-white/5 bg-white/5 px-2 py-0.5 rounded">
                                        Listo
                                      </span>
                                    )}
                                    {fileItem.status === 'processing' && (
                                      <Loader2 size={11} className="animate-spin text-neutral-400" />
                                    )}
                                    {fileItem.status === 'success' && (
                                      <div className="flex items-center gap-1.5">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        {!targetDirHandle && (
                                          <button 
                                            onClick={() => handleDownloadSingle(fileItem)}
                                            className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                            title="Descargar"
                                          >
                                            <Download size={10} />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {fileItem.status === 'error' && (
                                      <AlertCircle size={12} className="text-rose-500" title={fileItem.error} />
                                    )}
                                    
                                    <button 
                                      onClick={() => handleRemoveFile(fileItem.id)}
                                      disabled={isProcessing}
                                      className="p-1 rounded bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:text-rose-400 text-neutral-500 transition-all opacity-0 group-hover:opacity-100"
                                      title="Quitar"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Alerta Modal Personalizada */}
      {customAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: t.panel }}
          >
            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {customAlert.type === 'success' ? (
                <CheckCircle2 className="text-emerald-400" size={24} />
              ) : customAlert.type === 'error' ? (
                <AlertCircle className="text-rose-500" size={24} />
              ) : customAlert.type === 'info' ? (
                <Trash2 className="text-rose-400" size={24} />
              ) : (
                <AlertCircle className="text-amber-500" size={24} />
              )}
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">{customAlert.title}</h3>
              <p className="text-[10px] text-neutral-400 mt-2 whitespace-pre-wrap leading-relaxed">{customAlert.message}</p>
            </div>
            <button
              onClick={() => setCustomAlert(null)}
              className="mt-2 w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all font-bold"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ConversorWebP;
