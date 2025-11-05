export const passwordResetSuccessHtmlTemplate = (userEmail) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Successfully Reset</title>
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
                        <td style="padding: 20px 40px 40px;">
                            <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">Password Successfully Reset</h2>
                            <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                Your ProDevScore account password has been changed successfully. You can now log in with your new password.
                            </p>

                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td style="padding: 20px; background-color: #f8f9ff; border-left: 4px solid #667eea; border-radius: 6px;">
                                        <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 14px; font-weight: 600;">
                                            Account Details:
                                        </p>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                            <strong>Email:</strong> ${userEmail}<br>
                                            <strong>Changed:</strong> ${new Date().toLocaleString(
                                              "en-US",
                                              {
                                                dateStyle: "long",
                                                timeStyle: "short",
                                              }
                                            )}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Security Notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td style="padding: 20px; background-color: #fff9f0; border-left: 4px solid #ff9800; border-radius: 6px;">
                                        <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 14px; font-weight: 600;">
                                            ⚠️ Didn't change your password?
                                        </p>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                            If you didn't make this change, your account may be compromised. Please contact our support team immediately.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Login Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 24px 0;">
                                        <a href="${
                                          process.env.NODE_ENV === "development"
                                            ? process.env.LOCAL_FRONTEND_URL
                                            : process.env.FRONTEND_URL
                                        }/login" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 18px; font-weight: 600; border-radius: 8px; text-decoration: none; letter-spacing: 1px; box-shadow: 0 1px 4px rgba(102,126,234,0.10);">
                                            Login to Your Account
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 24px 0 0; color: #999999; font-size: 14px; line-height: 1.6; text-align: center;">
                                For security reasons, we recommend:
                            </p>
                            <ul style="margin: 12px 0; padding: 0; color: #666666; font-size: 14px; line-height: 1.8; text-align: left; list-style-position: inside;">
                                <li>Using a strong, unique password</li>
                                <li>Enabling two-factor authentication</li>
                                <li>Never sharing your password with anyone</li>
                            </ul>
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
