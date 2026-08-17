import { useMemo } from 'react';

function formatDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calcula la categoría de riesgo de un préstamo basado en su historial de pagos y tipo (mensual o diario).
 *
 * @param {Object} prestamo - Datos del préstamo
 * @returns {{ categoria: string, mesesAtraso: number, mesesAdeudados: string[], dialog: object, montoPendiente: number }} Resultado de categorización
 */
function calcularCategoriaPrestamo(prestamo) {
  if (!prestamo?.inicio) return null;
  
  const pagos = Array.isArray(prestamo.pagos) ? prestamo.pagos : [];
  const hoy = new Date();
  const hoyStart = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicio = new Date(prestamo.inicio);
  if (isNaN(inicio.getTime())) return null;

  const isDiario = prestamo.tipo_pago === 'diario';
  const capital = parseFloat(prestamo.capital) || 0;
  const tasaInteres = parseFloat(prestamo.interes) || 0;

  if (isDiario) {
    const meses = parseInt(prestamo.plazo_meses) || 1;
    const totalDias = meses * 30;
    const interesTotal = Math.round(capital * (tasaInteres / 100) * meses * 100) / 100;
    const cuotaDiaria = totalDias > 0 ? (capital + interesTotal) / totalDias : 0;

    const startDate = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const diasEsperados = [];

    for (let dia = 0; dia < totalDias; dia++) {
      const fechaActual = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + dia + 1);
      // Solo exigir días transcurridos hasta hoy
      if (fechaActual <= hoyStart) {
        diasEsperados.push(formatDateStr(fechaActual));
      }
    }

    const diasAdeudados = diasEsperados.filter(d => 
      !pagos.includes(d) && !pagos.includes(`${d}_ocultado`) && !pagos.includes(`${d}_reservado_ocultado`)
    );
    const totalAtraso = diasAdeudados.length;
    const montoPendiente = Math.round(totalAtraso * cuotaDiaria * 100) / 100;

    let categoria, dialog;
    if (totalAtraso === 0) {
      categoria = 'AL_DIA';
      dialog = {
        color: '#22c55e',
        icono: 'CheckCircle',
        titulo: 'Al día',
        mensaje: 'Cobro diario al día sin cuotas pendientes.',
        nivel: 'Bajo',
      };
    } else if (totalAtraso <= 3) {
      categoria = 'PENDIENTE';
      dialog = {
        color: '#eab308',
        icono: 'Clock',
        titulo: 'Pendiente diario',
        mensaje: `Debe ${totalAtraso} ${totalAtraso === 1 ? 'día' : 'días'} (${diasAdeudados.slice(-3).join(', ')}). Enviar recordatorio diario.`,
        nivel: 'Bajo',
      };
    } else if (totalAtraso <= 7) {
      categoria = 'DEUDOR_1MES';
      dialog = {
        color: '#f97316',
        icono: 'AlertTriangle',
        titulo: 'Riesgo medio',
        mensaje: `Debe ${totalAtraso} días acumulados de cuota diaria. Contactar urgente.`,
        nivel: 'Medio',
      };
    } else {
      categoria = 'DEUDOR_CRITICO';
      dialog = {
        color: '#ef4444',
        icono: 'XCircle',
        titulo: 'RIESGO CRÍTICO',
        mensaje: `Debe ${totalAtraso} días de cuota diaria (${montoPendiente.toLocaleString()} ${prestamo.moneda || 'BOB'}). Acción urgente.`,
        nivel: 'Alto',
      };
    }

    return {
      categoria,
      mesesAtraso: totalAtraso,
      mesesAdeudados: diasAdeudados,
      diasAdeudados,
      totalAtraso,
      montoPendiente,
      cuotaUnit: cuotaDiaria,
      dialog,
      diasEsperados
    };
  }

  // ── Préstamo Mensual Tradicional ──
  const interesMensual = Math.round(capital * (tasaInteres / 100));
  const mesesEsperados = [];
  let cursor = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
  const fin = prestamo.fin ? new Date(prestamo.fin) : null;
  const tope = fin && fin < hoy ? fin : hoy;
  
  while (cursor <= tope) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    mesesEsperados.push(key);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  
  const mesesAdeudados = mesesEsperados.filter(m => 
    !pagos.includes(m) && !pagos.includes(`${m}_ocultado`) && !pagos.includes(`${m}_reservado_ocultado`)
  );
  const totalAtraso = mesesAdeudados.length;
  const montoPendiente = totalAtraso * interesMensual;
  
  let categoria, dialog;
  if (totalAtraso === 0) {
    categoria = 'AL_DIA';
    dialog = {
      color: '#22c55e',
      icono: 'CheckCircle',
      titulo: 'Al día',
      mensaje: 'Cliente al día con todos sus pagos mensuales.',
      nivel: 'Bajo',
    };
  } else if (totalAtraso === 1) {
    categoria = 'PENDIENTE';
    dialog = {
      color: '#eab308',
      icono: 'Clock',
      titulo: 'Pendiente de pago',
      mensaje: `Debe el mes actual (${mesesAdeudados[0]}). Enviar recordatorio de cobro.`,
      nivel: 'Bajo',
    };
  } else if (totalAtraso === 2) {
    categoria = 'DEUDOR_1MES';
    dialog = {
      color: '#f97316',
      icono: 'AlertTriangle',
      titulo: 'Riesgo medio',
      mensaje: `Debe ${totalAtraso} meses (${mesesAdeudados.join(', ')}). Contactar urgente.`,
      nivel: 'Medio',
    };
  } else {
    categoria = 'DEUDOR_CRITICO';
    dialog = {
      color: '#ef4444',
      icono: 'XCircle',
      titulo: 'RIESGO ALTO',
      mensaje: `Debe ${totalAtraso} meses (${mesesAdeudados.join(', ')}). Evaluar acción legal o refinanciamiento.`,
      nivel: 'Alto',
    };
  }
  
  return {
    categoria,
    mesesAtraso: totalAtraso,
    mesesAdeudados,
    totalAtraso,
    montoPendiente,
    cuotaUnit: interesMensual,
    dialog,
    mesesEsperados
  };
}

/**
 * Hook que recibe el array de préstamos y devuelve objetos categorizados por nivel de riesgo.
 */
export function usePrestamoCategorias(prestamos) {
  return useMemo(() => {
    const lista = Array.isArray(prestamos) ? prestamos.filter(p => p && p.id) : [];
    
    const categorizado = lista.map(p => ({
      ...p,
      ...calcularCategoriaPrestamo(p),
    })).filter(p => p !== null);
    
    const alDia = categorizado.filter(p => p.categoria === 'AL_DIA');
    const pendientes = categorizado.filter(p => p.categoria === 'PENDIENTE');
    const deudor1Mes = categorizado.filter(p => p.categoria === 'DEUDOR_1MES');
    const deudorCritico = categorizado.filter(p => p.categoria === 'DEUDOR_CRITICO');
    const porCobrar = categorizado.filter(p => p.categoria !== 'AL_DIA');
    
    const totalPendiente = porCobrar.reduce((sum, p) => {
      return sum + (p.montoPendiente || 0);
    }, 0);
    
    return {
      alDia,
      pendientes,
      deudor1Mes,
      deudorCritico,
      porCobrar,
      todos: categorizado,
      totales: {
        alDia: alDia.length,
        pendientes: pendientes.length,
        deudor1Mes: deudor1Mes.length,
        deudorCritico: deudorCritico.length,
        totalPorCobrar: porCobrar.length,
        totalPendiente,
      }
    };
  }, [prestamos]);
}

export { calcularCategoriaPrestamo };
