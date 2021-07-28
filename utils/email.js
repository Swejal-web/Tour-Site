const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Swejal Shrestha <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      //we user maiptrap instead of gmail
      //it does not send actual emails to the user but traps the emails in mailtrap
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      //ACtivate in gmail "less secure app" option
    });
  }

  // send the actual email
  async send(template, subject) {
    // 1) Render HTML based on pug template
    const html = pug.renderFile(
      `${__dirname}/../Views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    ); //this will render the file in html

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText.fromString(html), //converts html to text
    };

    // 3) Create a transport and send email
    this.newTransport();
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the Natours Family'); //since send is an async function we have to wait for it to complete first
    //so we use async
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token invalid for only 10 min'
    );
  }
};

//const sendEmail = async (options) => {
//------- 1) Create a transporter
// const transporter = nodemailer.createTransport({
//-------we user maiptrap instead of gmail
//---------it does not send actual emails to the user but traps the emails in mailtrap
// host: process.env.EMAIL_HOST,
// port: process.env.EMAIL_PORT,
// auth: {
//   user: process.env.EMAIL_USERNAME,
//   pass: process.env.EMAIL_PASSWORD,
// },
//--------ACtivate in gmail "less secure app" option
//});

//----------------- 2) Define the email option

// const mailOptions = {
//   from: 'Swejal Shrestha <swejalshrestha08@gmail.com>',
//   to: options.email,
//   subject: options.subject,
//   text: options.message,
// };

//----------- 3) Actually sends email
//await transporter.sendMail(mailOptions); //-------------sendmail returns a promise
//};

//module.exports = sendEmail;
