import React, { useState, useMemo, useCallback } from 'react';
import {
  User, FileSignature, Smartphone, DollarSign, BadgePercent, CalendarDays,
  ShieldCheck, ExternalLink, ChevronLeft, ChevronRight, Save, X, Check, CheckCircle2,
  AlertCircle, Upload, CreditCard, ArrowRight, Eye, EyeOff, MapPin, Globe, Building2,
  Users, Briefcase, Hash, Phone, Mail, FileText, Image, Link, Lock, Wallet
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

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

  // Estado del formulario
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
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

  // ─── VALIDACIÓN ──────────────────────────────────────────
  const validate = useCallback((pasoActual) => {
    const errs = {};
    if (pasoActual === 0) {
      if (!form.nombre?.trim()) errs.nombre = 'El nombre es obligatorio';
      if (!form.ci?.trim()) errs.ci = 'El CI / Cédula es obligatorio';
      if (!form.telefono?.trim()) errs.telefono = 'El teléfono es obligatorio';
    }
    if (pasoActual === 1) {
      if (!form.capital || parseFloat(form.capital) <= 0) errs.capital = 'El capital debe ser mayor a 0';
      if (!form.interes || parseFloat(form.interes) <= 0) errs.interes = 'El interés debe ser mayor a 0';
      if (!form.inicio) errs.inicio = 'Fecha de inicio requerida';
      if (!form.fin) errs.fin = 'Fecha de vencimiento requerida';
      if (form.inicio && form.fin && new Date(form.inicio) >= new Date(form.fin)) {
        errs.fin = 'El vencimiento debe ser posterior al inicio';
      }
    }
    return errs;
  }, [form]);

  const validateAll = useCallback(() => {
    let allErrors = {};
    PASOS.forEach((_, i) => {
      allErrors = { ...allErrors, ...validate(i) };
    });
    return allErrors;
  }, [validate]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const canAdvance = () => {
    const errs = validate(paso);
    setErrors(prev => ({ ...prev, ...errs }));
    setTouched(prev => PASOS[paso].fields?.reduce((acc, f) => ({ ...acc, [f]: true }), prev) || prev);
    return Object.keys(errs).length === 0;
  };

  const nextPaso = () => {
    if (canAdvance() && paso < PASOS.length - 1) {
      setPaso(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPaso = () => {
    if (paso > 0) {
      setPaso(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const irAPaso = (i) => {
    if (i < paso) { setPaso(i); return; }
    // Solo permitir ir adelante si el paso actual es válido
    let canGo = true;
    for (let p = paso; p < i; p++) {
      const errs = validate(p);
      if (Object.keys(errs).length > 0) {
        setErrors(prev => ({ ...prev, ...errs }));
        canGo = false;
        break;
      }
    }
    if (canGo) setPaso(i);
  };

  // ─── GUARDAR ─────────────────────────────────────────────
  const handleSubmit = async () => {
    const allErrors = validateAll();
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      // Ir al primer paso con error
      for (let i = 0; i < PASOS.length; i++) {
        const pasoErrors = validate(i);
        if (Object.keys(pasoErrors).length > 0) {
          setPaso(i);
          return;
        }
      }
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        ci: form.ci.trim(),
        telefono: form.telefono.trim(),
        email: form.email?.trim() || '',
        direccion: form.direccion?.trim() || '',
        referencias: form.referencias?.trim() || '',
        ocupacion: form.ocupacion?.trim() || '',
        capital: parseFloat(form.capital),
        interes: parseFloat(form.interes),
        moneda: form.moneda,
        inicio: form.inicio,
        fin: form.fin,
        estado: form.estado || 'Activo',
        tipoGarantia: form.tipoGarantia || '',
        garantia: form.garantia?.trim() || '',
        drive_contrato: form.drive_contrato?.trim() || '',
        drive_fotos: form.drive_fotos?.trim() || '',
        notas: form.notas?.trim() || '',
        pagos: form.pagos || [],
      };

      const isEdit = !!initialData?.id;
      if (isEdit) {
        const { error } = await supabase.from('prestamos').update(payload).eq('id', initialData.id);
        if (error) throw error;
        // Auditoría
        await supabase.from('prestamos_historial').insert([{
          prestamo_id: initialData.id,
          accion: 'ACTUALIZADO',
          detalle: `Préstamo actualizado: ${payload.nombre}`,
          datos_previos: initialData,
          datos_nuevos: payload,
        }]);
      } else {
        const { data: newData, error } = await supabase.from('prestamos').insert([payload]).select();
        if (error) throw error;
        // Auditoría
        if (newData?.[0]?.id) {
          await supabase.from('prestamos_historial').insert([{
            prestamo_id: newData[0].id,
            accion: 'CREADO',
            detalle: `Nuevo préstamo creado: ${payload.nombre} - ${payload.capital} ${payload.moneda}`,
            datos_nuevos: payload,
          }]);
        }
      }

      if (onSave) onSave();
      if (onClose) onClose();
    } catch (e) {
      setErrors({ submit: 'Error al guardar: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  // ─── CÁLCULOS EN VIVO ────────────────────────────────────
  const interesCalculado = useMemo(() => {
    const cap = parseFloat(form.capital) || 0;
    const int = parseFloat(form.interes) || 0;
    return cap * (int / 100);
  }, [form.capital, form.interes]);

  const numMeses = useMemo(() => {
    if (!form.inicio || !form.fin) return 0;
    const start = new Date(form.inicio);
    const end = new Date(form.fin);
    return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
  }, [form.inicio, form.fin]);

  const totalInteres = useMemo(() => interesCalculado * numMeses, [interesCalculado, numMeses]);

  // ─── RENDER DE PASOS ─────────────────────────────────────
  const renderPasoDatos = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo
          label="Nombre Completo"
          icon={User}
          value={form.nombre}
          onChange={v => handleChange('nombre', v)}
          error={errors.nombre}
          touched={touched.nombre}
          placeholder="Ej: Juan Pérez López"
          required
          isDark={isDark}
        />
        <Campo
          label="Cédula de Identidad"
          icon={Hash}
          value={form.ci}
          onChange={v => handleChange('ci', v)}
          error={errors.ci}
          touched={touched.ci}
          placeholder="Ej: 1234567"
          required
          isDark={isDark}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo
          label="Teléfono / WhatsApp"
          icon={Smartphone}
          value={form.telefono}
          onChange={v => handleChange('telefono', v)}
          error={errors.telefono}
          touched={touched.telefono}
          placeholder="Ej: +591 76543210"
          required
          isDark={isDark}
        />
        <Campo
          label="Correo Electrónico"
          icon={Mail}
          value={form.email}
          onChange={v => handleChange('email', v)}
          error={errors.email}
          touched={touched.email}
          placeholder="Ej: juan@email.com"
          type="email"
          isDark={isDark}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo
          label="Dirección"
          icon={MapPin}
          value={form.direccion}
          onChange={v => handleChange('direccion', v)}
          error={errors.direccion}
          touched={touched.direccion}
          placeholder="Dirección de domicilio"
          isDark={isDark}
        />
        <Campo
          label="Ocupación"
          icon={Briefcase}
          value={form.ocupacion}
          onChange={v => handleChange('ocupacion', v)}
          error={errors.ocupacion}
          touched={touched.ocupacion}
          placeholder="Ej: Comerciante, Abogado..."
          isDark={isDark}
        />
      </div>
      <Campo
        label="Referencias Personales"
        icon={Users}
        value={form.referencias}
        onChange={v => handleChange('referencias', v)}
        error={errors.referencias}
        touched={touched.referencias}
        placeholder="Nombres y teléfonos de referencias"
        isDark={isDark}
        textarea
      />
    </div>
  );

  const renderPasoFinanciero = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            Capital <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
            backgroundColor: t.input, border: `1px solid ${errors.capital && touched.capital ? '#ef4444' : t.border}`,
            borderRadius: '12px', transition: 'border 0.2s',
          }}>
            <DollarSign size={18} color={t.textDim} />
            <input
              type="number"
              value={form.capital}
              onChange={e => handleChange('capital', e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '1.25rem', fontWeight: 700, color: t.text, width: '100%',
                fontFamily: 'monospace',
              }}
              placeholder="0"
            />
          </div>
          {errors.capital && touched.capital && (
            <p style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: 500 }}>{errors.capital}</p>
          )}
        </div>

        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            Interés Mensual (%) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
            backgroundColor: t.input, border: `1px solid ${errors.interes && touched.interes ? '#ef4444' : t.border}`,
            borderRadius: '12px', transition: 'border 0.2s',
          }}>
            <BadgePercent size={18} color={t.accent} />
            <input
              type="number"
              value={form.interes}
              onChange={e => handleChange('interes', e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '1.25rem', fontWeight: 700, color: t.accent, width: '100%',
                fontFamily: 'monospace',
              }}
              placeholder="5"
              step="0.1"
            />
          </div>
          {errors.interes && touched.interes && (
            <p style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: 500 }}>{errors.interes}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            Moneda
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {MONEDAS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => handleChange('moneda', m)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600,
                  fontSize: '13px', cursor: 'pointer',
                  backgroundColor: form.moneda === m ? t.accent : t.input,
                  color: form.moneda === m ? 'white' : t.text,
                  border: `1px solid ${form.moneda === m ? t.accent : t.border}`,
                  transition: 'all 0.2s',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            Estado Inicial
          </label>
          <select
            value={form.estado}
            onChange={e => handleChange('estado', e.target.value)}
            style={{
              width: '100%', padding: '12px', fontSize: '12px', fontWeight: 600,
              backgroundColor: t.input, border: `1px solid ${t.border}`,
              color: form.estado === 'Finalizado' ? t.success : form.estado === 'En Mora' ? t.danger : t.accent,
              borderRadius: '12px', outline: 'none', cursor: 'pointer',
            }}
          >
            {ESTADOS_INICIALES.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            Fecha de Inicio <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="date"
            value={form.inicio}
            onChange={e => handleChange('inicio', e.target.value)}
            style={{
              width: '100%', padding: '12px', fontSize: '12px',
              backgroundColor: t.input, border: `1px solid ${errors.inicio && touched.inicio ? '#ef4444' : t.border}`,
              color: t.text, borderRadius: '12px', outline: 'none',
            }}
          />
          {errors.inicio && touched.inicio && (
            <p style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: 500 }}>{errors.inicio}</p>
          )}
        </div>

        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            Fecha de Vencimiento <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="date"
            value={form.fin}
            onChange={e => handleChange('fin', e.target.value)}
            style={{
              width: '100%', padding: '12px', fontSize: '12px',
              backgroundColor: t.input, border: `1px solid ${errors.fin && touched.fin ? '#ef4444' : t.border}`,
              color: t.text, borderRadius: '12px', outline: 'none',
            }}
          />
          {errors.fin && touched.fin && (
            <p style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: 500 }}>{errors.fin}</p>
          )}
        </div>
      </div>

      {/* Vista previa de cálculos */}
      {form.capital > 0 && (
        <div style={{
          padding: '16px', borderRadius: '12px',
          backgroundColor: `${t.accent}08`, border: `1px solid ${t.accent}20`,
        }}>
          <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, marginBottom: '12px' }}>
            <Wallet size={12} style={{ marginRight: 6 }} /> Proyección Financiera
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p style={{ fontSize: '9px', color: t.textDim, margin: 0 }}>Interés Mensual</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: t.accent, margin: '2px 0 0 0' }}>
                {interesCalculado.toLocaleString()} <span style={{ fontSize: '9px' }}>{form.moneda}</span>
              </p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: t.textDim, margin: 0 }}>N° Cuotas</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: t.text, margin: '2px 0 0 0' }}>
                {numMeses} {numMeses === 1 ? 'mes' : 'meses'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: t.textDim, margin: 0 }}>Total Intereses</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: t.accent, margin: '2px 0 0 0' }}>
                {totalInteres.toLocaleString()} <span style={{ fontSize: '9px' }}>{form.moneda}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPasoGarantia = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            Tipo de Garantía
          </label>
          <select
            value={form.tipoGarantia}
            onChange={e => handleChange('tipoGarantia', e.target.value)}
            style={{
              width: '100%', padding: '12px', fontSize: '12px',
              backgroundColor: t.input, border: `1px solid ${t.border}`,
              color: t.text, borderRadius: '12px', outline: 'none', cursor: 'pointer',
            }}
          >
            {TIPOS_GARANTIA.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            Documento de Garantía
          </label>
          <Campo
            label=""
            icon={FileText}
            value={form.garantia}
            onChange={v => handleChange('garantia', v)}
            error={errors.garantia}
            touched={touched.garantia}
            placeholder="Descripción de la garantía"
            isDark={isDark}
            textarea
            noLabel
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            <Link size={10} style={{ marginRight: 4 }} /> Link Contrato (Drive)
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
            backgroundColor: t.input, border: `1px solid ${t.border}`,
            borderRadius: '12px',
          }}>
            <ExternalLink size={14} color={t.textDim} />
            <input
              type="text"
              value={form.drive_contrato}
              onChange={e => handleChange('drive_contrato', e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '11px', color: t.text, width: '100%',
              }}
              placeholder="https://drive.google.com/..."
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
            <Image size={10} style={{ marginRight: 4 }} /> Link Fotos (Drive)
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
            backgroundColor: t.input, border: `1px solid ${t.border}`,
            borderRadius: '12px',
          }}>
            <ExternalLink size={14} color={t.textDim} />
            <input
              type="text"
              value={form.drive_fotos}
              onChange={e => handleChange('drive_fotos', e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '11px', color: t.text, width: '100%',
              }}
              placeholder="https://photos.app.goo.gl/..."
            />
          </div>
        </div>
      </div>

      <div>
        <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
          Notas Adicionales
        </label>
        <textarea
          value={form.notas}
          onChange={e => handleChange('notas', e.target.value)}
          style={{
            width: '100%', height: '80px', padding: '12px', fontSize: '11px',
            backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
            borderRadius: '12px', outline: 'none', resize: 'vertical',
          }}
          placeholder="Cualquier información adicional relevante..."
        />
      </div>
    </div>
  );

  const renderPasoResumen = () => (
    <div className="space-y-5">
      {/* Tarjeta de resumen visual */}
      <div style={{
        padding: '24px', borderRadius: '16px',
        background: `linear-gradient(135deg, ${t.accent}15, ${t.accent}05)`,
        border: `1px solid ${t.accent}30`,
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: `${t.accent}20`, color: t.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <User size={28} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, margin: 0 }}>
          {form.nombre || 'Sin nombre'}
        </h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
          {form.ci && <Badge style={{ label: 'CI', value: form.ci, color: t.textMuted, isDark }} />}
          {form.telefono && <Badge style={{ label: 'WA', value: form.telefono, color: t.accent, isDark }} />}
          {form.moneda && <Badge style={{ label: 'Moneda', value: form.moneda, color: t.textMuted, isDark }} />}
        </div>
      </div>

      {/* Detalle financiero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ResumenCard t={t} label="Capital" value={`${parseFloat(form.capital || 0).toLocaleString()} ${form.moneda}`} icon={DollarSign} color={t.text} />
        <ResumenCard t={t} label="Interés" value={`${form.interes}%`} icon={BadgePercent} color={t.accent} />
        <ResumenCard t={t} label="Pago Mensual" value={`${interesCalculado.toLocaleString()} ${form.moneda}`} icon={CreditCard} color={t.success} />
        <ResumenCard t={t} label="Total Intereses" value={`${totalInteres.toLocaleString()} ${form.moneda}`} icon={Wallet} color={t.warning || '#f59e0b'} />
      </div>

      {/* Periodo */}
      <div style={{
        padding: '16px', borderRadius: '12px',
        backgroundColor: t.input, border: `1px solid ${t.border}`,
      }}>
        <div className="flex items-center gap-3">
          <CalendarDays size={16} color={t.accent} />
          <span style={{ fontSize: '12px', color: t.textMuted }}>
            {form.inicio ? new Date(form.inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
          </span>
          <ArrowRight size={14} color={t.textDim} />
          <span style={{ fontSize: '12px', color: t.textMuted }}>
            {form.fin ? new Date(form.fin).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
          </span>
          <span style={{ fontSize: '10px', color: t.accent, fontWeight: 600, marginLeft: 'auto' }}>
            {numMeses} {numMeses === 1 ? 'mes' : 'meses'}
          </span>
        </div>
      </div>

      {/* Garantía */}
      {form.garantia && (
        <div style={{
          padding: '16px', borderRadius: '12px',
          backgroundColor: t.input, border: `1px solid ${t.border}`,
        }}>
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} color={t.warning || '#f59e0b'} style={{ marginTop: 2 }} />
            <div>
              <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: t.textMuted, margin: 0 }}>
                {form.tipoGarantia || 'Garantía'}
              </p>
              <p style={{ fontSize: '12px', color: t.text, marginTop: 4 }}>{form.garantia}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estado */}
      <div style={{
        padding: '16px', borderRadius: '12px',
        backgroundColor: t.input, border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <ShieldCheck size={16} color={
          form.estado === 'Finalizado' ? t.success :
          form.estado === 'En Mora' ? t.danger : t.accent
        } />
        <span style={{ fontSize: '12px', color: t.textMuted }}>Estado:</span>
        <span style={{
          fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px',
          backgroundColor: form.estado === 'Finalizado' ? `${t.success}15` :
            form.estado === 'En Mora' ? `${t.danger}15` : `${t.accent}15`,
          color: form.estado === 'Finalizado' ? t.success :
            form.estado === 'En Mora' ? t.danger : t.accent,
        }}>
          {form.estado || 'Activo'}
        </span>
      </div>

      {errors.submit && (
        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#ef444415', border: '1px solid #ef444430', color: '#ef4444', fontSize: '11px', fontWeight: 500 }}>
          {errors.submit}
        </div>
      )}
    </div>
  );

  const renderPaso = () => {
    switch (paso) {
      case 0: return renderPasoDatos();
      case 1: return renderPasoFinanciero();
      case 2: return renderPasoGarantia();
      case 3: return renderPasoResumen();
      default: return null;
    }
  };

  const isLastStep = paso === PASOS.length - 1;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '10px',
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, margin: 0, letterSpacing: '-0.02em' }}>
            {initialData ? 'Editar Préstamo' : 'Nuevo Préstamo'}
          </h2>
          <p style={{ fontSize: '11px', color: t.textDim, marginTop: '2px' }}>
            {PASOS[paso].desc}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${t.border}`,
            backgroundColor: t.input, color: t.textDim, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {PASOS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => irAPaso(i)}
              style={{
                flex: 1, height: '4px', borderRadius: '2px', border: 'none', cursor: 'pointer',
                backgroundColor: i <= paso ? t.accent : t.border,
                transition: 'all 0.3s', opacity: i <= paso ? 1 : 0.5,
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {PASOS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => irAPaso(i)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                opacity: i <= paso ? 1 : 0.4,
                transition: 'all 0.3s',
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: i < paso ? t.success :
                  i === paso ? t.accent : t.input,
                color: i <= paso ? 'white' : t.textDim,
                fontSize: '11px', fontWeight: 700,
                border: i === paso ? `2px solid ${t.accent}` : 'none',
                transition: 'all 0.3s',
              }}>
                {i < paso ? <Check size={14} /> : <p.icon size={14} />}
              </div>
              <span style={{
                fontSize: '8px', fontWeight: 600, textTransform: 'uppercase',
                color: i === paso ? t.accent : t.textDim,
                letterSpacing: '0.02em',
              }}>
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '24px', backgroundColor: t.panel,
        border: `1px solid ${t.border}`, borderRadius: '16px',
        minHeight: '320px',
      }}>
        {renderPaso()}

        {/* Botones de navegación */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: '28px', paddingTop: '20px',
          borderTop: `1px solid ${t.border}`,
        }}>
          <button
            onClick={prevPaso}
            disabled={paso === 0}
            style={{
              padding: '10px 20px', borderRadius: '12px', border: `1px solid ${t.border}`,
              backgroundColor: t.input, color: t.text, fontSize: '11px', fontWeight: 600,
              cursor: paso === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              opacity: paso === 0 ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '10px 24px', borderRadius: '12px', border: 'none',
                backgroundColor: t.accent, color: 'white', fontSize: '11px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = t.accentHover; }}
              onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = t.accent; }}
            >
              {loading ? 'Guardando...' : <><Save size={14} /> {initialData ? 'Actualizar' : 'Guardar Préstamo'}</>}
            </button>
          ) : (
            <button
              onClick={nextPaso}
              style={{
                padding: '10px 24px', borderRadius: '12px', border: 'none',
                backgroundColor: t.accent, color: 'white', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.backgroundColor = t.accentHover}
              onMouseLeave={e => e.target.style.backgroundColor = t.accent}
            >
              Siguiente <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTES AUXILIARES ──────────────────────────────────

const Campo = ({ label, icon: Icon, value, onChange, error, touched, placeholder, type = 'text', required, textarea, isDark, noLabel }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const showError = error && touched;

  return (
    <div>
      {!noLabel && label && (
        <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '8px' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <div style={{
        display: 'flex', alignItems: textarea ? 'flex-start' : 'center',
        gap: '10px', padding: textarea ? '12px 14px' : '10px 14px',
        backgroundColor: t.input, border: `1px solid ${showError ? '#ef4444' : t.border}`,
        borderRadius: '12px', transition: 'border 0.2s',
      }}>
        {Icon && <Icon size={16} color={t.textDim} style={{ marginTop: textarea ? 3 : 0 }} />}
        {textarea ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '12px', color: t.text, width: '100%', minHeight: '60px',
              resize: 'vertical', fontFamily: 'inherit',
            }}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '12px', color: t.text, width: '100%',
            }}
            placeholder={placeholder}
          />
        )}
      </div>
      {showError && (
        <p style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
};

const Badge = ({ style: { label, value, color, isDark } }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  return (
    <span style={{
      fontSize: '9px', fontWeight: 600, padding: '3px 10px',
      borderRadius: '8px', backgroundColor: t.input,
      border: `1px solid ${t.border}`, color,
    }}>
      {label}: {value}
    </span>
  );
};

const ResumenCard = ({ t, label, value, icon: Icon, color }) => (
  <div style={{
    padding: '16px', borderRadius: '12px',
    backgroundColor: t.input, border: `1px solid ${t.border}`,
    textAlign: 'center',
  }}>
    <Icon size={16} color={color} style={{ margin: '0 auto 6px' }} />
    <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: t.textDim, margin: 0 }}>{label}</p>
    <p style={{ fontSize: '13px', fontWeight: 700, color, marginTop: '4px' }}>{value}</p>
  </div>
);

export default FormularioPrestamo;
