import nodemailer from "nodemailer";

export class Email {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // Specific Gmail SMTP server
            port: 465, // SSL port for Gmail
            secure: true, // Use SSL
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD, // This should be an App Password for Gmail
            },
            tls: {
                rejectUnauthorized: false, // Helps avoid certificate issues
            },
        });
    }


    // emaile templete for password reset
    public async sendPasswordResetEmail(to: string, token: string) {
        const APP_URL = process.env.APP_URL;
        const html = `
            <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 40px 20px;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.08);">
        <tr>
            <td style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eaedf3;">
                <!-- Document verification icon placeholder -->
                <div style="margin-bottom: 15px;">
                    <svg width="60" height="60" viewBox="0 0 24 24" style="fill: #3b82f6;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7zm-2 8v2h4v-2h-4zm0 4v2h4v-2h-4zm-2-4v2H5v-2h4zm0 4v2H5v-2h4z"/>
                        <path d="M13 12.66V9.5a1.5 1.5 0 1 0-3 0v3.16a1 1 0 1 0 3 0z" fill="#3b82f6"/>
                    </svg>
                </div>
                <h1 style="color: #1e40af; margin: 0; font-size: 24px; font-weight: 600;">Password Reset</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 25px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                <p style="margin-top: 0;">Hello there,</p>
                <p>You are receiving this email because a password reset was requested for your account. Security is important for document verification, and this step helps ensure your verified documents remain secure.</p>
                <p>Please click the button below to reset your password:</p>
            </td>
        </tr>
        <tr>
            <td style="text-align: center; padding: 10px 0 30px 0;">
                <a href="${APP_URL}/reset-password?token=${token}" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; display: inline-block; box-shadow: 0px 4px 6px rgba(59, 130, 246, 0.25); transition: all 0.3s ease;">Reset Password</a>
            </td>
        </tr>
        <tr>
            <td style="color: #64748b; font-size: 14px; padding: 0 0 25px 0; border-bottom: 1px solid #eaedf3;">
                <p style="margin: 0 0 10px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin: 0; word-break: break-all;"><a href="${APP_URL}/reset-password?token=${token}" style="color: #3b82f6; text-decoration: none;">${APP_URL}/reset-password?token=${token}</a></p>
            </td>
        </tr>
        <tr>
            <td style="color: #64748b; font-size: 14px; text-align: center; padding-top: 25px;">
                <p style="margin: 0 0 5px 0;">This secure link will expire in 60 minutes for your protection.</p>
                <p style="margin: 0 0 5px 0;">If you did not request this reset, please contact support immediately as someone may be attempting to access your verified documents.</p>
                <p style="margin: 20px 0 5px 0;">Thank you,</p>
                <p style="margin: 0; font-weight: 600; color: #475569;">The ${process.env.APP_NAME} Team</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaedf3; color: #94a3b8; font-size: 12px;">
                    <p>© 2025 ${process.env.APP_NAME}. All rights reserved.</p>
                    <p style="margin-top: 5px;">Your documents are secured with blockchain verification technology.</p>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        await this.sendEmail(to, "Password Reset Document Verification System", html);
    }



    public async addingMemberToOrganization(to: string, token: string,  password: string, name: string) {
        const APP_URL = process.env.APP_URL;
        const html = `
            <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the University Document Verification System</title>
</head>
<body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 40px 20px;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.08);">
        <tr>
            <td style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eaedf3;">
                <!-- Icon for verification system -->
                <div style="margin-bottom: 15px;">
                    <svg width="60" height="60" viewBox="0 0 24 24" style="fill: #3b82f6;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7zm-2 8v2h4v-2h-4zm0 4v2h4v-2h-4zm-2-4v2H5v-2h4zm0 4v2H5v-2h4z"/>
                        <path d="M13 12.66V9.5a1.5 1.5 0 1 0-3 0v3.16a1 1 0 1 0 3 0z" fill="#3b82f6"/>
                    </svg>
                </div>
                <h1 style="color: #1e40af; margin: 0; font-size: 24px; font-weight: 600;">Welcome to Our System</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 25px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                <p style="margin-top: 0;">Dear <strong>${name}</strong>,</p>
                <p>We are pleased to welcome you to the <strong>University Document Verification System</strong>. Below are your login credentials:</p>

                <div style="background: #ecf0f1; padding: 12px; border-radius: 6px; margin: 20px 0;">
                    <p style="font-size: 16px; margin: 8px 0;"><strong>User ID:</strong> <span style="color: #e74c3c;">${Email}</span></p>
                    <p style="font-size: 16px; margin: 8px 0;"><strong>Temporary Password:</strong> <span style="color: #e74c3c;">${password}</span></p>
                </div>

                <p style="margin-bottom: 20px;">For security reasons, please reset your password immediately using the link below:</p>
            </td>
        </tr>
        <tr>
            <td style="text-align: center; padding: 10px 0 30px 0;">
                <a href="[Reset_Password_Link]" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; display: inline-block; box-shadow: 0px 4px 6px rgba(59, 130, 246, 0.25); transition: all 0.3s ease;">Reset Password</a>
            </td>
        </tr>
        <tr>
            <td style="color: #64748b; font-size: 14px; padding: 0 0 25px 0; border-bottom: 1px solid #eaedf3;">
                <p style="margin: 0 0 10px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin: 0; word-break: break-word;"><a href="[Reset_Password_Link]" style="color: #3b82f6; text-decoration: none;">${APP_URL}/reset-password?token=${token}</a></p>
            </td>
        </tr>
        <tr>
            <td style="color: #64748b; font-size: 14px; text-align: center; padding-top: 25px;">
                <p style="margin: 0 0 5px 0;">Your secure link will expire in <strong>60 minutes</strong>.</p>
                <p style="margin: 0 0 5px 0;">If you did not request this invitation, please contact IT support immediately.</p>
                <p style="margin: 20px 0 5px 0;">Best Regards,</p>
                <p style="margin: 0; font-weight: 600; color: #475569;">[University Name] IT Team</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaedf3; color: #94a3b8; font-size: 12px;">
                    <p>© 2025 [University Name]. All rights reserved.</p>
                    <p>Your documents are secured with advanced encryption technology.</p>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
        `

        await this.sendEmail(to, "Welcome to the University Document Verification System", html);
        
    }



    public async sendEmail(to: string, subject: string, html: string) {

        const info = await this.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        });
        console.log("Email sent", info);
    }

}