import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service.js";
import { EjsAdapter } from "@nestjs-modules/mailer/adapters/ejs.adapter";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


@Module({
    imports: [MailerModule.forRootAsync({
        inject: [ConfigService],
        useFactory: async (config: ConfigService) => ({
            transport: {
                host: config.get<string>("SMTP_HOST"),
                port: config.get<number>("SMTP_PORT"),
                secure: false,
                auth: {
                    user: config.get<string>("SMTP_USER_NAME"),
                    pass: config.get<string>("SMTP_PASSWORD"),
                },
            },
            template: {
                dir: join(__dirname, "templates"),
                adapter: new EjsAdapter({
                    inlineCssEnabled: true,
                })
            },
        }),
    })],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }