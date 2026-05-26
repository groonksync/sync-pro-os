import { useMemo } from 'react';

// ─── CONSTANTES ───────────────────────────────────────────────
const TASA_MORA_DIARIA = 0.05; // 5% del interés mensual por día de atraso
const DIAS_GRACIA = 0; // Días de gracia antes de aplicar mora

// ─── UTILIDADES ───────────────────────────────────────────────
function getFechaVencimiento(inicio, mesIndex) {
  const d = new Date(inicio);
  d.setDate(d.getDate() + 1);
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

/**
 * Genera el cronograma de pagos completo para un préstamo.
 */
function generarCronograma(prestamo) {
  if (!prestamo?.inicio) return [];

  const pagos = Array.isArray(prestamo.pagos) ? prestamo.pagos : [];
  const capital = parseFloat(prestamo.capital) || 0;
  const interes = parseFloat(prestamo.interes) || 0;
  const interesMensual = capital * (interes / 100);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicio = new Date(prestamo.inicio);
  const fin = prestamo.fin ? new Date(prestamo.fin) : null;
  if (isNaN(inicio.getTime())) return [];

  const cuotas = [];
  let idx = 0;
  let cursor = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
  const tope = fin && fin > inicio ? new Date(fin.getFullYear(), fin.getMonth(), 1) : new Date(hoy.getFullYear() + 1, hoy.getMonth(), 1);

  while (cursor <= tope) {
    const key = generarKey(cursor.getFullYear(), cursor.getMonth());
    const pagado = pagos.includes(key);
    const fechaVenc = getFechaVencimiento(inicio.toISOString().split('T')[0], idx);
    const vencDate = new Date(fechaVenc);
    const vencido = !pagado && vencDate < hoy;
    
    let mora = 0;
    if (vencido) {
      const diasAtraso = diasEntre(fechaVenc, hoy.toISOString().split('T')[0]) - DIAS_GRACIA;
      if (diasAtraso > 0) {
        mora = Math.round(interesMensual * TASA_MORA_DIARIA * diasAtraso * 100) / 100;
      }
    }

    let estado;
    if (pagado) {
      estado = 'pagado';
    } else if (vencido) {
      estado = 'vencido';
    } else if (new Date(key + '-01') > hoy) {
      estado = 'futuro';
    } else {
      estado = 'pendiente';
    }

    cuotas.push({
      key,
      label: cursor.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      fechaVencimiento: fechaVenc,
      interes: interesMensual,
      capital: 0,
      total: interesMensual + mora,
      pagado,
      mora,
      diasAtraso: vencido ? diasEntre(fechaVenc, hoy.toISOString().split('T')[0]) : 0,
      estado,
      timestamp: cursor.getTime(),
    });

    cursor.setMonth(cursor.getMonth() + 1);
    idx++;
  }

  return cuotas;
}

/**
 * Calcula el resumen financiero de un préstamo.
 */
function calcularResumen(cuotas) {
  const cuotasPagadas = cuotas.filter(c => c.estado === 'pagado');
  const cuotasPendientes = cuotas.filter(c => c.estado === 'pendiente');
  const cuotasVencidas = cuotas.filter(c => c.estado === 'vencido');
  const cuotasFuturas = cuotas.filter(c => c.estado === 'futuro');

  return {
    totalCuotas: cuotas.length,
    cuotasPagadas: cuotasPagadas.length,
    cuotasPendientes: cuotasPendientes.length,
    cuotasVencidas: cuotasVencidas.length,
    cuotasFuturas: cuotasFuturas.length,
    totalPagado: cuotasPagadas.reduce((s, c) => s + c.total, 0),
    totalPendiente: [...cuotasPendientes, ...cuotasVencidas].reduce((s, c) => s + c.total, 0),
    totalMora: cuotasVencidas.reduce((s, c) => s + c.mora, 0),
    interesPromedio: cuotas.length > 0 ? cuotas[0].interes : 0,
    mesesAtraso: cuotasVencidas.length,
    tasaMoraDiaria: TASA_MORA_DIARIA,
  };
}

/**
 * Proyecta las siguientes N cuotas para un préstamo.
 */
function proyectarSiguientes(prestamo, meses = 6) {
  if (!prestamo?.inicio) return [];

  const capital = parseFloat(prestamo.capital) || 0;
  const interes = parseFloat(prestamo.interes) || 0;
  const interesMensual = capital * (interes / 100);
  const pagos = Array.isArray(prestamo.pagos) ? prestamo.pagos : [];

  const cronograma = generarCronograma(prestamo);
  const ultimaCuota = cronograma[cronograma.length - 1];
  
  if (prestamo.fin && ultimaCuota) {
    const finDate = new Date(prestamo.fin);
    const ultimaDate = new Date(ultimaCuota.key + '-01');
    if (ultimaDate >= finDate) return [];
  }

  const inicio = ultimaCuota
    ? new Date(ultimaCuota.timestamp)
    : new Date(new Date(prestamo.inicio).getFullYear(), new Date(prestamo.inicio).getMonth() + 1, 1);
  
  if (ultimaCuota) inicio.setMonth(inicio.getMonth() + 1);

  const proyeccion = [];
  for (let i = 0; i < meses; i++) {
    const key = generarKey(inicio.getFullYear(), inicio.getMonth());
    const fechaVenc = getFechaVencimiento(prestamo.inicio, cronograma.length + i);

    proyeccion.push({
      key,
      label: inicio.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      fechaVencimiento: fechaVenc,
      interes: interesMensual,
      capital: 0,
      total: interesMensual,
      pagado: pagos.includes(key),
      mora: 0,
      diasAtraso: 0,
      estado: 'futuro',
      timestamp: inicio.getTime(),
    });

    inicio.setMonth(inicio.getMonth() + 1);
  }

  return proyeccion;
}

/**
 * Calcula estadísticas globales para un array de préstamos.
 */
function calcularEstadisticas(prestamos) {
  const lista = Array.isArray(prestamos) ? prestamos : [];
  
  const capitalActivo = lista.reduce((s, p) => {
    if (p.estado !== 'Finalizado') return s + (parseFloat(p.capital) || 0);
    return s;
  }, 0);

  let rendimientoMensual = 0;
  let totalMora = 0;
  let totalCuotas = 0;
  let cuotasPagadasTotal = 0;

  lista.forEach(p => {
    const cronograma = generarCronograma(p);
    const resumen = calcularResumen(cronograma);
    rendimientoMensual += resumen.interesPromedio;
    totalMora += resumen.totalMora;
    totalCuotas += resumen.totalCuotas;
    cuotasPagadasTotal += resumen.cuotasPagadas;
  });

  const tasaPromedio = lista.length > 0
    ? lista.reduce((s, p) => s + (parseFloat(p.interes) || 0), 0) / lista.length
    : 0;

  const indiceSalud = totalCuotas > 0
    ? Math.round((cuotasPagadasTotal / totalCuotas) * 100)
    : 100;

  return {
    capitalActivo,
    rendimientoMensual,
    tasaPromedio: Math.round(tasaPromedio * 10) / 10,
    totalMora,
    indiceSalud,
    totalPrestamos: lista.length,
    prestamosActivos: lista.filter(p => p.estado !== 'Finalizado').length,
    totalCuotas,
    cuotasPagadasTotal,
  };
}

// ─── HOOKS ────────────────────────────────────────────────────

/**
 * Hook para un préstamo individual.
 */
export function useAmortizacion(prestamo) {
  return useMemo(() => {
    if (!prestamo?.id) return { cuotas: [], resumen: null, proyeccion: [] };

    const cuotas = generarCronograma(prestamo);
    const resumen = calcularResumen(cuotas);
    const proyeccion = proyectarSiguientes(prestamo);

    return { cuotas, resumen, proyeccion };
  }, [prestamo?.id, prestamo?.inicio, prestamo?.fin, prestamo?.capital, prestamo?.interes, prestamo?.pagos]);
}

/**
 * Hook global para array de préstamos.
 */
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
  }, [prestamos]);
}

// ─── EXPORTS DE FUNCIONES PURAS ──────────────────────────────
export { generarCronograma, calcularResumen, proyectarSiguientes, calcularEstadisticas };
