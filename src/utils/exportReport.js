/**
 * Utilidad de exportación para el CommandCenter v2.
 * Requiere: jsPDF + jspdf-autotable (ya instalados)
 */

/**
 * Exporta la tabla de cobros como CSV.
 * @param {Array} cobros - Array de objetos con datos del préstamo categorizado
 * @param {string} periodo - Período seleccionado (ej: '2026-05')
 */
export function exportCobrosCSV(cobros, periodo = '') {
  const headers = ['Prestamista', 'Categoría', 'Fecha Cobro', 'Capital', 'Interés %', 'Pago Mensual', 'Moneda', 'Meses Adeudados', 'Nivel Riesgo'];
  
  const rows = cobros.map(c => [
    c.nombre || 'Sin nombre',
    c.categoria || 'N/A',
    c.inicio ? new Date(c.inicio).toLocaleDateString('es-ES') : 'N/A',
    parseFloat(c.capital || 0).toFixed(2),
    parseFloat(c.interes || 0).toFixed(2),
    (parseFloat(c.capital || 0) * (parseFloat(c.interes || 0) / 100)).toFixed(2),
    c.moneda || 'Bs',
    (c.mesesAdeudados || []).join('; '),
    c.dialog?.nivel || 'N/A',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Cobros_${periodo || 'reporte'}_${new Date().toISOString().split('T')[0]}.csv`;
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta los productos con stock bajo como CSV.
 * @param {Array} stockBajo - Array de productos con stock <= 5
 */
export function exportStockBajoCSV(stockBajo) {
  const headers = ['Producto', 'Stock Actual', 'Precio', 'Valor Total', 'Categoría'];
  
  const rows = stockBajo.map(p => [
    p.nombre || 'Sin nombre',
    parseInt(p.stock_actual || p.stock || 0),
    parseFloat(p.precio_venta || p.precio || 0).toFixed(2),
    (parseInt(p.stock_actual || p.stock || 0) * parseFloat(p.precio_venta || p.precio || 0)).toFixed(2),
    p.categoria || 'General',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Stock_Bajo_${new Date().toISOString().split('T')[0]}.csv`;
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta un reporte PDF ejecutivo con KPIs y tabla de cobros.
 * @param {Object} estado - Estado completo del CommandCenter
 */
export async function exportPDF(estado) {
  try {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    const doc = new jsPDF();
    const accentColor = [245, 158, 11]; // Amber
    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // --- HEADER ---
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CENTRO DE CONTROL', 20, 22);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(`Reporte Ejecutivo - ${fechaStr}`, 20, 32);
    doc.text(`Sovereign OS`, 180, 32, { align: 'right' });
    
    // --- KPIs ---
    const { totalCapital, totalInteresMensual, valorInventario, totalPendiente, stockBajoCount, mesActual } = estado;
    
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 55, 80, 25, 'F');
    doc.rect(105, 55, 80, 25, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CAPITAL ACTIVO', 25, 63);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(totalCapital || 0).toLocaleString()} Bs`, 25, 75);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('RENDIMIENTO MENSUAL', 110, 63);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`+${(totalInteresMensual || 0).toLocaleString()} Bs`, 110, 75);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 85, 80, 25, 'F');
    doc.rect(105, 85, 80, 25, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR INVENTARIO', 25, 93);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(valorInventario || 0).toLocaleString()} Bs`, 25, 105);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('COBROS PENDIENTES', 110, 93);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(totalPendiente || 0).toLocaleString()} Bs`, 110, 105);
    
    // --- TABLA DE COBROS ---
    const cobros = estado.porCobrar || [];
    
    if (cobros.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('COBROS PENDIENTES', 20, 130);
      
      const tableData = cobros.map(c => [
        c.nombre || 'Sin nombre',
        c.categoria || 'N/A',
        c.inicio ? new Date(c.inicio).toLocaleDateString('es-ES') : 'N/A',
        `${(parseFloat(c.capital || 0) * (parseFloat(c.interes || 0) / 100)).toFixed(0)} Bs`,
        c.dialog?.nivel || 'N/A',
      ]);
      
      doc.autoTable({
        startY: 135,
        head: [['Prestamista', 'Categoría', 'Inicio', 'Cuota Mensual', 'Riesgo']],
        body: tableData,
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          4: { fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    }
    
    // --- FOOTER ---
    const footerY = doc.lastAutoTable?.finalY + 15 || 180;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado automáticamente por Sovereign OS CommandCenter - ${fechaStr}`, 105, footerY, { align: 'center' });
    doc.text(`${cobros.length} cobros pendientes • ${estado.stockBajoCount || 0} productos con stock bajo`, 105, footerY + 6, { align: 'center' });
    
    const filename = `Reporte_CC_${fechaStr.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
    
  } catch (e) {
    console.error('Error al exportar PDF:', e);
    alert('Error al generar PDF: ' + e.message);
  }
}
