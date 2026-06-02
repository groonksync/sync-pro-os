import { jsPDF } from 'jspdf';

export function generarComprobantePDF({ prestamo, cuotaInfo, tipo = 'mensual' }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const left = 20;
  const right = pageW - left;
  const top = 30;
  const primary = '#1e3a5f';

  // Línea decorativa superior
  doc.setDrawColor(primary);
  doc.setLineWidth(0.6);
  doc.line(left, 22, right, 22);

  // Título
  doc.setTextColor(primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('COMPROBANTE DE PAGO', pageW / 2, top, { align: 'center' });

  // N° comprobante
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#666');
  const numRef = `N° ${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*999)).padStart(3,'0')}`;
  doc.text(numRef, pageW / 2, top + 7, { align: 'center' });

  // Separador
  doc.setDrawColor('#ddd');
  doc.setLineWidth(0.3);
  doc.line(left, top + 12, right, top + 12);

  let y = top + 20;

  // Datos del prestatario
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primary);
  doc.text('PRESTATARIO', left, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#333');
  doc.text(`Nombre:   ${prestamo.nombre || '—'}`, left + 2, y);
  y += 5;
  doc.text(`CI:            ${prestamo.ci || '—'}`, left + 2, y);
  y += 5;
  doc.text(`Teléfono:  ${prestamo.telefono || '—'}`, left + 2, y);
  y += 10;

  // Línea separadora
  doc.setDrawColor('#eee');
  doc.line(left, y, right, y);
  y += 6;

  // Detalle del pago
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primary);
  doc.text('DETALLE DEL PAGO', left, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#333');

  const fechaPago = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  let concepto = '';
  let interesPuro = cuotaInfo.interes || 0;
  let capitalParte = cuotaInfo.capital || 0;
  let totalPago = cuotaInfo.total || 0;

  if (tipo === 'diario') {
    concepto = `Pago diario — Día ${cuotaInfo.diaActual || '—'} de ${cuotaInfo.totalDias || '—'}`;
  } else {
    concepto = `Pago de cuota — ${cuotaInfo.label || '—'}`;
  }

  const campos = [
    ['Concepto:', concepto],
    ['Fecha de pago:', fechaPago],
    ['Modalidad:', tipo === 'diario' ? 'Diario con Amortización' : 'Mensual (Interés)'],
  ];

  campos.forEach(([l, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(l, left + 2, y);
    const lw = doc.getTextWidth(l);
    doc.setFont('helvetica', 'normal');
    doc.text(v, left + 2 + lw + 2, y);
    y += 5;
  });

  y += 3;

  // Tabla de montos
  const montos = [];
  if (tipo === 'diario') {
    montos.push(['Capital del día', `${capitalParte.toFixed(2)} ${prestamo.moneda || 'BOB'}`]);
    montos.push(['Interés del día', `${interesPuro.toFixed(2)} ${prestamo.moneda || 'BOB'}`]);
  } else {
    montos.push(['Interés', `${interesPuro.toFixed(2)} ${prestamo.moneda || 'BOB'}`]);
  }

  if (cuotaInfo.mora > 0) {
    montos.push(['Mora', `${cuotaInfo.mora.toFixed(2)} ${prestamo.moneda || 'BOB'}`]);
  }

  doc.setDrawColor('#ddd');
  doc.line(left, y, right, y);
  y += 3;

  montos.forEach(([l, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#333');
    doc.text(l, left + 2, y);
    doc.text(v, right - 2, y, { align: 'right' });
    y += 6;
  });

  // Total
  doc.setDrawColor(primary);
  doc.setLineWidth(0.5);
  doc.line(left, y, right, y);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primary);
  doc.text('TOTAL PAGADO:', left + 2, y);
  doc.text(`${totalPago.toFixed(2)} ${prestamo.moneda || 'BOB'}`, right - 2, y, { align: 'right' });
  y += 8;

  // Saldo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#333');
  doc.line(left, y, right, y);
  y += 3;

  if (tipo === 'diario') {
    doc.text('Capital amortizado:', left + 2, y);
    doc.text(`${(cuotaInfo.capitalAmortizado || 0).toFixed(2)} ${prestamo.moneda || 'BOB'}`, right - 2, y, { align: 'right' });
    y += 5;
    doc.text('Capital restante:', left + 2, y);
    doc.text(`${(cuotaInfo.capitalRestante || 0).toFixed(2)} ${prestamo.moneda || 'BOB'}`, right - 2, y, { align: 'right' });
  } else {
    doc.text('Saldo capital:', left + 2, y);
    doc.text(`${(parseFloat(prestamo.capital) || 0).toFixed(2)} ${prestamo.moneda || 'BOB'}`, right - 2, y, { align: 'right' });
  }
  y += 5;

  if (cuotaInfo.proximoVencimiento) {
    doc.text('Próximo vencimiento:', left + 2, y);
    doc.text(cuotaInfo.proximoVencimiento, right - 2, y, { align: 'right' });
    y += 5;
  }

  if (tipo === 'diario' && cuotaInfo.progreso) {
    doc.text('Progreso:', left + 2, y);
    doc.text(cuotaInfo.progreso, right - 2, y, { align: 'right' });
    y += 5;
  }

  y += 6;

  // Mensaje final
  doc.setDrawColor('#22c55e');
  doc.setLineWidth(0.4);
  doc.line(left, y, right, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor('#22c55e');
  doc.text('✅ Pagado — Gracias por tu pago', pageW / 2, y, { align: 'center' });
  y += 8;

  // Fecha de emisión
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#999');
  const emitido = new Date().toLocaleString('es-ES');
  doc.text(`Emitido: ${emitido}`, pageW / 2, y, { align: 'center' });

  // Línea decorativa inferior
  doc.setDrawColor(primary);
  doc.setLineWidth(0.6);
  y += 4;
  doc.line(left, y, right, y);

  const fileName = `comprobante_${prestamo.nombre?.replace(/ /g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}