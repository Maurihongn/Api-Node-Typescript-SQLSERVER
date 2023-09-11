import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: process.env.EMAILADMIN,
    pass: process.env.EMAILADMINPASS,
  },
  tls: {
    rejectUnauthorized: false, // Deshabilitar la verificación del certificado
  },
});

transporter.verify().then(() => {
  console.log('Ready for send emails');
});

// export const sendEmail = async (
//   to: string,
//   subject: string,
//   html: string
// ): Promise<void> => {
//   await transporter.sendMail({
//     from: `"Fred Foo  ▷" <${process.env.EMAILADMIN}>`,
//     to,
//     subject,
//     html,
//   });
// }

interface EmailData {
  from: string | undefined;
  to: string;
  subject: string;
  html: string;
}
export const sendEmail = async (data: EmailData): Promise<void> => {
  await transporter.sendMail(data, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
    return info.response;
  });
};
