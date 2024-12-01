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

app.post('/api/send-email', async (req, res) => {
  const { email, template } = req.body;

  if (!email || !template) {
    return res.status(400).send('Email and template are required.');
  }

  const templatePath = path.join(__dirname, `${template}.html`);
  if (!fs.existsSync(templatePath)) {
    return res.status(404).send('Template not found.');
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

  const notificationMailOptions = {
    from: '"Ofaros" <ofarosdev@gmail.com>',
    to: 'contacto@ofaros.org',
    subject: 'Nuevo registro en Ofaros',
    html: `<p>Un nuevo usuario se ha registrado como <strong>${template}</strong>.</p>
           <p>Email: ${email}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(notificationMailOptions);
    res.send('Emails sent successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while sending the emails.');
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
