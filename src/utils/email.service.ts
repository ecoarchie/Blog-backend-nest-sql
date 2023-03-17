import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity';

dotenv.config();

@Injectable()
export class EmailService {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'app.cronosport@gmail.com',
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  async sendEmailConfirmationMessage(user: Partial<User>) {
    const info = await this.transporter.sendMail({
      from: 'BlogPost <app.cronosport.gmail.com>',
      to: user.email,
      subject: 'Email confirmation',
      html: `<h1>Thank for your registration</h1><p>To finish registration please follow the link below: <a href='https://somesite.com/confirm-email?code=${user.confirmationCode}'>complete registration</a> </p>`,
    });
  }

  async sendPasswordRecoveryMessage(user: Partial<User>) {
    const info = await this.transporter.sendMail({
      from: 'BlogPost <app.cronosport.gmail.com>',
      to: user.email,
      subject: 'Password Recovery',
      html: `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href='https://somesite.com/password-recovery?recoveryCode=${user.passwordRecoveryCode}'>recovery password</a>
      </p>`,
    });
  }
}
