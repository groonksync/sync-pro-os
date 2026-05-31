import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Save, Trash2, Edit3, X, Image as ImageIcon,
  Truck, Tag, Box as BoxIcon, Layout, CheckCircle, ChevronLeft, ChevronRight,
  Briefcase, ShoppingBag, DollarSign, Hash, MapPin, ShieldCheck, FileText, Info, Zap, ShoppingCart,
  Layers, Ruler, Weight, Globe, Star, AlertTriangle, List, ArrowUpRight, ArrowLeft, ArrowRight,
  Barcode, Shield, ZapOff, Activity, Palette, ClipboardList, RotateCcw, Search, TrendingUp, AlertOctagon, Video, Download,
  Music, Smartphone, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';
import { aiService } from '../services/aiService';
import { safeDelete } from '../lib/trashService';

const Toast = ({ message, show, onClose, isDark, t }) => {
  useEffect(() => {
    if (show) { const timer = setTimeout(() => onClose(), 3000); return () => clearTimeout(timer); }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <div style={{ backgroundColor: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(245,245,247,0.98)', backdropFilter: 'blur(24px)', border: `1px solid ${t.border}`, padding: '14px 28px', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 12, minWidth: 280, justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}><CheckCircle size={16} /></div>
        <span style={{ color: isDark ? '#fff' : '#141414', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{message}</span>
      </div>
    </div>
  );
};

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, t }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
      <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, padding: 28, borderRadius: 24, maxWidth: 420, width: '90%', boxShadow: 'none', animation: 'scaleIn 0.3s ease-out' }}>
        <h4 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: t.text, letterSpacing: '0.05em', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={18} color="#ef4444" /> {title}</h4>
        <p style={{ fontSize: 12, color: t.textMuted, lineHeight: '1.6', margin: '0 0 28px 0' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 12, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.textDim, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_PRODUCTS = [
  {
    "nombre": "POWER BANK 10,000mAh NEGRO/GRIS",
    "categoria": "Accesorios",
    "precio_costo": 99,
    "precio_venta": 155,
    "precio_antes": 200,
    "stock_actual": 18,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "POWER BANK 10,000mAh NEGRO/GRIS*180g COMPACTO Y LIGERO*CARGA RAPIDA*2 PUERTOS 1X USB-A, 1x USB-C*MATERIAL PC+ABS\n",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777692539470-5t048.webp",
    "codigo": "GF0647",
    "sku": "GF0647",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777692521532-cmenx.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777692531562-3qxjo.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777692539470-5t048.webp"
    ],
    "marca": "HAVIT",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "AUDIFONOS INALAMBRICOS CONFORT NEGRO",
    "categoria": "Audio y Sonido",
    "precio_costo": 142,
    "precio_venta": 230,
    "precio_antes": 0,
    "stock_actual": 12,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "AUDIFONOS INALAMBRICOS CONFORT NEGRO* PESO 2,083gr*DISEO ERGONOMICO CONFORT IN-EAR*CASE CON DISPLAY PARA VER EL NIVEL DE BATERIA*BT V5,4*DISEOÑ COMPACTO\n",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777738066951-q83gf.webp",
    "codigo": "AIRBUDS 9-BK",
    "sku": "AIRBUDS 9-BK",
    "garantia": "180 Días",
    "tipo_envio": "Envío Gratuito",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777738066951-q83gf.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777689299635-bbapj.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777689314364-m04w8.webp"
    ],
    "marca": "HAVIT",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "EXTENSION DE PANTALLA PARA LAPTOP",
    "categoria": "Computadoras",
    "precio_costo": 1193,
    "precio_venta": 1400,
    "precio_antes": 0,
    "stock_actual": 6,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "EXTENSION DE PANTALLA PARA LAPTOP*PANTALLA 14\" IPS FHD 1080P* 60Hz*COMPATIBLE PD 3.0 20V/5A*COMPATIBLE CON WIN/MAC/ANDROID/LINUX/CHROMEOS*DISEÑO PREMIUM*ALTAVOZ\n",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777690191316-n16ju.webp",
    "codigo": "SCM6",
    "sku": "SCM6",
    "garantia": "180 Días",
    "tipo_envio": "Envío Gratuito",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777690186172-tbv7x.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777690191316-n16ju.webp"
    ],
    "marca": "Sovereign",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "MICROFONO INALAMBRICO TODO EN UNO BOYA",
    "categoria": "Audio y Sonido",
    "precio_costo": 2273,
    "precio_venta": 2550,
    "precio_antes": 2600,
    "stock_actual": 8,
    "stock_minimo": 2,
    "stock_vendido": 0,
    "ficha_tecnica": "MICROFONO INALAMBRICO TODO EN UNO*TRUE AI*PARA USO PROFESIONAL*FULL KIT\n",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777737243332-143mi.webp",
    "codigo": "BOYAMIC 2-01",
    "sku": "GV0027",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777737243332-143mi.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777737238297-kzxvz.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777737338736-6erzd.webp"
    ],
    "marca": "BOYA",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "AURICULARES INALAMBRICOS ESTEREO NEGRO",
    "categoria": "Audio y Sonido",
    "precio_costo": 123,
    "precio_venta": 200,
    "precio_antes": 250,
    "stock_actual": 33,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "AURICULARES INALAMBRICOS ESTEREO NEGRO*TAMAÑO COMPACTO*CONTROL TACTIL*LLAMADAS NITIDAS*GRAVES POTENTES*BT 5.3*PUERTO TIPO-C*5HR BATERIA",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777688997328-e4iyh.webp",
    "codigo": "GF0563",
    "sku": "GF0563",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777688739198-qfsbk.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777688742733-6iaes.webp"
    ],
    "marca": "HAVIT",
    "color": "NEGRO",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "MICROFONO INALAMBRICO TODO EN UNO",
    "categoria": "Audio y Sonido",
    "precio_costo": 1518,
    "precio_venta": 1800,
    "precio_antes": 2100,
    "stock_actual": 12,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "MICROFONO INALAMBRICO TODO EN UNO*BOTON DE GRABACION (REC) INTEGRADO*ALCANCE 300MTS*CONTROL DE CANCELACION DE RUIDO 48kHz/ 24bit HD*8GB DE MEMORIA INTERNA*\n",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777694339200-p6yj0.webp",
    "codigo": "BOYAMIC",
    "sku": "GV0010",
    "garantia": "180 Días",
    "tipo_envio": "Envío Gratuito",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777694339200-p6yj0.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777694345485-a6g8r.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777694358281-7xb0z.webp"
    ],
    "marca": "BOYA",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "CAMARA IP WIFI 5X5MP DOBLE LENTE TIPO PT",
    "categoria": "Cámaras y Fotografía",
    "precio_costo": 695,
    "precio_venta": 780,
    "precio_antes": 820,
    "stock_actual": 12,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "CAMARA IP WIFI 5X5MP DOBLE LENTE TIPO PT **DETECCIÓN DUAL *CONTROL DE RONDA *SIRENA Y LUZ DE ALARMA *DETEC. PERSONAS Y VEHICULOS IA *IP66 *MICRO SD HASTA 256GB",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518465961-6a7x5.webp",
    "codigo": "IPC-P5DP-5F-PV-0280B/0600",
    "sku": "EA0849",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518465961-6a7x5.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518469333-7ukjd.webp"
    ],
    "marca": "DAHUA TECHNOLOGY",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "MICROFONO INALAMBRICO MINI",
    "categoria": "Audio y Sonido",
    "precio_costo": 285,
    "precio_venta": 340,
    "precio_antes": 370,
    "stock_actual": 1,
    "stock_minimo": 2,
    "stock_vendido": 0,
    "ficha_tecnica": "MICROFONO INALAMBRICO MINI*ULTRACOMPACTO Y PORTATIL*48KHz/16bits*CANCELACION DE RUIDO CON IA DE 4 NIVELES*30Hr DE BATERIA*TRANSMISION 100MT*FILTROS DE VOZ IA\n",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777738496425-vhk57.webp",
    "codigo": "WAVE T1 MINI",
    "sku": "WAVE T1 MINI",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777738496425-vhk57.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777738505470-6ang9.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777738513868-i6eu9.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777738520729-kwxdb.webp"
    ],
    "marca": "MAONO",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "CÁMARA PT WIFI 4MP TIPO FOCO",
    "categoria": "Cámaras y Fotografía",
    "precio_costo": 245,
    "precio_venta": 300,
    "precio_antes": 340,
    "stock_actual": 4,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "CÁMARA PT WIFI 4MP TIPO FOCO *DETEC. PERSONAS *DETEC. MOVIMIENTO *AUDIO BIDIRECCIONAL *DIT. IR 8-10M *WIFI 2.4GHz *RANURA MICRO SD MAX 256GB *MATERIAL PLASTICO",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778519157314-md024.webp",
    "codigo": "G120",
    "sku": "G120",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778519157314-md024.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778519163140-424q9.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778519171164-mg8ng.webp"
    ],
    "marca": "DIMAX",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "CAMARA CRUISER DUAL 2 IP WIFI 3+5MP",
    "categoria": "Cámaras y Fotografía",
    "precio_costo": 719,
    "precio_venta": 810,
    "precio_antes": 850,
    "stock_actual": 4,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "CAMARA CRUISER DUAL 2 IP WIFI 3+5MP *TIPO PT *LENTE FIJO 3MP, LENTE PT 5MP *LUCES DISUASIVAS ROJO/AZUL *SIRENA INTEGRADA *FULL COLOR *AUDIO BIDIRECCIONAL",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518786231-n8bwv.webp",
    "codigo": "IPC-S7XEN-8M0WED-0360B",
    "sku": "ED0055",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518786231-n8bwv.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518796638-mk8wr.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518803815-0t502.webp"
    ],
    "marca": "IMOU",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "AURICULARES INALAMBRICOS DE OIDO ABIERTO",
    "categoria": "Audio y Sonido",
    "precio_costo": 142,
    "precio_venta": 250,
    "precio_antes": 280,
    "stock_actual": 46,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "AURICULARES INALAMBRICOS DE OIDO ABIERTO*CANCELACION DE RUIDO*RESISTENCIA IPX5*BT V5.4*PUERTO USB-C\n",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777689521868-z4295.webp",
    "codigo": "OWS916 LITE-BK",
    "sku": "GF0617",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777689521868-z4295.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777689530295-wgl5g.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1777689535371-zrj8w.webp"
    ],
    "marca": "HAVIT",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "CÁMARA IP WIFI CRUISER SC 3MP *TIPO PT",
    "categoria": "Cámaras y Fotografía",
    "precio_costo": 429,
    "precio_venta": 510,
    "precio_antes": 540,
    "stock_actual": 95,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "CÁMARA IP WIFI CRUISER SC 3MP *TIPO PT *FULL COLOR *RASTERO INTELIGENTE *AUDIO BIDIRECCIONAL *1 PUERTO RJ45 *MICRO SD HASTA 512GB *PARA EXTERIORES *DISUASIVA",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518931626-0cin7.webp",
    "codigo": "IPC-K7FN-3H0WE-imou",
    "sku": "ED0068",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518931626-0cin7.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518986261-ovd5y.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518993227-8zd5b.webp"
    ],
    "marca": "IMOU",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "CAMARA IP WIFI 3X3MP DOBLE LENTE TIPO PT",
    "categoria": "Cámaras y Fotografía",
    "precio_costo": 695,
    "precio_venta": 850,
    "precio_antes": 900,
    "stock_actual": 4,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "CAMARA IP WIFI 3X3 MP DOBLE LENTE TIPO PT *DETECCIÓN DUAL *CONTROL DE RONDA *SIRENA Y LUZ DE ALARMA *DETEC. PERSONAS Y VEHICULOS IA *IP66 *MICRO SD HASTA 256GB",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518105959-rnq57.webp",
    "codigo": "EA0847",
    "sku": "EA0847",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518105959-rnq57.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778518110310-vzwwh.webp"
    ],
    "marca": "DAHUA TECHNOLOGY",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "CÁMARA WIFI 4MP C/ PANEL SOLAR Y BATERIA",
    "categoria": "Cámaras y Fotografía",
    "precio_costo": 755,
    "precio_venta": 850,
    "precio_antes": 900,
    "stock_actual": 4,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "CÁMARA PT WIFI 4MP C/ PANEL SOLAR Y BATERIA *FUL COLOR *SENSOR PIR *AUDIO BIDIRECCIONAL *VISION NOCTURA HASTA 15M *IP65 *MICRO SD MAX 256GB",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522784817-dh027.webp",
    "codigo": "G119",
    "sku": "G119",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522784817-dh027.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522791831-atwca.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522800707-b54bx.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522806050-rzcuw.webp"
    ],
    "marca": "DIMAX",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "CAMARA IP WIFI CRUISER SC+ 5MP",
    "categoria": "Cámaras y Fotografía",
    "precio_costo": 485,
    "precio_venta": 580,
    "precio_antes": 620,
    "stock_actual": 56,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "CAMARA IP WIFI CRUISER SC+ 5MP *DETEC. HUMANOS *RASTREO INTELIGENTE *DISUACIÓN ACTIVA *IP66 *AUDIO BIDIRECCIONAL *SD MAS 512GB *FULL COLOR *1 RJ45 1 x 100MBPS",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522479249-9ms3r.webp",
    "codigo": "IPC-K7FN-5H0WE-imou",
    "sku": "ED0069",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522479249-9ms3r.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522489503-yjo02.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778522495497-gby1o.webp"
    ],
    "marca": "IMOU",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "CÁMARA PT WIFI 4MP PANEL SOLAR Y BATERIA",
    "categoria": "Cámaras y Fotografía",
    "precio_costo": 629,
    "precio_venta": 720,
    "precio_antes": 790,
    "stock_actual": 20,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "CÁMARA PT WIFI FULL COLOR 4MP CON PANEL SOLAR Y BATERIA INTEGRADA *FULL COLOR *DETEC. PERSONAS *SENSOR PIR *DIST. ILUM. 8M *IP65 *POTENCIA PANEL 2.25W",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778523658489-fb6n8.webp",
    "codigo": "G125",
    "sku": "G125",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778523658489-fb6n8.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778523663532-faixc.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778523673740-1kxtx.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778523682797-qqpnt.webp"
    ],
    "marca": "DIMAX",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "MICROFONO + BRAZO HIDRAULICO RGB",
    "categoria": "Audio y Sonido",
    "precio_costo": 264,
    "precio_venta": 340,
    "precio_antes": 380,
    "stock_actual": 36,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "MICROFONO + BRAZO HIDRAULICO RGB*MICROFONO PARA STREAMING RGB*BOTON DE MUTE TOUCH*CARDIOIDE*FRECUENCIA DE RESPUESTA 30Hz-20000Hz",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778524527472-pkhsz.webp",
    "codigo": "GF0585",
    "sku": "GF0585",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778524527472-pkhsz.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778524544597-rv37u.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778524552653-odc0r.webp"
    ],
    "marca": "HAVIT",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "Fuente de alimentación portátil de 1200W",
    "categoria": "Electrónica",
    "precio_costo": 8946,
    "precio_venta": 9600,
    "precio_antes": 10800,
    "stock_actual": 8,
    "stock_minimo": 5,
    "stock_vendido": 0,
    "ficha_tecnica": "Capacidad: 1200VA/1200W • Voltaje: 220V • Tomas de corriente: 3 NEMA 5-15R + 8 CC • Factor de forma: Torre • Forma de onda: Onda sinusoidal pura",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778607812517-3pp1na.webp",
    "codigo": "FPP-T1202",
    "sku": "FPP-T1202",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778607812517-3pp1na.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778607812521-yg1n8d.webp"
    ],
    "marca": "FORZA",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "COMBO TECLADO+MOUSE ESTANDAR USB",
    "categoria": "Computadoras",
    "precio_costo": 45,
    "precio_venta": 80,
    "precio_antes": 110,
    "stock_actual": 88,
    "stock_minimo": 5,
    "stock_vendido": 1,
    "ficha_tecnica": "COMBO TECLADO+MOUSE ESTANDAR USB*104 TECLAS*CABLE USB 1.5m*TECLADO EN ESPAÑOL",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778524171300-5mzwg.webp",
    "codigo": "GF0548",
    "sku": "GF0548",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778524171300-5mzwg.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778524188962-8l614.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778524197499-y9dwn.webp"
    ],
    "marca": "HAVIT",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  },
  {
    "nombre": "MEMORIA MICRO SD 128GB EXTREME PRO",
    "categoria": "Celulares y Accesorios",
    "precio_costo": 228,
    "precio_venta": 260,
    "precio_antes": 300,
    "stock_actual": 47,
    "stock_minimo": 5,
    "stock_vendido": 1,
    "ficha_tecnica": "MEMORIA MICRO SD 128GB EXTREME PRO* SDXC 128GB V30/A1/C10 HASTA 100MB/s,NO INCLUYE ADAPTADOR",
    "estado": "Stock",
    "imagen": "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778523957003-4rx6a.webp",
    "codigo": "GN0037",
    "sku": "GN0037",
    "garantia": "180 Días",
    "tipo_envio": "Costo Adicional",
    "imagenes": [
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778523957003-4rx6a.webp",
      "https://wcewgxkizvsnffhbqqet.supabase.co/storage/v1/object/public/productos/1778523963785-exjln.webp"
    ],
    "marca": "NETAC",
    "color": "",
    "condicion": "Nuevo",
    "metadata": {}
  }
];

const AMAZON_CATEGORIES = [
  "Electrónica", "Computadoras", "Celulares y Accesorios", "Audio y Sonido", "Cámaras y Fotografía",
  "Hogar y Cocina", "Ropa y Calzado", "Belleza y Cuidado Personal", "Deportes y Fitness", "Juguetes y Juegos",
  "Salud y Bienestar", "Libros", "Automotriz", "Herramientas y Bricolaje", "Oficina y Papelería",
  "Jardín y Exteriores", "Mascotas", "Alimentos y Bebidas", "Accesorios", "Ofertas", "Combos/Packs"
];

const getCategoryIcon = (category) => {
  const catLower = category?.toLowerCase() || '';
  if (catLower.includes('computadoras') || catLower.includes('pc') || catLower.includes('laptop')) return BoxIcon;
  if (catLower.includes('audio') || catLower.includes('sonido') || catLower.includes('música') || catLower.includes('micrófono')) return Music;
  if (catLower.includes('celular') || catLower.includes('teléfono') || catLower.includes('accesorio')) return Smartphone;
  if (catLower.includes('cámara') || catLower.includes('fotografía') || catLower.includes('seguridad') || catLower.includes('video')) return Video;
  if (catLower.includes('electrónica') || catLower.includes('fuente') || catLower.includes('forza')) return Zap;
  return Tag;
};

const Inventario = ({ settings = {}, isDark = true, initialSearch = '' }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [aiLoading, setAiLoading] = useState(false);

  const optimizeDescriptionWithAI = async () => {
    if (!editingProduct?.descripcion || !editingProduct?.nombre) return;
    setAiLoading(true);
    try {
      const { nombre, descripcion, garantia, tipo_envio, es_oferta, precio_oferta, es_combo, productos_regalo } = editingProduct;
      
      // Construir dinámicamente la lista de especificaciones del producto que SÍ han sido rellenadas
      let productDetails = `- Nombre del Producto: ${nombre}\n- Detalles y Características: ${descripcion}`;
      
      const hasGarantia = garantia && garantia.trim() && garantia.trim() !== 'Sin garantía registrada';
      const hasEnvio = tipo_envio && tipo_envio.trim();
      const hasOferta = es_oferta && parseFloat(precio_oferta) > 0;
      const hasCombo = es_combo && productos_regalo && productos_regalo.trim();

      if (hasGarantia) {
        productDetails += `\n- Garantía: ${garantia.trim()}`;
      }
      if (hasEnvio) {
        productDetails += `\n- Método de Envío: ${tipo_envio.trim()}`;
      }
      if (hasOferta) {
        productDetails += `\n- Oferta Especial: Sí, precio de oferta ${precio_oferta} BS`;
      }
      if (hasCombo) {
        productDetails += `\n- Adicionales del combo: ${productos_regalo.trim()}`;
      }

      const prompt = `Actúa como un Copywriter profesional experto en E-commerce y WhatsApp Business.
Reescribe y optimiza la descripción del siguiente producto para que sea muy atractiva, resumida, directa y profesional en una tienda de WhatsApp.

DATOS DISPONIBLES DEL PRODUCTO:
${productDetails}

REGLAS DE FORMATO Y ESTILO:
1. La descripción debe ser CORTA y DIRECTA AL GRANO (resumida pero detallada al punto para que el usuario entienda de un vistazo). Evita explicaciones largas, rodeos o introducciones vacías.
2. Si el usuario NO rellenó un campo específico en los DATOS DISPONIBLES anteriores (por ejemplo, si no hay garantía o no hay regalos de combo en la lista), NO inventes esa información y NO pongas ese campo ni hagas mención a él en absoluto.
3. Divide el texto en estas secciones usando emojis temáticos:
   - Una breve frase persuasiva de introducción (máximo 15 palabras) basada únicamente en los datos provistos.
   - 🌟 *Especificaciones:* Una lista corta (2 o 3 viñetas máximo) usando asterisco '*' al inicio de cada línea para viñetas y negritas de WhatsApp (ej: '*Pantalla:* 6.7 pulgadas').
   - 📦 *Entrega y Garantía:* (Solo si se proporcionaron datos de envío o garantía) Detalles breves de entrega y garantía. Si no se especificaron arriba, omite esta sección por completo.
4. Todo el texto debe ser apto para móviles, con oraciones cortas.
5. Devuelve únicamente el texto optimizado final, sin comentarios explicativos de ningún tipo.`;

      const response = await aiService.askAgent(prompt, [], { settings });
      if (response && !response.startsWith('❌') && !response.startsWith('⚠️')) {
        setEditingProduct(prev => ({ ...prev, descripcion: response.trim() }));
        setToast({ show: true, message: 'Descripción Optimizada' });
      } else {
        alert("Error de IA: " + response);
      }
    } catch (e) {
      alert("Error al optimizar con IA: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const [activeSection, setActiveSection] = useState('productos'); // 'productos' | 'pedidos'
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todos');
  const [toast, setToast] = useState({ show: false, message: '' });

  const inputStyle = useMemo(() => ({
    width: '100%',
    backgroundColor: !isDark ? '#ffffff' : 'rgba(255,255,255,0.02)',
    border: !isDark ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: '12px 16px',
    fontSize: 12,
    outline: 'none',
    color: t.text,
  }), [isDark, t]);

  const selectStyle = useMemo(() => ({
    width: '100%',
    backgroundColor: !isDark ? '#ffffff' : 'rgba(255,255,255,0.03)',
    border: !isDark ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: '12px 16px',
    fontSize: 12,
    outline: 'none',
    color: t.text,
  }), [isDark, t]);

  const labelStyle = useMemo(() => ({
    fontSize: 8,
    fontWeight: 900,
    color: t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  }), [t]);
  
  // Custom states for sorting and collapsible UI
  const [sortBy, setSortBy] = useState('nombre');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllLowStock, setShowAllLowStock] = useState(false);

  // Custom dialog state
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, item: null });
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);


  useEffect(() => { 
    fetchData(); 
    fetchPedidos();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProductos(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchPedidos = async () => {
    try {
      setPedidosLoading(true);
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('estado', 'Pendiente')
        .order('fecha', { ascending: false });
      if (error) throw error;
      setPedidosPendientes(data || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setPedidosLoading(false); 
    }
  };

  const handleAprobarPedido = async (pedido) => {
    if (!pedido || !pedido.metadata || !Array.isArray(pedido.metadata.cart)) return;
    try {
      setLoading(true);
      for (const item of pedido.metadata.cart) {
        const { data: prodData } = await supabase.from('productos').select('stock_actual, stock_vendido').eq('id', item.id).single();
        if (prodData) {
          const currentStock = parseInt(prodData.stock_actual || 0);
          const nextStock = Math.max(0, currentStock - (parseInt(item.quantity) || 1));
          const nextVendido = parseInt(prodData.stock_vendido || 0) + (parseInt(item.quantity) || 1);
          await supabase.from('productos').update({ stock_actual: nextStock, stock_vendido: nextVendido }).eq('id', item.id);
        }
      }
      
      const { error } = await supabase.from('ventas').update({ estado: 'Aprobado' }).eq('id', pedido.id);
      if (error) throw error;
      
      setToast({ show: true, message: 'Pedido Aprobado y Stock Actualizado' });
      await fetchPedidos();
      await fetchData();
    } catch (e) {
      alert('Error al aprobar pedido: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarPedido = async (pedidoId) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido? Se eliminará de la lista.')) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('ventas').delete().eq('id', pedidoId);
      if (error) throw error;
      setToast({ show: true, message: 'Pedido Cancelado' });
      await fetchPedidos();
    } catch (e) {
      alert('Error al cancelar pedido: ' + e.message);
    } finally {
      setLoading(false);
    }
  };



  const handleSaveProduct = async () => {
    if (!editingProduct?.nombre) return;
    setLoading(true);
    try {
      const payload = {
        ...editingProduct,
        precio_venta: parseFloat(editingProduct.precio_venta) || 0,
        precio_costo: parseFloat(editingProduct.precio_costo) || 0,
        precio_antes: parseFloat(editingProduct.precio_antes) || 0,
        stock_actual: parseInt(editingProduct.stock_actual) || 0,
        es_oferta: !!editingProduct.es_oferta,
        precio_oferta: parseFloat(editingProduct.precio_oferta) || 0,
        es_combo: !!editingProduct.es_combo,
        productos_regalo: editingProduct.productos_regalo || '',
        enlace_compra: editingProduct.enlace_compra || '',
        updated_at: new Date().toISOString(),
        metadata: {
          ...(editingProduct.metadata || {}),
          video_url: editingProduct.video_url || '',
          sku: editingProduct.sku || '',
          codigo: editingProduct.codigo || '',
          es_oferta: !!editingProduct.es_oferta,
          precio_oferta: parseFloat(editingProduct.precio_oferta) || 0,
          es_combo: !!editingProduct.es_combo,
          productos_regalo: editingProduct.productos_regalo || '',
          link_compra: editingProduct.enlace_compra || ''
        }
      };
      
      const { 
        descripcion, 
        video_url, 
        es_oferta, 
        precio_oferta, 
        es_combo, 
        productos_regalo, 
        ...cleanPayload 
      } = payload;
      cleanPayload.ficha_tecnica = descripcion || payload.ficha_tecnica || '';
      
      const { error } = await supabase.from('productos').upsert(cleanPayload);
      if (error) throw error;
      
      await fetchData();
      setIsModalOpen(false);
      setEditingProduct(null);
      setToast({ show: true, message: 'Producto Guardado' });
    } catch (e) {
      alert('Error de guardado: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (p) => {
    setEditingProduct({
      ...p,
      imagen: p.imagen || '',
      imagenes: p.imagenes || [],
      descripcion: p.descripcion || p.ficha_tecnica || '',
      sku: p.sku || p.metadata?.sku || '',
      codigo: p.codigo || p.metadata?.codigo || '',
      stock_minimo: p.stock_minimo || 5,
      stock_vendido: p.stock_vendido || 0,
      garantia: p.garantia || '180 Días',
      tipo_envio: p.tipo_envio || 'Envío Gratuito',
      video_url: p.video_url || p.metadata?.video_url || '',
      enlace_compra: p.enlace_compra || p.metadata?.link_compra || '',
      es_oferta: p.es_oferta !== undefined ? p.es_oferta : (p.metadata?.es_oferta || false),
      precio_oferta: p.precio_oferta !== undefined ? p.precio_oferta : (p.metadata?.precio_oferta || 0),
      es_combo: p.es_combo !== undefined ? p.es_combo : (p.metadata?.es_combo || false),
      productos_regalo: p.productos_regalo !== undefined ? p.productos_regalo : (p.metadata?.productos_regalo || ''),
      metadata: p.metadata || {}
    });
    setIsModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct({
      id: generateUUID(),
      nombre: '',
      categoria: 'Electrónica',
      marca: '',
      precio_costo: 0,
      precio_venta: 0,
      precio_antes: 0,
      stock_actual: 10,
      stock_minimo: 5,
      stock_vendido: 0,
      codigo: '',
      sku: '',
      imagen: '',
      imagenes: [],
      descripcion: '',
      garantia: '180 Días',
      tipo_envio: 'Envío Gratuito',
      video_url: '',
      enlace_compra: '',
      es_oferta: false,
      precio_oferta: 0,
      es_combo: false,
      productos_regalo: '',
      metadata: {}
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!confirmDelete.id) return;
    try {
      setLoading(true);
      await safeDelete('producto', confirmDelete.id, confirmDelete.item);
      setToast({ show: true, message: 'Producto movido a la papelera' });
      setConfirmDelete({ isOpen: false, id: null, item: null });
      await fetchData();
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
        urls.push(publicUrl);
      }
      const newImages = [...(editingProduct.imagenes || []), ...urls];
      setEditingProduct(prev => ({
        ...prev,
        imagenes: newImages,
        imagen: prev.imagen || newImages[0]
      }));
      setToast({ show: true, message: 'Imágenes Subidas' });
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveImage = (idx, direction) => {
    if (!editingProduct) return;
    const list = [...(editingProduct.imagenes || [])];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
    
    // If the cover was one of these, keep track of it
    let newCover = editingProduct.imagen;
    if (editingProduct.imagen === list[targetIdx]) {
      newCover = list[idx];
    } else if (editingProduct.imagen === list[idx]) {
      newCover = list[targetIdx];
    }

    setEditingProduct({
      ...editingProduct,
      imagenes: list,
      imagen: newCover
    });
  };

  const handleDeleteImage = (idx) => {
    if (!editingProduct) return;
    const targetUrl = editingProduct.imagenes[idx];
    const list = editingProduct.imagenes.filter((_, i) => i !== idx);
    setEditingProduct({
      ...editingProduct,
      imagenes: list,
      imagen: editingProduct.imagen === targetUrl ? (list[0] || '') : editingProduct.imagen
    });
  };

  const [manualUrlInput, setManualUrlInput] = useState('');
  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim() || !editingProduct) return;
    const updatedList = [...(editingProduct.imagenes || []), manualUrlInput.trim()];
    setEditingProduct({
      ...editingProduct,
      imagenes: updatedList,
      imagen: editingProduct.imagen || manualUrlInput.trim()
    });
    setManualUrlInput('');
  };

  const filteredProducts = useMemo(() => {
    let result = [...productos];
    if (selectedCategoryFilter !== 'Todos') {
      result = result.filter(p => p.categoria === selectedCategoryFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.nombre?.toLowerCase().includes(lower) || 
        p.categoria?.toLowerCase().includes(lower) || 
        p.sku?.toLowerCase().includes(lower) ||
        p.codigo?.toLowerCase().includes(lower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'nombre') {
        return (a.nombre || '').localeCompare(b.nombre || '');
      }
      if (sortBy === 'nombre-desc') {
        return (b.nombre || '').localeCompare(a.nombre || '');
      }
      if (sortBy === 'categoria') {
        return (a.categoria || '').localeCompare(b.categoria || '');
      }
      if (sortBy === 'fecha') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'stock') {
        return (parseInt(a.stock_actual) || 0) - (parseInt(b.stock_actual) || 0);
      }
      if (sortBy === 'stock-desc') {
        return (parseInt(b.stock_actual) || 0) - (parseInt(a.stock_actual) || 0);
      }
      if (sortBy === 'ofertas') {
        const aIsPromo = !!(a.es_oferta || a.es_combo || a.metadata?.es_oferta || a.metadata?.es_combo);
        const bIsPromo = !!(b.es_oferta || b.es_combo || b.metadata?.es_oferta || b.metadata?.es_combo);
        if (aIsPromo && !bIsPromo) return -1;
        if (!aIsPromo && bIsPromo) return 1;
        return 0;
      }
      return 0;
    });

    return result;
  }, [productos, searchTerm, selectedCategoryFilter, sortBy]);

  const stats = useMemo(() => {
    const totalCount = productos.length;
    const totalInv = productos.reduce((sum, p) => sum + (parseFloat(p.precio_costo || 0) * parseInt(p.stock_actual || 0)), 0);
    const totalSaleVal = productos.reduce((sum, p) => sum + (parseFloat(p.precio_venta || 0) * parseInt(p.stock_actual || 0)), 0);
    const totalEarns = totalSaleVal - totalInv;
    const lowStock = productos.filter(p => parseInt(p.stock_actual || 0) <= 5 && parseInt(p.stock_actual || 0) > 0);
    
    // Dynamically build category map with sums
    const catMap = {};
    productos.forEach(p => {
      const cat = p.categoria || 'Accesorios';
      if (!catMap[cat]) catMap[cat] = { count: 0, investment: 0 };
      catMap[cat].count += 1;
      catMap[cat].investment += (parseFloat(p.precio_costo || 0) * parseInt(p.stock_actual || 0));
    });

    return { totalCount, totalInv, totalSaleVal, totalEarns, lowStock, catMap };
  }, [productos]);

  const exportToPDF = () => {
    setIsPdfModalOpen(true);
  };

  const confirmExportPDF = async () => {
    setIsPdfModalOpen(false);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // ── PORTADA ──────────────────────────────────────────────────────────────
      doc.setFillColor(12, 12, 14);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageW, 4, 'F');
      doc.setFillColor(16, 185, 129);
      doc.rect(0, pageH - 4, pageW, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(36);
      doc.setTextColor(255, 255, 255);
      doc.text('INVENTARIO', 20, 55);
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text('REPORTE FINANCIERO COMPLETO', 20, 68);

      doc.setDrawColor(40, 40, 44);
      doc.setLineWidth(0.4);
      doc.line(20, 75, pageW - 20, 75);

      // Stats en portada
      const coverStats = [
        { label: 'Total Productos', value: `${productos.length} ref.`, color: [255, 255, 255] },
        { label: 'Inversión Total', value: `${stats.totalInv.toLocaleString()} BS`, color: [156, 163, 175] },
        { label: 'Valor Estimado Venta', value: `${stats.totalSaleVal.toLocaleString()} BS`, color: [96, 165, 250] },
        { label: 'Ganancia Potencial', value: `${stats.totalEarns.toLocaleString()} BS`, color: [16, 185, 129] },
        { label: 'Margen Global', value: stats.totalInv > 0 ? `${((stats.totalEarns / stats.totalInv) * 100).toFixed(1)}%` : '0%', color: [16, 185, 129] },
        { label: 'Alertas Stock Crítico', value: `${stats.lowStock.length}`, color: stats.lowStock.length > 0 ? [245, 158, 11] : [107, 114, 128] },
      ];
      coverStats.forEach((s, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 20 + col * 87;
        const y = 86 + row * 34;
        doc.setFillColor(22, 22, 26);
        doc.roundedRect(x, y, 78, 28, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 110);
        doc.text(s.label.toUpperCase(), x + 5, y + 10);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...s.color);
        doc.text(s.value, x + 5, y + 22);
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 90);
      const fechaGen = new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' });
      doc.text(`Generado el ${fechaGen}`, 20, pageH - 12);
      doc.text('Control de Inventario — Inefable', pageW - 20, pageH - 12, { align: 'right' });

      // ── RESUMEN POR CATEGORÍA ─────────────────────────────────────────────
      doc.addPage();
      doc.setFillColor(12, 12, 14);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageW, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('RESUMEN POR CATEGORÍA', 20, 20);

      const catRows = Object.entries(stats.catMap).map(([cat, data]) => {
        const catProds = productos.filter(p => p.categoria === cat);
        const gananciaTotal = catProds.reduce((sum, p) => {
          const profit = (parseFloat(p.precio_venta || 0) - parseFloat(p.precio_costo || 0)) * parseInt(p.stock_actual || 0);
          return sum + profit;
        }, 0);
        const avgMargin = data.count > 0
          ? catProds.reduce((sum, p) => {
              const c = parseFloat(p.precio_costo || 0);
              const v = parseFloat(p.precio_venta || 0);
              return sum + (c > 0 ? ((v - c) / c) * 100 : 0);
            }, 0) / data.count
          : 0;
        return [cat, `${data.count}`, `${data.investment.toLocaleString()} BS`, `${gananciaTotal.toLocaleString()} BS`, `${avgMargin.toFixed(1)}%`];
      });

      autoTable(doc, {
        startY: 28,
        head: [['CATEGORÍA', 'PRODUCTOS', 'INVERSIÓN TOTAL', 'GANANCIA POTENCIAL', 'MARGEN PROM.']],
        body: catRows,
        theme: 'plain',
        styles: { fillColor: [18, 18, 20], textColor: [200, 200, 210], fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [25, 25, 28] },
        margin: { left: 14, right: 14 },
      });

      // ── CATÁLOGO DETALLADO DE PRODUCTOS ──────────────────────────────────
      doc.addPage();
      doc.setFillColor(12, 12, 14);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageW, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('CATÁLOGO DETALLADO DE PRODUCTOS', 20, 20);

      const tableRows = filteredProducts.map(p => {
        const stock = parseInt(p.stock_actual || 0);
        const cost = parseFloat(p.precio_costo || 0);
        const sale = parseFloat(p.precio_venta || 0);
        const profit = sale - cost;
        const marginPct = cost > 0 ? ((profit / cost) * 100).toFixed(1) : '0';
        const totalProfit = profit * stock;
        return [
          p.sku || p.codigo || '-',
          p.nombre?.toUpperCase() || '-',
          p.categoria || '-',
          p.marca || '-',
          `${cost.toLocaleString()} BS`,
          `${sale.toLocaleString()} BS`,
          `+${profit.toLocaleString()} BS`,
          `${marginPct}%`,
          `${totalProfit.toLocaleString()} BS`,
          `${stock} uds`,
          p.garantia || '-',
        ];
      });

      autoTable(doc, {
        startY: 28,
        head: [['SKU', 'PRODUCTO', 'CATEGORÍA', 'MARCA', 'COSTO', 'PRECIO VENTA', 'GANANCIA/U', 'MARGEN%', 'GANANCIA TOTAL', 'STOCK', 'GARANTÍA']],
        body: tableRows,
        theme: 'plain',
        styles: { fillColor: [18, 18, 20], textColor: [200, 200, 210], fontSize: 6.5, cellPadding: 3.5 },
        headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [25, 25, 28] },
        columnStyles: {
          0: { cellWidth: 14 }, 1: { cellWidth: 36 }, 2: { cellWidth: 20 }, 3: { cellWidth: 16 },
          4: { cellWidth: 14 }, 5: { cellWidth: 16 }, 6: { cellWidth: 16 }, 7: { cellWidth: 11 },
          8: { cellWidth: 18 }, 9: { cellWidth: 10 }, 10: { cellWidth: 14 }
        },
        margin: { left: 8, right: 8 },
        didDrawPage: () => {
          doc.setFillColor(12, 12, 14);
          doc.setFillColor(16, 185, 129);
          doc.rect(0, 0, pageW, 4, 'F');
          doc.rect(0, pageH - 4, pageW, 4, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 90);
          doc.text('Control de Inventario — Inefable', pageW - 14, pageH - 8, { align: 'right' });
        },
      });

      doc.save(`Inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
      setToast({ show: true, message: 'PDF Exportado Correctamente' });
    } catch (error) {
      alert('Error al exportar PDF: ' + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', fontFamily: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>
      <Toast show={toast.show} message={toast.message} isDark={isDark} t={t} onClose={() => setToast({ ...toast, show: false })} />
      
      <ConfirmModal 
        isOpen={confirmDelete.isOpen} 
        title="Eliminar Producto" 
        message="¿Estás seguro de que deseas eliminar este producto permanentemente del inventario? Esta acción no se puede deshacer." 
        onConfirm={handleDeleteProduct} 
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })} 
        t={t} 
      />

      {/* PDF EXPORT CONFIRMATION MODAL */}
      {isPdfModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, padding: 32, borderRadius: 28, maxWidth: 480, width: '90%', boxShadow: 'none', animation: 'scaleIn 0.3s ease-out' }}>
            <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: t.text, letterSpacing: '0.1em', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} color="#10b981" /> Confirmar Exportación PDF
            </h4>
            <span style={{ fontSize: 9, fontWeight: 900, color: t.accent, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>
              Resumen del Reporte Financiero
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: t.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${t.border}`, padding: 20, borderRadius: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#707070', fontWeight: 700, textTransform: 'uppercase' }}>Total Activos (Refs)</span>
                <span style={{ fontSize: 11, color: t.text, fontWeight: 900, fontFamily: 'monospace' }}>{productos.length} productos</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#707070', fontWeight: 700, textTransform: 'uppercase' }}>Capital Invertido (Costo)</span>
                <span style={{ fontSize: 11, color: t.text, fontWeight: 900, fontFamily: 'monospace' }}>{stats.totalInv.toLocaleString()} BS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#707070', fontWeight: 700, textTransform: 'uppercase' }}>Valor Estimado Venta</span>
                <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 900, fontFamily: 'monospace' }}>{stats.totalSaleVal.toLocaleString()} BS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#707070', fontWeight: 700, textTransform: 'uppercase' }}>Ganancia Neta Potencial</span>
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 900, fontFamily: 'monospace' }}>{stats.totalEarns.toLocaleString()} BS ({stats.totalInv > 0 ? ((stats.totalEarns / stats.totalInv) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#707070', fontWeight: 700, textTransform: 'uppercase' }}>Categorías Activas</span>
                <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 900, fontFamily: 'monospace' }}>{Object.keys(stats.catMap).length} categorías</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#707070', fontWeight: 700, textTransform: 'uppercase' }}>Alertas de Stock Crítico</span>
                <span style={{ fontSize: 11, color: stats.lowStock.length > 0 ? '#f59e0b' : '#707070', fontWeight: 900, fontFamily: 'monospace' }}>{stats.lowStock.length} alertas</span>
              </div>
            </div>
            
            <p style={{ fontSize: 11, color: t.textMuted, lineHeight: '1.6', margin: '0 0 24px 0' }}>
              ¿Deseas generar y descargar el reporte financiero completo en formato PDF con el resumen arriba detallado?
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setIsPdfModalOpen(false)} 
                style={{ padding: '10px 20px', borderRadius: 12, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.textDim, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmExportPDF} 
                style={{ padding: '10px 22px', borderRadius: 12, border: 'none', backgroundColor: '#10b981', color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
              >
                Sí, exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}


      {/* TOP HEADER PANEL */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: t.text, letterSpacing: '-0.04em', margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
              Empresa
            </h2>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3, fontWeight: 400, letterSpacing: '0.01em' }}>
              Gestión de Empresa
            </p>
          </div>
          {/* Selector de Sección */}
          <div className="flex p-0.5 rounded-xl border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', height: '36px', boxSizing: 'border-box' }}>
            <button
              onClick={() => setActiveSection('productos')}
              className="px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
              style={{
                backgroundColor: activeSection === 'productos' ? t.accent : 'transparent',
                color: activeSection === 'productos' ? '#000' : t.textDim,
              }}
            >
              Inventario
            </button>
            <button
              onClick={() => setActiveSection('pedidos')}
              className="px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: activeSection === 'pedidos' ? t.accent : 'transparent',
                color: activeSection === 'pedidos' ? '#000' : t.textDim,
              }}
            >
              Pedidos Pendientes
              {pedidosPendientes.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[8px] flex items-center justify-center font-bold">
                  {pedidosPendientes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeSection === 'productos' ? (
            <>
              <button 
                onClick={exportToPDF}
                style={{ padding: '12px 18px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#fff', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
              >
                <Download size={13} /> Exportar PDF
              </button>

              <button 
                onClick={openNewProduct}
                style={{ padding: '12px 22px', backgroundColor: '#10b981', border: 'none', borderRadius: 14, color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus size={14} /> Nuevo Producto
              </button>
            </>
          ) : (
            <button 
              onClick={fetchPedidos}
              style={{ padding: '12px 18px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#fff', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
            >
              Recargar Pedidos
            </button>
          )}
        </div>
      </header>

      {activeSection === 'productos' && (
        <>
          {/* METRICS DASHBOARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Inversión de Capital (Costo)', value: `${stats.totalInv.toLocaleString()} BS`, icon: Briefcase, color: '#a0a0a0' },
          { label: 'Valor Estimado de Venta', value: `${stats.totalSaleVal.toLocaleString()} BS`, icon: TrendingUp, color: '#3b82f6' },
          { label: 'Ganancia Neta Potencial', value: `${stats.totalEarns.toLocaleString()} BS`, icon: DollarSign, color: '#10b981', sub: stats.totalInv > 0 ? `Margen: ${((stats.totalEarns / stats.totalInv) * 100).toFixed(0)}%` : 'Margen: 0%' },
          { label: 'Ítems en Inventario', value: `${stats.totalCount} ref`, icon: Package, color: '#8b5cf6' },
          { label: 'Stock Crítico', value: stats.lowStock.length, icon: AlertOctagon, color: stats.lowStock.length > 0 ? '#f59e0b' : '#707070' }
        ].map((m, i) => (
          <div key={i} style={{ backgroundColor: t.panel, border: t.isDark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${t.border}`, borderRadius: 20, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'none', position: 'relative', overflow: 'hidden' }}>
            <div>
              <span style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{m.label}</span>
              <p style={{ fontSize: 20, fontWeight: 900, color: m.color, fontFamily: 'monospace', margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>{m.value}</p>
              {m.sub && <span style={{ fontSize: 8, color: t.textDim, fontWeight: 700, marginTop: 4, display: 'block' }}>{m.sub}</span>}
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
              <m.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* CATEGORÍAS + STOCK CRÍTICO ROW — Siempre visibles debajo de métricas */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexShrink: 0 }}>
        
        {/* Categories Pill Card */}
        <div style={{ flex: 1.3, backgroundColor: t.panel, border: t.isDark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${t.border}`, borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Layers size={15} style={{ color: '#10b981' }} />
              <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.text, margin: 0 }}>Categorías de Activos</h4>
            </div>
            <button 
              onClick={() => setShowAllCategories(!showAllCategories)}
              style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 9, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {showAllCategories ? 'Ver menos' : 'Ver más categorías'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={() => setSelectedCategoryFilter('Todos')}
              style={{
                padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                backgroundColor: selectedCategoryFilter === 'Todos' ? 'rgba(16, 185, 129, 0.12)' : (t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'),
                color: selectedCategoryFilter === 'Todos' ? '#10b981' : t.textMuted,
                fontSize: 9, fontWeight: 800, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6
              }}
              onMouseEnter={e => { if (selectedCategoryFilter !== 'Todos') e.currentTarget.style.backgroundColor = t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { if (selectedCategoryFilter !== 'Todos') e.currentTarget.style.backgroundColor = t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'; }}
            >
              <span>Todos</span>
              <span style={{ backgroundColor: selectedCategoryFilter === 'Todos' ? 'rgba(0,0,0,0.2)' : (t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: selectedCategoryFilter === 'Todos' ? '#10b981' : t.textDim, padding: '2px 7px', borderRadius: 20, fontSize: 8, fontFamily: 'monospace' }}>{productos.length}</span>
            </button>

            {Object.keys(stats.catMap).slice(0, showAllCategories ? undefined : 6).map(catName => {
              const item = stats.catMap[catName];
              const isActive = selectedCategoryFilter === catName;
              const CatIcon = getCategoryIcon(catName);
              return (
                <button
                  key={catName}
                  onClick={() => setSelectedCategoryFilter(catName)}
                  style={{
                    padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : (t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'),
                    color: isActive ? '#10b981' : t.textMuted,
                    fontSize: 9, fontWeight: 800, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'; }}
                >
                  <CatIcon size={11} style={{ color: isActive ? '#10b981' : t.textDim }} />
                  <span>{catName}</span>
                  <span style={{ backgroundColor: isActive ? 'rgba(0,0,0,0.2)' : (t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isActive ? '#10b981' : t.textDim, padding: '2px 7px', borderRadius: 20, fontSize: 8, fontFamily: 'monospace' }}>{item.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div style={{ flex: 1, backgroundColor: t.panel, border: t.isDark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${t.border}`, borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
              <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.text, margin: 0 }}>Control Stock Crítico</h4>
            </div>
            {stats.lowStock.length > 4 && (
              <button 
                onClick={() => setShowAllLowStock(!showAllLowStock)}
                style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: 9, fontWeight: 800, cursor: 'pointer' }}
              >
                {showAllLowStock ? 'Ver menos' : `Ver todos (${stats.lowStock.length})`}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {stats.lowStock.length === 0 ? (
              <div style={{ padding: '16px 20px', gridColumn: '1 / -1', textAlign: 'center', color: '#707070', fontSize: 10, opacity: 0.7 }}>
                Todos los productos tienen stock suficiente.
              </div>
            ) : (
              stats.lowStock.slice(0, showAllLowStock ? undefined : 4).map(p => (
                <div
                  key={p.id}
                  onClick={() => { setSearchTerm(p.nombre); setSelectedCategoryFilter('Todos'); }}
                  style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: t.isDark ? '1px solid rgba(255,255,255,0.04)' : `1px solid ${t.border}`, borderRadius: 14, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', minWidth: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.isDark ? 'rgba(255,255,255,0.04)' : t.border; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.imagen ? (
                      <img src={p.imagen} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    ) : (
                      <ImageIcon size={10} style={{ color: t.textDim }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: t.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }} title={String(p.nombre || '').toUpperCase()}>{String(p.nombre || '').toUpperCase()}</span>
                    <span style={{ fontSize: 7, color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase' }}>Stock: {p.stock_actual} uds</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ADMIN PROMOTIONS & COMBOS DASHBOARD (PRIVADO) */}
      {productos.some(p => !!(p.es_oferta || p.es_combo || p.metadata?.es_oferta || p.metadata?.es_combo)) && (
        <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 24, padding: 22, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Zap size={15} style={{ color: '#10b981' }} />
            <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.text, margin: 0 }}>Análisis de Ofertas y Combos Activos (Privado)</h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {productos.filter(p => !!(p.es_oferta || p.es_combo || p.metadata?.es_oferta || p.metadata?.es_combo)).map(p => {
              const isOferta = !!(p.es_oferta || p.metadata?.es_oferta);
              const isCombo = !!(p.es_combo || p.metadata?.es_combo);
              const cost = parseFloat(p.precio_costo) || 0;
              const priceVal = isOferta ? (parseFloat(p.precio_oferta || p.metadata?.precio_oferta) || parseFloat(p.precio_venta) || 0) : (parseFloat(p.precio_venta) || 0);
              const profit = priceVal - cost;
              const totalProfit = profit * (parseInt(p.stock_actual) || 0);
              return (
                <div key={p.id} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.imagen ? (
                      <img src={p.imagen} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    ) : (
                      <ImageIcon size={16} style={{ color: '#707070' }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
                      {isOferta && <span style={{ fontSize: 7, fontWeight: 900, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 6px', borderRadius: 4 }}>OFERTA</span>}
                      {isCombo && <span style={{ fontSize: 7, fontWeight: 900, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '1px 6px', borderRadius: 4 }}>COMBO</span>}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(p.nombre || '').toUpperCase()}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 8, color: '#707070', fontWeight: 700 }}>
                      <span>INVERSIÓN: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{cost} Bs</strong></span>
                      <span>VENTA: <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{priceVal} Bs</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 8, color: '#707070', fontWeight: 700 }}>
                      <span>GANANCIA NETA: <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>+{profit} Bs</strong></span>
                      <span>TOTAL POTENCIAL: <strong style={{ color: '#3b82f6', fontFamily: 'monospace' }}>{totalProfit} Bs</strong></span>
                    </div>
                    {isCombo && (p.productos_regalo || p.metadata?.productos_regalo) && (
                      <div style={{ fontSize: 7, color: '#3b82f6', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        🎁 Regalo: {p.productos_regalo || p.metadata?.productos_regalo}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULL-WIDTH MASTER TABLE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: t.panel, border: t.isDark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${t.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: 'none' }}>
        
        {/* Table Header Filter search */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Buscar por código, SKU, nombre o categoría..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', backgroundColor: t.isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', border: t.isDark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${t.border}`, borderRadius: 12, padding: '11px 18px', fontSize: 12, outline: 'none', color: t.text, transition: 'all 0.2s', fontFamily: "'Inter', system-ui, sans-serif" }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: t.isDark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 10, color: t.text, outline: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              <option value="nombre">Nombre (A-Z)</option>
              <option value="nombre-desc">Nombre (Z-A)</option>
              <option value="categoria">Categoría</option>
              <option value="fecha">Más Recientes</option>
              <option value="stock">Stock (Menor primero)</option>
              <option value="stock-desc">Stock (Mayor primero)</option>
              <option value="ofertas">Ofertas y Combos primero</option>
            </select>
          </div>
          
          {selectedCategoryFilter !== 'Todos' && (
            <button
              onClick={() => setSelectedCategoryFilter('Todos')}
              style={{ border: 'none', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Filtro: {selectedCategoryFilter} <X size={10} />
            </button>
          )}
        </div>

        {/* Master Table Scrollable Container */}
        <div style={{ overflowX: 'auto', flex: 1 }} className="mac-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)' }}>
                {['SKU', 'Producto', 'Categoría', 'Costo', 'Precio Público', 'Ganancia & Margen', 'Stock', 'Acciones'].map((th, idx) => (
                  <th key={idx} style={{ padding: '14px 20px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap' }}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '100px 0', textAlign: 'center', color: t.textDim, fontSize: 11 }}>
                    No se encontraron activos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const stock = parseInt(p.stock_actual || 0);
                  const isAgotado = stock <= 0;
                  const isLow = stock > 0 && stock <= 5;
                  const statusColor = isAgotado ? '#ef4444' : isLow ? '#f59e0b' : '#10b981';
                  
                  const cost = parseFloat(p.precio_costo || 0);
                  const sale = parseFloat(p.precio_venta || 0);
                  const profit = sale - cost;
                  const totalProfit = profit * stock;
                  const marginPct = cost > 0 ? ((profit / cost) * 100).toFixed(0) : '0';

                  const minStock = parseInt(p.stock_minimo || 5);
                  const percent = Math.min(100, (stock / (minStock * 3)) * 100);

                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background-color 0.2s' }} className="hover-row">
                      <td style={{ padding: '14px 20px', fontSize: 10, fontFamily: 'monospace', color: t.textDim, whiteSpace: 'nowrap' }}>
                        {p.sku || p.codigo || (p.id ? p.id.substring(0, 8) : 'N/A')}
                      </td>
                      
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: t.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.05)', border: `1px solid ${t.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {p.imagen ? (
                              <img src={p.imagen} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.nombre} />
                            ) : (
                              <ImageIcon size={20} style={{ color: t.textDim }} />
                            )}
                          </div>
                          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ 
                              fontSize: 12, 
                              fontWeight: 700, 
                              color: t.text, 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden', 
                              maxWidth: '280px', 
                              fontFamily: "'Inter', system-ui, sans-serif", 
                              letterSpacing: '-0.01em',
                              textTransform: 'uppercase',
                              lineHeight: '1.4em',
                              maxHeight: '2.8em'
                            }} title={String(p.nombre || '').toUpperCase()}>
                              {String(p.nombre || '').toUpperCase()}
                            </span>
                            <span style={{ fontSize: 9, fontWeight: 400, color: t.textDim, fontFamily: "'Inter', system-ui, sans-serif", textTransform: 'uppercase' }}>{p.marca || 'Sin marca'}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: t.isDark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${t.border}`, color: t.textMuted, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', fontFamily: "'Inter', system-ui, sans-serif" }}>
                          {p.categoria || 'General'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: t.textMuted }}>{cost.toLocaleString()}</span>
                        <span style={{ fontSize: 8, color: t.textDim, display: 'block', marginTop: 1 }}>BS costo</span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: t.text }}>{sale.toLocaleString()}</span>
                        <span style={{ fontSize: 8, color: t.textDim, display: 'block', marginTop: 1 }}>BS público</span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: profit >= 0 ? t.text : '#ef4444' }}>+{profit.toLocaleString()}</span>
                            <span style={{ fontSize: 8, color: t.textDim }}>BS/u</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: parseFloat(marginPct) >= 30 ? '#10b981' : parseFloat(marginPct) >= 15 ? '#f59e0b' : '#ef4444',
                              backgroundColor: parseFloat(marginPct) >= 30 ? 'rgba(16,185,129,0.1)' : parseFloat(marginPct) >= 15 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                              padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace'
                            }}>{marginPct}%</span>
                            <span style={{ fontSize: 8, color: t.textDim, fontFamily: 'monospace' }}>{totalProfit.toLocaleString()} BS total</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 80 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: t.text, fontFamily: 'monospace' }}>{stock}</span>
                            <span style={{ fontSize: 9, color: t.textDim }}>uds</span>
                          </div>
                          <div style={{ height: 3, width: '100%', backgroundColor: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percent}%`, backgroundColor: statusColor, borderRadius: 2, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleEditProduct(p)} style={{ width: 32, height: 32, borderRadius: 10, border: t.isDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${t.border}`, backgroundColor: t.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => setConfirmDelete({ isOpen: true, id: p.id, item: p })} style={{ width: 32, height: 32, borderRadius: 10, border: t.isDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${t.border}`, backgroundColor: t.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {activeSection === 'pedidos' && (
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {pedidosLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: 12 }}>
              <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${t.accent}`, borderTopColor: 'transparent' }} />
              <span style={{ fontSize: 11, color: t.textDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cargando pedidos...</span>
            </div>
          ) : pedidosPendientes.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 24, padding: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: t.isDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim }}>
                <CheckCircle size={32} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: 14, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Todo al día</h4>
                <p style={{ fontSize: 11, color: t.textDim, margin: 0 }}>No hay nuevos pedidos pendientes por procesar.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
              {pedidosPendientes.map((pedido) => {
                const cart = pedido.metadata?.cart || [];
                const clientName = pedido.metadata?.clientName || 'Cliente Catálogo';
                const clientAddress = pedido.metadata?.clientAddress || 'No especificada';
                const paymentMethod = pedido.metadata?.paymentMethod || 'Efectivo';
                const pedidoCode = pedido.metadata?.pedidoCode || pedido.id.slice(0, 8);
                
                return (
                  <div 
                    key={pedido.id} 
                    style={{ 
                      backgroundColor: t.panel, 
                      border: `1px solid ${t.border}`, 
                      borderRadius: 24, 
                      padding: 24, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 16,
                      transition: 'transform 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${t.border}`, paddingBottom: 16 }}>
                      <div>
                        <span style={{ fontSize: 8, fontWeight: 900, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
                          Código: {pedidoCode}
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 900, color: t.text, margin: '4px 0 0 0' }}>
                          {clientName}
                        </h3>
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                        Pendiente
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, color: t.textDim }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <MapPin size={13} style={{ color: t.textDim, marginTop: 1, flexShrink: 0 }} />
                        <span><strong>Dirección:</strong> {clientAddress}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag size={13} style={{ color: t.textDim, flexShrink: 0 }} />
                        <span><strong>Pago:</strong> {paymentMethod}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={13} style={{ color: t.textDim, flexShrink: 0 }} />
                        <span><strong>Fecha:</strong> {pedido.fecha}</span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', border: `1px solid ${t.border}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${t.border}`, paddingBottom: 6 }}>
                        Productos ({cart.reduce((acc, c) => acc + (parseInt(c.quantity) || 1), 0)} uds)
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                        {cart.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ color: t.text, fontWeight: 600 }}>{item.nombre}</span>
                              <span style={{ fontSize: 9, color: t.textDim, fontFamily: 'monospace' }}>SKU/Cód: {item.sku || 'N/A'}</span>
                            </div>
                            <span style={{ color: t.textMuted, fontFamily: 'monospace' }}>
                              {item.quantity} x {parseFloat(item.precio_venta).toLocaleString()} BS
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${t.border}`, paddingTop: 16, marginTop: 'auto' }}>
                      <div>
                        <span style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monto a Cobrar</span>
                        <p style={{ fontSize: 18, fontWeight: 900, color: t.text, fontFamily: 'monospace', margin: 0 }}>
                          {parseFloat(pedido.monto).toLocaleString()} BS
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => handleCancelarPedido(pedido.id)}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: 'transparent',
                            border: `1px solid rgba(239, 68, 68, 0.2)`,
                            borderRadius: 12,
                            color: '#ef4444',
                            fontSize: 9,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Rechazar
                        </button>
                        
                        <button
                          onClick={() => handleAprobarPedido(pedido)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#10b981',
                            border: 'none',
                            borderRadius: 12,
                            color: '#000',
                            fontSize: 9,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          Aprobar Pago
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PRODUCT CREATION AND EDIT PANEL MODAL */}
      {isModalOpen && editingProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, width: '100%', maxWidth: 1060, borderRadius: 28, overflow: 'hidden', boxShadow: 'none', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'scaleIn 0.3s ease-out' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: `1px solid ${t.border}` }}>
              <h3 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: t.text, letterSpacing: '0.1em', margin: 0 }}>
                {editingProduct.nombre ? 'Ficha de Producto / Modificar Ficha' : 'Nuevo Producto / Registrar Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: t.isDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            {/* Split Form Layout Container */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              
              {/* Left Side Panel: Interactive Image Manager (380px) */}
              <div style={{ width: '390px', borderRight: `1px solid ${t.border}`, backgroundColor: t.isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }} className="mac-scrollbar">
                
                {/* Large Preview Area */}
                <div style={{ width: '100%', height: 230, borderRadius: 20, backgroundColor: t.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', border: `1px solid ${t.border}`, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {editingProduct.imagen ? (
                    <img src={editingProduct.imagen} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Portada" />
                  ) : (
                    <ImageIcon size={44} style={{ color: t.textDim }} />
                  )}
                  <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#10b981', color: '#000', fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Star size={8} fill="black" /> Portada Principal</div>
                </div>

                {/* File Uploader Button */}
                <div>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Subir archivos a Supabase</label>
                  <label style={{ padding: '12px 16px', backgroundColor: t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', border: t.isDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${t.border}`, color: t.text, borderRadius: 12, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                    <input type="file" style={{ display: 'none' }} accept="image/*" multiple onChange={handleImageUpload} />
                    <ImageIcon size={13} /> Subir Imágenes Simultáneas
                  </label>
                </div>

                {/* Paste URL Input */}
                <div>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>O ingresar URL manual de foto</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      value={manualUrlInput} 
                      onChange={e => setManualUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/foto.jpg"
                      style={{ flex: 1, backgroundColor: !isDark ? '#ffffff' : 'rgba(255,255,255,0.02)', border: !isDark ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 14px', fontSize: 11, outline: 'none', color: t.text }} 
                    />
                    <button 
                      onClick={handleAddManualUrl}
                      style={{ padding: '10px 16px', backgroundColor: '#10b981', color: '#000', border: 'none', borderRadius: 12, fontSize: 9, fontWeight: 900, cursor: 'pointer' }}
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Gallery List thumbnails */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Carrusel de Imágenes ({editingProduct.imagenes?.length || 0})</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editingProduct.imagenes?.map((img, idx) => {
                      const isCover = editingProduct.imagen === img;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: t.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isCover ? '#10b981' : t.border}`, borderRadius: 14, padding: 8, transition: 'all 0.2s' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            {/* Choose Cover Button */}
                            <button 
                              onClick={() => setEditingProduct({ ...editingProduct, imagen: img })}
                              style={{ 
                                width: 26, height: 26, borderRadius: 8, border: 'none', cursor: 'pointer',
                                backgroundColor: isCover ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: isCover ? '#10b981' : '#707070', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                              title="Establecer como Portada"
                            >
                              <Star size={11} fill={isCover ? '#10b981' : 'none'} />
                            </button>
                            
                            {/* Reordering */}
                            <button onClick={() => handleMoveImage(idx, -1)} style={{ width: 26, height: 26, borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: '#707070', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={11} /></button>
                            <button onClick={() => handleMoveImage(idx, 1)} style={{ width: 26, height: 26, borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: '#707070', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={11} /></button>
                            
                            {/* Trash Delete */}
                            <button onClick={() => handleDeleteImage(idx)} style={{ width: 26, height: 26, borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={11} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Side: Configuration Input Fields */}
              <div style={{ flex: 1, padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }} className="mac-scrollbar">
                
                {/* Commercial Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Nombre Comercial de Producto</label>
                  <input 
                    type="text" 
                    value={editingProduct.nombre} 
                    onChange={e => setEditingProduct({ ...editingProduct, nombre: e.target.value })}
                    placeholder="Ej: CÁMARA PT WIFI 4MP PANEL SOLAR"
                    style={inputStyle} 
                  />
                </div>

                {/* SKU & Barcode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Código SKU</label>
                    <input 
                      type="text" 
                      value={editingProduct.sku} 
                      onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      placeholder="Ej: SAKTI-STAND-01"
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Código de barras (UPC/EAN)</label>
                    <input 
                      type="text" 
                      value={editingProduct.codigo} 
                      onChange={e => setEditingProduct({ ...editingProduct, codigo: e.target.value })}
                      placeholder="Ej: 779123456789"
                      style={inputStyle} 
                    />
                  </div>
                </div>

                {/* Categoria & Marca */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Categoría Principal</label>
                    <select 
                      value={editingProduct.categoria} 
                      onChange={e => setEditingProduct({ ...editingProduct, categoria: e.target.value })}
                      style={selectStyle}
                    >
                      {AMAZON_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Marca / Fabricante</label>
                    <input 
                      type="text" 
                      value={editingProduct.marca} 
                      onChange={e => setEditingProduct({ ...editingProduct, marca: e.target.value })}
                      placeholder="Ej: DAHUA TECHNOLOGY"
                      style={inputStyle} 
                    />
                  </div>
                </div>

                {/* Cost, Sale, and Before Prices */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Precio Inversión / Costo (BS)</label>
                    <input 
                      type="number" 
                      value={editingProduct.precio_costo} 
                      onChange={e => setEditingProduct({ ...editingProduct, precio_costo: e.target.value })}
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Precio Venta Público (BS)</label>
                    <input 
                      type="number" 
                      value={editingProduct.precio_venta} 
                      onChange={e => setEditingProduct({ ...editingProduct, precio_venta: e.target.value })}
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Precio Antes / Tachado (BS)</label>
                    <input 
                      type="number" 
                      value={editingProduct.precio_antes} 
                      onChange={e => setEditingProduct({ ...editingProduct, precio_antes: e.target.value })}
                      style={inputStyle} 
                    />
                  </div>
                </div>

                {/* Stock, Garantia & Logistica */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Stock Disponible</label>
                    <input 
                      type="number" 
                      value={editingProduct.stock_actual} 
                      onChange={e => setEditingProduct({ ...editingProduct, stock_actual: e.target.value })}
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Garantía</label>
                    <input 
                      type="text" 
                      value={editingProduct.garantia} 
                      onChange={e => setEditingProduct({ ...editingProduct, garantia: e.target.value })}
                      placeholder="Ej: 180 Días"
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Método de Envío</label>
                    <select 
                      value={editingProduct.tipo_envio} 
                      onChange={e => setEditingProduct({ ...editingProduct, tipo_envio: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="Envío Gratuito">Envío Gratuito</option>
                      <option value="Costo Adicional">Costo Adicional</option>
                    </select>
                  </div>
                </div>

                {/* Video Promocional & Enlace Compra */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>URL del Video Promocional</label>
                    <input 
                      type="text" 
                      value={editingProduct.video_url || ''} 
                      onChange={e => setEditingProduct({ ...editingProduct, video_url: e.target.value })}
                      placeholder="Ej: https://www.youtube.com/watch?v=VIDEO_ID"
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Enlace de Compra (WhatsApp Business)</label>
                    <input 
                      type="text" 
                      value={editingProduct.enlace_compra || ''} 
                      onChange={e => setEditingProduct({ ...editingProduct, enlace_compra: e.target.value })}
                      placeholder="Ej: https://mi-sitio.com/pagar-producto"
                      style={inputStyle} 
                    />
                  </div>
                </div>

                {/* Ofertas y Combos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, backgroundColor: t.isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.02)', border: `1px solid ${t.border}`, padding: 16, borderRadius: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input 
                        type="checkbox" 
                        id="modal-es-oferta"
                        checked={!!editingProduct.es_oferta} 
                        onChange={e => setEditingProduct({ ...editingProduct, es_oferta: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="modal-es-oferta" style={{ fontSize: 9, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Activar como Oferta</label>
                    </div>
                    {editingProduct.es_oferta && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={labelStyle}>Precio de Oferta Especial (BS)</label>
                        <input 
                          type="number" 
                          value={editingProduct.precio_oferta || ''} 
                          onChange={e => setEditingProduct({ ...editingProduct, precio_oferta: e.target.value })}
                          placeholder="Ej: 120"
                          style={inputStyle} 
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input 
                        type="checkbox" 
                        id="modal-es-combo"
                        checked={!!editingProduct.es_combo} 
                        onChange={e => setEditingProduct({ ...editingProduct, es_combo: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="modal-es-combo" style={{ fontSize: 9, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Activar como Combo / Pack</label>
                    </div>
                    {editingProduct.es_combo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={labelStyle}>Regalos y Adicionales Incluidos</label>
                        <input 
                          type="text" 
                          value={editingProduct.productos_regalo || ''} 
                          onChange={e => setEditingProduct({ ...editingProduct, productos_regalo: e.target.value })}
                          placeholder="Ej: + Estuche protector gratis"
                          style={inputStyle} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Description extended */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Descripción / Ficha Técnica Corporativa</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <textarea 
                      value={editingProduct.descripcion} 
                      onChange={e => setEditingProduct({ ...editingProduct, descripcion: e.target.value })}
                      placeholder="Detalla las especificaciones comerciales del artículo..."
                      style={{ 
                        width: '100%', 
                        height: 130, 
                        backgroundColor: !isDark ? '#ffffff' : 'rgba(255,255,255,0.02)', 
                        border: !isDark ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: 14, 
                        padding: '12px 16px', 
                        paddingBottom: '36px',
                        fontSize: 12, 
                        outline: 'none', 
                        color: '#fff', 
                        resize: 'vertical' 
                      }} 
                    />
                    <button
                      onClick={optimizeDescriptionWithAI}
                      disabled={aiLoading || !editingProduct?.descripcion || !editingProduct?.nombre}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 8,
                        color: '#10b981',
                        fontSize: 8,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.2s',
                        height: '20px',
                        zIndex: 10
                      }}
                      onMouseEnter={e => { if (!aiLoading && editingProduct?.descripcion) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'; }}
                      onMouseLeave={e => { if (!aiLoading && editingProduct?.descripcion) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; }}
                    >
                      <Sparkles size={9} />
                      {aiLoading ? '...' : 'Optimizar con IA'}
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Actions Footer */}
            <div style={{ padding: '20px 32px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: 'rgba(0,0,0,0.15)' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '10px 22px', borderRadius: 12, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.textDim, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveProduct}
                style={{ padding: '10px 26px', borderRadius: 12, border: 'none', backgroundColor: '#10b981', color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
              >
                Guardar Producto
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
