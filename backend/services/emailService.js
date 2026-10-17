/**
 * Servicio de Envío de Correos Electrónicos - CineRewind
 * Soporta Resend (API REST oficial) con fallback para entorno de pruebas/desarrollo.
 */

const generarPlantillaRecuperacionHTML = ({ nombre, urlRestablecimiento }) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña · CineRewind</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0c10;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e4e4e7;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0c10;
      padding: 40px 10px;
    }
    .card {
      max-width: 540px;
      margin: 0 auto;
      background-color: #14141d;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      padding: 36px 32px 20px;
      text-align: center;
      background: linear-gradient(180deg, rgba(225, 29, 72, 0.08) 0%, transparent 100%);
    }
    .logo-container {
      display: inline-block;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin: 0;
    }
    .brand-title span {
      color: #f43f5e;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 4px 0 0;
      font-weight: 600;
    }
    .content {
      padding: 24px 36px 36px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .text {
      font-size: 14px;
      color: #d4d4d8;
      margin: 0 0 24px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb923c 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 800;
      padding: 14px 32px;
      border-radius: 14px;
      letter-spacing: 0.2px;
      box-shadow: 0 8px 24px rgba(225, 29, 72, 0.35);
    }
    .security-note {
      font-size: 12px;
      color: #71717a;
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 14px;
      margin-top: 24px;
      line-height: 1.5;
    }
    .footer {
      padding: 20px 36px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      background-color: #0e0f15;
      font-size: 11px;
      color: #71717a;
    }
    .footer a {
      color: #f43f5e;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-container">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="84" height="84" rx="24" fill="#181824" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
            <path d="M48 30L26 50L48 70V58L39 50L48 42V30Z" fill="#F43F5E"/>
            <path d="M72 30L50 50L72 70V58L63 50L72 42V30Z" fill="#FB923C"/>
          </svg>
        </div>
        <h1 class="brand-title">Cine<span>Rewind</span></h1>
        <p class="brand-subtitle">Tu Diario Cinematográfico</p>
      </div>

      <div class="content">
        <div class="greeting">¡Hola, ${nombre || 'Cinéfilo'}! 🍿</div>
        <p class="text">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en CineRewind.
          Haz clic en el siguiente botón para elegir una nueva contraseña:
        </p>

        <div class="button-container">
          <a href="${urlRestablecimiento}" target="_blank" class="btn">Restablecer mi Contraseña</a>
        </div>

        <p class="text" style="font-size: 12px; color: #a1a1aa;">
          O copia y pega este enlace directamente en tu navegador:<br>
          <a href="${urlRestablecimiento}" style="color: #f43f5e; word-break: break-all;">${urlRestablecimiento}</a>
        </p>

        <div class="security-note">
          ⏱ <strong>Este enlace es válido durante 1 hora.</strong><br>
          Si tú no solicitaste este cambio, puedes ignorar este mensaje con total tranquilidad. Tu cuenta y tu contraseña actual siguen totalmente seguras.
        </div>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} CineRewind · Tu diario de películas y series.<br>
        Enviado automáticamente por el sistema de seguridad.
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Enviar correo de recuperación de contraseña
 * @param {Object} params
 * @param {string} params.destinatario - Correo del usuario
 * @param {string} params.nombre - Nombre del usuario
 * @param {string} params.token - Token único generado
 */
const enviarEmailRecuperacion = async ({ destinatario, nombre, token }) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const urlRestablecimiento = `${baseUrl}/restablecer-password?token=${encodeURIComponent(token)}`;
  const htmlContenido = generarPlantillaRecuperacionHTML({ nombre, urlRestablecimiento });

  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. MODO REAL: Si hay clave configurada de Resend
  if (resendApiKey) {
    try {
      const remitente = process.env.EMAIL_FROM || 'CineRewind <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: remitente,
          to: [destinatario],
          subject: 'Restablece tu contraseña · CineRewind',
          html: htmlContenido
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('[Resend Error]:', data);
        throw new Error(data.message || 'Error al enviar correo mediante Resend');
      }

      console.log(`[Email Service] Correo de recuperación enviado a ${destinatario} con ID:`, data.id);
      return { success: true, proveedor: 'resend', id: data.id };
    } catch (error) {
      console.error('[Email Service Error]:', error.message);
      throw error;
    }
  }

  // 2. MODO PRUEBAS / DESARROLLO LOCAL:
  // Si aún no se colocó la API Key, el enlace se imprime en consola y se devuelve para testear al instante
  console.log('\n============================================================');
  console.log('📬 [EMAIL SERVICE - MODO DESARROLLO / PRUEBAS]');
  console.log(`Para: ${destinatario} (${nombre})`);
  console.log('Asunto: Restablece tu contraseña · CineRewind');
  console.log(`🔗 Enlace generado para probar:`);
  console.log(`👉 ${urlRestablecimiento}`);
  console.log('============================================================\n');

  return {
    success: true,
    proveedor: 'simulado_local',
    enlacePrueba: urlRestablecimiento
  };
};

module.exports = {
  enviarEmailRecuperacion
};
