
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Genera un PDF profesional de factura/recibo para Sovereign OS
 * @param {Object} client - Datos del cliente
 * @param {Object} meeting - Datos de la sesión/proyecto
 * @param {Object} item - Hito de pago específico
 * @param {string} studioName - Nombre del estudio
 */
export const generateSovereignInvoice = (client, meeting, item, studioName = 'Sync Pro Studio') => {
  const doc = new jsPDF();
  const accentColor = [245, 158, 11]; // Amber 500

  // --- HEADER: ESTILO EJECUTIVO ---
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(studioName.toUpperCase(), 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('RECIBO DE PRODUCCIÓN ÉLITE', 20, 32);

  // Fecha y Número de Factura
  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.setTextColor(255, 255, 255);
  doc.text(`FECHA: ${dateStr}`, 150, 25);
  doc.text(`ID: #${Math.floor(1000 + Math.random() * 9000)}`, 150, 32);

  // --- INFO DEL CLIENTE ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURADO A:', 20, 60);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(client.nombre_completo || client.nombre, 20, 68);
  doc.text(client.empresa || 'Cliente Individual', 20, 74);
  doc.text(client.email || '', 20, 80);
  doc.text(client.pais || '', 20, 86);

  // --- TABLA DE CONCEPTOS ---
  const tableData = [
    [
      meeting.categoria || 'Producción de Video',
      item.label || 'Hito de Pago',
      '1',
      `${item.monto} ${item.currency || 'USD'}`,
      `${item.monto} ${item.currency || 'USD'}`
    ]
  ];

  doc.autoTable({
    startY: 100,
    head: [['CONCEPTO', 'DESCRIPCIÓN', 'CANT.', 'PRECIO', 'TOTAL']],
    body: tableData,
    headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 6 },
    columnStyles: {
      4: { fontStyle: 'bold', halign: 'right' }
    }
  });

  // --- TOTALES ---
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL A PAGAR:', 140, finalY + 10);
  doc.setFontSize(16);
  doc.setTextColor(...accentColor);
  doc.text(`${item.monto} ${item.currency || 'USD'}`, 140, finalY + 20);

  // --- MÉTODOS DE PAGO ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MÉTODOS DE PAGO:', 20, finalY + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('• Transferencia Bancaria / QR', 20, finalY + 18);
  doc.text('• PayPal / Global Payments', 20, finalY + 23);
  doc.text('• USDT (TRC20)', 20, finalY + 28);

  // --- FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Gracias por confiar en el sistema de producción Sovereign OS.', 105, 285, { align: 'center' });

  // Descargar el PDF
  const filename = `Recibo_${client.nombre.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};
