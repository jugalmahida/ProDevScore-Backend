export const forgetPasswordHtmlTemplate = (link) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">ProDevScore</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                            <p style="margin: 0 0 32px; color: #666666; font-size: 16px; line-height: 1.5;">
                                We received a request to reset your ProDevScore account password. Click the button below to set a new password:
                            </p>

                            <!-- Reset Password Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 24px;">
                                        <a href="${link}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 18px; font-weight: 600; border-radius: 8px; text-decoration: none; letter-spacing: 1px; box-shadow: 0 1px 4px rgba(102,126,234,0.10);">
                                            Verify Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 32px 0 0; color: #666666; font-size: 15px; text-align: center;">
                                If the button doesn’t work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 8px 0 0; color: #667eea; font-size: 14px; word-break: break-all; text-align: center;">
                                <a href="${link}" style="color: #667eea; text-decoration: underline;" target="_blank">${link}</a>
                            </p>
                            <p style="margin: 32px 0 0; color: #999999; font-size: 14px; line-height: 1.6; text-align: center;">
                                This reset link will expire in <strong style="color: #666666;">15 minutes</strong>.<br>
                                If you didn’t forget password for ProDevScore, you can safely ignore this email. Someone else might have typed your email address by mistake.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6; text-align: center;">
                                © ${new Date().getFullYear()} ProDevScore. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};
