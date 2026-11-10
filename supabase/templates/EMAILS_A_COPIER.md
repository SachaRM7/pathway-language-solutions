# E-mails du Campus à copier dans Supabase

Supabase → **Authentication** → **Emails** → **Templates** :
https://supabase.com/dashboard/project/ynflykxalfynxoupkxmy/auth/templates

Pour chaque modèle : remplacer le **Subject**, effacer tout le **Body** et coller le bloc HTML, puis **Save changes**.
Le logo est servi par le site (`https://pathway-languages.com/campus/email/logo.png`).

## 1. Invite user

**Subject**

```
Tu acceso al Campus Pathway
```

**Body**

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Tu acceso al Campus Pathway</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu profesor te invitó al Campus Pathway: ejercicios, repaso y simulacros entre tus clases.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f2f0;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 20px;">
      <img src="https://pathway-languages.com/campus/email/logo.png" width="148" height="42" alt="Pathway" style="display:block;border:0;width:148px;height:42px;">
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:28px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:#ffe6db;padding:32px 32px 0;border-radius:28px 28px 0 0;">
          <p style="margin:0 0 6px;font:700 13px/1.4 Arial,Helvetica,sans-serif;color:#b23f1d;letter-spacing:.02em;">CAMPUS PATHWAY</p>
          <p style="margin:0;font:800 64px/0.9 Arial,Helvetica,sans-serif;letter-spacing:-3px;color:#f05a36;">Bonjour</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font:800 26px/1.2 Arial,Helvetica,sans-serif;letter-spacing:-.5px;color:#141414;">{{ if .Data.full_name }}Hola, {{ .Data.full_name }}{{ else }}Hola{{ end }}</h1>
          <p style="margin:0 0 24px;font:400 16px/1.6 Arial,Helvetica,sans-serif;color:#5f5f66;">Tu profesor te invitó al <strong style="color:#141414;">Campus Pathway</strong>: el espacio donde practicas tu francés entre clases, a tu ritmo, hasta tu objetivo NCLC&nbsp;7.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
            <tr><td style="background:#141414;border-radius:999px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:16px 30px;font:700 16px/1 Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;border-radius:999px;">Entrar al campus &rarr;</a>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr><td style="padding:14px 18px;background:#fff2c4;border-radius:16px;font:400 15px/1.4 Arial,Helvetica,sans-serif;color:#866000;"><strong style="color:#141414;">Lecciones</strong> &middot; las unidades de tu manual, en 10 minutos</td></tr>
            <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="padding:14px 18px;background:#ebe7ff;border-radius:16px;font:400 15px/1.4 Arial,Helvetica,sans-serif;color:#5946c8;"><strong style="color:#141414;">Repaso</strong> &middot; tus errores vuelven justo a tiempo</td></tr>
            <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="padding:14px 18px;background:#dcf3e4;border-radius:16px;font:400 15px/1.4 Arial,Helvetica,sans-serif;color:#1d7a49;"><strong style="color:#141414;">Racha</strong> &middot; un poco de francés cada día</td></tr>
          </table>
          <p style="margin:0;font:400 13px/1.6 Arial,Helvetica,sans-serif;color:#9b9ba3;">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="{{ .ConfirmationURL }}" style="color:#5f5f66;word-break:break-all;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 8px 0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#9b9ba3;text-align:center;">
      Recibiste este correo porque Pathway Language Solutions te invitó a su campus.<br>
      ¿Una pregunta? Responde a este correo o escríbenos por WhatsApp.<br>
      <a href="https://pathway-languages.com/" style="color:#9b9ba3;">pathway-languages.com</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
```

## 2. Magic link or OTP

**Subject**

```
Tu enlace para entrar al Campus Pathway
```

**Body**

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Tu enlace para entrar al Campus Pathway</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu enlace y tu código para entrar al Campus Pathway. Caducan en una hora.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f2f0;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 20px;">
      <img src="https://pathway-languages.com/campus/email/logo.png" width="148" height="42" alt="Pathway" style="display:block;border:0;width:148px;height:42px;">
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:28px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:#ebe7ff;padding:32px 32px 0;border-radius:28px 28px 0 0;">
          <p style="margin:0 0 6px;font:700 13px/1.4 Arial,Helvetica,sans-serif;color:#5946c8;letter-spacing:.02em;">CAMPUS PATHWAY</p>
          <p style="margin:0;font:800 64px/0.9 Arial,Helvetica,sans-serif;letter-spacing:-3px;color:#f05a36;">Salut</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font:800 26px/1.2 Arial,Helvetica,sans-serif;letter-spacing:-.5px;color:#141414;">{{ if .Data.full_name }}Hola, {{ .Data.full_name }}{{ else }}Entra a tu campus{{ end }}</h1>
          <p style="margin:0 0 24px;font:400 16px/1.6 Arial,Helvetica,sans-serif;color:#5f5f66;">Toca el botón para entrar a tu campus. Sin contraseña.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
            <tr><td style="background:#141414;border-radius:999px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:16px 30px;font:700 16px/1 Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;border-radius:999px;">Entrar al campus &rarr;</a>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr><td style="padding:20px;background:#f6f6f5;border-radius:20px;">
              <p style="margin:0 0 8px;font:400 14px/1.5 Arial,Helvetica,sans-serif;color:#5f5f66;">¿Abriste el correo en otro dispositivo? Escribe este código en el campus:</p>
              <p style="margin:0;font:800 34px/1 'Courier New',Courier,monospace;letter-spacing:6px;color:#141414;">{{ .Token }}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 16px;font:400 14px/1.6 Arial,Helvetica,sans-serif;color:#5f5f66;">El enlace y el código caducan en una hora. Si no pediste entrar, ignora este correo: nadie puede acceder sin él.</p>
          <p style="margin:0;font:400 13px/1.6 Arial,Helvetica,sans-serif;color:#9b9ba3;">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="{{ .ConfirmationURL }}" style="color:#5f5f66;word-break:break-all;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 8px 0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#9b9ba3;text-align:center;">
      Pathway Language Solutions · <a href="https://pathway-languages.com/" style="color:#9b9ba3;">pathway-languages.com</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
```
