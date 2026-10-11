import crypto from "crypto"
import nodeMailer from "nodemailer"

const generateResetPasswordToken = () => {
    const resetToken = crypto.randomBytes(20).toString("hex");

    const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    const resetPasswordExpireTime = Date.now() + 15*60*1000; //15 minutes

    return {resetToken, hashedToken, resetPasswordExpireTime}

}

const generateEmailTemplate = (resetPasswordUrl) => {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px;
margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius:
8px; background-color: #000; color: #fff;">
<h2 style="color: #fff; text-align: center;">Reset Your
Password</h2>
<p style="font-size: 16px; color: #ccc;">Dear User,</p>
<p style="font-size: 16px; color: #ccc;">You requested to
reset your password. Please click the button below to proceed:</p>
<div style="text-align: center; margin: 20px 0;">
<a href="${resetPasswordUrl}"
style="display: inline-block; font-size: 16px;
font-weight: bold; color: #000; text-decoration: none; padding: 12px
20px; border: 1px solid #fff; border-radius: 5px; background-color:
#fff; cursor: pointer">
Reset Password
</a>
</div>
<p style="font-size: 16px; color: #ccc;">If you did not
request this, please ignore this email. The link will expire in 15
minutes.</p>
<p style="font-size: 16px; color: #ccc;">If the button above
doesn’t work, copy and paste the following URL into your browser:</p>
<p style="font-size: 16px; color: #fff; word-wrap:
break-word;">${resetPasswordUrl}</p>
<footer style="margin-top: 20px; text-align: center;
font-size: 14px; color: #666;">
<p>Thank you,<br>Ecommerce Team</p>
<p style="font-size: 12px; color: #444;">This is an
automated message. Please do not reply to this email.</p>
</footer>
</div>
`
}


const sendEmail = async ({email, subject, message}) => {
    const transporter = nodeMailer.createTransport({
        host: process.env.SMTP_HOST,
        service: process.env.SMTP_SERVICE,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: subject,
        html: message
    }

    await transporter.sendMail(mailOptions);
}


export {generateResetPasswordToken, generateEmailTemplate, sendEmail}