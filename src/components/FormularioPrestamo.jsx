import React, { useState, useMemo, useCallback } from 'react';
import {
  User, FileSignature, Smartphone, DollarSign, BadgePercent, CalendarDays,
  ShieldCheck, ExternalLink, ChevronLeft, ChevronRight, Save, X, Check, CheckCircle2,
  AlertCircle, Upload, CreditCard, ArrowRight, Eye, EyeOff, MapPin, Globe, Building2,
  Users, Briefcase, Hash, Phone, Mail, FileText, Image, Link, Lock, Wallet, Camera
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

// ─── COMPONENTE CAMPO REUTILIZABLE (FUERA del componente padre para evitar remontaje en cada render) ──
const Campo = ({ t, label, icon: Icon, value, onChange, hasError, error, placeholder, type = 'text', required, textarea, noLabel }) => {
  return (
    <div>
      {!noLabel && (
        <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: hasError ? (t.danger || '#ef4444') : t.textMuted, display: 'block', marginBottom: '5px' }}>
          {Icon && <Icon size={10} style={{ display: 'inline', marginRight: '4px' }} />}
          {label} {required && <span style={{ color: t.danger || '#ef4444' }}>*</span>}
        </label>
      )}
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', fontSize: '12px', lineHeight: 1.5,
            backgroundColor: t.input, border: `1px solid ${hasError ? (t.danger || '#ef4444') : t.border}`,
            color: t.text, borderRadius: '10px', outline: 'none', resize: 'vertical',
            minHeight: '70px', transition: 'border 0.2s',
          }}
          onFocus={e => { if (!hasError) e.target.style.borderColor = t.accent; }}
          onBlur={e => { if (!hasError) e.target.style.borderColor = t.border; }}
          placeholder={placeholder} />
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 12px', backgroundColor: t.input,
          border: `1px solid ${hasError ? (t.danger || '#ef4444') : t.border}`,
          borderRadius: '10px', transition: 'border 0.2s',
        }}>
          <input type={type} value={value} onChange={e => onChange(e.target.value)}
            style={{
              flex: 1, padding: '10px 0', fontSize: '12px', fontWeight: 500,
              background: 'transparent', border: 'none', outline: 'none',
              color: t.text, width: '100%',
            }}
            placeholder={placeholder} />
        </div>
      )}
      {hasError && error && <p style={{ fontSize: '9px', color: t.danger || '#ef4444', margin: '3px 0 0', fontWeight: 500 }}>{error}</p>}
    </div>
  );
};

// ─── CONSTANTES ───────────────────────────────────────────────
const PASOS = [
  { id: 'datos', label: 'Datos Personales', icon: User, desc: 'Información del deudor' },
  { id: 'financiero', label: 'Términos Financieros', icon: DollarSign, desc: 'Capital, interés, plazo' },
  { id: 'garantia', label: 'Garantía & Documentos', icon: ShieldCheck, desc: 'Respaldo del préstamo' },
  { id: 'resumen', label: 'Resumen & Confirmar', icon: CheckCircle2, desc: 'Verifica antes de crear' },
];

const ESTADOS_INICIALES = ['Activo', 'En Mora', 'Finalizado'];
const MONEDAS = ['BOB', 'USD'];
const TIPOS_GARANTIA = [
  { value: '', label: 'Selecciona tipo…' },
  { value: 'Vehiculo', label: 'Vehículo' },
  { value: 'Inmueble', label: 'Inmueble / Propiedad' },
  { value: 'Electrodomestico', label: 'Electrodoméstico' },
  { value: 'Prendario', label: 'Prenda / Joyas' },
  { value: 'Firma', label: 'Firma / Aval' },
  { value: 'Otro', label: 'Otro' },
];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
const FormularioPrestamo = ({ isDark, onClose, onSave, initialData = null }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [paso, setPaso] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Estado del formulario
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        foto: initialData.foto || '',
        pagos: Array.isArray(initialData.pagos) ? initialData.pagos : [],
      };
    }
    const today = new Date();
    const fin = new Date(today);
    fin.setMonth(fin.getMonth() + 6);
    return {
      // Paso 1: Datos Personales
      nombre: '',
      ci: '',
      telefono: '',
      email: '',
      direccion: '',
      referencias: '',
      ocupacion: '',
      foto: '',
      // Paso 2: Financieros
      capital: '',
      interes: 5,
      moneda: 'BOB',
      inicio: today.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0],
      estado: 'Activo',
      // Paso 3: Garantía
      tipoGarantia: '',
      garantia: '',
      drive_contrato: '',
      drive_fotos: '',
      notas: '',
      pagos: [],
    };
  });

  // ─── SUBIR FOTO A SUPABASE STORAGE ─────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, foto: 'Solo se permiten imágenes' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, foto: 'La imagen no debe superar 5MB' }));
      return;
    }
    
    setUploadingFoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `prestatario_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prestatario-fotos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('prestatario-fotos')
        .getPublicUrl(fileName);
      
      handleChange('foto', publicUrl);
      setErrors(prev => { const c = { ...prev }; delete c.foto; return c; });
    } catch (err) {
      setErrors(prev => ({ ...prev, foto: 'Error al subir imagen: ' + err.message }));
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleRemoveFoto = () => {
    handleChange('foto', '');
  };

  // ─── VALIDACIÓN ──────────────────────────────────────────
  const validate = useCallback((pasoActual) => {
    const errs = {};
    if (pasoActual === 0) {
      if (!form.nombre?.trim()) errs.nombre = 'El nombre es obligatorio';
    }
    if (pasoActual === 1) {
      if (!form.capital || parseFloat(form.capital) <= 0) errs.capital = 'Capital inválido';
    }
    return errs;
  }, [form]);

  // ─── MANEJO DE CAMPOS ────────────────────────────────────
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
  };

  const canAdvance = () => {
    const errs = validate(paso);
    setErrors(errs);
    setTouched(Object.keys(form).reduce((a, k) => ({ ...a, [k]: true }), {}));
    return Object.keys(errs).length === 0;
  };

  const nextPaso = () => { if (canAdvance()) setPaso(p => Math.min(p + 1, PASOS.length - 1)); };
  const prevPaso = () => setPaso(p => Math.max(p - 1, 0));

  const irAPaso = (i) => {
    if (i < paso) { setPaso(i); return; }
    // Validar todos los pasos intermedios sin mutar estado
    let allErrors = {};
    for (let p = paso; p < i; p++) {
      const errs = validate(p);
      if (Object.keys(errs).length > 0) { allErrors = { ...allErrors, ...errs }; break; }
    }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setTouched(Object.keys(form).reduce((a, k) => ({ ...a, [k]: true }), {}));
    } else {
      setPaso(i);
    }
  };

// ─── SUBMIT ──────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validar solo campos obligatorios antes de enviar
    const errsPaso0 = validate(0);
    const errsPaso1 = validate(1);
    const allErrors = { ...errsPaso0, ...errsPaso1 };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Llevar al primer paso con error
      if (Object.keys(errsPaso0).length > 0) setPaso(0);
      else if (Object.keys(errsPaso1).length > 0) setPaso(1);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre?.trim(),
        ci: form.ci?.trim(),
        telefono: form.telefono?.trim(),
        email: form.email?.trim() || '',
        direccion: form.direccion?.trim() || '',
        referencias: form.referencias?.trim() || '',
        ocupacion: form.ocupacion?.trim() || '',
        foto: form.foto || '',
        capital: parseFloat(form.capital) || 0,
        interes: parseFloat(form.interes) || 0,
        moneda: form.moneda || 'BOB',
        inicio: form.inicio || '',
        fin: form.fin || '',
        estado: form.estado || 'Activo',
        tipoGarantia: form.tipoGarantia || '',
        garantia: form.garantia?.trim() || '',
        drive_contrato: form.drive_contrato?.trim() || '',
        drive_fotos: form.drive_fotos?.trim() || '',
        notas: form.notas?.trim() || '',
        pagos: form.pagos || [],
      };

      if (initialData?.id) {
        const { error } = await supabase.from('prestamos').update(payload).eq('id', initialData.id);
        if (error) throw error;
        // Audit trail
        await supabase.from('prestamos_historial').insert([{
          prestamo_id: initialData.id,
          accion: 'MODIFICADO',
          detalle: `Préstamo modificado: ${payload.nombre}`,
          datos_previos: initialData,
        }]);
      } else {
        const { data: newRecord, error } = await supabase.from('prestamos').insert([payload]).select();
        if (error) throw error;
        // Audit trail
        if (newRecord?.[0]) {
          await supabase.from('prestamos_historial').insert([{
            prestamo_id: newRecord[0].id,
            accion: 'CREADO',
            detalle: `Nuevo préstamo creado: ${payload.nombre} - ${payload.capital} ${payload.moneda}`,
          }]);
        }
      }

      onSave?.();
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message }));
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER: STEP INDICATOR ──────────────────────────────
  const renderStepper = () => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', padding: '0 4px' }}>
      {PASOS.map((p, idx) => {
        const isActive = idx === paso;
        const isComplete = idx < paso;
        const Icon = p.icon;
        return (
          <div key={p.id}
            onClick={() => irAPaso(idx)}
            style={{
              flex: 1, cursor: idx <= paso ? 'pointer' : 'default',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              opacity: idx > paso ? 0.4 : 1,
              transition: 'all 0.2s',
            }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: isComplete ? t.accent : isActive ? t.accentSoft : t.input,
              color: isComplete ? 'white' : isActive ? t.accent : t.textDim,
              border: isActive && !isComplete ? `1.5px solid ${t.accent}` : 'none',
              transition: 'all 0.2s',
            }}>
              {isComplete ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
            </div>
            <span style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: isActive ? t.accent : t.textDim, textAlign: 'center' }}>
              {p.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Nota: Campo se define FUERA del componente (línea 11) para evitar que React lo desmonte/vuelva a montar en cada render.

  // ─── RENDER: PASO 1 - DATOS PERSONALES ───────────────────
  const renderPasoDatos = () => {
    const makeHandler = (field) => (val) => handleChange(field, val);

    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>Datos Personales</h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>Información básica del prestatario</p>
        </div>

        {/* Foto del prestatario */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            backgroundColor: t.input, border: `2px dashed ${t.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onClick={() => document.getElementById('foto-input')?.click()}
            onMouseEnter={e => { if (!form.foto) e.currentTarget.style.borderColor = t.accent; }}
            onMouseLeave={e => { if (!form.foto) e.currentTarget.style.borderColor = t.border; }}
          >
            {form.foto ? (
              <>
                <img src={form.foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveFoto(); }}
                  style={{
                    position: 'absolute', top: '2px', right: '2px',
                    width: '22px', height: '22px', borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                    border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', lineHeight: 1,
                  }}
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: t.textDim }}>
                <Camera size={24} />
                <span style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {uploadingFoto ? 'Subiendo...' : 'Foto'}
                </span>
              </div>
            )}
            <input
              id="foto-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          {errors.foto && (
            <p style={{ fontSize: '9px', color: t.danger, margin: '6px 0 0', fontWeight: 500 }}>{errors.foto}</p>
          )}
          {uploadingFoto && (
            <p style={{ fontSize: '9px', color: t.accent, margin: '6px 0 0', fontWeight: 500 }}>Subiendo imagen…</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Campo t={t} label="Nombre Completo" icon={User} value={form.nombre} onChange={makeHandler('nombre')}
            hasError={!!errors.nombre && !!touched.nombre} error={errors.nombre} placeholder="Ej: Juan Pérez" required />
          <Campo t={t} label="Cédula de Identidad" icon={FileSignature} value={form.ci} onChange={makeHandler('ci')}
            hasError={!!errors.ci && !!touched.ci} error={errors.ci} placeholder="Ej: 1234567" required />
          <Campo t={t} label="Teléfono / WhatsApp" icon={Smartphone} value={form.telefono} onChange={makeHandler('telefono')}
            hasError={!!errors.telefono && !!touched.telefono} error={errors.telefono} placeholder="Ej: 71234567" required />
          <Campo t={t} label="Correo Electrónico" icon={Mail} value={form.email} onChange={makeHandler('email')}
            hasError={!!errors.email && !!touched.email} error={errors.email} placeholder="Ej: juan@email.com" />
          <Campo t={t} label="Dirección" icon={MapPin} value={form.direccion} onChange={makeHandler('direccion')}
            hasError={!!errors.direccion && !!touched.direccion} error={errors.direccion} placeholder="Dirección de domicilio" />
          <Campo t={t} label="Ocupación" icon={Briefcase} value={form.ocupacion} onChange={makeHandler('ocupacion')}
            hasError={!!errors.ocupacion && !!touched.ocupacion} error={errors.ocupacion} placeholder="Ej: Comerciante" />
        </div>
        <div style={{ marginTop: '14px' }}>
          <Campo t={t} label="Referencias Personales" icon={Users} value={form.referencias} onChange={makeHandler('referencias')}
            hasError={!!errors.referencias && !!touched.referencias} error={errors.referencias} placeholder="Nombre y teléfono de referencia" textarea />
        </div>
      </div>
    );
  };

  // ─── RENDER: PASO 2 - FINANCIEROS ────────────────────────
  const renderPasoFinanciero = () => {
    const makeHandler = (field) => (val) => handleChange(field, val);

    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>Términos Financieros</h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>Define el capital, interés y plazo del préstamo</p>
        </div>

        {/* Capital y Moneda lado a lado */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: errors.capital ? t.danger : t.textMuted, display: 'block', marginBottom: '5px' }}>
              <DollarSign size={10} style={{ display: 'inline', marginRight: '4px' }} /> Capital <span style={{ color: t.danger }}>*</span>
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0 12px', backgroundColor: t.input,
              border: `1px solid ${errors.capital ? t.danger : t.border}`, borderRadius: '10px',
            }}>
              <input type="number" value={form.capital} onChange={e => handleChange('capital', e.target.value)}
                style={{
                  flex: 1, padding: '12px 0', fontSize: '14px', fontWeight: 700, fontFamily: 'monospace',
                  background: 'transparent', border: 'none', outline: 'none', color: t.text,
                }}
                placeholder="0.00" />
            </div>
            {errors.capital && <p style={{ fontSize: '9px', color: t.danger, margin: '3px 0 0', fontWeight: 500 }}>{errors.capital}</p>}
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <Wallet size={10} style={{ display: 'inline', marginRight: '4px' }} /> Moneda
            </label>
            <select value={form.moneda} onChange={e => handleChange('moneda', e.target.value)}
              style={{
                width: '100%', padding: '12px', fontSize: '13px', fontWeight: 600,
                backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                borderRadius: '10px', outline: 'none',
              }}>
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Interés y Estado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: errors.interes ? t.danger : t.textMuted, display: 'block', marginBottom: '5px' }}>
              <BadgePercent size={10} style={{ display: 'inline', marginRight: '4px' }} /> Interés Mensual (%) <span style={{ color: t.danger }}>*</span>
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0 12px', backgroundColor: t.input,
              border: `1px solid ${errors.interes ? t.danger : t.border}`, borderRadius: '10px',
            }}>
              <input type="number" step="0.1" value={form.interes} onChange={e => handleChange('interes', e.target.value)}
                style={{
                  flex: 1, padding: '12px 0', fontSize: '14px', fontWeight: 600, fontFamily: 'monospace',
                  background: 'transparent', border: 'none', outline: 'none', color: t.accent,
                }}
                placeholder="5" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: t.textDim }}>%</span>
            </div>
            {errors.interes && <p style={{ fontSize: '9px', color: t.danger, margin: '3px 0 0', fontWeight: 500 }}>{errors.interes}</p>}
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <CheckCircle2 size={10} style={{ display: 'inline', marginRight: '4px' }} /> Estado Inicial
            </label>
            <select value={form.estado} onChange={e => handleChange('estado', e.target.value)}
              style={{
                width: '100%', padding: '12px', fontSize: '13px', fontWeight: 600,
                backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                borderRadius: '10px', outline: 'none',
              }}>
              {ESTADOS_INICIALES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* Fechas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: errors.inicio ? t.danger : t.textMuted, display: 'block', marginBottom: '5px' }}>
              <CalendarDays size={10} style={{ display: 'inline', marginRight: '4px' }} /> Fecha de Inicio <span style={{ color: t.danger }}>*</span>
            </label>
            <input type="date" value={form.inicio} onChange={e => handleChange('inicio', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '12px',
                backgroundColor: t.input, border: `1px solid ${errors.inicio ? t.danger : t.border}`,
                color: t.text, borderRadius: '10px', outline: 'none',
              }} />
            {errors.inicio && <p style={{ fontSize: '9px', color: t.danger, margin: '3px 0 0', fontWeight: 500 }}>{errors.inicio}</p>}
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: errors.fin ? t.danger : t.textMuted, display: 'block', marginBottom: '5px' }}>
              <CalendarDays size={10} style={{ display: 'inline', marginRight: '4px' }} /> Fecha de Vencimiento <span style={{ color: t.danger }}>*</span>
            </label>
            <input type="date" value={form.fin} onChange={e => handleChange('fin', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '12px',
                backgroundColor: t.input, border: `1px solid ${errors.fin ? t.danger : t.border}`,
                color: t.text, borderRadius: '10px', outline: 'none',
              }} />
            {errors.fin && <p style={{ fontSize: '9px', color: t.danger, margin: '3px 0 0', fontWeight: 500 }}>{errors.fin}</p>}
          </div>
        </div>

        {/* Resumen en vivo */}
        <div style={{
          padding: '16px', borderRadius: '12px',
          backgroundColor: `${t.accent}08`, border: `1px solid ${t.accent}20`,
        }}>
          <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, margin: '0 0 8px' }}>Resumen del Préstamo</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '10px', color: t.textDim, margin: '0 0 2px' }}>Interés mensual calculado:</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: t.accent, margin: 0 }}>
                {(parseFloat(form.capital) * (parseFloat(form.interes) / 100) || 0).toLocaleString()} {form.moneda}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', color: t.textDim, margin: '0 0 2px' }}>Pago único mensual</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>
                {(parseFloat(form.capital) / 6 + parseFloat(form.capital) * (parseFloat(form.interes) / 100) || 0).toLocaleString()} {form.moneda}
                <span style={{ fontSize: '9px', color: t.textDim }}> /mes</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER: PASO 3 - GARANTÍA ───────────────────────────
  const renderPasoGarantia = () => {
    const makeHandler = (field) => (val) => handleChange(field, val);

    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>Garantía & Documentos</h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>Respaldo documental del préstamo</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: errors.tipoGarantia ? t.danger : t.textMuted, display: 'block', marginBottom: '5px' }}>
              <ShieldCheck size={10} style={{ display: 'inline', marginRight: '4px' }} /> Tipo de Garantía <span style={{ color: t.danger }}>*</span>
            </label>
            <select value={form.tipoGarantia} onChange={e => handleChange('tipoGarantia', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '12px', fontWeight: 500,
                backgroundColor: t.input, border: `1px solid ${errors.tipoGarantia ? t.danger : t.border}`,
                color: t.text, borderRadius: '10px', outline: 'none',
              }}>
              {TIPOS_GARANTIA.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
            {errors.tipoGarantia && <p style={{ fontSize: '9px', color: t.danger, margin: '3px 0 0', fontWeight: 500 }}>{errors.tipoGarantia}</p>}
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <Link size={10} style={{ display: 'inline', marginRight: '4px' }} /> Link Contrato (Drive)
            </label>
            <input type="url" value={form.drive_contrato} onChange={e => handleChange('drive_contrato', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '12px',
                backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                borderRadius: '10px', outline: 'none',
              }}
              placeholder="https://drive.google.com/..." />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Campo t={t} label="Descripción de la Garantía" icon={FileText} value={form.garantia}
            onChange={makeHandler('garantia')} hasError={!!errors.garantia && !!touched.garantia} error={errors.garantia}
            placeholder="Describe el bien o documento que respalda el préstamo (Ej: Toyota Corolla 2019, placas 1234ABC)" textarea />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <Image size={10} style={{ display: 'inline', marginRight: '4px' }} /> Link Fotos (Drive)
            </label>
            <input type="url" value={form.drive_fotos} onChange={e => handleChange('drive_fotos', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '12px',
                backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                borderRadius: '10px', outline: 'none',
              }}
              placeholder="https://photos.app.goo.gl/..." />
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <Lock size={10} style={{ display: 'inline', marginRight: '4px' }} /> Notas Internas
            </label>
            <input type="text" value={form.notas} onChange={e => handleChange('notas', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '12px',
                backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                borderRadius: '10px', outline: 'none',
              }}
              placeholder="Información adicional..." />
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER: PASO 4 - RESUMEN ────────────────────────────
  const renderPasoResumen = () => {
    const resumenItems = [
      { label: 'Prestatario', value: form.nombre || '—', icon: User },
      { label: 'CI / Documento', value: form.ci || '—', icon: FileSignature },
      { label: 'Contacto', value: form.telefono || '—', icon: Smartphone },
      { label: 'Capital', value: `${(parseFloat(form.capital) || 0).toLocaleString()} ${form.moneda}`, icon: DollarSign },
      { label: 'Interés', value: `${form.interes}% mensual`, icon: BadgePercent },
      { label: 'Periodo', value: `${form.inicio ? new Date(form.inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'} → ${form.fin ? new Date(form.fin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}`, icon: CalendarDays },
      { label: 'Garantía', value: form.tipoGarantia ? `${form.tipoGarantia} — ${form.garantia?.substring(0, 40)}${(form.garantia?.length || 0) > 40 ? '...' : ''}` : '—', icon: ShieldCheck },
    ];

    const moneda = form.moneda || 'BOB';

    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>Resumen & Confirmar</h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>Verifica que todos los datos sean correctos antes de guardar</p>
        </div>

        {/* Foto en resumen */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '16px', borderRadius: '12px',
          backgroundColor: t.input, border: `1px solid ${t.border}`,
          marginBottom: '16px',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
            border: `2px solid ${t.accent}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: t.bg,
          }}>
            {form.foto ? (
              <img src={form.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={32} color={t.textDim} />
            )}
          </div>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: t.text, margin: '0 0 2px' }}>{form.nombre || 'Sin nombre'}</p>
            <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>{form.ci || 'Sin CI'} · {form.telefono || 'Sin teléfono'}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <span style={{
                fontSize: '9px', fontWeight: 600, padding: '2px 10px', borderRadius: '12px',
                backgroundColor: t.accentSoft, color: t.accent,
              }}>
                {form.estado}
              </span>
              <span style={{
                fontSize: '9px', fontWeight: 600, padding: '2px 10px', borderRadius: '12px',
                backgroundColor: `${t.accent}08`, color: t.textDim,
              }}>
                {form.moneda}
              </span>
            </div>
          </div>
        </div>

        {/* Detalles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {resumenItems.map((item, idx) => (
            <ResumenCard key={idx} t={t} label={item.label} value={item.value} icon={item.icon} color={t.accent} />
          ))}
        </div>

        {/* Totales destacados */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
        }}>
          <ResumenCard t={t} label="Capital" value={`${(parseFloat(form.capital) || 0).toLocaleString()} ${moneda}`} icon={DollarSign} color={t.accent} />
          <ResumenCard t={t} label="Interés/Mes" value={`${(parseFloat(form.capital) * (parseFloat(form.interes) / 100) || 0).toLocaleString()} ${moneda}`} icon={BadgePercent} color="#10b981" />
          <ResumenCard t={t} label="Pago Mensual" value={`${((parseFloat(form.capital) || 0) / Math.max(1, Math.ceil((new Date(form.fin) - new Date(form.inicio)) / (1000 * 60 * 60 * 24 * 30))) + (parseFloat(form.capital) * (parseFloat(form.interes) / 100) || 0)).toLocaleString()} ${moneda}`} icon={CreditCard} color="#f59e0b" />
        </div>
      </div>
    );
  };

  // ─── RENDER: STEP CONTROLLER ─────────────────────────────
  const renderPaso = () => {
    switch (paso) {
      case 0: return renderPasoDatos();
      case 1: return renderPasoFinanciero();
      case 2: return renderPasoGarantia();
      case 3: return renderPasoResumen();
      default: return null;
    }
  };

  // ─── RENDER PRINCIPAL ────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: t.text, margin: 0, letterSpacing: '-0.02em' }}>
          {initialData ? 'Editar Préstamo' : 'Nuevo Préstamo'}
        </h2>
        <button onClick={onClose}
          style={{
            width: '32px', height: '32px', borderRadius: '10px', border: `1px solid ${t.border}`,
            backgroundColor: t.input, color: t.textDim, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <X size={16} />
        </button>
      </div>

      {renderStepper()}

      {/* Content */}
      <div style={{ minHeight: '320px' }}>
        {renderPaso()}
      </div>

      {/* Error de submit */}
      {errors.submit && (
        <div style={{
          padding: '12px', borderRadius: '10px', marginTop: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444', fontSize: '11px', fontWeight: 500,
        }}>
          {errors.submit}
        </div>
      )}

      {/* Botones de navegación */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '28px', paddingTop: '20px', borderTop: `1px solid ${t.border}`,
      }}>
        <button onClick={prevPaso} disabled={paso === 0}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: `1px solid ${t.border}`,
            backgroundColor: t.input, color: t.text, fontSize: '11px', fontWeight: 600,
            cursor: paso === 0 ? 'default' : 'pointer', opacity: paso === 0 ? 0.4 : 1,
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
          }}>
          <ChevronLeft size={14} /> Anterior
        </button>

        {/* Indicador de paso */}
        <span style={{ fontSize: '10px', fontWeight: 600, color: t.textDim }}>
          Paso {paso + 1} de {PASOS.length}
        </span>

        {paso < PASOS.length - 1 ? (
          <button onClick={nextPaso}
            style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              backgroundColor: t.accent, color: 'white', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.target.style.backgroundColor = t.accentHover}
            onMouseLeave={e => e.target.style.backgroundColor = t.accent}>
            Siguiente <ChevronRight size={14} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              backgroundColor: t.accent, color: 'white', fontSize: '11px', fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = t.accentHover; }}
            onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = t.accent; }}>
            {loading ? 'Guardando...' : <><Save size={14} /> {initialData ? 'Actualizar' : 'Crear Préstamo'}</>}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── COMPONENTE RESUMEN CARD ────────────────────────────────
const ResumenCard = ({ t, label, value, icon: Icon, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', borderRadius: '10px',
    backgroundColor: t.input, border: `1px solid ${t.border}`,
  }}>
    <div style={{
      width: '28px', height: '28px', borderRadius: '8px',
      backgroundColor: `${color}12`, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={13} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: '11px', fontWeight: 600, color: t.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
    </div>
  </div>
);

export default FormularioPrestamo;
