import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Folder, 
  FileText, 
  Plus, 
  Share2, 
  History, 
  MessageSquare, 
  Trash2, 
  Lock, 
  Unlock, 
  Clock, 
  UserCheck, 
  Users, 
  Database, 
  Layout, 
  Type, 
  Table, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  CheckSquare, 
  Eye, 
  Edit, 
  FileCheck, 
  ChevronRight, 
  Search, 
  Globe, 
  LogOut, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  FolderPlus,
  Play,
  Pause,
  Download,
  AlertCircle,
  Indent,
  Outdent,
  Strikethrough,
  ListOrdered
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';
import { aiService } from '../services/aiService';

// =========================================================================
// CRIPTOGRAFÍA CLIENT-SIDE (SubtleCrypto)
// =========================================================================
const MASTER_SECRET = 'InefableFlowWriterSecretKey2026_SecureMasterKey';
const MASTER_SALT = new Uint8Array([73, 110, 101, 102, 97, 98, 108, 101, 83, 116, 117, 100, 105, 111, 49, 50]); // "InefableStudio12"

async function getMasterKey() {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(MASTER_SECRET);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: MASTER_SALT,
      iterations: 10000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptEmail(email) {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(email.trim().toLowerCase());
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoded
  );
  const ivHex = bytesToHex(iv);
  const cipherHex = bytesToHex(new Uint8Array(ciphertext));
  return `${ivHex}:${cipherHex}`;
}

async function decryptEmail(encryptedStr) {
  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 2) return 'Correo Cifrado';
    const iv = hexToBytes(parts[0]);
    const ciphertext = hexToBytes(parts[1]);
    const key = await getMasterKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return 'Error de cifrado';
  }
}

async function hashPassword(password, saltHex) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = hexToBytes(saltHex);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );
  const exported = await crypto.subtle.exportKey('raw', derivedKey);
  return bytesToHex(new Uint8Array(exported));
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function simpleWordDiff(oldText, newText) {
  const cleanHtml = (html) => html.replace(/<[^>]*>/g, ' ');
  const s1 = cleanHtml(oldText).split(/\s+/).filter(Boolean);
  const s2 = cleanHtml(newText).split(/\s+/).filter(Boolean);
  
  let i = 0, j = 0;
  const out = [];
  
  while (i < s1.length || j < s2.length) {
    if (i < s1.length && j < s2.length && s1[i] === s2[j]) {
      out.push(s1[i]);
      i++; j++;
    } else if (j < s2.length && (i >= s1.length || !s1.slice(i).includes(s2[j]))) {
      out.push(`<span class="bg-[#4ec9b0]/20 text-[#4ec9b0] px-1 border-b border-[#4ec9b0]">${s2[j]}</span>`);
      j++;
    } else {
      out.push(`<span class="bg-[#e04a4a]/20 text-[#e04a4a] px-1 line-through">${s1[i]}</span>`);
      i++;
    }
  }
  return out.join(' ');
}

// =========================================================================
// PLANTILLAS PREDEFINIDAS
// =========================================================================
const PLANTILLAS = [
  {
    id: 'legal',
    titulo: 'Contrato de Servicios',
    categoria: 'Legal',
    icon: 'gavel',
    contenido: `<h1>CONTRATO DE PRESTACIÓN DE SERVICIOS</h1>
<p>Reunidos por una parte el <strong>Contratante</strong> y por la otra el <strong>Prestador</strong>, acuerdan celebrar este acuerdo regulado por las siguientes cláusulas:</p>
<table style="border-collapse: collapse; width: 100%; border: 1px solid #3e4851;">
  <thead>
    <tr>
      <th style="border: 1px solid #3e4851; padding: 10px; text-align: left; background-color: rgba(255,255,255,0.05);">Cláusula</th>
      <th style="border: 1px solid #3e4851; padding: 10px; text-align: left; background-color: rgba(255,255,255,0.05);">Detalle y Obligaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #3e4851; padding: 10px;">Objeto</td>
      <td style="border: 1px solid #3e4851; padding: 10px;">Desarrollo del proyecto audiovisual y de diseño acordado en los requerimientos iniciales.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #3e4851; padding: 10px;">Plazo</td>
      <td style="border: 1px solid #3e4851; padding: 10px;">El trabajo deberá ser entregado en un máximo de 30 días hábiles.</td>
    </tr>
  </tbody>
</table>
<p>Y para que conste, firman de conformidad al pie del presente documento.</p>`
  },
  {
    id: 'marketing',
    titulo: 'Estrategia de Lanzamiento',
    categoria: 'Marketing',
    icon: 'trending-up',
    contenido: `<h1>ESTRATEGIA DE LANZAMIENTO DE PRODUCTO</h1>
<p>Este documento define el embudo de captación, la segmentación y el plan de contenidos para la campaña.</p>
<h2>Checklist de Campaña</h2>
<div class="ft-todo-item" style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
  <input type="checkbox" checked /> <span>Definir el Buyer Persona y dolor principal.</span>
</div>
<div class="ft-todo-item" style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
  <input type="checkbox" /> <span>Crear copys persuasivos para anuncios en Meta.</span>
</div>
<div class="ft-todo-item" style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
  <input type="checkbox" /> <span>Estructurar la Landing Page del producto.</span>
</div>
<p>Presupuesto Estimado: <strong>$1,500 USD</strong></p>`
  },
  {
    id: 'academico',
    titulo: 'Artículo Académico / Reporte',
    categoria: 'Académico',
    icon: 'school',
    contenido: `<h1>TÍTULO DEL REPORTE ACADÉMICO</h1>
<p><strong>Autor:</strong> Colaborador de Inefable Studio<br/><strong>Fecha:</strong> Mayo 2026</p>
<h2>Resumen</h2>
<p>Este artículo investiga los impactos de la automatización digital en procesos organizacionales contemporáneos.</p>
<h2>1. Introducción</h2>
<p>Las arquitecturas de software modernas priorizan el cifrado Zero-Knowledge para salvaguardar la privacidad de datos corporativos de extremo a extremo.</p>`
  },
  {
    id: 'negocios',
    titulo: 'Minuta de Reunión',
    categoria: 'Negocios',
    icon: 'business_center',
    contenido: `<h1>MINUTA DE REUNIÓN SEMANAL</h1>
<p><strong>Fecha:</strong> 30 de Mayo de 2026<br/><strong>Asistentes:</strong> Creador, Editor, IA Copilot</p>
<h2>Puntos Tratados</h2>
<ul>
  <li>Sincronización de carpetas de almacenamiento local.</li>
  <li>Flujo de Trabajo integrado estilo Microsoft Word con Ribbon.</li>
  <li>Estadísticas de metas de escritura.</li>
</ul>`
  }
];

// =========================================================================
// REGLA SUPERIOR DE PÁGINA (Word Ruler)
// =========================================================================
function PageRuler({ margins, orientation }) {
  const isVertical = orientation === 'vertical';
  const widthCm = isVertical ? 21 : 29.7;
  const totalTicks = Math.floor(widthCm);
  
  let marginCm = 2.5;
  if (margins === 'narrow') marginCm = 1.27;
  if (margins === 'wide') marginCm = 5.08;

  return (
    <div className="w-full h-4 bg-neutral-800/20 border-b border-neutral-700/30 flex items-center relative select-none" style={{ fontSize: '7px', color: '#6b7280', minHeight: '16px' }}>
      {/* Margins */}
      <div className="absolute left-0 top-0 bottom-0 bg-neutral-700/10 border-r border-neutral-700/20" style={{ width: `${(marginCm / widthCm) * 100}%` }} />
      <div className="absolute right-0 top-0 bottom-0 bg-neutral-700/10 border-l border-neutral-700/20" style={{ width: `${(marginCm / widthCm) * 100}%` }} />
      
      {/* Ticks */}
      {Array.from({ length: totalTicks + 1 }).map((_, i) => {
        const leftPercent = (i / widthCm) * 100;
        return (
          <div key={i} className="absolute flex flex-col items-center" style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}>
            <span className="text-[6px] leading-none mb-0.5">{i}</span>
            <div className="w-px h-1 bg-neutral-600/30" />
          </div>
        );
      })}
    </div>
  );
}

// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================
export default function FlujoTrabajo({ settings, isDark }) {
  const t = useMemo(() => getTheme(isDark), [isDark]);

  // --- Estados de Sesión ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- Estados de Datos ---
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [shares, setShares] = useState([]);
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);

  // --- Modales y UI ---
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('archivos'); // 'archivos' | 'compartidos' | 'admin'
  const [ribbonTab, setRibbonTab] = useState('inicio'); // 'inicio' | 'insertar' | 'disposicion' | 'revision' | 'vista'
  const [contextMenu, setContextMenu] = useState(null); // { x: 0, y: 0, targetCell: null, targetTable: null }
  
  // --- Propiedades del Editor ---
  const editorRef = useRef(null);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState('14px');
  const [margins, setMargins] = useState('normal'); // 'normal' | 'narrow' | 'wide'
  const [orientation, setOrientation] = useState('vertical'); // 'vertical' | 'horizontal'
  const [pageColor, setPageColor] = useState('dark'); // 'dark' | 'light'
  const [wordCount, setWordCount] = useState(0);

  // --- Compartir ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('lector');
  const [shareExpiry, setShareExpiry] = useState('unlimited'); // 'unlimited' | '1day' | '3days' | '7days'
  const [shareMessage, setShareMessage] = useState('');

  // --- Versiones & Comentarios ---
  const [rightSidebarMode, setRightSidebarMode] = useState(null); // null | 'comentarios' | 'versiones' | 'copilot'
  const [newComment, setNewComment] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [viewingVersion, setViewingVersion] = useState(null); // Si visualizamos una versión histórica
  
  // --- Word Engine & Copilot states ---
  const [zoom, setZoom] = useState(100);
  const [focusedPageIndex, setFocusedPageIndex] = useState(0);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [pageUpdateTrigger, setPageUpdateTrigger] = useState(0);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState([
    { role: 'assistant', content: 'Hola Carlos. Soy tu Asistente Neural de Flujo. Puedo redactar documentos estilo Word (usando múltiples páginas), crear carpetas, o generar plantillas personalizadas. ¿En qué te ayudo hoy?' }
  ]);
  const [customTemplates, setCustomTemplates] = useState(() => {
    const saved = localStorage.getItem('ft_custom_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const [showRuler, setShowRuler] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [pageOverflows, setPageOverflows] = useState({});
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const pagesContainerRef = useRef(null);

  const pages = useMemo(() => {
    if (!activeDoc?.contenido) return [''];
    return activeDoc.contenido.split('<!-- pagebreak -->');
  }, [activeDoc?.id, pageUpdateTrigger]);

  const checkOverflows = () => {
    if (!pagesContainerRef.current) return;
    const pageDivs = pagesContainerRef.current.querySelectorAll('.word-page-content');
    const overflows = {};
    const limit = orientation === 'vertical' ? 1123 : 794;
    const availableHeight = limit - (showRuler ? 16 : 0);
    
    pageDivs.forEach((div, idx) => {
      // Usar altura disponible con tolerancia de 10px para evitar falsos positivos
      if (div.scrollHeight > availableHeight + 10) {
        overflows[idx] = true;
      } else {
        overflows[idx] = false;
      }
    });
    
    setPageOverflows(prev => {
      const changed = Object.keys(overflows).some(k => prev[k] !== overflows[k]) || 
                      Object.keys(prev).length !== Object.keys(overflows).length;
      return changed ? overflows : prev;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkOverflows();
    }, 100);
    return () => clearTimeout(timer);
  }, [pages, orientation, margins, fontSize, fontFamily, zoom, activeDoc?.id, pageUpdateTrigger, showRuler]);

  const getJoinedHTML = () => {
    if (!pagesContainerRef.current) return activeDoc?.contenido || '';
    const pageDivs = pagesContainerRef.current.querySelectorAll('.word-page-content');
    const pageContents = Array.from(pageDivs).map(div => div.innerHTML);
    return pageContents.join('<!-- pagebreak -->');
  };

  const focusActivePage = () => {
    if (pagesContainerRef.current) {
      const pageDivs = pagesContainerRef.current.querySelectorAll('.word-page-content');
      const activePage = pageDivs[focusedPageIndex] || pageDivs[0];
      if (activePage) activePage.focus();
    }
  };

  // --- Admin Console ---
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // --- Pomodoro / Enfoque Timer ---
  const [focusActive, setFocusActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(1500); // 25 min default
  const focusInterval = useRef(null);

  // --- Fallback Alert ---
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // =========================================================================
  // AUTOMÁTICO INICIO DE SESIÓN PARA EL CREADOR (Bypass del login)
  // =========================================================================
  const autoLoginCreator = () => {
    const creatorSession = {
      id: 'creator-admin-uuid-static-1111',
      email_hash: 'creator-hash-placeholder',
      email_decrypted: 'carlosjoelsb@gmail.com',
      rol: 'creador_admin'
    };
    setCurrentUser(creatorSession);
    localStorage.setItem('ft_session', JSON.stringify(creatorSession));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('ft_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        autoLoginCreator();
      }
    } else {
      autoLoginCreator(); // Inicia sesión automáticamente
    }
  }, []);

  // Cargar datos al iniciar sesión
  useEffect(() => {
    if (currentUser) {
      fetchFolders();
      fetchDocuments();
      if (currentUser.rol === 'creador_admin') {
        fetchAdminUsers();
      }
    } else {
      setFolders([]);
      setDocuments([]);
      setActiveDoc(null);
    }
  }, [currentUser]);

  // Monitorear contador de palabras del documento activo
  useEffect(() => {
    if (activeDoc) {
      calculateWordCount();
    }
  }, [activeDoc]);

  // Pomodoro Timer Effect
  useEffect(() => {
    if (focusActive) {
      focusInterval.current = setInterval(() => {
        setFocusSeconds(prev => {
          if (prev <= 1) {
            clearInterval(focusInterval.current);
            setFocusActive(false);
            alert("¡Sesión de enfoque completada!");
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(focusInterval.current);
    }
    return () => clearInterval(focusInterval.current);
  }, [focusActive]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- OPERACIONES DB / LOCALSTORAGE ---

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('flujo_trabajo_carpetas')
        .select('*')
        .eq('owner_id', currentUser.id);
      
      if (error) throw error;
      
      const local = JSON.parse(localStorage.getItem('ft_folders') || '[]');
      const filteredLocal = local.filter(f => f.owner_id === currentUser.id);
      
      const merged = [...(data || [])];
      filteredLocal.forEach(localFolder => {
        if (!merged.some(f => f.id === localFolder.id)) {
          merged.push(localFolder);
        }
      });
      
      setFolders(merged);
      setIsFallbackMode(false);
    } catch (e) {
      setIsFallbackMode(true);
      const local = JSON.parse(localStorage.getItem('ft_folders') || '[]');
      const filtered = local.filter(f => f.owner_id === currentUser.id);
      setFolders(filtered);
    }
  };

  const createFolderWithName = async (folderName) => {
    if (!folderName.trim()) return;
    const newFolderObj = {
      id: crypto.randomUUID(),
      nombre: folderName.trim(),
      owner_id: currentUser.id,
      created_at: new Date().toISOString()
    };

    const local = JSON.parse(localStorage.getItem('ft_folders') || '[]');
    local.push(newFolderObj);
    localStorage.setItem('ft_folders', JSON.stringify(local));
    setFolders(prev => [...prev, newFolderObj]);

    try {
      if (isFallbackMode) throw new Error("Fallback manual");
      const { error } = await supabase
        .from('flujo_trabajo_carpetas')
        .insert(newFolderObj);
      if (error) throw error;
    } catch (e) {
      console.warn("Error saving folder to Supabase, running in local fallback:", e);
      setIsFallbackMode(true);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolderWithName(newFolderName);
    setNewFolderName('');
    setShowFolderModal(false);
  };

  const deleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar esta carpeta? Los documentos dentro de ella se mantendrán pero quedarán sin carpeta.')) return;
    
    const localFolders = JSON.parse(localStorage.getItem('ft_folders') || '[]');
    const filteredFolders = localFolders.filter(f => f.id !== folderId);
    localStorage.setItem('ft_folders', JSON.stringify(filteredFolders));
    
    const localDocs = JSON.parse(localStorage.getItem('ft_documents') || '[]');
    localDocs.forEach(d => {
      if (d.folder_id === folderId) d.folder_id = null;
    });
    localStorage.setItem('ft_documents', JSON.stringify(localDocs));
    
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setDocuments(prev => prev.map(d => d.folder_id === folderId ? { ...d, folder_id: null } : d));
    
    if (activeFolderId === folderId) {
      setActiveFolderId(null);
    }

    try {
      if (isFallbackMode) throw new Error("Fallback");
      const { error: docErr } = await supabase
        .from('flujo_trabajo_documentos')
        .update({ folder_id: null })
        .eq('folder_id', folderId);
      if (docErr) throw docErr;

      const { error } = await supabase
        .from('flujo_trabajo_carpetas')
        .delete()
        .eq('id', folderId);
      if (error) throw error;
    } catch (err) {
      console.warn("Error deleting folder from Supabase, running in local fallback:", err);
      setIsFallbackMode(true);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data: ownDocs, error: err1 } = await supabase
        .from('flujo_trabajo_documentos')
        .select('*')
        .eq('owner_id', currentUser.id);
      if (err1) throw err1;

      const { data: sharedRelations, error: err2 } = await supabase
        .from('flujo_trabajo_compartidos')
        .select('documento_id, rol, expira_el')
        .eq('usuario_id', currentUser.id);
      if (err2) throw err2;

      let sharedDocs = [];
      if (sharedRelations && sharedRelations.length > 0) {
        const validRelations = sharedRelations.filter(rel => {
          if (!rel.expira_el) return true;
          return new Date() < new Date(rel.expira_el);
        });

        if (validRelations.length > 0) {
          const docIds = validRelations.map(r => r.documento_id);
          const { data: rawShared, error: err3 } = await supabase
            .from('flujo_trabajo_documentos')
            .select('*')
            .in('id', docIds);
          if (err3) throw err3;
          
          sharedDocs = (rawShared || []).map(d => {
            const rel = validRelations.find(r => r.documento_id === d.id);
            return { ...d, isShared: true, sharedRole: rel ? rel.rol : 'lector' };
          });
        }
      }

      const remoteDocs = [...(ownDocs || []), ...sharedDocs];
      const localDocs = JSON.parse(localStorage.getItem('ft_documents') || '[]');
      const ownLocal = localDocs.filter(d => d.owner_id === currentUser.id);
      
      const localShares = JSON.parse(localStorage.getItem('ft_shares') || '[]');
      const activeShares = localShares.filter(s => s.usuario_id === currentUser.id && (!s.expira_el || new Date() < new Date(s.expira_el)));
      
      const sharedLocal = localDocs.filter(d => activeShares.some(s => s.documento_id === d.id)).map(d => {
        const shObj = activeShares.find(s => s.documento_id === d.id);
        return { ...d, isShared: true, sharedRole: shObj.rol };
      });

      const mergedLocal = [...ownLocal, ...sharedLocal];
      const merged = [...remoteDocs];
      mergedLocal.forEach(localDoc => {
        if (!merged.some(d => d.id === localDoc.id)) {
          merged.push(localDoc);
        }
      });

      setDocuments(merged);
      setIsFallbackMode(false);
    } catch (e) {
      setIsFallbackMode(true);
      const localDocs = JSON.parse(localStorage.getItem('ft_documents') || '[]');
      const own = localDocs.filter(d => d.owner_id === currentUser.id);
      
      const localShares = JSON.parse(localStorage.getItem('ft_shares') || '[]');
      const activeShares = localShares.filter(s => s.usuario_id === currentUser.id && (!s.expira_el || new Date() < new Date(s.expira_el)));
      
      const shared = localDocs.filter(d => activeShares.some(s => s.documento_id === d.id)).map(d => {
        const shObj = activeShares.find(s => s.documento_id === d.id);
        return { ...d, isShared: true, sharedRole: shObj.rol };
      });

      setDocuments([...own, ...shared]);
    }
  };

  const createDocument = async (titulo = 'Sin Título', contenido = '', templateId = null) => {
    const newDocObj = {
      id: crypto.randomUUID(),
      titulo,
      contenido,
      owner_id: currentUser.id,
      folder_id: activeFolderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const local = JSON.parse(localStorage.getItem('ft_documents') || '[]');
    local.unshift(newDocObj);
    localStorage.setItem('ft_documents', JSON.stringify(local));
    setDocuments(prev => [newDocObj, ...prev]);
    setActiveDoc(newDocObj);

    try {
      if (isFallbackMode) throw new Error("Fallback manual");
      const { error } = await supabase
        .from('flujo_trabajo_documentos')
        .insert(newDocObj);
      if (error) throw error;
    } catch (e) {
      console.warn("Error creating document in Supabase, running in local fallback:", e);
      setIsFallbackMode(true);
    }
  };

  const saveDocumentContent = async () => {
    if (!activeDoc || viewingVersion) return;
    const updatedContent = getJoinedHTML();
    
    const updatedDoc = {
      ...activeDoc,
      contenido: updatedContent,
      updated_at: new Date().toISOString()
    };

    saveVersionLog(activeDoc.id, updatedContent);

    const local = JSON.parse(localStorage.getItem('ft_documents') || '[]');
    const index = local.findIndex(d => d.id === activeDoc.id);
    if (index !== -1) {
      local[index] = { ...local[index], contenido: updatedContent, updated_at: updatedDoc.updated_at };
    } else {
      local.unshift(updatedDoc);
    }
    localStorage.setItem('ft_documents', JSON.stringify(local));

    setDocuments(prev => prev.map(d => d.id === activeDoc.id ? updatedDoc : d));
    setActiveDoc(updatedDoc);

    try {
      if (isFallbackMode) throw new Error("Fallback manual");
      const { error } = await supabase
        .from('flujo_trabajo_documentos')
        .update({ contenido: updatedContent, updated_at: updatedDoc.updated_at })
        .eq('id', activeDoc.id);
      if (error) throw error;
    } catch (e) {
      console.warn("Error saving document content to Supabase, running in local fallback:", e);
      setIsFallbackMode(true);
    }
  };

  const deleteDocument = async (docId) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    
    const local = JSON.parse(localStorage.getItem('ft_documents') || '[]');
    const filtered = local.filter(d => d.id !== docId);
    localStorage.setItem('ft_documents', JSON.stringify(filtered));
    
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (activeDoc && activeDoc.id === docId) {
      setActiveDoc(null);
    }

    try {
      if (isFallbackMode) throw new Error("Fallback");
      const { error } = await supabase
        .from('flujo_trabajo_documentos')
        .delete()
        .eq('id', docId);
      if (error) throw error;
    } catch (e) {
      console.warn("Error deleting document from Supabase, running in local fallback:", e);
      setIsFallbackMode(true);
    }
  };

  // --- GESTIÓN DE COMPARTICIÓN Y EXPIRACIÓN ---

  const fetchShares = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('flujo_trabajo_compartidos')
        .select('*')
        .eq('documento_id', docId);
      if (error) throw error;
      
      const enriched = await Promise.all((data || []).map(async (sh) => {
        let email = 'Invitado';
        try {
          const { data: usr } = await supabase.from('flujo_trabajo_usuarios').select('email_encrypted').eq('id', sh.usuario_id).single();
          if (usr) email = await decryptEmail(usr.email_encrypted);
        } catch {}
        return { ...sh, email };
      }));
      setShares(enriched);
    } catch (e) {
      const localShares = JSON.parse(localStorage.getItem('ft_shares') || '[]');
      const filtered = localShares.filter(s => s.documento_id === docId);
      const enriched = filtered.map(sh => {
        const localUsers = JSON.parse(localStorage.getItem('ft_users') || '[]');
        const u = localUsers.find(user => user.id === sh.usuario_id);
        const email = u ? u.email_decrypted : 'Invitado';
        return { ...sh, email };
      });
      setShares(enriched);
    }
  };

  const shareDocument = async () => {
    if (!shareEmail.trim()) return;
    setShareMessage('');
    try {
      const emailHash = await sha256(shareEmail);
      
      let targetUser = null;
      try {
        const { data, error } = await supabase
          .from('flujo_trabajo_usuarios')
          .select('id')
          .eq('email_hash', emailHash)
          .single();
        if (data) targetUser = data;
      } catch {
        const localUsers = JSON.parse(localStorage.getItem('ft_users') || '[]');
        const found = localUsers.find(u => u.email_hash === emailHash);
        if (found) targetUser = found;
      }

      if (!targetUser) {
        setShareMessage('El correo ingresado no está registrado en Flujo de Trabajo.');
        return;
      }

      if (targetUser.id === currentUser.id) {
        setShareMessage('No puedes compartir un archivo contigo mismo.');
        return;
      }

      let expira_el = null;
      const ahora = new Date();
      if (shareExpiry === '1day') {
        ahora.setDate(ahora.getDate() + 1);
        expira_el = ahora.toISOString();
      } else if (shareExpiry === '3days') {
        ahora.setDate(ahora.getDate() + 3);
        expira_el = ahora.toISOString();
      } else if (shareExpiry === '7days') {
        ahora.setDate(ahora.getDate() + 7);
        expira_el = ahora.toISOString();
      }

      const shareObj = {
        id: crypto.randomUUID(),
        documento_id: activeDoc.id,
        usuario_id: targetUser.id,
        rol: shareRole,
        expira_el,
        created_at: new Date().toISOString()
      };

      try {
        if (isFallbackMode) throw new Error("Fallback");
        const { error } = await supabase
          .from('flujo_trabajo_compartidos')
          .insert(shareObj);
        if (error) throw error;
      } catch {
        const localShares = JSON.parse(localStorage.getItem('ft_shares') || '[]');
        localShares.push(shareObj);
        localStorage.setItem('ft_shares', JSON.stringify(localShares));
      }

      setShareEmail('');
      setShareMessage('¡Documento compartido correctamente!');
      fetchShares(activeDoc.id);
    } catch (e) {
      setShareMessage('Error al compartir: ' + e.message);
    }
  };

  const revokeShare = async (shareId) => {
    try {
      if (isFallbackMode) throw new Error("Fallback");
      const { error } = await supabase
        .from('flujo_trabajo_compartidos')
        .delete()
        .eq('id', shareId);
      if (error) throw error;
    } catch {
      const localShares = JSON.parse(localStorage.getItem('ft_shares') || '[]');
      const filtered = localShares.filter(s => s.id !== shareId);
      localStorage.setItem('ft_shares', JSON.stringify(filtered));
    }
    setShares(prev => prev.filter(s => s.id !== shareId));
  };

  // --- CONTROL DE COMENTARIOS ---

  const fetchComments = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('flujo_trabajo_comentarios')
        .select('*')
        .eq('documento_id', docId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      
      const localComments = JSON.parse(localStorage.getItem('ft_comments') || '[]');
      const filtered = localComments.filter(c => c.documento_id === docId);
      
      const merged = [...(data || [])];
      filtered.forEach(localComment => {
        if (!merged.some(c => c.id === localComment.id)) {
          merged.push(localComment);
        }
      });
      merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      setComments(merged);
    } catch {
      const localComments = JSON.parse(localStorage.getItem('ft_comments') || '[]');
      const filtered = localComments.filter(c => c.documento_id === docId);
      setComments(filtered);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const commentObj = {
      id: crypto.randomUUID(),
      documento_id: activeDoc.id,
      usuario_id: currentUser.id,
      email_decrypted: currentUser.email_decrypted,
      contenido: newComment.trim(),
      created_at: new Date().toISOString()
    };

    const localComments = JSON.parse(localStorage.getItem('ft_comments') || '[]');
    localComments.push(commentObj);
    localStorage.setItem('ft_comments', JSON.stringify(localComments));
    setComments(prev => [...prev, commentObj]);

    try {
      if (isFallbackMode) throw new Error("Fallback");
      const { error } = await supabase
        .from('flujo_trabajo_comentarios')
        .insert(commentObj);
      if (error) throw error;
    } catch {
      setIsFallbackMode(true);
    }
    setNewComment('');
  };

  // --- HISTORIAL DE VERSIONES ---

  const fetchVersions = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('flujo_trabajo_versiones')
        .select('*')
        .eq('documento_id', docId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const localVersions = JSON.parse(localStorage.getItem('ft_versions') || '[]');
      const filtered = localVersions.filter(v => v.documento_id === docId);
      
      const merged = [...(data || [])];
      filtered.forEach(localVersion => {
        if (!merged.some(v => v.id === localVersion.id)) {
          merged.push(localVersion);
        }
      });
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setVersions(merged);
    } catch {
      const localVersions = JSON.parse(localStorage.getItem('ft_versions') || '[]');
      const filtered = localVersions.filter(v => v.documento_id === docId).reverse();
      setVersions(filtered);
    }
  };

  const saveVersionLog = async (docId, htmlContent, desc = 'Guardado automático') => {
    const versionObj = {
      id: crypto.randomUUID(),
      documento_id: docId,
      contenido: htmlContent,
      cambio_descripcion: desc,
      created_at: new Date().toISOString()
    };

    const localVersions = JSON.parse(localStorage.getItem('ft_versions') || '[]');
    localVersions.push(versionObj);
    localStorage.setItem('ft_versions', JSON.stringify(localVersions));
    setVersions(prev => [versionObj, ...prev]);

    try {
      if (isFallbackMode) throw new Error("Fallback");
      const { error } = await supabase
        .from('flujo_trabajo_versiones')
        .insert(versionObj);
      if (error) throw error;
    } catch {
      setIsFallbackMode(true);
    }
  };

  const handleManualVersion = () => {
    if (!versionDescription.trim()) return;
    const content = getJoinedHTML();
    saveVersionLog(activeDoc.id, content, versionDescription.trim());
    setVersionDescription('');
    alert('¡Versión manual guardada!');
  };

  const restoreVersion = async (versionObj) => {
    if (!confirm('¿Deseas restaurar el documento a este punto del historial? La versión actual será sobreescrita.')) return;
    
    const currentContent = getJoinedHTML();
    await saveVersionLog(activeDoc.id, currentContent, 'Respaldo antes de restauración');
    
    const updatedDoc = {
      ...activeDoc,
      contenido: versionObj.contenido,
      updated_at: new Date().toISOString()
    };

    try {
      if (isFallbackMode) throw new Error("Fallback");
      const { error } = await supabase
        .from('flujo_trabajo_documentos')
        .update({ contenido: versionObj.contenido, updated_at: updatedDoc.updated_at })
        .eq('id', activeDoc.id);
      if (error) throw error;
    } catch {
      const local = JSON.parse(localStorage.getItem('ft_documents') || '[]');
      const index = local.findIndex(d => d.id === activeDoc.id);
      if (index !== -1) {
        local[index] = { ...local[index], contenido: versionObj.contenido, updated_at: updatedDoc.updated_at };
        localStorage.setItem('ft_documents', JSON.stringify(local));
      }
    }

    setDocuments(prev => prev.map(d => d.id === activeDoc.id ? updatedDoc : d));
    setActiveDoc(updatedDoc);
    setPageUpdateTrigger(prev => prev + 1);
    setViewingVersion(null);
    setRightSidebarMode(null);
    alert('Documento restaurado.');
  };

  // --- CONSOLA DEL CREADOR (ADMIN PANEL) ---

  const fetchAdminUsers = async () => {
    setAdminLoading(true);
    try {
      const { data: usrs, error: err1 } = await supabase.from('flujo_trabajo_usuarios').select('*');
      if (err1) throw err1;
      
      const { data: docs, error: err2 } = await supabase.from('flujo_trabajo_documentos').select('owner_id');
      if (err2) throw err2;

      const enriched = await Promise.all((usrs || []).map(async (u) => {
        const decrypted = await decryptEmail(u.email_encrypted);
        const userDocs = (docs || []).filter(d => d.owner_id === u.id).length;
        return {
          ...u,
          email_decrypted: decrypted,
          document_count: userDocs
        };
      }));
      setAdminUsers(enriched);
    } catch (e) {
      const localUsers = JSON.parse(localStorage.getItem('ft_users') || '[]');
      const localDocs = JSON.parse(localStorage.getItem('ft_documents') || '[]');
      
      const enriched = localUsers.map(u => {
        const count = localDocs.filter(d => d.owner_id === u.id).length;
        return {
          ...u,
          document_count: count
        };
      });
      setAdminUsers(enriched);
    } finally {
      setAdminLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'activo' ? 'suspendido' : 'activo';
    try {
      if (isFallbackMode) throw new Error("Fallback");
      const { error } = await supabase
        .from('flujo_trabajo_usuarios')
        .update({ estado: nextStatus })
        .eq('id', userId);
      if (error) throw error;
    } catch {
      const localUsers = JSON.parse(localStorage.getItem('ft_users') || '[]');
      const index = localUsers.findIndex(u => u.id === userId);
      if (index !== -1) {
        localUsers[index].estado = nextStatus;
        localStorage.setItem('ft_users', JSON.stringify(localUsers));
      }
    }
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, estado: nextStatus } : u));
  };

  // --- AUTENTICACIÓN ---

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Por favor introduce tu correo y contraseña.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      const emailHash = await sha256(emailInput);
      
      if (authMode === 'register') {
        const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
        const passwordHash = await hashPassword(passwordInput, salt);
        const encryptedEmail = await encryptEmail(emailInput);

        let isFirstUser = false;
        try {
          const { count } = await supabase.from('flujo_trabajo_usuarios').select('id', { count: 'exact', head: true });
          isFirstUser = count === 0;
        } catch {
          const localUsers = JSON.parse(localStorage.getItem('ft_users') || '[]');
          isFirstUser = localUsers.length === 0;
        }

        const newUserObj = {
          id: crypto.randomUUID(),
          email_hash: emailHash,
          email_encrypted: encryptedEmail,
          password_hash: passwordHash,
          password_salt: salt,
          rol: isFirstUser ? 'creador_admin' : 'miembro',
          estado: 'activo',
          created_at: new Date().toISOString()
        };

        try {
          if (isFallbackMode) throw new Error("Fallback manual");
          const { error } = await supabase
            .from('flujo_trabajo_usuarios')
            .insert(newUserObj);
          if (error) throw error;
        } catch {
          setIsFallbackMode(true);
          const localUsers = JSON.parse(localStorage.getItem('ft_users') || '[]');
          if (localUsers.some(u => u.email_hash === emailHash)) {
            throw new Error("El usuario ya existe localmente.");
          }
          localUsers.push({ ...newUserObj, email_decrypted: emailInput.trim().toLowerCase() });
          localStorage.setItem('ft_users', JSON.stringify(localUsers));
        }

        alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
        setAuthMode('login');
      } else {
        // LOGIN
        let userRecord = null;
        try {
          const { data, error } = await supabase
            .from('flujo_trabajo_usuarios')
            .select('*')
            .eq('email_hash', emailHash)
            .single();
          if (error) throw error;
          userRecord = data;
        } catch {
          setIsFallbackMode(true);
          const localUsers = JSON.parse(localStorage.getItem('ft_users') || '[]');
          const found = localUsers.find(u => u.email_hash === emailHash);
          if (found) userRecord = found;
        }

        if (!userRecord) {
          setAuthError('Correo o contraseña incorrectos.');
          setAuthLoading(false);
          return;
        }

        if (userRecord.estado === 'suspendido') {
          setAuthError('Tu cuenta está suspendida. Contacta al creador.');
          setAuthLoading(false);
          return;
        }

        const derivedHash = await hashPassword(passwordInput, userRecord.password_salt);
        if (derivedHash !== userRecord.password_hash) {
          setAuthError('Correo o contraseña incorrectos.');
          setAuthLoading(false);
          return;
        }

        const decEmail = await decryptEmail(userRecord.email_encrypted);
        const sessionUser = {
          id: userRecord.id,
          email_hash: userRecord.email_hash,
          email_decrypted: decEmail || emailInput.trim().toLowerCase(),
          rol: userRecord.rol
        };

        setCurrentUser(sessionUser);
        localStorage.setItem('ft_session', JSON.stringify(sessionUser));
      }
    } catch (err) {
      setAuthError('Fallo en la autenticación: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ft_session');
    setActiveSidebarTab('archivos');
  };

  // =========================================================================
  // LOGICA E INTERACCIONES DEL EDITOR RIBBON
  // =========================================================================
  const execCommand = (command, value = null) => {
    if (viewingVersion) return;
    document.execCommand(command, false, value);
    focusActivePage();
    calculateWordCount();
  };

  // Aplica estilos de párrafo o títulos (Dropdown de Microsoft Word)
  const handleStyleChange = (val) => {
    if (val === 'p') execCommand('formatBlock', 'P');
    else if (val === 'h1') execCommand('formatBlock', 'H1');
    else if (val === 'h2') execCommand('formatBlock', 'H2');
    else if (val === 'h3') execCommand('formatBlock', 'H3');
    else if (val === 'pre') execCommand('formatBlock', 'PRE');
  };

  // Aplica tipografías del sistema de forma limpia
  const changeFontFamily = (family) => {
    setFontFamily(family);
    execCommand('fontName', 'tempFamily');
    if (pagesContainerRef.current) {
      const fontElems = pagesContainerRef.current.querySelectorAll('font[face="tempFamily"]');
      fontElems.forEach(font => {
        font.removeAttribute('face');
        font.style.fontFamily = family;
        const span = document.createElement('span');
        span.style.fontFamily = family;
        span.innerHTML = font.innerHTML;
        font.parentNode.replaceChild(span, font);
      });
    }
  };

  // Aplica escala de tamaños en pixeles reales (8px - 72px)
  const changeFontSize = (sizeStr) => {
    setFontSize(sizeStr);
    execCommand('fontSize', '7'); // temporal
    if (pagesContainerRef.current) {
      const fontElems = pagesContainerRef.current.querySelectorAll('font[size="7"]');
      fontElems.forEach(font => {
        font.removeAttribute('size');
        font.style.fontSize = sizeStr;
        const span = document.createElement('span');
        span.style.fontSize = sizeStr;
        span.innerHTML = font.innerHTML;
        font.parentNode.replaceChild(span, font);
      });
    }
  };

  const insertChecklist = () => {
    const checklistHtml = `<div class="ft-todo-item" style="display: flex; align-items: center; gap: 8px; margin: 4px 0;"><input type="checkbox" style="width: 16px; height: 16px;" /> <span>Nuevo checklist</span></div>`;
    insertHtmlAtCursor(checklistHtml);
  };

  const insertWysiwygTable = (rows = 3, cols = 3) => {
    let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid #3e4851; margin: 10px 0;" class="ft-wysiwyg-table"><thead><tr>`;
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th style="border: 1px solid #3e4851; padding: 10px; text-align: left; background-color: rgba(255,255,255,0.05);">Encabezado</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < rows - 1; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td style="border: 1px solid #3e4851; padding: 10px;">Dato</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p></p>`;
    insertHtmlAtCursor(tableHtml);
  };

  const insertHtmlAtCursor = (html) => {
    if (viewingVersion) return;
    let sel, range;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        const el = document.createElement("div");
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
    calculateWordCount();
  };

  const getSelectedTable = () => {
    if (!window.getSelection().rangeCount) return null;
    let node = window.getSelection().anchorNode;
    while (node && node !== pagesContainerRef.current) {
      if (node.nodeName === 'TABLE') return node;
      node = node.parentNode;
    }
    return null;
  };

  const addRowToTable = () => {
    const table = getSelectedTable();
    if (!table) return alert('Por favor sitúa el cursor dentro de una celda de la tabla.');
    const rows = table.rows;
    if (rows.length === 0) return;
    const newRow = table.insertRow(-1);
    const colsCount = rows[0].cells.length;
    for (let i = 0; i < colsCount; i++) {
      const cell = newRow.insertCell(i);
      cell.innerHTML = 'Dato';
      cell.setAttribute('style', 'border: 1px solid #3e4851; padding: 10px;');
    }
    saveDocumentContent();
  };

  const addColToTable = () => {
    const table = getSelectedTable();
    if (!table) return alert('Por favor sitúa el cursor dentro de una celda de la tabla.');
    const rows = table.rows;
    for (let i = 0; i < rows.length; i++) {
      const cell = i === 0 ? document.createElement('th') : rows[i].insertCell(-1);
      cell.innerHTML = i === 0 ? 'Encabezado' : 'Dato';
      cell.setAttribute('style', 'border: 1px solid #3e4851; padding: 10px; ' + (i === 0 ? 'background-color: rgba(255,255,255,0.05); text-align: left;' : ''));
      if (i === 0) rows[i].appendChild(cell);
    }
    saveDocumentContent();
  };

  const insertRowBelow = (table, cell) => {
    if (!table || !cell) return;
    const row = cell.parentNode;
    const rowIndex = row.rowIndex;
    const newRow = table.insertRow(rowIndex + 1);
    const colsCount = table.rows[0].cells.length;
    for (let i = 0; i < colsCount; i++) {
      const newCell = newRow.insertCell(i);
      newCell.innerHTML = 'Dato';
      newCell.setAttribute('style', 'border: 1px solid #3e4851; padding: 10px;');
    }
    saveDocumentContent();
  };

  const insertColRight = (table, cell) => {
    if (!table || !cell) return;
    const cellIndex = cell.cellIndex;
    const rows = table.rows;
    for (let i = 0; i < rows.length; i++) {
      const newCell = i === 0 && rows[i].cells[cellIndex].nodeName === 'TH' 
        ? document.createElement('th') 
        : rows[i].insertCell(cellIndex + 1);
      
      newCell.innerHTML = i === 0 ? 'Encabezado' : 'Dato';
      newCell.setAttribute('style', 'border: 1px solid #3e4851; padding: 10px; ' + 
        (i === 0 ? 'background-color: rgba(255,255,255,0.05); text-align: left;' : ''));
      
      if (i === 0 && rows[i].cells[cellIndex].nodeName === 'TH') {
        const currentTh = rows[i].cells[cellIndex];
        currentTh.parentNode.insertBefore(newCell, currentTh.nextSibling);
      }
    }
    saveDocumentContent();
  };

  const deleteCurrentRow = (table, cell) => {
    if (!table || !cell) return;
    const row = cell.parentNode;
    table.deleteRow(row.rowIndex);
    saveDocumentContent();
  };

  const deleteCurrentCol = (table, cell) => {
    if (!table || !cell) return;
    const cellIndex = cell.cellIndex;
    const rows = table.rows;
    for (let i = 0; i < rows.length; i++) {
      rows[i].deleteCell(cellIndex);
    }
    saveDocumentContent();
  };

  const deleteEntireTable = (table) => {
    if (!table) return;
    table.remove();
    saveDocumentContent();
  };

  const promptInsertTable = () => {
    const rowsStr = prompt("Número de filas:", "3");
    const colsStr = prompt("Número de columnas:", "3");
    const r = parseInt(rowsStr);
    const c = parseInt(colsStr);
    if (!isNaN(r) && !isNaN(c) && r > 0 && c > 0) {
      insertWysiwygTable(r, c);
    }
  };

  const handleContextMenu = (e) => {
    if (pagesContainerRef.current && pagesContainerRef.current.contains(e.target)) {
      e.preventDefault();
      
      let cell = e.target;
      let cellNode = null;
      let tableNode = null;
      
      while (cell && cell !== pagesContainerRef.current) {
        if (cell.nodeName === 'TD' || cell.nodeName === 'TH') {
          cellNode = cell;
        }
        if (cell.nodeName === 'TABLE') {
          tableNode = cell;
          break;
        }
        cell = cell.parentNode;
      }
      
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetCell: cellNode,
        targetTable: tableNode
      });
    } else {
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const calculateWordCount = () => {
    if (!pagesContainerRef.current) return;
    const pageDivs = pagesContainerRef.current.querySelectorAll('.word-page-content');
    const text = Array.from(pageDivs).map(div => div.innerText).join(' ');
    const cleanText = text.trim();
    const count = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
    setWordCount(count);
  };

  const insertPageAfterCurrent = () => {
    if (!pagesContainerRef.current) return;
    const pageDivs = pagesContainerRef.current.querySelectorAll('.word-page-content');
    const pageContents = Array.from(pageDivs).map(div => div.innerHTML);
    
    pageContents.splice(focusedPageIndex + 1, 0, '<p>Nueva página</p>');
    const joined = pageContents.join('<!-- pagebreak -->');
    
    setActiveDoc(prev => ({ ...prev, contenido: joined }));
    setPageUpdateTrigger(prev => prev + 1);
    setFocusedPageIndex(focusedPageIndex + 1);
  };

  const deleteCurrentPage = () => {
    if (!pagesContainerRef.current) return;
    const pageDivs = pagesContainerRef.current.querySelectorAll('.word-page-content');
    if (pageDivs.length <= 1) {
      alert("No puedes eliminar la única página del documento.");
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar la página ${focusedPageIndex + 1}? El contenido de esta página se perderá.`)) return;
    
    const pageContents = Array.from(pageDivs).map(div => div.innerHTML);
    pageContents.splice(focusedPageIndex, 1);
    const joined = pageContents.join('<!-- pagebreak -->');
    
    setActiveDoc(prev => ({ ...prev, contenido: joined }));
    setPageUpdateTrigger(prev => prev + 1);
    setFocusedPageIndex(Math.max(0, focusedPageIndex - 1));
  };

  const insertImage = () => {
    const url = prompt("Introduce la URL de la imagen (o presiona Enter para subir una desde tu computadora):");
    if (url === null) return;
    if (url.trim()) {
      const imgHtml = `<img src="${url.trim()}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" alt="Imagen" />`;
      insertHtmlAtCursor(imgHtml);
      saveDocumentContent();
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imgHtml = `<img src="${event.target.result}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" alt="Imagen" />`;
            insertHtmlAtCursor(imgHtml);
            saveDocumentContent();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const insertVideo = () => {
    const url = prompt("Introduce la URL del video (YouTube o enlace directo mp4/webm):");
    if (!url) return;
    let videoHtml = '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      videoHtml = `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 10px 0; border-radius: 8px;">
        <iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
      </div><p></p>`;
    } else {
      videoHtml = `<video controls src="${url}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; display: block;"></video><p></p>`;
    }
    insertHtmlAtCursor(videoHtml);
    saveDocumentContent();
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());

          const reader = new FileReader();
          reader.onloadend = () => {
            const audioHtml = `<div class="audio-embed" style="margin: 10px 0; display: inline-block;">
              <audio controls src="${reader.result}"></audio>
            </div><p></p>`;
            insertHtmlAtCursor(audioHtml);
            saveDocumentContent();
          };
          reader.readAsDataURL(audioBlob);
        };

        recorder.start();
        setIsRecording(true);
      } catch (err) {
        alert("No se pudo acceder al micrófono: " + err.message);
      }
    }
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    if (!pagesContainerRef.current) return;
    const pageDivs = pagesContainerRef.current.querySelectorAll('.word-page-content');
    
    let count = 0;
    pageDivs.forEach(div => {
      const html = div.innerHTML;
      if (html.includes(findQuery)) {
        const occurrences = html.split(findQuery).length - 1;
        count += occurrences;
        div.innerHTML = html.split(findQuery).join(replaceQuery);
      }
    });
    
    if (count > 0) {
      calculateWordCount();
      saveDocumentContent();
      alert(`Se reemplazaron ${count} coincidencias.`);
    } else {
      alert("No se encontraron coincidencias.");
    }
    setShowFindReplaceModal(false);
  };

  const handleSendCopilot = async () => {
    if (!copilotInput.trim() || copilotLoading) return;
    const userMsg = copilotInput.trim();
    setCopilotInput('');
    setCopilotLoading(true);

    const newMessages = [...copilotMessages, { role: 'user', content: userMsg }];
    setCopilotMessages(newMessages);

    try {
      const systemPrompt = `
        Eres el "Asistente Neural de Flujo" (Inefable FlowWriter AI Copilot).
        Tu objetivo es ayudar al administrador (Carlos) a gestionar y redactar sus documentos, plantillas y carpetas.

        ACCIONES (JSON MANDATORIO AL FINAL):
        Puedes realizar las siguientes acciones especiales cuando el usuario lo solicite:
        - CREAR DOCUMENTO: redactar un nuevo documento desde cero.
          JSON: { "action": "CREATE_DOCUMENT", "data": { "titulo": "Título del Documento", "contenido": "Contenido HTML del documento. Usa estilos HTML como h1, h2, p, strong, em, table si es necesario. IMPORTANTE: puedes usar '<!-- pagebreak -->' para insertar saltos de página y estructurar un documento de múltiples hojas." } }
        - CREAR CARPETA: crear una nueva carpeta en el explorador.
          JSON: { "action": "CREATE_FOLDER", "data": { "nombre": "Nombre de la Carpeta" } }
        - CREAR PLANTILLA: diseñar una plantilla preestablecida para que el usuario pueda usarla después.
          JSON: { "action": "GENERATE_TEMPLATE", "data": { "id": "id-unico-generado", "titulo": "Nombre de la Plantilla", "categoria": "Categoría (ej: Legal, Marketing, Negocios, Académico)", "contenido": "Contenido HTML base de la plantilla." } }

        REGLAS CRÍTICAS:
        1. SIEMPRE responde en español con un estilo elegante, profesional y de copywriter.
        2. Si el usuario te pide crear un documento, una carpeta o una plantilla, redacta el contenido solicitado y adjunta el comando JSON MANDATORIO al final de tu respuesta, envuelto estrictamente entre estos marcadores: [[[ACTION{tu_json_aqui}]]].
        3. No le expliques el JSON al usuario, solo di qué acción has realizado.
        4. Si el documento es largo o el usuario lo pide, utiliza '<!-- pagebreak -->' para separar las páginas.
        5. Tienes acceso al contexto del documento actual si lo necesitas:
           - Título actual: "${activeDoc?.titulo || 'Ninguno'}"
           - Cantidad de páginas actuales: ${pages.length}
      `;

      const response = await aiService.askRaw(systemPrompt, userMsg, settings);
      
      let cleanText = response || 'No he podido procesar tu solicitud.';
      let actionJSON = null;

      if (cleanText.includes('[[[ACTION')) {
        const parts = cleanText.split('[[[ACTION');
        cleanText = parts[0].trim();
        const actionPart = parts[1].split(']]]');
        if (actionPart.length > 0) {
          try {
            actionJSON = JSON.parse(actionPart[0].trim());
          } catch (e) {
            console.error("Error parsing Copilot action JSON:", e);
          }
        }
      }

      setCopilotMessages(prev => [...prev, { role: 'assistant', content: cleanText }]);

      if (actionJSON) {
        const { action, data } = actionJSON;
        if (action === 'CREATE_DOCUMENT' && data) {
          await createDocument(data.titulo || 'Nuevo Documento', data.contenido || '');
          setPageUpdateTrigger(prev => prev + 1);
        } else if (action === 'CREATE_FOLDER' && data) {
          await createFolderWithName(data.nombre);
        } else if (action === 'GENERATE_TEMPLATE' && data) {
          const newTemplate = {
            id: data.id || crypto.randomUUID(),
            titulo: data.titulo || 'Nueva Plantilla',
            categoria: data.categoria || 'General',
            contenido: data.contenido || ''
          };
          const updatedTemplates = [...customTemplates, newTemplate];
          setCustomTemplates(updatedTemplates);
          localStorage.setItem('ft_custom_templates', JSON.stringify(updatedTemplates));
        }
      }

    } catch (err) {
      console.error(err);
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: '❌ Error: No se pudo conectar con el servicio neural. Revisa tus llaves de API en Ajustes.' }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const openDocument = (doc) => {
    setActiveDoc(doc);
    setViewingVersion(null);
    setRightSidebarMode(null);
    fetchComments(doc.id);
    fetchVersions(doc.id);
    fetchShares(doc.id);
  };

  const handleTemplateClick = (plantilla) => {
    createDocument(plantilla.titulo, plantilla.contenido, plantilla.id);
  };

  // Filtrado de documentos del Explorador
  const filteredDocuments = useMemo(() => {
    let result = documents;
    if (activeSidebarTab === 'compartidos') {
      result = result.filter(d => d.isShared);
    } else if (activeSidebarTab === 'archivos') {
      result = result.filter(d => !d.isShared);
      if (activeFolderId) {
        result = result.filter(d => d.folder_id === activeFolderId);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.titulo.toLowerCase().includes(q));
    }
    return result;
  }, [documents, activeSidebarTab, activeFolderId, searchQuery]);

  const currentFolderName = useMemo(() => {
    if (activeSidebarTab === 'compartidos') return 'Compartidos Conmigo';
    if (!activeFolderId) return 'Mis Archivos';
    const folder = folders.find(f => f.id === activeFolderId);
    return folder ? folder.nombre : 'Carpeta';
  }, [activeFolderId, folders, activeSidebarTab]);

  return (
    <div className="flex h-full w-full overflow-hidden" 
      style={{ backgroundColor: '#141414' }}>
      
      {/* SCOPED CSS STYLES FOR WYSIWYG DOCUMENT CANVAS */}
      <style>{`
        .ft-wysiwyg-content {
          outline: none;
        }
        .ft-wysiwyg-content h1 {
          font-size: 2.4em !important;
          font-weight: 800 !important;
          margin-top: 1.6rem !important;
          margin-bottom: 0.8rem !important;
          color: inherit !important;
          display: block !important;
          line-height: 1.2 !important;
        }
        .ft-wysiwyg-content h2 {
          font-size: 1.8em !important;
          font-weight: 700 !important;
          margin-top: 1.4rem !important;
          margin-bottom: 0.6rem !important;
          color: inherit !important;
          display: block !important;
          line-height: 1.3 !important;
        }
        .ft-wysiwyg-content h3 {
          font-size: 1.4em !important;
          font-weight: 600 !important;
          margin-top: 1.2rem !important;
          margin-bottom: 0.5rem !important;
          color: inherit !important;
          display: block !important;
        }
        .ft-wysiwyg-content p {
          margin-top: 0 !important;
          margin-bottom: 1rem !important;
          line-height: 1.6 !important;
        }
        .ft-wysiwyg-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5rem 0;
        }
        .ft-wysiwyg-content th, .ft-wysiwyg-content td {
          border: 1px solid #3e4851;
          padding: 10px;
        }
        .ft-wysiwyg-content ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1rem !important;
        }
        .ft-wysiwyg-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1rem !important;
        }
      `}</style>
      
      {/* 1. SIDEBAR INTERNA DE NAVEGACIÓN */}
      <aside className="w-60 border-r flex flex-col justify-between shrink-0" 
        style={{ backgroundColor: '#141414', borderColor: '#3e4851' }}>
        <div>
          {/* Cabecera Sidebar (Limpia sin iconos ni subtítulos, con descripción en español) */}
          <div className="p-5 border-b" style={{ borderColor: '#3e4851' }}>
            <span className="text-[12px] font-extrabold tracking-widest text-[#8ecdff] block">FLUJO DE TRABAJO</span>
            <p className="text-[10px] text-[#bec8d2] mt-3 leading-relaxed border-t border-white/5 pt-2.5 font-normal">
              procesador de texto
            </p>
          </div>

          {/* Menú Principal */}
          <div className="p-3 space-y-1">
            <button 
              onClick={() => { setActiveSidebarTab('archivos'); setActiveFolderId(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                activeSidebarTab === 'archivos' && !activeFolderId ? 'bg-white/5 text-[#8ecdff]' : 'text-[#bec8d2] hover:bg-white/5'
              }`}
            >
              <FileText size={14} />
              <span>Mis Archivos</span>
            </button>
            <button 
              onClick={() => { setActiveSidebarTab('compartidos'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                activeSidebarTab === 'compartidos' ? 'bg-white/5 text-[#8ecdff]' : 'text-[#bec8d2] hover:bg-white/5'
              }`}
            >
              <Users size={14} />
              <span>Compartidos Conmigo</span>
            </button>
            
            {/* Panel de Admin (Creador) */}
            {currentUser && currentUser.rol === 'creador_admin' && (
              <button 
                onClick={() => { setActiveSidebarTab('admin'); fetchAdminUsers(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  activeSidebarTab === 'admin' ? 'bg-white/5 text-[#8ecdff]' : 'text-[#bec8d2] hover:bg-white/5'
                }`}
              >
                <Database size={14} />
                <span>Panel del Creador</span>
              </button>
            )}
          </div>

          {/* Lista de Carpetas */}
          {activeSidebarTab === 'archivos' && (
            <div className="p-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[9px] font-bold text-[#bec8d2] uppercase tracking-wider">Carpetas</span>
                <button 
                  onClick={() => setShowFolderModal(true)}
                  className="p-1 rounded hover:bg-white/5 text-[#8ecdff] transition-all"
                  title="Nueva Carpeta"
                >
                  <FolderPlus size={12} />
                </button>
              </div>
              <div className="space-y-0.5 max-h-56 overflow-y-auto mac-scrollbar">
                {folders.map(f => (
                  <div
                    key={f.id}
                    className={`group/folder w-full flex items-center justify-between px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      activeFolderId === f.id ? 'bg-white/5 text-white' : 'text-[#bec8d2] hover:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFolderId(f.id)}
                      className="flex items-center gap-2 text-left truncate flex-grow py-1"
                    >
                      <Folder size={12} className={activeFolderId === f.id ? 'text-[#8ecdff]' : 'text-neutral-500'} />
                      <span className="truncate">{f.nombre}</span>
                    </button>
                    <button
                      onClick={(e) => deleteFolder(f.id, e)}
                      className="opacity-0 group-hover/folder:opacity-100 p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 ml-1"
                      title="Eliminar Carpeta"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                {folders.length === 0 && (
                  <p className="text-[9px] text-neutral-500 px-3 py-1 italic">Sin carpetas</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Caja de Perfil */}
        {currentUser && (
          <div className="p-3 border-t" style={{ borderColor: '#3e4851' }}>
            <div className="bg-[#201f1f] p-3 rounded-xl border" style={{ borderColor: '#3e4851' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded bg-[#8ecdff]/20 flex items-center justify-center text-[10px] text-[#8ecdff] font-bold uppercase">
                  {currentUser.email_decrypted.charAt(0)}
                </div>
                <span className="text-[10px] text-white font-medium truncate block flex-1">
                  {currentUser.email_decrypted}
                </span>
              </div>
              <div className="flex justify-between items-center text-[8px] text-[#bec8d2]">
                <span className="capitalize">{currentUser.rol === 'creador_admin' ? 'Creador Admin' : 'Miembro'}</span>
                <button 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold"
                >
                  <LogOut size={9} /> Salir/Login
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden relative" style={{ backgroundColor: '#141414' }}>
        
        {/* --- A: PANTALLA DE ACCESO (Si no ha iniciado sesión) --- */}
        {!currentUser ? (
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 overflow-y-auto mac-scrollbar">
            <div className="w-full max-w-md bg-[#1c1b1b] p-8 rounded-[24px] border shadow-2xl flex flex-col" style={{ borderColor: '#3e4851' }}>
              <h2 className="text-xl font-bold text-center text-white mb-2">Acceso a Flujo de Trabajo</h2>
              <p className="text-[10px] text-center text-[#bec8d2] mb-6">
                Inicia sesión con tu cuenta de colaborador para acceder a los documentos compartidos.
              </p>

              {authError && (
                <div className="mb-4 p-3 bg-red-950/30 border border-red-800 text-red-300 rounded-lg text-[10px] flex items-center gap-2">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-[#bec8d2] block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="usuario@dominio.com"
                    className="w-full h-10 px-3 rounded-lg text-[11px] outline-none text-white transition-all bg-[#131313] border focus:border-[#8ecdff]"
                    style={{ borderColor: '#3e4851' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[#bec8d2] block mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3 rounded-lg text-[11px] outline-none text-white transition-all bg-[#131313] border focus:border-[#8ecdff]"
                    style={{ borderColor: '#3e4851' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-10 rounded-lg bg-[#00a4ef] hover:bg-[#00a4ef]/80 text-white text-[11px] font-bold uppercase transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : authMode === 'login' ? (
                    'Iniciar Sesión'
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t flex justify-center text-[10px] gap-2" style={{ borderColor: '#3e4851' }}>
                <span className="text-neutral-500">
                  {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                </span>
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-[#8ecdff] hover:underline font-medium"
                >
                  {authMode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* --- B: VISTA DE DASHBOARD O EDITOR (Usuario Logueado) --- */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Si NO hay documento abierto, mostrar el Dashboard y Explorador */}
            {!activeDoc ? (
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 mac-scrollbar">
                
                {/* Cabecera del Dashboard */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {activeSidebarTab === 'admin' ? 'Consola del Creador' : currentFolderName}
                    </h1>
                    <p className="text-[10px] text-[#bec8d2]">Gestiona y procesa tus documentos con seguridad e identidad local.</p>
                  </div>

                  {activeSidebarTab !== 'admin' && (
                    <div className="flex items-center gap-3">
                      {/* Búsqueda (Cuadro simplificado único sin caja doble) */}
                      <input
                        type="text"
                        placeholder="Buscar documentos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-60 px-3.5 rounded-lg border outline-none text-[10px] text-white placeholder-neutral-500 transition-all focus:border-[#8ecdff]"
                        style={{ backgroundColor: '#141414', borderColor: '#3e4851' }}
                      />
                      
                      {/* Botón de crear documento */}
                      <button
                        onClick={() => createDocument('Nuevo Documento', '')}
                        className="h-9 px-4 rounded-lg bg-[#00a4ef] hover:bg-[#00a4ef]/80 text-white text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 shadow"
                      >
                        <Plus size={14} /> Nuevo Documento
                      </button>
                    </div>
                  )}
                </div>

                {/* --- SECCIÓN 1: PANEL DEL CREADOR (CONSOLA ADMIN) --- */}
                {activeSidebarTab === 'admin' && (
                  <div className="space-y-6">
                    {/* KPIs de Admin */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#1c1b1b] p-5 rounded-[20px] border" style={{ borderColor: '#3e4851' }}>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">Miembros Registrados</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-3xl font-extrabold text-white">{adminUsers.length}</span>
                          <span className="text-[9px] text-[#8ecdff]">Cuentas activas</span>
                        </div>
                      </div>
                      <div className="bg-[#1c1b1b] p-5 rounded-[20px] border" style={{ borderColor: '#3e4851' }}>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">Privacidad del Creador</span>
                        <p className="text-[10px] text-[#bec8d2] mt-2">
                          Todas las contraseñas están irreversiblemente cifradas.
                        </p>
                      </div>
                      <div className="bg-[#1c1b1b] p-5 rounded-[20px] border" style={{ borderColor: '#3e4851' }}>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">Estado del Servidor</span>
                        <div className="flex items-center gap-2 mt-2 text-green-400 text-[10px]">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                          <span>Activo (Supabase/LocalStorage)</span>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Usuarios Registrados */}
                    <div className="bg-[#1c1b1b] rounded-[24px] border overflow-hidden" style={{ borderColor: '#3e4851' }}>
                      <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#3e4851' }}>
                        <span className="text-[10px] font-bold text-white">Miembros del Sistema</span>
                        <button 
                          onClick={fetchAdminUsers}
                          className="text-[9px] text-[#8ecdff] hover:underline flex items-center gap-1"
                        >
                          <RefreshCw size={10} /> Actualizar Tabla
                        </button>
                      </div>
                      
                      {adminLoading ? (
                        <div className="p-10 text-center text-neutral-500 text-[10px]">
                          Cargando usuarios...
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="border-b text-neutral-400" style={{ borderColor: '#3e4851', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <th className="p-4 font-semibold">Correo Descifrado</th>
                                <th className="p-4 font-semibold">Fecha Registro</th>
                                <th className="p-4 font-semibold">Documentos Creados</th>
                                <th className="p-4 font-semibold">Rol</th>
                                <th className="p-4 font-semibold">Estado</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUsers.map(usr => (
                                <tr key={usr.id} className="border-b hover:bg-white/5" style={{ borderColor: '#3e4851' }}>
                                  <td className="p-4 font-medium text-white">{usr.email_decrypted || 'Desconocido'}</td>
                                  <td className="p-4 text-[#bec8d2]">
                                    {new Date(usr.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="p-4 text-center font-bold text-white">{usr.document_count}</td>
                                  <td className="p-4 text-[#8ecdff] uppercase font-bold">{usr.rol}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                                      usr.estado === 'activo' ? 'bg-green-500/10 text-green-400 border border-green-800' : 'bg-red-500/10 text-red-400 border border-red-800'
                                    }`}>
                                      {usr.estado}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {usr.id !== currentUser.id && (
                                      <button
                                        onClick={() => toggleUserStatus(usr.id, usr.estado)}
                                        className={`px-3 py-1 rounded-md text-[8px] font-bold transition-all ${
                                          usr.estado === 'activo' ? 'bg-red-950/20 text-red-400 hover:bg-red-950/55 border border-red-900' : 'bg-green-950/20 text-green-400 hover:bg-green-950/55 border border-green-900'
                                        }`}
                                      >
                                        {usr.estado === 'activo' ? 'Suspender' : 'Activar'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- SECCIÓN 2: VISTA ESTÁNDAR --- */}
                {activeSidebarTab !== 'admin' && (
                  <>
                    {/* Fila superior: KPIs de Metas y Pomodoro */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Widget Temporizador Pomodoro */}
                      <div className="bg-[#1c1b1b] p-5 rounded-[24px] border flex flex-col justify-between" style={{ borderColor: '#3e4851' }}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Sesión de Enfoque</span>
                          <Clock size={14} className="text-[#8ecdff]" />
                        </div>
                        <div className="flex flex-col items-center py-2">
                          <span className="text-3xl font-extrabold text-white tracking-widest font-mono">
                            {formatTimer(focusSeconds)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setFocusActive(!focusActive)}
                            className="flex-1 h-8 rounded-lg bg-[#00a4ef]/10 text-[#8ecdff] border border-[#00a4ef]/30 font-bold text-[9px] uppercase hover:bg-[#00a4ef]/20 transition-all flex items-center justify-center gap-1"
                          >
                            {focusActive ? <Pause size={10} /> : <Play size={10} />}
                            {focusActive ? 'Pausar' : 'Enfocar'}
                          </button>
                          <button
                            onClick={() => { setFocusActive(false); setFocusSeconds(1500); }}
                            className="px-3 h-8 rounded-lg bg-neutral-900 border border-neutral-800 text-[9px] text-[#bec8d2] hover:bg-neutral-800 font-bold transition-all"
                          >
                            Reiniciar
                          </button>
                        </div>
                      </div>

                      {/* Widget Meta de Escritura Diaria */}
                      <div className="bg-[#1c1b1b] p-5 rounded-[24px] border flex items-center gap-4" style={{ borderColor: '#3e4851' }}>
                        <div className="relative shrink-0 w-16 h-16">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-neutral-800"
                              strokeWidth="3.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-[#8ecdff]"
                              strokeDasharray="60, 100"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">60%</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Objetivo Diario</span>
                          <span className="text-xl font-bold text-white mt-1 block">600 / 1000</span>
                          <span className="text-[8px] text-[#8ecdff]">palabras escritas hoy</span>
                        </div>
                      </div>

                      {/* KPI de Documentos */}
                      <div className="bg-[#1c1b1b] p-5 rounded-[24px] border flex flex-col justify-between" style={{ borderColor: '#3e4851' }}>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Documentos del Workspace</span>
                          <span className="text-2xl font-extrabold text-white mt-2 block">{documents.length}</span>
                        </div>
                        <span className="text-[8px] text-neutral-500">Documentos cargados.</span>
                      </div>
                    </div>

                    {/* Fila 2: Plantillas */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-[#bec8d2] uppercase tracking-wider block">Plantillas Rápidas</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...PLANTILLAS, ...customTemplates].map(p => (
                          <div
                            key={p.id}
                            onClick={() => handleTemplateClick(p)}
                            className="bg-[#1c1b1b] hover:bg-[#201f1f] p-4 rounded-[20px] border cursor-pointer group transition-all relative overflow-hidden"
                            style={{ borderColor: '#3e4851' }}
                          >
                            <div className="absolute inset-0 bg-[#00a4ef]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center mb-3 group-hover:scale-105 transition-all">
                              <Sparkles size={14} className="text-[#8ecdff]" />
                            </div>
                            <span className="text-[9px] font-bold text-neutral-500 uppercase">{p.categoria}</span>
                            <h4 className="text-[11px] font-bold text-white mt-1 group-hover:text-[#8ecdff] transition-all truncate">
                              {p.titulo}
                            </h4>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fila 3: Lista de Documentos */}
                    <div className="bg-[#1c1b1b] rounded-[24px] border overflow-hidden" style={{ borderColor: '#3e4851' }}>
                      <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#3e4851' }}>
                        <span className="text-[10px] font-bold text-white">Archivos Recientes</span>
                        <span className="text-[8px] text-[#bec8d2]">{filteredDocuments.length} documentos</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="border-b text-neutral-400" style={{ borderColor: '#3e4851', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                              <th className="p-4 font-semibold">Título</th>
                              <th className="p-4 font-semibold">Tipo</th>
                              <th className="p-4 font-semibold">Última Modificación</th>
                              <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDocuments.map(doc => (
                              <tr 
                                key={doc.id} 
                                className="border-b hover:bg-white/5 cursor-pointer group" 
                                style={{ borderColor: '#3e4851' }}
                                onClick={() => openDocument(doc)}
                              >
                                <td className="p-4 font-semibold text-white">
                                  <div className="flex items-center gap-2">
                                    <FileText size={12} className="text-[#8ecdff]" />
                                    <span className="group-hover:text-[#8ecdff] transition-all truncate max-w-xs">{doc.titulo}</span>
                                    {doc.isShared && (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900 text-[7px] uppercase font-bold shrink-0">
                                        Compartido ({doc.sharedRole})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-neutral-500">Documento de Texto</td>
                                <td className="p-4 text-[#bec8d2]">
                                  {new Date(doc.updated_at).toLocaleString()}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  {!doc.isShared ? (
                                    <button
                                      onClick={() => deleteDocument(doc.id)}
                                      className="p-2 rounded text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  ) : (
                                    <span className="text-[8px] text-neutral-500 italic pr-2">Colaboración</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

              </div>
            ) : (
              /* --- C: LIENZO Y EDITOR DE TEXTOS ACTIVO --- */
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* 1. RIBBON TOOLBAR (Microsoft Word Ribbon Avanzado en Español) */}
                <div className="border-b shrink-0" style={{ backgroundColor: '#141414', borderColor: '#3e4851' }}>
                  <div className="flex border-b px-4 text-[9px] font-bold uppercase tracking-wider text-neutral-500" style={{ borderColor: '#3e4851' }}>
                    {['inicio', 'insertar', 'disposicion', 'revision', 'vista'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setRibbonTab(tab)}
                        className={`px-4 py-2 border-b-2 transition-all ${
                          ribbonTab === tab ? 'border-[#8ecdff] text-[#8ecdff]' : 'border-transparent hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                    
                    {/* Botones derecha */}
                    <div className="ml-auto flex items-center gap-2 py-1">
                      {currentUser?.rol === 'creador_admin' && (
                        <button
                          onClick={() => setRightSidebarMode(rightSidebarMode === 'copilot' ? null : 'copilot')}
                          className="h-6 px-2.5 rounded bg-amber-950/20 text-amber-400 border border-amber-950/30 hover:bg-amber-950/40 text-[8px] font-bold uppercase transition-all flex items-center gap-1"
                          title="Asistente Neural de Flujo"
                        >
                          <Sparkles size={10} /> Copilot IA
                        </button>
                      )}
                      {!activeDoc.isShared && (
                        <button
                          onClick={() => { setShowShareModal(true); fetchShares(activeDoc.id); }}
                          className="h-6 px-2.5 rounded bg-blue-900/20 text-[#8ecdff] border border-blue-900/30 hover:bg-blue-900/40 text-[8px] font-bold uppercase transition-all flex items-center gap-1"
                        >
                          <Share2 size={10} /> Compartir
                        </button>
                      )}
                      <button
                        onClick={() => setRightSidebarMode(rightSidebarMode === 'versiones' ? null : 'versiones')}
                        className="h-6 px-2.5 rounded bg-neutral-900 text-[#bec8d2] border border-neutral-800 hover:bg-neutral-800 text-[8px] font-bold uppercase transition-all flex items-center gap-1"
                      >
                        <History size={10} /> Versiones
                      </button>
                      <button
                        onClick={() => setRightSidebarMode(rightSidebarMode === 'comentarios' ? null : 'comentarios')}
                        className="h-6 px-2.5 rounded bg-neutral-900 text-[#bec8d2] border border-neutral-800 hover:bg-neutral-800 text-[8px] font-bold uppercase transition-all flex items-center gap-1"
                      >
                        <MessageSquare size={10} /> Comentarios
                      </button>
                      
                      {!viewingVersion && (!activeDoc.isShared || activeDoc.sharedRole === 'editor') && (
                        <button
                          onClick={saveDocumentContent}
                          className="h-6 px-3 rounded bg-green-700/20 text-[#4ec9b0] border border-green-700/30 hover:bg-green-700/40 text-[8px] font-bold uppercase transition-all flex items-center gap-1"
                        >
                          Guardar
                        </button>
                      )}
                      
                      <button
                        onClick={() => { saveDocumentContent(); setActiveDoc(null); }}
                        className="h-6 px-2.5 rounded bg-neutral-900 text-red-400 border border-neutral-800 hover:bg-red-500/10 text-[8px] font-bold uppercase transition-all"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>

                  {/* Cinta Ribbon */}
                  <div className="p-3 flex items-center gap-3 flex-wrap min-h-12 text-[10px]" style={{ backgroundColor: '#141414' }}>
                    
                    {/* --- INICIO TAB --- */}
                    {ribbonTab === 'inicio' && (
                      <div className="flex items-center gap-3 divide-x divide-neutral-800 flex-wrap">
                        
                        {/* Selector de Tipografías del Sistema */}
                        <div className="flex items-center gap-1.5 pr-2">
                          <span className="text-[8px] text-neutral-500 font-bold uppercase">Fuente:</span>
                          <select
                            value={fontFamily}
                            onChange={(e) => changeFontFamily(e.target.value)}
                            className="bg-[#201f1f] text-white border border-[#3e4851] rounded px-1.5 py-0.5 outline-none text-[9px]"
                          >
                            <option value="Inter">Inter (Sans)</option>
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Verdana">Verdana</option>
                            <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                          </select>
                        </div>

                        {/* Selector de Escala de Tamaños (PX como Word) */}
                        <div className="flex items-center gap-1.5 px-3">
                          <span className="text-[8px] text-neutral-500 font-bold uppercase">Tamaño:</span>
                          <select
                            value={fontSize}
                            onChange={(e) => changeFontSize(e.target.value)}
                            className="bg-[#201f1f] text-white border border-[#3e4851] rounded px-1.5 py-0.5 outline-none text-[9px]"
                          >
                            {['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '36px', '48px', '72px'].map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>

                        {/* Desplegable de Estilos (Título 1, 2, Normal - Reemplaza H1/H2 botones) */}
                        <div className="flex items-center gap-1.5 px-3">
                          <span className="text-[8px] text-neutral-500 font-bold uppercase">Estilos:</span>
                          <select
                            onChange={(e) => handleStyleChange(e.target.value)}
                            defaultValue="p"
                            className="bg-[#201f1f] text-white border border-[#3e4851] rounded px-1.5 py-0.5 outline-none text-[9px] font-semibold"
                          >
                            <option value="p">Normal (Párrafo)</option>
                            <option value="h1">Título 1 (Grande)</option>
                            <option value="h2">Título 2 (Mediano)</option>
                            <option value="h3">Título 3 (Pequeño)</option>
                            <option value="pre">Código / Monospace</option>
                          </select>
                        </div>

                        {/* Formatos de Tinta (N, K, S, Tachado) */}
                        <div className="flex items-center gap-1 px-3">
                          <button onClick={() => execCommand('bold')} className="w-6 h-6 rounded hover:bg-white/5 font-bold text-white" title="Negrita">N</button>
                          <button onClick={() => execCommand('italic')} className="w-6 h-6 rounded hover:bg-white/5 italic text-white" title="Cursiva">K</button>
                          <button onClick={() => execCommand('underline')} className="w-6 h-6 rounded hover:bg-white/5 underline text-white" title="Subrayado">S</button>
                          <button onClick={() => execCommand('strikeThrough')} className="w-6 h-6 rounded hover:bg-white/5 text-white flex items-center justify-center" title="Tachado">
                            <Strikethrough size={12} />
                          </button>
                        </div>

                        {/* Color de Letra y Resaltado (Marcador) */}
                        <div className="flex items-center gap-2 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-neutral-500 font-bold">Color:</span>
                            <input
                              type="color"
                              onChange={(e) => execCommand('foregroundColor', e.target.value)}
                              className="w-4 h-4 bg-transparent border-none cursor-pointer outline-none"
                              title="Color de Texto"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-neutral-500 font-bold">Resaltar:</span>
                            <select
                              onChange={(e) => execCommand('hiliteColor', e.target.value)}
                              className="bg-[#201f1f] text-white border border-[#3e4851] rounded px-1 text-[8px]"
                              title="Marcador de Resaltado"
                              defaultValue="transparent"
                            >
                              <option value="transparent">Ninguno</option>
                              <option value="#ffff00">Amarillo</option>
                              <option value="#00ff00">Verde</option>
                              <option value="#00ffff">Celeste</option>
                              <option value="#ff00ff">Rosa</option>
                            </select>
                          </div>
                        </div>

                        {/* Sangrías y Listas */}
                        <div className="flex items-center gap-1 px-3">
                          <button onClick={() => execCommand('insertUnorderedList')} className="p-1 rounded text-white hover:bg-white/5" title="Lista de Viñetas">
                            <List size={13} />
                          </button>
                          <button onClick={() => execCommand('insertOrderedList')} className="p-1 rounded text-white hover:bg-white/5" title="Lista Numerada">
                            <ListOrdered size={13} />
                          </button>
                          <button onClick={() => execCommand('outdent')} className="p-1 rounded text-white hover:bg-white/5" title="Reducir Sangría">
                            <Outdent size={13} />
                          </button>
                          <button onClick={() => execCommand('indent')} className="p-1 rounded text-white hover:bg-white/5" title="Aumentar Sangría">
                            <Indent size={13} />
                          </button>
                        </div>

                        {/* Alineación */}
                        <div className="flex items-center gap-1 px-3">
                          <button onClick={() => execCommand('justifyLeft')} className="p-1 rounded text-white hover:bg-white/5" title="Alinear Izquierda"><AlignLeft size={13} /></button>
                          <button onClick={() => execCommand('justifyCenter')} className="p-1 rounded text-white hover:bg-white/5" title="Centrar"><AlignCenter size={13} /></button>
                          <button onClick={() => execCommand('justifyRight')} className="p-1 rounded text-white hover:bg-white/5" title="Alinear Derecha"><AlignRight size={13} /></button>
                          <button onClick={() => execCommand('justifyFull')} className="p-1 rounded text-white hover:bg-white/5" title="Justificar"><AlignJustify size={13} /></button>
                        </div>

                        {/* Buscar y Reemplazar */}
                        <div className="flex items-center gap-1 px-3">
                          <button
                            onClick={() => setShowFindReplaceModal(true)}
                            className="flex items-center gap-1 px-2 py-1 bg-neutral-900 border border-neutral-800 text-white rounded hover:bg-neutral-800 font-bold"
                            title="Buscar y Reemplazar"
                          >
                            <Search size={12} /> <span className="text-[9px]">Buscar y Reemplazar</span>
                          </button>
                        </div>

                      </div>
                    )}

                    {/* --- TAB INSERTAR --- */}
                    {ribbonTab === 'insertar' && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={insertPageAfterCurrent}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#201f1f] text-[#8ecdff] rounded border border-[#8ecdff]/20 hover:bg-[#8ecdff]/10 font-bold"
                        >
                          + Añadir Página
                        </button>
                        <button
                          onClick={deleteCurrentPage}
                          className="flex items-center gap-1.5 px-3 py-1 bg-red-950/20 text-red-400 rounded border border-red-950/30 hover:bg-red-950/40 font-bold"
                        >
                          ✕ Eliminar Página
                        </button>
                        <button
                          onClick={insertImage}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#201f1f] text-white rounded border border-[#3e4851] hover:bg-white/5 font-bold text-[9px]"
                        >
                          Imagen
                        </button>
                        <button
                          onClick={insertVideo}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#201f1f] text-white rounded border border-[#3e4851] hover:bg-white/5 font-bold text-[9px]"
                        >
                          Video
                        </button>
                        <button
                          onClick={toggleRecording}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded border font-bold transition-all text-[9px] ${
                            isRecording 
                              ? 'bg-red-600 border-red-700 text-white animate-pulse' 
                              : 'bg-[#201f1f] border-[#3e4851] text-white hover:bg-white/5'
                          }`}
                        >
                          {isRecording ? 'Parar Voz' : 'Grabar Voz'}
                        </button>
                        <button
                          onClick={() => insertWysiwygTable(3, 3)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#201f1f] text-white rounded border border-[#3e4851] hover:bg-white/5"
                        >
                          <Table size={12} /> Insertar Tabla 3x3
                        </button>
                        <button
                          onClick={insertChecklist}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#201f1f] text-white rounded border border-[#3e4851] hover:bg-white/5"
                        >
                          <CheckSquare size={12} /> Checklist
                        </button>
                        <button
                          onClick={() => execCommand('insertHorizontalRule')}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#201f1f] text-white rounded border border-[#3e4851] hover:bg-white/5"
                        >
                          Línea Divisoria
                        </button>
                        
                        <div className="h-6 w-px bg-neutral-800 mx-2"></div>
                        <span className="text-[8px] text-neutral-500 uppercase font-bold">Modificar Tabla:</span>
                        <button
                          onClick={addRowToTable}
                          className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-white rounded hover:bg-neutral-800 text-[8px]"
                        >
                          + Fila
                        </button>
                        <button
                          onClick={addColToTable}
                          className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-white rounded hover:bg-neutral-800 text-[8px]"
                        >
                          + Columna
                        </button>
                      </div>
                    )}

                    {/* --- TAB DISPOSICIÓN --- */}
                    {ribbonTab === 'disposicion' && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 mr-1.5">Márgenes:</span>
                          {['normal', 'narrow', 'wide'].map(m => (
                            <button
                              key={m}
                              onClick={() => setMargins(m)}
                              className={`px-2 py-1 rounded text-[9px] font-bold capitalize ${
                                margins === m ? 'bg-[#8ecdff]/20 text-[#8ecdff] border border-[#8ecdff]/30' : 'bg-transparent text-neutral-400 hover:text-white'
                              }`}
                            >
                              {m === 'normal' ? 'Normal' : m === 'narrow' ? 'Estrecho' : 'Ancho'}
                            </button>
                          ))}
                        </div>
                        <div className="h-6 w-px bg-neutral-800 mx-2"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 mr-1.5">Orientación:</span>
                          {['vertical', 'horizontal'].map(o => (
                            <button
                              key={o}
                              onClick={() => setOrientation(o)}
                              className={`px-2 py-1 rounded text-[9px] font-bold capitalize ${
                                orientation === o ? 'bg-[#8ecdff]/20 text-[#8ecdff] border border-[#8ecdff]/30' : 'bg-transparent text-neutral-400 hover:text-white'
                              }`}
                            >
                              {o === 'vertical' ? 'Vertical' : 'Horizontal'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* --- TAB REVISIÓN --- */}
                    {ribbonTab === 'revision' && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500">Recuento:</span>
                          <span className="font-bold text-white">{wordCount} palabras</span>
                        </div>
                        <div className="h-6 w-px bg-neutral-800 mx-1"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500">Lectura Estimada:</span>
                          <span className="font-bold text-white">{Math.ceil(wordCount / 200)} minutos</span>
                        </div>
                      </div>
                    )}

                    {/* --- TAB VISTA --- */}
                    {ribbonTab === 'vista' && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 mr-1.5">Color del Papel:</span>
                          <button
                            onClick={() => setPageColor('dark')}
                            className={`px-2 py-1 rounded text-[9px] font-bold ${
                              pageColor === 'dark' ? 'bg-[#8ecdff]/20 text-[#8ecdff] border border-[#8ecdff]/30' : 'bg-transparent text-neutral-400 hover:text-white'
                            }`}
                          >
                            Noche Oscuro
                          </button>
                          <button
                            onClick={() => setPageColor('light')}
                            className={`px-2 py-1 rounded text-[9px] font-bold ${
                              pageColor === 'light' ? 'bg-white text-black border' : 'bg-transparent text-neutral-400 hover:text-white'
                            }`}
                          >
                            Papel Real (Claro)
                          </button>
                        </div>
                        <div className="h-6 w-px bg-neutral-800 mx-2"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 mr-1.5">Herramientas:</span>
                          <button
                            onClick={() => setShowRuler(!showRuler)}
                            className={`px-2 py-1 rounded text-[9px] font-bold ${
                              showRuler ? 'bg-[#8ecdff]/20 text-[#8ecdff] border border-[#8ecdff]/30' : 'bg-transparent text-neutral-400 hover:text-white'
                            }`}
                          >
                            {showRuler ? 'Ocultar Regla' : 'Mostrar Regla'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Versión Histórica */}
                {viewingVersion && (
                  <div className="bg-amber-950/40 text-amber-300 border-b border-amber-900/60 px-5 py-2 flex items-center justify-between text-[10px] shrink-0">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="animate-pulse text-amber-500" />
                      <span>
                        Viendo Versión Guardada: <strong>{new Date(viewingVersion.created_at).toLocaleString()}</strong> ({viewingVersion.cambio_descripcion})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => restoreVersion(viewingVersion)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded uppercase text-[8px] transition-all"
                      >
                        Restaurar esta Versión
                      </button>
                      <button
                        onClick={() => setViewingVersion(null)}
                        className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[8px]"
                      >
                        Volver al Editor
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. ÁREA DEL CANVASES DE LA PÁGINA */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-[#131313] relative">
                  
                  {/* Page overflow warnings */}
                  <div className="w-full max-w-[800px] flex flex-col gap-1 mb-4 z-10">
                    {pages.map((_, idx) => {
                      if (pageOverflows[idx]) {
                        return (
                          <div key={idx} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[9px] flex items-center justify-between">
                            <span>⚠️ El contenido de la <strong>Página {idx + 1}</strong> excede el límite físico de la hoja.</span>
                            <button 
                              onClick={() => {
                                if (pagesContainerRef.current) {
                                  const pageDivs = pagesContainerRef.current.querySelectorAll('.word-page-content');
                                  if (pageDivs[idx]) pageDivs[idx].focus();
                                }
                              }}
                              className="underline font-bold uppercase hover:text-red-300"
                            >
                              Ir a la página
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Document Zoom Container */}
                  <div 
                    ref={pagesContainerRef}
                    style={{ 
                      transform: `scale(${zoom / 100})`, 
                      transformOrigin: 'top center',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginBottom: `${(zoom / 100 - 1) * 1200}px`
                    }}
                  >
                    {pages.map((pageHtml, idx) => (
                      <div 
                        key={idx} 
                        className={`relative mb-8 flex flex-col items-center border shadow-2xl transition-all duration-300 ${
                          pageColor === 'dark' 
                            ? 'border-[#3e4851] bg-[#1c1b1b]' 
                            : 'border-neutral-300 bg-white shadow-neutral-950/20'
                        }`}
                        style={{
                          width: `${orientation === 'vertical' ? 794 : 1123}px`,
                          minHeight: `${orientation === 'vertical' ? 1123 : 794}px`,
                        }}
                      >
                        {/* Page Ruler */}
                        {showRuler && <PageRuler margins={margins} orientation={orientation} />}

                        <div
                          contentEditable={!viewingVersion && (!activeDoc.isShared || activeDoc.sharedRole === 'editor')}
                          onInput={calculateWordCount}
                          onFocus={() => setFocusedPageIndex(idx)}
                          onContextMenu={handleContextMenu}
                          className="word-page-content ft-wysiwyg-content w-full outline-none p-12 h-full flex-1"
                          style={{
                            padding: margins === 'narrow' ? '24px' : margins === 'wide' ? '80px' : '48px',
                            color: pageColor === 'dark' ? '#e5e2e1' : '#000000',
                            fontFamily: fontFamily === 'JetBrains Mono' ? 'JetBrains Mono, monospace' : fontFamily === 'Georgia' ? 'Georgia, serif' : fontFamily === 'Times New Roman' ? 'Times New Roman, serif' : fontFamily === 'Courier New' ? 'Courier New, monospace' : fontFamily === 'Verdana' ? 'Verdana, sans-serif' : fontFamily === 'Arial' ? 'Arial, sans-serif' : 'Inter, sans-serif',
                            fontSize: fontSize,
                            lineHeight: '1.6'
                          }}
                          dangerouslySetInnerHTML={{ __html: pageHtml }}
                        />
                        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-neutral-400/60 select-none pointer-events-none border-t border-dashed border-neutral-700/10 pt-2 font-mono">
                          Página {idx + 1} de {pages.length}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparación Diff Mode */}
                  {viewingVersion && rightSidebarMode === 'versiones' && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none flex justify-center p-8 z-50">
                      <div className={`w-full h-full max-h-[900px] rounded-xl border border-neutral-800 bg-[#131313]/95 shadow-2xl p-10 overflow-y-auto text-[11px] select-text pointer-events-auto ${
                        orientation === 'vertical' ? 'max-w-[760px]' : 'max-w-[1000px]'
                      }`}>
                        <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
                          <span className="font-bold text-[#8ecdff]">Diferencias con la Versión Histórica (Verde = Agregado, Rojo = Eliminado)</span>
                        </div>
                        <div 
                          className="font-sans leading-relaxed text-[#bec8d2]"
                          dangerouslySetInnerHTML={{ __html: simpleWordDiff(viewingVersion.contenido, activeDoc.contenido) }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pie de página con Zoom */}
                <div className="h-8 bg-[#141414] border-t border-[#3e4851] px-4 flex items-center justify-between text-[10px] text-neutral-400 select-none shrink-0 z-10">
                  <div className="flex items-center gap-3">
                    <span>Página {focusedPageIndex + 1} de {pages.length}</span>
                    <span>•</span>
                    <span>{wordCount} palabras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Zoom: {zoom}%</span>
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={zoom} 
                      onChange={(e) => setZoom(parseInt(e.target.value))}
                      className="w-24 accent-[#8ecdff] cursor-pointer"
                    />
                  </div>
                </div>

                {/* 3. COLAPSIBLE LATERAL DERECHA (Comentarios / Versiones / Copilot) */}
                {rightSidebarMode && (
                  <aside className="w-80 border-l bg-[#1c1b1b] flex flex-col overflow-hidden absolute right-0 top-12 bottom-0 z-40 animate-in slide-in-from-right duration-200" 
                    style={{ borderColor: '#3e4851' }}>
                    
                    {/* Comentarios */}
                    {rightSidebarMode === 'comentarios' && (
                      <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b text-[10px] font-bold text-white flex justify-between items-center" style={{ borderColor: '#3e4851' }}>
                          <span>Comentarios del Documento</span>
                          <button onClick={() => setRightSidebarMode(null)} className="text-neutral-500 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 mac-scrollbar text-[10px]">
                          {comments.map(c => (
                            <div key={c.id} className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-[#8ecdff] truncate max-w-[150px]">{c.email_decrypted}</span>
                                <span className="text-[8px] text-neutral-500">{new Date(c.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-white leading-relaxed">{c.contenido}</p>
                            </div>
                          ))}
                          {comments.length === 0 && (
                            <div className="text-center py-10 text-neutral-500 italic">No hay comentarios en este archivo.</div>
                          )}
                        </div>
                        <div className="p-3 border-t bg-neutral-900" style={{ borderColor: '#3e4851' }}>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="w-full p-2 h-16 rounded-lg text-[10px] bg-[#131313] border border-neutral-800 text-white outline-none focus:border-[#8ecdff] resize-none"
                          />
                          <button onClick={addComment} className="w-full mt-2 h-8 rounded-lg bg-[#00a4ef] text-white text-[9px] font-bold uppercase transition-all">
                            Enviar Comentario
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Versiones */}
                    {rightSidebarMode === 'versiones' && (
                      <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b text-[10px] font-bold text-white flex justify-between items-center" style={{ borderColor: '#3e4851' }}>
                          <span>Historial de Versiones</span>
                          <button onClick={() => setRightSidebarMode(null)} className="text-neutral-500 hover:text-white">✕</button>
                        </div>
                        <div className="p-4 bg-neutral-900/60 border-b border-neutral-800 space-y-2">
                          <input
                            type="text"
                            value={versionDescription}
                            onChange={(e) => setVersionDescription(e.target.value)}
                            placeholder="Descripción de la versión..."
                            className="w-full px-2.5 h-8 rounded-lg text-[9px] bg-[#131313] border border-neutral-800 text-white outline-none focus:border-[#8ecdff]"
                          />
                          <button onClick={handleManualVersion} className="w-full h-8 rounded-lg bg-[#00a4ef]/10 text-[#8ecdff] border border-[#00a4ef]/30 text-[9px] font-bold uppercase transition-all">
                            Guardar Hito Manual
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 mac-scrollbar">
                          {versions.map((v, index) => (
                            <div
                              key={v.id}
                              onClick={() => setViewingVersion(v)}
                              className={`p-3 rounded-lg border text-[10px] cursor-pointer transition-all ${
                                viewingVersion?.id === v.id 
                                  ? 'bg-[#8ecdff]/10 border-[#8ecdff] text-[#8ecdff]' 
                                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-[#bec8d2]'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-white">Hito #{versions.length - index}</span>
                                <span className="text-[7px] text-neutral-500">{new Date(v.created_at).toLocaleTimeString()}</span>
                              </div>
                              <p className="line-clamp-2 italic">{v.cambio_descripcion}</p>
                            </div>
                          ))}
                          {versions.length === 0 && (
                            <div className="text-center py-10 text-neutral-500 italic">Sin versiones históricas todavía.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Copilot IA */}
                    {rightSidebarMode === 'copilot' && (
                      <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b text-[10px] font-bold text-white flex justify-between items-center" style={{ borderColor: '#3e4851' }}>
                          <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-400" /> Asistente Neural de Flujo</span>
                          <button onClick={() => setRightSidebarMode(null)} className="text-neutral-500 hover:text-white">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 mac-scrollbar text-[10px]">
                          {copilotMessages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                              <span className="text-[8px] text-neutral-500 mb-1">
                                {msg.role === 'user' ? 'Tú (Creador)' : 'Copilot Neural'}
                              </span>
                              <div className={`p-3 rounded-xl border max-w-[85%] leading-relaxed ${
                                msg.role === 'user' 
                                  ? 'bg-[#8ecdff]/10 border-[#8ecdff]/20 text-white' 
                                  : 'bg-neutral-900/80 border-neutral-800 text-[#bec8d2]'
                              }`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                              </div>
                            </div>
                          ))}
                          {copilotLoading && (
                            <div className="flex items-center gap-2 text-neutral-500 italic py-2">
                              <RefreshCw size={12} className="animate-spin text-[#8ecdff]" />
                              <span>Procesando instrucción...</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 border-t bg-neutral-900" style={{ borderColor: '#3e4851' }}>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={copilotInput}
                              onChange={(e) => setCopilotInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendCopilot();
                              }}
                              placeholder="Escribe tu mensaje..."
                              className="flex-1 px-3 h-9 rounded-lg text-[10px] bg-[#131313] border border-neutral-800 text-white outline-none focus:border-[#8ecdff]"
                              disabled={copilotLoading}
                            />
                            <button 
                              onClick={handleSendCopilot}
                              className="px-3 h-9 rounded-lg bg-[#00a4ef] text-white text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                              disabled={copilotLoading || !copilotInput.trim()}
                            >
                              Enviar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </aside>
                )}

              </div>
            )}
          </div>
        )}

      </div>

      {/* =========================================================================
      MODALES
      ========================================================================= */}

      {/* Modal: Compartir */}
      {showShareModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#1c1b1b] p-6 rounded-[24px] border shadow-2xl" style={{ borderColor: '#3e4851' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-white flex items-center gap-2">
                <Share2 size={14} className="text-[#8ecdff]" /> Compartir Documento
              </span>
              <button onClick={() => { setShowShareModal(false); setShareMessage(''); }} className="text-neutral-500 hover:text-white">✕</button>
            </div>

            {shareMessage && (
              <div className="mb-4 p-2 bg-[#8ecdff]/10 text-[#8ecdff] border border-[#8ecdff]/30 text-[9px] rounded-lg">
                {shareMessage}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[9px] text-[#bec8d2] font-semibold block mb-1">Correo del Colaborador</label>
                  <input
                    type="email"
                    placeholder="socio@dominio.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg text-[10px] outline-none text-white bg-[#131313] border"
                    style={{ borderColor: '#3e4851' }}
                  />
                </div>
                <div className="w-24">
                  <label className="text-[9px] text-[#bec8d2] font-semibold block mb-1">Rol</label>
                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg text-[10px] outline-none text-white bg-[#131313] border"
                    style={{ borderColor: '#3e4851' }}
                  >
                    <option value="lector">Lector</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] text-[#bec8d2] font-semibold block mb-1">Plazo de Expiración</label>
                <select
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg text-[10px] outline-none text-white bg-[#131313] border"
                  style={{ borderColor: '#3e4851' }}
                >
                  <option value="unlimited">Sin límite (Permanente)</option>
                  <option value="1day">Expira en 24 Horas</option>
                  <option value="3days">Expira en 3 Días</option>
                  <option value="7days">Expira en 7 Días</option>
                </select>
              </div>

              <button onClick={shareDocument} className="w-full h-8 rounded-lg bg-[#00a4ef] hover:bg-[#00a4ef]/80 text-white text-[10px] font-bold uppercase transition-all">
                Agregar Colaborador
              </button>

              <div className="pt-4 border-t" style={{ borderColor: '#3e4851' }}>
                <span className="text-[9px] font-bold text-[#bec8d2] uppercase tracking-wider block mb-2">Accesos Autorizados</span>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 mac-scrollbar">
                  {shares.map(sh => (
                    <div key={sh.id} className="flex justify-between items-center bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-[10px]">
                      <div>
                        <span className="font-bold text-white block">{sh.email}</span>
                        <div className="flex gap-2 items-center mt-0.5 text-[8px] text-neutral-500">
                          <span className="capitalize text-[#8ecdff]">{sh.rol}</span>
                          <span>•</span>
                          <span>{sh.expira_el ? `Expira: ${new Date(sh.expira_el).toLocaleDateString()}` : 'Permanente'}</span>
                        </div>
                      </div>
                      <button onClick={() => revokeShare(sh.id)} className="text-red-400 hover:underline text-[9px] font-bold">
                        Revocar
                      </button>
                    </div>
                  ))}
                  {shares.length === 0 && (
                    <p className="text-[9px] text-neutral-500 italic py-2">Nadie más tiene acceso a este documento todavía.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Carpeta */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#1c1b1b] p-6 rounded-[24px] border shadow-2xl" style={{ borderColor: '#3e4851' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-white flex items-center gap-2">
                <Folder size={14} className="text-[#8ecdff]" /> Crear Nueva Carpeta
              </span>
              <button onClick={() => setShowFolderModal(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-[#bec8d2] font-semibold block mb-1">Nombre de la Carpeta</label>
                <input
                  type="text"
                  placeholder="Ej: Contratos 2026"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg text-[10px] outline-none text-white bg-[#131313] border focus:border-[#8ecdff]"
                  style={{ borderColor: '#3e4851' }}
                />
              </div>
              <button onClick={createFolder} className="w-full h-8 rounded-lg bg-[#00a4ef] hover:bg-[#00a4ef]/80 text-white text-[10px] font-bold uppercase transition-all">
                Crear Carpeta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buscar y Reemplazar */}
      {showFindReplaceModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#1c1b1b] p-6 rounded-[24px] border shadow-2xl" style={{ borderColor: '#3e4851' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-white flex items-center gap-2">
                <Search size={14} className="text-[#8ecdff]" /> Buscar y Reemplazar
              </span>
              <button onClick={() => setShowFindReplaceModal(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-[#bec8d2] font-semibold block mb-1">Buscar Texto</label>
                <input
                  type="text"
                  placeholder="Texto a buscar..."
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg text-[10px] outline-none text-white bg-[#131313] border focus:border-[#8ecdff]"
                  style={{ borderColor: '#3e4851' }}
                />
              </div>
              <div>
                <label className="text-[9px] text-[#bec8d2] font-semibold block mb-1">Reemplazar Con</label>
                <input
                  type="text"
                  placeholder="Reemplazar con..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg text-[10px] outline-none text-white bg-[#131313] border focus:border-[#8ecdff]"
                  style={{ borderColor: '#3e4851' }}
                />
              </div>
              <button 
                onClick={handleReplaceAll}
                className="w-full h-8 rounded-lg bg-[#00a4ef] hover:bg-[#00a4ef]/80 text-white text-[10px] font-bold uppercase transition-all"
              >
                Reemplazar Todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Contextual de clic derecho */}
      {contextMenu && (
        <div 
          className="fixed z-[3000] bg-[#1c1b1b] border border-[#3e4851] rounded-xl shadow-2xl py-1.5 w-52 text-[10px] text-white animate-in fade-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.targetTable ? (
            <>
              <div className="px-3 py-1 text-neutral-500 uppercase font-bold text-[8px]">Modificar Tabla</div>
              <button 
                onClick={() => insertRowBelow(contextMenu.targetTable, contextMenu.targetCell)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                Insertar Fila Abajo
              </button>
              <button 
                onClick={() => insertColRight(contextMenu.targetTable, contextMenu.targetCell)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                Insertar Columna Derecha
              </button>
              <div className="border-t border-white/5 my-1"></div>
              <button 
                onClick={() => deleteCurrentRow(contextMenu.targetTable, contextMenu.targetCell)}
                className="w-full text-left px-3 py-1.5 hover:bg-[#e04a4a]/20 hover:text-red-400 text-red-300 transition-colors flex items-center gap-2"
              >
                Eliminar Fila Actual
              </button>
              <button 
                onClick={() => deleteCurrentCol(contextMenu.targetTable, contextMenu.targetCell)}
                className="w-full text-left px-3 py-1.5 hover:bg-[#e04a4a]/20 hover:text-red-400 text-red-300 transition-colors flex items-center gap-2"
              >
                Eliminar Columna Actual
              </button>
              <button 
                onClick={() => deleteEntireTable(contextMenu.targetTable)}
                className="w-full text-left px-3 py-1.5 hover:bg-[#e04a4a]/20 hover:text-red-400 text-red-300 font-bold transition-colors flex items-center gap-2"
              >
                Eliminar Tabla Completa
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-1 text-neutral-500 uppercase font-bold text-[8px]">Formato y Herramientas</div>
              <button 
                onClick={() => execCommand('bold')}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="font-bold">N</span> Negrita
              </button>
              <button 
                onClick={() => execCommand('italic')}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="italic">K</span> Cursiva
              </button>
              <button 
                onClick={() => execCommand('underline')}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="underline">S</span> Subrayado
              </button>
              <div className="border-t border-white/5 my-1"></div>
              <button 
                onClick={promptInsertTable}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                Insertar Tabla...
              </button>
              <button 
                onClick={insertChecklist}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                Insertar Checklist
              </button>
              <button 
                onClick={() => execCommand('insertHorizontalRule')}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                Línea Divisoria
              </button>
              <div className="border-t border-white/5 my-1"></div>
              <button 
                onClick={() => execCommand('removeFormat')}
                className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2 text-neutral-400"
              >
                Limpiar Formato
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}
