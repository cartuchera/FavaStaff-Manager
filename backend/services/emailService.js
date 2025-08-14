const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración del transportador de email
const createTransporter = () => {
  // Configuración para Gmail (puedes cambiar por otro proveedor)
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // email del sistema
      pass: process.env.EMAIL_PASS  // contraseña de aplicación
    }
  });

  return transporter;
};

// Función para enviar email de notificación de baja
const enviarNotificacionBaja = async (empleadoData, bajaData) => {
  try {
    const transporter = createTransporter();

    // Destinatarios (pueden ser múltiples)
    const destinatarios = [
      process.env.EMAIL_SISTEMAS, // Email de sistemas
      process.env.EMAIL_RRHH      // Email de RRHH
    ].filter(email => email); // Filtrar emails que no estén definidos

    if (destinatarios.length === 0) {
      console.warn('No hay destinatarios configurados para notificaciones de baja');
      return false;
    }

    // Template del email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 5px; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .tipo-baja { padding: 5px 10px; border-radius: 20px; color: white; font-weight: bold; }
          .tipo-renuncia { background-color: #17a2b8; }
          .tipo-despido { background-color: #dc3545; }
          .tipo-jubilacion { background-color: #6f42c1; }
          .tipo-defuncion { background-color: #343a40; }
          .tipo-otros { background-color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 FavaStaff - Notificación de Baja de Empleado</h1>
            <p>Sistema de Gestión de Recursos Humanos</p>
          </div>
          
          <div class="content">
            <div class="alert">
              <strong>⚠️ ATENCIÓN:</strong> Se ha procesado una baja de empleado en el sistema.
            </div>

            <div class="info-box">
              <h3>📋 Información del Empleado</h3>
              <p><strong>Nombre:</strong> ${empleadoData.nombre} ${empleadoData.apellido}</p>
              <p><strong>DNI:</strong> ${empleadoData.dni}</p>
              <p><strong>Legajo:</strong> ${empleadoData.numero_legajo}</p>
              <p><strong>Puesto:</strong> ${empleadoData.puesto || 'No especificado'}</p>
              <p><strong>Sector:</strong> ${empleadoData.sector || 'No especificado'}</p>
            </div>

            <div class="info-box">
              <h3>📅 Detalles de la Baja</h3>
              <p><strong>Fecha de Baja:</strong> ${new Date(bajaData.fecha_baja).toLocaleDateString('es-ES')}</p>
              <p><strong>Tipo de Baja:</strong> 
                <span class="tipo-baja tipo-${bajaData.tipo_baja}">${bajaData.tipo_baja.toUpperCase()}</span>
              </p>
              <p><strong>Motivo:</strong> ${bajaData.motivo}</p>
              ${bajaData.observaciones ? `<p><strong>Observaciones:</strong> ${bajaData.observaciones}</p>` : ''}
              <p><strong>Procesado el:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>

            <div class="alert">
              <h4>🔧 Acciones Requeridas para Sistemas:</h4>
              <ul>
                <li>✅ Desactivar cuentas de usuario en todos los sistemas</li>
                <li>✅ Revocar accesos a aplicaciones corporativas</li>
                <li>✅ Bloquear acceso a red y VPN</li>
                <li>✅ Recuperar equipos asignados (notebooks, teléfonos, etc.)</li>
                <li>✅ Transferir archivos importantes si corresponde</li>
                <li>✅ Actualizar directorio corporativo</li>
                <li>✅ Notificar a administradores de sistemas</li>
              </ul>
            </div>

            <div class="info-box">
              <p><strong>📞 Contacto:</strong> Si necesita más información, contacte al departamento de RRHH.</p>
              <p><strong>🔗 Sistema:</strong> Acceda al <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}">FavaStaff</a> para más detalles.</p>
            </div>
          </div>

          <div class="footer">
            <p>Este es un mensaje automático del sistema FavaStaff - No responder a este email</p>
            <p>© ${new Date().getFullYear()} Sistema de Gestión de RRHH</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      NOTIFICACIÓN DE BAJA DE EMPLEADO - FavaStaff

      EMPLEADO:
      - Nombre: ${empleadoData.nombre} ${empleadoData.apellido}
      - DNI: ${empleadoData.dni}
      - Legajo: ${empleadoData.numero_legajo}
      - Puesto: ${empleadoData.puesto || 'No especificado'}

      DETALLES DE LA BAJA:
      - Fecha: ${new Date(bajaData.fecha_baja).toLocaleDateString('es-ES')}
      - Tipo: ${bajaData.tipo_baja.toUpperCase()}
      - Motivo: ${bajaData.motivo}
      ${bajaData.observaciones ? `- Observaciones: ${bajaData.observaciones}` : ''}

      ACCIONES REQUERIDAS PARA SISTEMAS:
      - Desactivar cuentas de usuario
      - Revocar accesos a aplicaciones
      - Bloquear acceso a red y VPN
      - Recuperar equipos asignados
      - Actualizar directorio corporativo

      Sistema FavaStaff - ${new Date().toLocaleString('es-ES')}
    `;

    // Configuración del email
    const mailOptions = {
      from: `"FavaStaff - Sistema RRHH" <${process.env.EMAIL_USER}>`,
      to: destinatarios.join(', '),
      subject: `🚨 BAJA DE EMPLEADO - ${empleadoData.apellido}, ${empleadoData.nombre} - Legajo ${empleadoData.numero_legajo}`,
      text: textContent,
      html: htmlContent,
      priority: 'high'
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de notificación de baja enviado:', info.messageId);
    console.log('📧 Destinatarios:', destinatarios.join(', '));
    
    return {
      success: true,
      messageId: info.messageId,
      destinatarios: destinatarios
    };

  } catch (error) {
    console.error('❌ Error al enviar email de notificación de baja:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para enviar email de recordatorio de equipos pendientes
const enviarRecordatorioEquipos = async (empleadoData, equiposPendientes) => {
  try {
    const transporter = createTransporter();

    const destinatarios = [
      process.env.EMAIL_SISTEMAS,
      process.env.EMAIL_RRHH
    ].filter(email => email);

    if (destinatarios.length === 0) {
      console.warn('No hay destinatarios configurados para recordatorios de equipos');
      return false;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff7b7b 0%, #ff6b6b 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .equipment-list { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ RECORDATORIO - Equipos Pendientes de Devolución</h1>
          </div>
          
          <div class="content">
            <div class="warning">
              <strong>ATENCIÓN:</strong> El empleado ${empleadoData.nombre} ${empleadoData.apellido} (Legajo: ${empleadoData.numero_legajo}) 
              tiene equipos pendientes de devolución.
            </div>

            <div class="equipment-list">
              <h3>📋 Equipos Pendientes:</h3>
              ${equiposPendientes.map(equipo => `
                <p>• ${equipo.nombre} - ${equipo.codigo_equipo} (${equipo.marca})</p>
              `).join('')}
            </div>

            <p><strong>Por favor, gestionar la devolución de estos equipos antes de completar el proceso de baja.</strong></p>
          </div>

          <div class="footer">
            <p>Sistema FavaStaff - Notificación Automática</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"FavaStaff - Sistema RRHH" <${process.env.EMAIL_USER}>`,
      to: destinatarios.join(', '),
      subject: `⚠️ EQUIPOS PENDIENTES - ${empleadoData.apellido}, ${empleadoData.nombre}`,
      html: htmlContent,
      priority: 'high'
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error al enviar recordatorio de equipos:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  enviarNotificacionBaja,
  enviarRecordatorioEquipos
};
