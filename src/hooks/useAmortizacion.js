import { useMemo } from 'react';

// ─── CONSTANTES ───────────────────────────────────────────────
const TASA_MORA_DIARIA = 0.05;
const DIAS_GRACIA = 0;

// ─── UTILIDADES ───────────────────────────────────────────────
function toDate(str) {
  if (!str) return new Date();
  const parts = str.split('-');
  if (parts.length !== 3) return new Date();
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  return new Date(y, m - 1, d);
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getFechaVencimiento(inicio, mesIndex) {
  const d = toDate(inicio);
  const diaPago = d.getDate();
  // Primer pago: mes siguiente al inicio
  const venc = new Date(d.getFullYear(), d.getMonth() + 1 + mesIndex, 1);
  const ultimoDiaMes = new Date(venc.getFullYear(), venc.getMonth() + 1, 0).getDate();
  const diaSeguro = Math.min(diaPago, ultimoDiaMes);
  venc.setDate(diaSeguro);
  return formatDate(venc);
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
  const startDate = toDate(inicio);
  const endDate = fin ? toDate(fin) : new Date();
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

// ─── GENERAR CRONOGRAMA DIARIO ──────────────────────────────────
function generarCronogramaDiario(prestamo) {
  if (!prestamo?.id) return [];
  const { inicio, capital, interes, pagos, plazo_meses, tipo_pago } = prestamo;
  const tasaInteres = parseFloat(interes) || 0;
  const capitalNum = parseFloat(capital) || 0;
  const meses = parseInt(plazo_meses) || 1;
  const totalDias = meses * 30;
  const interesTotal = Math.round(capitalNum * (tasaInteres / 100) * meses * 100) / 100;
  const capitalDiario = capitalNum / totalDias;
  const interesDiario = interesTotal / totalDias;
  const cuotaDiaria = capitalDiario + interesDiario;
  const pagosArr = Array.isArray(pagos) ? pagos : [];
  const startDate = toDate(inicio);
  const hoy = new Date();
  const cuotas = [];

  let capitalAcumulado = 0;

  for (let dia = 0; dia < totalDias; dia++) {
    const fechaActual = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + dia);
    const key = formatDate(fechaActual);
    capitalAcumulado += capitalDiario;

    let estado = 'pendiente';
    const isPagado = pagosArr.includes(key);
    if (isPagado) {
      estado = 'pagado';
    } else if (fechaActual < hoy) {
      estado = 'vencido';
    } else {
      const futuroLimite = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 1);
      if (fechaActual >= futuroLimite) estado = 'futuro';
    }

    cuotas.push({
      key,
      label: `${fechaActual.getDate()} ${fechaActual.toLocaleString('es', { month: 'short' })}`,
      fechaVencimiento: formatDate(fechaActual),
      interes: Math.round(interesDiario * 100) / 100,
      capital: Math.round(capitalDiario * 100) / 100,
      total: Math.round(cuotaDiaria * 100) / 100,
      pagado: isPagado,
      mora: 0,
      diasAtraso: 0,
      estado,
      diaActual: dia + 1,
      totalDias,
      capitalAmortizado: Math.round(Math.min(capitalAcumulado, capitalNum) * 100) / 100,
      capitalRestante: Math.round(Math.max(capitalNum - capitalAcumulado, 0) * 100) / 100,
      timestamp: fechaActual.toISOString(),
    });
  }

  return cuotas;
}

// ─── CALCULAR RESUMEN ──────────────────────────────────────────
function calcularResumen(cuotas) {
  return _calcularResumen(cuotas);
}

function calcularResumenDiario(cuotas) {
  if (!cuotas?.length) return null;
  const pagadas = cuotas.filter(c => c.estado === 'pagado').length;
  const vencidas = cuotas.filter(c => c.estado === 'vencido').length;
  const pendientes = cuotas.filter(c => c.estado === 'pendiente').length;
  const totalPagado = cuotas.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.total, 0);
  const saldoRestante = cuotas.length > 0 ? cuotas[cuotas.length - 1].capitalRestante : 0;
  const ultimaPagada = [...cuotas].reverse().find(c => c.estado === 'pagado');
  const progreso = cuotas.length > 0
    ? `${(pagadas / cuotas.length * 100).toFixed(0)}%`
    : '0%';

  return {
    totalDias: cuotas.length,
    diasPagados: pagadas,
    diasVencidos: vencidas,
    diasPendientes: pendientes,
    totalPagado: Math.round(totalPagado * 100) / 100,
    saldoRestante,
    progreso,
    ultimoDiaPagado: ultimaPagada?.key || null,
    cuotaDiaria: cuotas[0]?.total || 0,
    capitalRestante: saldoRestante,
  };
}

function _calcularResumen(cuotas) {
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
    if (prestamo.tipo_pago === 'diario') {
      const cuotas = generarCronogramaDiario(prestamo);
      const resumen = calcularResumenDiario(cuotas);
      return { cuotas, resumen, proyeccion: [] };
    }
    const cuotas = generarCronograma(prestamo);
    const resumen = calcularResumen(cuotas);
    const proyeccion = proyectarSiguientes(prestamo);
    return { cuotas, resumen, proyeccion };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestamo?.id, prestamo?.inicio, prestamo?.fin, prestamo?.capital, prestamo?.interes, prestamo?.pagos, prestamo?.tipo_pago, prestamo?.plazo_meses]);
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

export { generarCronograma, generarCronogramaDiario, calcularResumen, calcularResumenDiario, proyectarSiguientes, calcularEstadisticas };
