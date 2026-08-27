import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  User, FileSignature, Smartphone, DollarSign, BadgePercent, CalendarDays,
  ShieldCheck, ExternalLink, ChevronLeft, ChevronRight, Save, X, Check, CheckCircle2,
  AlertCircle, Upload, CreditCard, ArrowRight, Eye, EyeOff, MapPin, Globe, Building2,
  Users, Briefcase, Hash, Phone, Mail, FileText, Image, Link, Lock, Wallet, Camera,
  Zap, Sparkles, Sliders, Calculator, CheckSquare
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme, useTheme } from '../lib/theme';

// ─── COMPONENTE CAMPO REUTILIZABLE ────────────────────────────
const Campo = React.memo(({ t, label, icon: Icon, value, onChange, hasError, error, placeholder, type = 'text', required, textarea, inputMode }) => {
  const borderColor = hasError ? (t.danger || '#ef4444') : t.border;
  return (
    <div>
      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: hasError ? (t.danger || '#ef4444') : t.textMuted, display: 'block', marginBottom: '5px' }}>
        {Icon && <Icon size={11} style={{ display: 'inline', marginRight: '4px' }} />}
        {label} {required && <span style={{ color: t.danger || '#ef4444' }}>*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', fontSize: '12px', lineHeight: 1.5,
            backgroundColor: t.input, border: `1px solid ${borderColor}`,
            color: t.text, borderRadius: '10px', outline: 'none', resize: 'vertical',
            minHeight: '70px', transition: 'border 0.2s', boxSizing: 'border-box',
          }}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', fontSize: '12px', fontWeight: 500,
            backgroundColor: t.input, border: `1px solid ${borderColor}`,
            color: t.text, borderRadius: '10px', outline: 'none',
            transition: 'border 0.2s', boxSizing: 'border-box',
          }}
          placeholder={placeholder}
        />
      )}
      {hasError && error && <p style={{ fontSize: '9px', color: t.danger || '#ef4444', margin: '3px 0 0', fontWeight: 600 }}>{error}</p>}
    </div>
  );
});

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

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000];
const PRESET_INTERESTS = [3, 5, 10, 12, 15, 20];
const PRESET_PLAZOS_MESES = [1, 3, 6, 12];
const PRESET_PLAZOS_DIAS = [15, 30, 60, 90];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
const FormularioPrestamo = ({ isDark, onClose, onSave, initialData = null }) => {
  const t = useTheme(isDark);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Modo de Creación: 'express' (1 pantalla rápida) vs 'completo' (wizard de 4 pasos)
  const [mode, setMode] = useState(initialData ? 'completo' : 'express');
  const [paso, setPaso] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const handlerCache = useRef({});

  const getHandler = useCallback((field) => {
    if (!handlerCache.current[field]) {
      handlerCache.current[field] = (val) => {
        setForm(prev => ({ ...prev, [field]: val }));
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => {
          if (!prev[field]) return prev;
          const c = { ...prev };
          delete c[field];
          return c;
        });
      };
    }
    return handlerCache.current[field];
  }, []);

  // Estado del formulario
  const [form, setForm] = useState(() => {
    if (initialData) {
      const defaults = {
        nombre: '', ci: '', telefono: '', email: '', direccion: '',
        referencias: '', ocupacion: '', foto: '', capital: '', interes: 5,
        moneda: 'BOB', inicio: '', fin: '', estado: 'Activo',
        tipo_pago: 'mensual', plazo_meses: 1, cuenta_bancaria: '',
        tipoGarantia: '', garantia: '', drive_contrato: '', drive_fotos: '',
        notas: '', pagos: [],
        tipo_prestamo: 'otorgado',
      };
      const merged = { ...defaults, ...initialData };
      return {
        ...merged,
        inicio: merged.inicio || new Date().toISOString().split('T')[0],
        fin: merged.fin || (() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d.toISOString().split('T')[0]; })(),
        foto: merged.foto || '',
        pagos: Array.isArray(merged.pagos) ? merged.pagos : [],
        tipo_pago: merged.tipo_pago || 'mensual',
        plazo_meses: merged.plazo_meses || 1,
        cuenta_bancaria: merged.cuenta_bancaria || '',
        capital: merged.capital?.toString() || '',
        interes: merged.interes?.toString() || '5',
        tipo_prestamo: merged.tipo_prestamo || 'otorgado',
      };
    }
    const today = new Date();
    const fin = new Date(today);
    fin.setMonth(fin.getMonth() + 6);
    return {
      // Paso 1: Datos Personales
      tipo_prestamo: 'otorgado',
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
      tipo_pago: 'mensual',
      plazo_meses: 1,
      cuenta_bancaria: '',
      // Paso 3: Garantía
      tipoGarantia: '',
      garantia: '',
      drive_contrato: '',
      drive_fotos: '',
      notas: '',
      pagos: [],
    };
  });

  // Cálculo en tiempo real para el simulador interactivo
  const liveSimulation = useMemo(() => {
    const capitalNum = parseFloat(form.capital) || 0;
    const tasaInteres = parseFloat(form.interes) || 0;
    const meses = parseInt(form.plazo_meses) || 1;
    const isDiario = form.tipo_pago === 'diario';
    const totalDias = meses * 30;

    if (isDiario) {
      const interesTotal = capitalNum * (tasaInteres / 100) * meses;
      const capitalDiario = totalDias > 0 ? capitalNum / totalDias : 0;
      const interesDiario = totalDias > 0 ? interesTotal / totalDias : 0;
      const cuotaDiaria = capitalDiario + interesDiario;
      const totalRecuperar = capitalNum + interesTotal;

      let fechaFinCalc = form.inicio;
      if (form.inicio) {
        const d = new Date(form.inicio);
        d.setDate(d.getDate() + totalDias);
        fechaFinCalc = d.toISOString().split('T')[0];
      }

      return {
        cuotaPeriodo: cuotaDiaria,
        labelPeriodo: 'Cuota Diaria',
        interesTotal,
        totalRecuperar,
        rendimientoPorcentaje: tasaInteres * meses,
        fechaFinSugerida: fechaFinCalc,
        totalDias
      };
    } else {
      const interesMensual = capitalNum * (tasaInteres / 100);
      const totalInteresPlazo = interesMensual * meses;
      const totalRecuperar = capitalNum + totalInteresPlazo;

      let fechaFinCalc = form.fin;
      if (form.inicio && !initialData) {
        const d = new Date(form.inicio);
        d.setMonth(d.getMonth() + meses);
        fechaFinCalc = d.toISOString().split('T')[0];
      }

      return {
        cuotaPeriodo: interesMensual,
        labelPeriodo: 'Interés Mensual',
        interesTotal: totalInteresPlazo,
        totalRecuperar,
        rendimientoPorcentaje: tasaInteres * meses,
        fechaFinSugerida: fechaFinCalc,
        totalDias: meses * 30
      };
    }
  }, [form.capital, form.interes, form.plazo_meses, form.tipo_pago, form.inicio, form.fin, initialData]);

  // Actualizar fecha fin automática en modo express si cambia plazo
  const handlePlazoChange = (mesesVal) => {
    const meses = parseInt(mesesVal) || 1;
    getHandler('plazo_meses')(meses);
    if (form.inicio) {
      const d = new Date(form.inicio);
      d.setMonth(d.getMonth() + meses);
      getHandler('fin')(d.toISOString().split('T')[0]);
    }
  };

  // Subir foto a Supabase Storage
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

  // Validación
  const validate = useCallback((pasoActual) => {
    const errs = {};
    if (pasoActual === 0 || mode === 'express') {
      if (!form.nombre?.trim()) errs.nombre = 'El nombre es obligatorio';
    }
    if (pasoActual === 1 || mode === 'express') {
      if (!form.capital || parseFloat(form.capital) <= 0) errs.capital = 'Ingresa un capital válido';
      if (parseFloat(form.interes) < 0) errs.interes = 'La tasa no puede ser negativa';
    }
    return errs;
  }, [form, mode]);

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

  // Submit
  const handleSubmit = async () => {
    const allErrors = validate(0);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      if (mode !== 'express') setPaso(0);
      return;
    }

    setLoading(true);
    try {
      const finalFin = form.fin || liveSimulation.fechaFinSugerida || form.inicio;

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
        inicio: form.inicio || new Date().toISOString().split('T')[0],
        fin: finalFin,
        estado: form.estado || 'Activo',
        tipo_pago: form.tipo_pago || 'mensual',
        plazo_meses: parseInt(form.plazo_meses) || 1,
        cuenta_bancaria: form.cuenta_bancaria?.trim() || '',
        tipoGarantia: form.tipoGarantia || '',
        garantia: form.garantia?.trim() || '',
        drive_contrato: form.drive_contrato?.trim() || '',
        drive_fotos: form.drive_fotos?.trim() || '',
        notas: form.notas?.trim() || '',
        pagos: form.pagos || [],
        tipo_prestamo: form.tipo_prestamo || 'otorgado'
      };

      let saveError;
      let newRecordData;
      if (initialData?.id) {
        const { error } = await supabase.from('prestamos').update(payload).eq('id', initialData.id);
        saveError = error;
        if (!error) {
          await supabase.from('prestamos_historial').insert([{
            prestamo_id: initialData.id,
            accion: 'MODIFICADO',
            detalle: `Préstamo modificado: ${payload.nombre}`,
            datos_previos: initialData,
          }]);
        }
        newRecordData = { id: initialData.id, ...payload };
      } else {
        const { error, data } = await supabase.from('prestamos').insert([payload]).select();
        saveError = error;
        if (data?.[0]) newRecordData = data[0];
        if (!error && data?.[0]) {
          await supabase.from('prestamos_historial').insert([{
            prestamo_id: data[0].id,
            accion: 'CREADO',
            detalle: `Nuevo préstamo creado: ${payload.nombre} - ${payload.capital} ${payload.moneda}`,
          }]);
        }
      }

      if (saveError) {
        if (saveError.message && (saveError.message.includes('tipo_prestamo') || saveError.code === '42703')) {
          const { tipo_prestamo, ...fallbackPayload } = payload;
          fallbackPayload.notas = `[TIPO:${form.tipo_prestamo}] ${(form.notas || '').trim()}`.trim();
          
          if (initialData?.id) {
            const { error: retryErr } = await supabase.from('prestamos').update(fallbackPayload).eq('id', initialData.id);
            if (retryErr) throw retryErr;
            newRecordData = { id: initialData.id, ...fallbackPayload };
          } else {
            const { error: retryErr, data } = await supabase.from('prestamos').insert([fallbackPayload]).select();
            if (retryErr) throw retryErr;
            if (data?.[0]) {
              newRecordData = data[0];
              await supabase.from('prestamos_historial').insert([{
                prestamo_id: data[0].id,
                accion: 'CREADO',
                detalle: `Nuevo préstamo creado (con fallback): ${fallbackPayload.nombre}`,
              }]);
            }
          }
        } else {
          throw saveError;
        }
      }

      onSave?.(newRecordData);
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message }));
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER: MODO EXPRESS (1 PANTALLA RÁPIDA & SIMULADOR) ───
  const renderModoExpress = () => {
    const esRecibido = form.tipo_prestamo === 'recibido';
    const isDiario = form.tipo_pago === 'diario';
    const moneda = form.moneda || 'BOB';

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* Selector de Tipo (Otorgado vs Recibido) */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => handleChange('tipo_prestamo', 'otorgado')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              form.tipo_prestamo === 'otorgado'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <DollarSign size={14} /> Otorgado a Cliente
          </button>
          <button
            type="button"
            onClick={() => handleChange('tipo_prestamo', 'recibido')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              form.tipo_prestamo === 'recibido'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Building2 size={14} /> Recibido (Banco / Deuda)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Columna Izquierda: Formulario Rápido */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Nombre y Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo
                t={t}
                label={esRecibido ? "Acreedor / Entidad" : "Nombre del Cliente"}
                icon={User}
                value={form.nombre}
                onChange={getHandler('nombre')}
                hasError={!!errors.nombre && !!touched.nombre}
                error={errors.nombre}
                placeholder={esRecibido ? "Ej: Banco FIE / Pedro" : "Ej: María Flores"}
                required
              />
              <Campo
                t={t}
                label="Teléfono / WhatsApp"
                icon={Smartphone}
                value={form.telefono}
                onChange={getHandler('telefono')}
                placeholder="Ej: 71234567"
                inputMode="tel"
              />
            </div>

            {/* Capital con Botones de Acceso Rápido */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <DollarSign size={12} className="text-emerald-400" /> Monto del Capital *
                </label>
                <div className="flex gap-1">
                  {MONEDAS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => getHandler('moneda')(m)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        form.moneda === m ? 'bg-emerald-500 text-black' : 'bg-white/[0.05] text-neutral-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.capital}
                  onChange={e => getHandler('capital')(e.target.value)}
                  placeholder="0.00"
                  className="w-full py-2.5 px-3.5 text-lg font-mono font-black rounded-xl bg-black/40 border border-white/[0.1] text-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Botones Presets de Capital */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => getHandler('capital')(amt.toString())}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/[0.06] transition-all"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              {errors.capital && <p className="text-[10px] text-red-400 font-bold">{errors.capital}</p>}
            </div>

            {/* Modalidad de Pago & Tasa de Interés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Modalidad */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <CreditCard size={12} className="text-blue-400" /> Modalidad
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => getHandler('tipo_pago')('mensual')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all ${
                      form.tipo_pago === 'mensual'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-white/[0.03] text-neutral-400 border border-transparent'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => getHandler('tipo_pago')('diario')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all ${
                      form.tipo_pago === 'diario'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-white/[0.03] text-neutral-400 border border-transparent'
                    }`}
                  >
                    Diario
                  </button>
                </div>
              </div>

              {/* Tasa % */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                    <BadgePercent size={12} className="text-amber-400" /> Interés Mensual
                  </label>
                  <span className="text-xs font-black font-mono text-amber-400">{form.interes}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={form.interes}
                    onChange={e => getHandler('interes')(e.target.value)}
                    className="w-20 py-1.5 px-2.5 text-xs font-mono font-bold rounded-lg bg-black/40 border border-white/[0.1] text-amber-400 text-center outline-none"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {PRESET_INTERESTS.map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => getHandler('interes')(rate.toString())}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold ${
                          parseFloat(form.interes) === rate
                            ? 'bg-amber-400 text-black'
                            : 'bg-white/[0.04] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Plazo & Fecha de Inicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <CalendarDays size={12} className="text-neutral-400" /> Plazo del Contrato
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(isDiario ? PRESET_PLAZOS_DIAS : PRESET_PLAZOS_MESES).map(pVal => {
                    const mesesEq = isDiario ? Math.max(1, Math.round(pVal / 30)) : pVal;
                    const isSelected = parseInt(form.plazo_meses) === mesesEq;
                    return (
                      <button
                        key={pVal}
                        type="button"
                        onClick={() => handlePlazoChange(mesesEq)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-white text-black font-black shadow-sm'
                            : 'bg-white/[0.04] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {isDiario ? `${pVal} días` : `${pVal} mes${pVal !== 1 ? 'es' : ''}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <CalendarDays size={12} className="text-neutral-400" /> Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={form.inicio}
                  onChange={e => getHandler('inicio')(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs font-mono font-medium rounded-lg bg-black/40 border border-white/[0.1] text-white outline-none"
                />
              </div>
            </div>

          </div>

          {/* Columna Derecha: Tarjeta Simulador en Vivo & Resumen */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-neutral-900 to-black border border-emerald-500/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Calculator size={16} className="text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">Simulador en Vivo</span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isDiario ? 'Plan Diario' : 'Plan Mensual'}
                </span>
              </div>

              {/* Gran Monto de Cuota */}
              <div className="text-center py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{liveSimulation.labelPeriodo}</p>
                <h3 className="text-3xl font-black font-mono text-emerald-400 tracking-tight mt-1">
                  {liveSimulation.cuotaPeriodo.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-sans font-bold text-neutral-400">{moneda}</span>
                </h3>
              </div>

              {/* Indicadores Clave */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <p className="text-[9px] text-neutral-400 uppercase font-bold">Ganancia Total (Interés)</p>
                  <p className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                    +{liveSimulation.interesTotal.toLocaleString('es-BO', { minimumFractionDigits: 0 })} {moneda}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <p className="text-[9px] text-neutral-400 uppercase font-bold">Total a Recuperar</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">
                    {liveSimulation.totalRecuperar.toLocaleString('es-BO', { minimumFractionDigits: 0 })} {moneda}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-neutral-400 pt-1">
                <div className="flex justify-between">
                  <span>Plazo:</span>
                  <span className="font-bold text-neutral-200">{isDiario ? `${liveSimulation.totalDias} días` : `${form.plazo_meses} meses`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vencimiento Estimado:</span>
                  <span className="font-bold text-neutral-200">{liveSimulation.fechaFinSugerida || '—'}</span>
                </div>
              </div>

              {/* Botón de Guardar en 1 Toque */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Save size={16} /> {initialData ? 'Guardar Cambios' : '⚡ Crear Préstamo Express'}
                  </>
                )}
              </button>
            </div>

            {/* Garantía opcional rápida */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                <ShieldCheck size={12} className="text-neutral-400" /> Garantía o Respaldo (Opcional)
              </label>
              <input
                type="text"
                value={form.garantia}
                onChange={e => getHandler('garantia')(e.target.value)}
                placeholder="Ej: Joya de oro 18k / Laptop HP"
                className="w-full py-2 px-3 text-xs rounded-lg bg-black/40 border border-white/[0.1] text-neutral-200 outline-none"
              />
            </div>

          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER: STEP INDICATOR (MODO COMPLETO) ───────────────────
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
            <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: isActive ? t.accent : t.textDim, textAlign: 'center' }}>
              {p.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ─── RENDER: PASO 1 - DATOS PERSONALES (MODO COMPLETO) ────────
  const renderPasoDatos = () => {
    const esRecibido = form.tipo_prestamo === 'recibido';
    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>
            {esRecibido ? 'Datos del Acreedor / Banco' : 'Datos del Prestatario'}
          </h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>
            {esRecibido ? 'Información de la entidad o persona que te otorgó el préstamo' : 'Información básica de la persona que recibe tu dinero'}
          </p>
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
                  {uploadingFoto ? 'Subiendo...' : esRecibido ? 'Logo/Foto' : 'Foto'}
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

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
          <Campo t={t} label={esRecibido ? "Nombre de la Entidad / Acreedor" : "Nombre Completo"} icon={User} value={form.nombre} onChange={getHandler('nombre')}
            hasError={!!errors.nombre && !!touched.nombre} error={errors.nombre} placeholder={esRecibido ? "Ej: Banco Unión o Pedro Gómez" : "Ej: Juan Pérez"} required />
          <Campo t={t} label={esRecibido ? "NIT / Identificación" : "Cédula de Identidad"} icon={FileSignature} value={form.ci} onChange={getHandler('ci')}
            hasError={!!errors.ci && !!touched.ci} error={errors.ci} placeholder="Ej: 1234567" />
          <Campo t={t} label="Teléfono / WhatsApp" icon={Smartphone} value={form.telefono} onChange={getHandler('telefono')}
            hasError={!!errors.telefono && !!touched.telefono} error={errors.telefono} placeholder="Ej: 71234567" />
          <Campo t={t} label="Correo Electrónico" icon={Mail} value={form.email} onChange={getHandler('email')}
            hasError={!!errors.email && !!touched.email} error={errors.email} placeholder="Ej: contacto@entidad.com" />
          <Campo t={t} label="Dirección / Ubicación" icon={MapPin} value={form.direccion} onChange={getHandler('direccion')}
            hasError={!!errors.direccion && !!touched.direccion} error={errors.direccion} placeholder="Ej: Av. Arce #123" />
          <Campo t={t} label={esRecibido ? "Contacto Interno" : "Ocupación"} icon={Briefcase} value={form.ocupacion} onChange={getHandler('ocupacion')}
            hasError={!!errors.ocupacion && !!touched.ocupacion} error={errors.ocupacion} placeholder={esRecibido ? "Ej: Ejecutivo de Crédito" : "Ej: Comerciante"} />
        </div>
        <div style={{ marginTop: '20px' }}>
          <Campo t={t} label={esRecibido ? "Notas del Crédito / Condiciones" : "Referencias Personales"} icon={Users} value={form.referencias} onChange={getHandler('referencias')}
            hasError={!!errors.referencias && !!touched.referencias} error={errors.referencias} placeholder={esRecibido ? "Ej: Ejecutivo: Javier Paz, Telf: 78945612" : "Nombre y teléfono de referencia"} textarea />
        </div>
      </div>
    );
  };

  // ─── RENDER: PASO 2 - FINANCIEROS (MODO COMPLETO) ───────────
  const renderPasoFinanciero = () => {
    const isDiario = form.tipo_pago === 'diario';
    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }} className="space-y-5">
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>Términos Financieros</h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>Define el capital, interés y modalidad del préstamo</p>
        </div>

        {/* Modalidad de Pago */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'mensual', label: 'Mensual (Interés)', desc: 'Pago único mensual de interés' },
            { value: 'diario', label: 'Diario (Amortización)', desc: 'Cuota diaria con amortización de capital' },
          ].map(opt => (
            <div key={opt.value} onClick={() => getHandler('tipo_pago')(opt.value)}
              style={{
                padding: '12px', borderRadius: '10px', cursor: 'pointer',
                backgroundColor: form.tipo_pago === opt.value ? `${t.accent}15` : t.input,
                border: `1.5px solid ${form.tipo_pago === opt.value ? t.accent : t.border}`,
                transition: 'all 0.2s',
              }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: form.tipo_pago === opt.value ? t.accent : t.text, margin: '0 0 2px' }}>
                {opt.label}
              </p>
              <p style={{ fontSize: '9px', color: t.textDim, margin: 0 }}>{opt.desc}</p>
            </div>
          ))}
        </div>

        {/* Capital y Moneda */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: errors.capital ? t.danger : t.textMuted, display: 'block', marginBottom: '5px' }}>
              <DollarSign size={10} style={{ display: 'inline', marginRight: '4px' }} /> Capital *
            </label>
            <input type="number" inputMode="decimal" value={form.capital} onChange={e => getHandler('capital')(e.target.value)}
              style={{
                width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700, fontFamily: 'monospace',
                backgroundColor: t.input, border: `1px solid ${errors.capital ? t.danger : t.border}`,
                color: t.text, borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
              }}
              placeholder="0.00" />
            {errors.capital && <p style={{ fontSize: '9px', color: t.danger, margin: '3px 0 0', fontWeight: 500 }}>{errors.capital}</p>}
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <Wallet size={10} style={{ display: 'inline', marginRight: '4px' }} /> Moneda
            </label>
            <select value={form.moneda} onChange={e => getHandler('moneda')(e.target.value)}
              style={{
                width: '100%', padding: '12px', fontSize: '13px', fontWeight: 600,
                backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
              }}>
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Tasa e Interés */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: errors.interes ? t.danger : t.textMuted, display: 'block', marginBottom: '5px' }}>
              <BadgePercent size={10} style={{ display: 'inline', marginRight: '4px' }} /> Interés Mensual (%)
            </label>
            <input type="number" step="0.5" value={form.interes} onChange={e => getHandler('interes')(e.target.value)}
              style={{
                width: '100%', padding: '12px', fontSize: '14px', fontWeight: 600, fontFamily: 'monospace',
                backgroundColor: t.input, border: `1px solid ${errors.interes ? t.danger : t.border}`,
                color: t.accent, borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
              }}
              placeholder="5" />
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <CheckCircle2 size={10} style={{ display: 'inline', marginRight: '4px' }} /> Estado Inicial
            </label>
            <select value={form.estado} onChange={e => getHandler('estado')(e.target.value)}
              style={{
                width: '100%', padding: '12px', fontSize: '13px', fontWeight: 600,
                backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
              }}>
              {ESTADOS_INICIALES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* Fechas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <CalendarDays size={10} style={{ display: 'inline', marginRight: '4px' }} /> Fecha de Inicio
            </label>
            <input type="date" value={form.inicio} onChange={e => getHandler('inicio')(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '12px',
                backgroundColor: t.input, border: `1px solid ${t.border}`,
                color: t.text, borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
              <CalendarDays size={10} style={{ display: 'inline', marginRight: '4px' }} /> Fecha de Vencimiento
            </label>
            <input type="date" value={form.fin} onChange={e => getHandler('fin')(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '12px',
                backgroundColor: t.input, border: `1px solid ${t.border}`,
                color: t.text, borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER: PASO 3 - GARANTÍA (MODO COMPLETO) ──────────────
  const renderPasoGarantia = () => (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }} className="space-y-5">
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>Garantía & Documentos</h3>
        <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>Respaldo documental del préstamo (opcional)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
            <ShieldCheck size={10} style={{ display: 'inline', marginRight: '4px' }} /> Tipo de Garantía
          </label>
          <select value={form.tipoGarantia} onChange={e => getHandler('tipoGarantia')(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', fontSize: '12px', fontWeight: 500,
              backgroundColor: t.input, border: `1px solid ${t.border}`,
              color: t.text, borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
            }}>
            {TIPOS_GARANTIA.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.textMuted, display: 'block', marginBottom: '5px' }}>
            <Link size={10} style={{ display: 'inline', marginRight: '4px' }} /> Link Contrato (Drive)
          </label>
          <input type="url" value={form.drive_contrato} onChange={e => getHandler('drive_contrato')(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', fontSize: '12px',
              backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
              borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
            }}
            placeholder="https://drive.google.com/..." />
        </div>
      </div>

      <div>
        <Campo t={t} label="Descripción de la Garantía" icon={FileText} value={form.garantia}
          onChange={getHandler('garantia')} placeholder="Describe el bien o documento de respaldo" textarea />
      </div>
    </div>
  );

  // ─── RENDER: PASO 4 - RESUMEN (MODO COMPLETO) ───────────────
  const renderPasoResumen = () => {
    const moneda = form.moneda || 'BOB';
    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }} className="space-y-4">
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>Resumen & Confirmar</h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>Verifica que todos los datos sean correctos antes de guardar</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-emerald-500/40 bg-neutral-800 flex items-center justify-center shrink-0">
            {form.foto ? (
              <img src={form.foto} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-neutral-400" />
            )}
          </div>
          <div>
            <h4 className="text-base font-black text-white m-0">{form.nombre || 'Sin nombre'}</h4>
            <p className="text-xs text-neutral-400 m-0 mt-0.5">{form.telefono || 'Sin teléfono'} · {form.ci || 'Sin CI'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
            <span className="text-[9px] font-bold uppercase text-neutral-400">Capital</span>
            <p className="text-sm font-mono font-black text-white mt-1">{(parseFloat(form.capital) || 0).toLocaleString()} {moneda}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
            <span className="text-[9px] font-bold uppercase text-neutral-400">Interés</span>
            <p className="text-sm font-mono font-black text-amber-400 mt-1">{form.interes}%</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
            <span className="text-[9px] font-bold uppercase text-neutral-400">Modalidad</span>
            <p className="text-sm font-bold uppercase text-emerald-400 mt-1">{form.tipo_pago}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPaso = () => {
    switch (paso) {
      case 0: return renderPasoDatos();
      case 1: return renderPasoFinanciero();
      case 2: return renderPasoGarantia();
      case 3: return renderPasoResumen();
      default: return null;
    }
  };

  // ─── RENDER PRINCIPAL ─────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Header con Selector de Modo (Express vs Completo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight m-0 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-400" />
            {initialData ? 'Editar Contrato de Préstamo' : 'Nuevo Contrato de Préstamo'}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {mode === 'express' ? 'Crea y calcula contratos en 3 segundos' : 'Configuración paso a paso con garantías y fotos'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!initialData && (
            <div className="flex p-1 rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setMode('express')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'express' ? 'bg-emerald-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Zap size={13} /> Express
              </button>
              <button
                type="button"
                onClick={() => setMode('completo')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'completo' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sliders size={13} /> Avanzado
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Contenido según Modo */}
      {mode === 'express' ? (
        renderModoExpress()
      ) : (
        <div>
          {renderStepper()}
          <div className="min-h-[320px]">
            {renderPaso()}
          </div>

          {/* Botones de navegación del Wizard */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={prevPaso}
              disabled={paso === 0}
              className="py-2 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Anterior
            </button>

            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Paso {paso + 1} de {PASOS.length}
            </span>

            {paso < PASOS.length - 1 ? (
              <button
                type="button"
                onClick={nextPaso}
                className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading ? 'Guardando...' : <><Save size={15} /> {initialData ? 'Actualizar' : 'Crear Préstamo'}</>}
              </button>
            )}
          </div>
        </div>
      )}

      {errors.submit && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          {errors.submit}
        </div>
      )}
    </div>
  );
};

export default FormularioPrestamo;
