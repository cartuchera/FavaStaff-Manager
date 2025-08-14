# 📧 Sistema de Notificaciones por Email - FavaStaff

## 🚀 Configuración de Emails para Bajas de Empleados

El sistema FavaStaff ahora incluye notificaciones automáticas por email cuando se procesa la baja de un empleado. Esto asegura que el departamento de sistemas sea notificado inmediatamente para tomar las acciones necesarias.

### 📋 Características Implementadas

- ✅ **Notificación automática** al procesar baja de empleado
- ✅ **Email HTML profesional** con toda la información relevante
- ✅ **Checklist de acciones** para el departamento de sistemas
- ✅ **Detección de equipos pendientes** de devolución
- ✅ **Notificaciones toast** en lugar de alerts básicos
- ✅ **Reenvío manual** de notificaciones si es necesario

### 🔧 Configuración Requerida

#### 1. Variables de Entorno (.env)

Crear un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```bash
# Configuración de Email (Gmail)
EMAIL_USER=sistemas@tuempresa.com
EMAIL_PASS=contraseña_de_aplicación_gmail
EMAIL_SISTEMAS=sistemas@tuempresa.com
EMAIL_RRHH=rrhh@tuempresa.com
FRONTEND_URL=http://localhost:3001
```

#### 2. Configuración de Gmail

Para usar Gmail como proveedor de email:

1. **Habilitar autenticación de 2 factores** en tu cuenta de Gmail
2. **Generar contraseña de aplicación**:
   - Ve a tu cuenta de Google
   - Seguridad → Contraseñas de aplicaciones
   - Genera una nueva contraseña para "Otra aplicación personalizada"
   - Usa esta contraseña en `EMAIL_PASS`

#### 3. Configuración de Otro Proveedor SMTP

Si prefieres usar otro proveedor, modifica `backend/services/emailService.js`:

```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.tudominio.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

### 📧 Flujo de Notificaciones

#### Cuando se procesa una baja:

1. **Se crea el registro** de baja en la base de datos
2. **Se desactiva el empleado** automáticamente
3. **Se cancelan reservas futuras** del empleado
4. **Se verifica equipos pendientes** de devolución
5. **Se envía email automático** a sistemas y RRHH
6. **Se muestra notificación toast** al usuario

#### Contenido del Email:

- 📋 **Información completa del empleado**
- 📅 **Detalles de la baja** (fecha, tipo, motivo)
- ⚠️ **Alertas de equipos pendientes** (si aplica)
- ✅ **Checklist de acciones** para sistemas
- 🔗 **Enlace al sistema** para más detalles

### 🛠️ API Endpoints

#### Procesar Baja (con email)
```
POST /bajas
Content-Type: application/json

{
  "empleado_id": 123,
  "fecha_baja": "2025-08-13",
  "tipo_baja": "renuncia",
  "motivo": "Cambio de trabajo",
  "observaciones": "Último día 15/08/2025"
}
```

#### Reenviar Notificación
```
POST /bajas/:bajaId/reenviar-email
```

### 🎨 Notificaciones Toast

Se reemplazaron todos los `alert()` básicos por notificaciones toast profesionales:

- ✅ **Éxito**: Verde con ícono de check
- ❌ **Error**: Rojo con ícono de error
- ⚠️ **Advertencia**: Amarillo con ícono de alerta
- ℹ️ **Información**: Azul con ícono de info
- 📧 **Email**: Gris con ícono de correo

#### Tipos específicos implementados:
- `notifyBajaCreada()` - Para confirmación de bajas
- `notifyEmailEnviado()` - Para confirmación de emails
- `notifyReservaCreada()` - Para nuevas reservas
- `notifyEstadoReserva()` - Para cambios de estado
- `notifyValidationError()` - Para errores de validación

### 🔒 Seguridad y Mejores Prácticas

- **No hardcodear credenciales** en el código
- **Usar variables de entorno** para configuración
- **Contraseñas de aplicación** en lugar de contraseñas reales
- **Validar datos** antes de enviar emails
- **Logging de eventos** para auditoría
- **Manejo de errores** sin exponer información sensible

### 🚨 Acciones que Requiere Sistemas

Cuando reciban un email de baja, el personal de sistemas debe:

1. ✅ **Desactivar cuentas** de usuario en todos los sistemas
2. ✅ **Revocar accesos** a aplicaciones corporativas
3. ✅ **Bloquear acceso** a red y VPN
4. ✅ **Recuperar equipos** asignados (notebooks, teléfonos, etc.)
5. ✅ **Transferir archivos** importantes si corresponde
6. ✅ **Actualizar directorio** corporativo
7. ✅ **Notificar a administradores** de sistemas

### 🔧 Troubleshooting

#### Email no se envía:
- Verificar variables de entorno
- Comprobar credenciales de Gmail
- Revisar logs del servidor
- Verificar conectividad a internet

#### Error de autenticación:
- Verificar que 2FA esté habilitado
- Regenerar contraseña de aplicación
- Verificar usuario y dominio

#### Emails van a spam:
- Configurar SPF/DKIM en el dominio
- Usar dirección corporativa como remitente
- Evitar palabras spam en asunto

### 📞 Soporte

Para problemas con el sistema de emails:
- Revisar logs en `backend/logs/`
- Verificar configuración en `.env`
- Contactar al administrador del sistema

---

**Desarrollado para FavaStaff - Sistema de Gestión de RRHH**  
*Versión con notificaciones automáticas por email*
