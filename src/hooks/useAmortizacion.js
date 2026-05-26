import { useMemo } from 'react';

// ─── CONSTANTES ───────────────────────────────────────────────
const TASA_MORA_DIARIA = 0.05; // 5% del interés mensual por día de atraso
const DIAS_GRACIA = 0; // Días de gracia antes de aplicar mora

// ─── UTILIDADES ───────────────────────────────────────────────
function getFechaVencimiento(inicio, mesIndex) {
  const d = new Date(inicio);
  d.setDate(d.getDate() + 1); // Un día después del inicio como base
  // Primer pago: mes siguiente al inicio
  const venc = new Date(d.getFullYear(), d.getMonth() + 1 + mesIndex, Math.min(d.getDate(), 28));
  return venc.toISOString().split('T')[0];
}

function diasEntre(fecha1, fecha2) {
  const f1 = new Date(fecha1);
  const f2 = new Date(fecha2);
  return Math.max(0, Math.floor((f2 - f1) / (1000 * 60 * 60 * 24)));
}

function generarKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// ─── GENERAR CRONOGRAMA ────────────────────────────────────────
function generarCronograma(prestamo) {
  if (!prestamo?.id) return [];
  const { inicio, fin, capital, interes, pagos } = prestamo;
  const tasaInteres = parseFloat(interes) || 0;
  const capitalNum = parseFloat(capital) || 0;
  const interesMensual = Math.round(capitalNum * (tasaInteres / 100));
  const pagosArr = Array.isArray(pagos) ? pagos : [];
  const cuotas = [];
  const startDate = new Date(inicio);
  const endDate = fin ? new Date(fin) : new Date();
  const hoy = new Date();

  // Calculate max months
  const totalMeses = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    (endDate.getDate() >= startDate.getDate() ? 1 : 0);

  // Add 12 months projection for active loans
  const maxMeses = Math.max(totalMeses, 12);

  for (let mesIndex = 0; mesIndex < maxMeses; mesIndex++) {
    const fechaVenc = getFechaVencimiento(inicio, mesIndex);
    const vencDate = new Date(fechaVenc);
    const key = generarKey(vencDate.getFullYear(), vencDate.getMonth());

    // Stop if we've passed the end date (plus projection buffer for active)
    if (fin && vencDate > endDate) break;

    let mora = 0;
    let diasAtraso = 0;
    let estado = 'pendiente';

    const isPagado = pagosArr.includes(key);
    if (isPagado) {
      estado = 'pagado';
    } else {
      if (vencDate < hoy) {
        estado = 'vencido';
        diasAtraso = diasEntre(fechaVenc, hoy.toISOString().split('T')[0]) - DIAS_GRACIA;
        if (diasAtraso > 0) {
          mora = Math.round(interesMensual * TASA_MORA_DIARIA * diasAtraso * 100) / 100;
        }
      }
      // Mark as future if more than ~2 months away
      const futuroLimite = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 1);
      if (vencDate >= futuroLimite) estado = 'futuro';
    }

    cuotas.push({
      key,
      label: `${vencDate.toLocaleString('es', { month: 'short' })} ${vencDate.getFullYear()}`,
      fechaVencimiento: fechaVenc,
      interes: interesMensual,
      capital: 0,
      total: interesMensual,
      pagado: isPagado,
      mora,
      diasAtraso,
      estado,
      timestamp: vencDate.toISOString(),
    });
  }

  return cuotas;
}

// ─── CALCULAR RESUMEN ──────────────────────────────────────────
function calcularResumen(cuotas) {
  if (!cuotas?.length) return null;
  const totalCuotas = cuotas.length;
  const cuotasPagadas = cuotas.filter(c => c.estado === 'pagado').length;
  const cuotasPendientes = cuotas.filter(c => c.estado === 'pendiente').length;
  const cuotasVencidas = cuotas.filter(c => c.estado === 'vencido').length;
  const cuotasFuturas = cuotas.filter(c => c.estado === 'futuro').length;

  const totalPagado = cuotas.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.total, 0);
  const totalPendiente = cuotas.filter(c => c.estado === 'pendiente' || c.estado === 'vencido').reduce((s, c) => s + c.total, 0);
  const totalMora = cuotas.reduce((s, c) => s + (c.mora || 0), 0);
  const interesPromedio = cuotas.length > 0 ? cuotas[0].interes : 0;
  const mesesAtraso = cuotasVencidas;

  return {
    totalCuotas,
    cuotasPagadas,
    cuotasPendientes,
    cuotasVencidas,
    cuotasFuturas,
    totalPagado,
    totalPendiente,
    totalMora,
    interesPromedio,
    mesesAtraso,
    tasaMoraDiaria: TASA_MORA_DIARIA,
  };
}

// ─── PROYECTAR SIGUIENTES CUOTAS ───────────────────────────────
function proyectarSiguientes(prestamo, meses = 6) {
  if (!prestamo?.id) return [];
  const { inicio, capital, interes } = prestamo;
  const tasaInteres = parseFloat(interes) || 0;
  const capitalNum = parseFloat(capital) || 0;
  const interesMensual = Math.round(capitalNum * (tasaInteres / 100));
  const ultimaCuota = generarCronograma(prestamo);
  const ultimoKey = ultimaCuota.length > 0 ? ultimaCuota[ultimaCuota.length - 1].key : null;

  const proyeccion = [];
  const hoy = new Date();

  for (let i = 1; i <= meses; i++) {
    const fechaBase = ultimoKey
      ? new Date(parseInt(ultimoKey.split('-')[0]), parseInt(ultimoKey.split('-')[1]) - 1, 1)
      : new Date(inicio);

    const proyDate = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + i, Math.min(fechaBase.getDate(), 28));
    const key = generarKey(proyDate.getFullYear(), proyDate.getMonth());

    // Skip if this key already exists
    if (ultimaCuota.some(c => c.key === key)) continue;

    proyeccion.push({
      key,
      label: `${proyDate.toLocaleString('es', { month: 'short' })} ${proyDate.getFullYear()}`,
      fechaVencimiento: proyDate.toISOString().split('T')[0],
      interes: interesMensual,
      capital: 0,
      total: interesMensual,
      pagado: false,
      mora: 0,
      diasAtraso: 0,
      estado: 'proyectado',
      timestamp: proyDate.toISOString(),
    });
  }

  return proyeccion;
}

// ─── CALCULAR ESTADÍSTICAS GLOBALES ────────────────────────────
function calcularEstadisticas(prestamos) {
  const lista = Array.isArray(prestamos) ? prestamos.filter(p => p?.id) : [];

  let capitalActivo = 0;
  let rendimientoMensual = 0;
  let totalMora = 0;
  let prestamosVencidos = 0;
  let prestamosAlDia = 0;

  lista.forEach(p => {
    const cap = parseFloat(p.capital) || 0;
    const interes = parseFloat(p.interes) || 0;
    capitalActivo += cap;
    rendimientoMensual += Math.round(cap * (interes / 100));

    const cuotas = generarCronograma(p);
    const resumen = calcularResumen(cuotas);
    if (resumen) {
      totalMora += resumen.totalMora;
      if (resumen.cuotasVencidas > 0) prestamosVencidos++;
      if (resumen.cuotasVencidas === 0 && resumen.cuotasPagadas > 0) prestamosAlDia++;
    }
  });

  const totalPrestamos = lista.length;
  const tasaPromedio = totalPrestamos > 0
    ? Math.round(lista.reduce((s, p) => s + (parseFloat(p.interes) || 0), 0) / totalPrestamos * 10) / 10
    : 0;

  const indiceSalud = totalPrestamos > 0
    ? Math.round((prestamosAlDia / totalPrestamos) * 100)
    : 100;

  return {
    totalPrestamos,
    capitalActivo,
    rendimientoMensual,
    tasaPromedio,
    totalMora: Math.round(totalMora * 100) / 100,
    prestamosVencidos,
    prestamosAlDia,
    indiceSalud,
  };
}

// ─── HOOKS ─────────────────────────────────────────────────────
export function useAmortizacion(prestamo) {
  return useMemo(() => {
    if (!prestamo?.id) return { cuotas: [], resumen: null, proyeccion: [] };
    const cuotas = generarCronograma(prestamo);
    const resumen = calcularResumen(cuotas);
    const proyeccion = proyectarSiguientes(prestamo);
    return { cuotas, resumen, proyeccion };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestamo?.id, prestamo?.inicio, prestamo?.fin, prestamo?.capital, prestamo?.interes, prestamo?.pagos]);
}

export function useAmortizacionGlobal(prestamos) {
  return useMemo(() => {
    const lista = Array.isArray(prestamos) ? prestamos.filter(p => p?.id) : [];
    const stats = calcularEstadisticas(lista);
    const cuotasPorPrestamo = {};
    lista.forEach(p => {
      cuotasPorPrestamo[p.id] = {
        cuotas: generarCronograma(p),
        resumen: calcularResumen(generarCronograma(p)),
      };
    });
    return { stats, cuotasPorPrestamo };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestamos]);
}

export { generarCronograma, calcularResumen, proyectarSiguientes, calcularEstadisticas };
