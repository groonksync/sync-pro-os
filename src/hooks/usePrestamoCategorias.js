import { useMemo } from 'react';

/**
 * Calcula la categoría de riesgo de un préstamo basado en su historial de pagos.
 *
 * @param {Object} prestamo - Datos del préstamo
 * @returns {{ categoria: string, mesesAtraso: number, mesesAdeudados: string[], dialog: object }} Resultado de categorización
 */
function calcularCategoriaPrestamo(prestamo) {
  if (!prestamo?.inicio) return null;
  
  const pagos = Array.isArray(prestamo.pagos) ? prestamo.pagos : [];
  const hoy = new Date();
  const inicio = new Date(prestamo.inicio);
  if (isNaN(inicio.getTime())) return null;
  
  // Generar todos los meses esperados desde el primer pago (1 mes después del inicio) hasta hoy
  const mesesEsperados = [];
  let cursor = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
  const fin = prestamo.fin ? new Date(prestamo.fin) : null;
  const tope = fin && fin < hoy ? fin : hoy;
  
  while (cursor <= tope) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    mesesEsperados.push(key);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  
  // Meses que debería haber pagado pero no están en pagos[]
  const mesesAdeudados = mesesEsperados.filter(m => !pagos.includes(m));
  const totalAtraso = mesesAdeudados.length;
  
  // Determinar categoría
  let categoria, dialog;
  if (totalAtraso === 0) {
    categoria = 'AL_DIA';
    dialog = {
      color: '#22c55e',
      icono: 'CheckCircle',
      titulo: 'Sin novedades',
      mensaje: 'Cliente al día con todos sus pagos.',
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
  
  return { categoria, mesesAtraso: totalAtraso, mesesAdeudados, dialog, mesesEsperados };
}

/**
 * Hook que recibe el array de préstamos y devuelve objetos categorizados por nivel de riesgo.
 *
 * @param {Array} prestamos - Lista de préstamos desde data.prestamos
 * @returns {{
 *   alDia: Array,
 *   pendientes: Array,
 *   deudor1Mes: Array,
 *   deudorCritico: Array,
 *   todos: Array,
 *   totales: { alDia: number, pendientes: number, deudor1Mes: number, deudorCritico: number, totalPendiente: number }
 * }}
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
      const cap = parseFloat(p.capital) || 0;
      const int = parseFloat(p.interes) || 0;
      return sum + (cap * (int / 100));
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
