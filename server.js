const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors({
  origin: 'https://ofaros.org/',
  methods: ['GET', 'POST'], 
  allowedHeaders: ['Content-Type'], 
}));

app.use(express.json());

// Middleware para loggear cada solicitud entrante
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  console.log(`Body:`, req.body);
  next();
});

app.post('/api/send-email', async (req, res) => {
  const { email, phoneNumber, stageName, username, address, template } = req.body;

  if (!email || !template) {
    const errorMsg = 'Email and template are required.';
    console.error(`[${new Date().toISOString()}] Error: ${errorMsg}`);
    return res.status(400).send(errorMsg);
  }

  if (template === 'Artista' && (!phoneNumber || !stageName || !username)) {
    const errorMsg = 'Artistas must provide phoneNumber, stageName, and username.';
    console.error(`[${new Date().toISOString()}] Error: ${errorMsg}`, req.body);
    return res.status(400).json({ error: errorMsg, body: req.body });
  }
  
  if (template === 'Cliente' && (!phoneNumber || !address || !username)) {
    const errorMsg = 'Client must provide phoneNumber, address, and username.';
    console.error(`[${new Date().toISOString()}] Error: ${errorMsg}`, req.body);
    return res.status(400).json({ error: errorMsg, body: req.body });
  }

  const templatePath = path.join(__dirname, `${template}.html`);
  if (!fs.existsSync(templatePath)) {
    const errorMsg = 'Template not found.';
    console.error(`[${new Date().toISOString()}] Error: ${errorMsg}`);
    return res.status(404).send(errorMsg);
  }

  const htmlContent = fs.readFileSync(templatePath, 'utf-8');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'ofarosdev@gmail.com',
      pass: 'apzl oluq yczr ycxm',
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const mailOptions = {
    from: '"Ofaros" <ofarosdev@gmail.com>',
    to: email,
    subject: '¡Bienvenido a Ofaros!',
    html: htmlContent,
    attachments: [
      {
        filename: 'image.png',
        path: path.join(__dirname, 'image.png'),
        cid: 'image',
      },
    ],
  };

  let notificationHtml = `<p>Un nuevo usuario se ha registrado como <strong>${template}</strong>.</p>
                          <p>Email: ${email}</p>`;

  if (template === 'Artista') {
    notificationHtml += `<p>Nombre Artístico: ${stageName}</p>
                         <p>Nombre Natural: ${username}</p>
                         <p>Celular: ${phoneNumber}</p>`;
  }
  if (template === 'Cliente') {
    notificationHtml += `<p>Nombre de usuario: ${username}</p>
                         <p>Celular: ${phoneNumber}</p>
                         <p>Dirección: ${address}</p>`;
  }

  const notificationMailOptions = {
    from: '"Ofaros" <ofarosdev@gmail.com>',
    to: 'contacto@ofaros.org',
    subject: template === 'Artista' ? 'Nuevo registro de artista en Ofaros' : 'Nuevo registro en Ofaros',
    html: notificationHtml,
  };

  try {
    console.log(`[${new Date().toISOString()}] Sending email to ${email}...`);
    await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toISOString()}] Email sent to ${email} successfully.`);
    
    console.log(`[${new Date().toISOString()}] Sending notification email to contacto@ofaros.org...`);
    await transporter.sendMail(notificationMailOptions);
    console.log(`[${new Date().toISOString()}] Notification email sent successfully.`);

    res.send('Emails sent successfully.');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error occurred while sending emails:`, error.message || error);
    res.status(500).send('An error occurred while sending the emails.');
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`));
