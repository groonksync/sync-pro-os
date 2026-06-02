export function useWhatsApp() {
  const QR_IMAGE_PATH = '/assets/qr_pago.png';

  function limpiarTelefono(tel) {
    return tel.replace(/[^\d]/g, '');
  }

  function generarLink(telefono, mensaje) {
    const tel = limpiarTelefono(telefono);
    const encoded = encodeURIComponent(mensaje);
    return `https://wa.me/${tel}?text=${encoded}`;
  }

  async function copiarAlPortapapeles(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }

  function abrirWhatsApp(url) {
    window.open(url, '_blank');
  }

  // ─── RECORDATORIO MENSUAL ───
  function mensajeRecordatorioMensual(prestamo, cuota) {
    const fechaVenc = cuota?.fechaVencimiento
      ? new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES', {
          day: '2-digit', month: 'long', year: 'numeric'
        })
      : '—';
    const diasRestantes = cuota?.diasAtraso !== undefined ? Math.abs(cuota.diasAtraso) : '—';

    return (
      `🔔 RECORDATORIO DE PAGO\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hola ${prestamo.nombre},\n\n` +
      `Te recordamos que tu cuota está próxima a vencer.\n\n` +
      `👤 Prestatario: ${prestamo.nombre}\n` +
      `📅 Vence: ${fechaVenc} (${diasRestantes} días)\n` +
      `💰 Monto: ${cuota?.total || '—'} ${prestamo.moneda || 'BOB'}\n` +
      `📊 Capital: ${prestamo.capital} ${prestamo.moneda || 'BOB'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏦 Deposita en:\n${prestamo.cuenta_bancaria || 'Cuenta no configurada'}\n\n` +
      `📸 QR para depósito adjunto (ya está en tu portapapeles)\n\n` +
      `⚠️ Evita mora del 5% diario`
    );
  }

  function enviarRecordatorioMensual(prestamo, cuota) {
    const msg = mensajeRecordatorioMensual(prestamo, cuota);
    copiarAlPortapapeles(`📸 QR para depósito: ${window.location?.origin || ''}${QR_IMAGE_PATH}`);
    const link = generarLink(prestamo.telefono, msg);
    abrirWhatsApp(link);
  }

  // ─── RECORDATORIO DIARIO ───
  function mensajeRecordatorioDiario(prestamo, cuotaDiaria, diaActual, totalDias, saldo) {
    const hoy = new Date().toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
      `🔔 RECORDATORIO PAGO DIARIO\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hola ${prestamo.nombre},\n\n` +
      `Hoy tienes una cuota pendiente.\n\n` +
      `📅 Fecha: ${hoy}\n` +
      `💰 Cuota de hoy: ${cuotaDiaria.toFixed(2)} ${prestamo.moneda || 'BOB'}\n` +
      `📊 Día ${diaActual} de ${totalDias}\n` +
      `📉 Saldo restante: ${saldo.toFixed(2)} ${prestamo.moneda || 'BOB'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏦 Deposita en:\n${prestamo.cuenta_bancaria || 'Cuenta no configurada'}\n\n` +
      `📸 QR adjunto (ya está en tu portapapeles)`
    );
  }

  function enviarRecordatorioDiario(prestamo, cuotaDiaria, diaActual, totalDias, saldo) {
    const msg = mensajeRecordatorioDiario(prestamo, cuotaDiaria, diaActual, totalDias, saldo);
    copiarAlPortapapeles(`📸 QR para depósito: ${window.location?.origin || ''}${QR_IMAGE_PATH}`);
    const link = generarLink(prestamo.telefono, msg);
    abrirWhatsApp(link);
  }

  // ─── COMPROBANTE DE PAGO ───
  function mensajeComprobante(prestamo, cuotaInfo) {
    const hoy = new Date().toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
      `✅ COMPROBANTE DE PAGO\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hola ${prestamo.nombre},\n\n` +
      `Hemos recibido tu pago correctamente.\n\n` +
      `💰 Monto pagado: ${cuotaInfo.total.toFixed(2)} ${prestamo.moneda || 'BOB'}\n` +
      `📅 Fecha: ${hoy}\n` +
      `📌 Período: ${cuotaInfo.label || '—'}\n` +
      `📉 Saldo restante: ${(cuotaInfo.capitalRestante ?? parseFloat(prestamo.capital) ?? 0).toFixed(2)} ${prestamo.moneda || 'BOB'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ ¡Gracias por tu puntualidad!\n\n` +
      `*Recibiste este comprobante generado automáticamente.*`
    );
  }

  function enviarComprobante(prestamo, cuotaInfo) {
    const msg = mensajeComprobante(prestamo, cuotaInfo);
    const link = generarLink(prestamo.telefono, msg);
    abrirWhatsApp(link);
  }

  return {
    enviarRecordatorioMensual,
    enviarRecordatorioDiario,
    enviarComprobante,
    copiarAlPortapapeles,
    generarLink,
    QR_IMAGE_PATH,
  };
}

export default useWhatsApp;