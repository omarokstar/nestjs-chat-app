import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
    ) { }

    public async sendLoginMail(email: string, username: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: "Login successful",
                template: "login",
                context: {
                    username: username,
                },
            });
            console.log("Login email sent successfully");

        } catch (error) {
            throw error;
        }

    }

    async sendEmailVerification(email: string, url: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: "Email Verification",
                template: "verifyEmail",
                context: {
                    url: url,
                },
            });
            console.log("Email verification email sent successfully");

        } catch (error) {
            throw error;
        }

    }
}