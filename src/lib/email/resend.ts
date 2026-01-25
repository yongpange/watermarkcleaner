import { Resend } from 'resend';

// Use a placeholder during build if env var is missing.
// Cloudflare Pages build environment often doesn't have access to secrets, causing the build to fail
// if we strictly require the key at the module level.
const resend = new Resend(process.env.RESEND_API_KEY || 're_build_placeholder');

export interface SendVerificationEmailParams {
  toEmail: string;
  verificationCode: string;
  purpose: 'register' | 'login' | 'update_email';
  locale?: string;
}

/**
 * 发送邮箱验证码
 * @param param0 - 邮件发送参数
 * @returns 发送结果
 */
export async function sendVerificationEmail({
  toEmail,
  verificationCode,
  purpose,
  locale = 'en'
}: SendVerificationEmailParams) {
  try {
    // 根据用途和语言选择主题
    const subjects = {
      zh: {
        register: '欢迎注册 WatermarkCleaner - 邮箱验证码',
        login: '登录 WatermarkCleaner - 邮箱验证码',
        update_email: '修改邮箱 - WatermarkCleaner 验证码'
      },
      en: {
        register: 'Welcome to WatermarkCleaner - Email Verification',
        login: 'Login to WatermarkCleaner - Verification Code',
        update_email: 'Update Email - WatermarkCleaner Verification'
      },
      es: {
        register: 'Bienvenido a WatermarkCleaner - Código de Verificación',
        login: 'Iniciar sesión - Código de verificación',
        update_email: 'Actualizar correo electrónico - Código'
      }
    };

    const t = (subjects as any)[locale] || subjects.en;
    const subject = t[purpose] || t.register;

    // 邮件HTML模板
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1890ff;
            margin-bottom: 10px;
          }
          .code-box {
            background-color: #f0f8ff;
            border: 2px solid #1890ff;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #1890ff;
            font-family: 'Courier New', monospace;
          }
          .message {
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            margin-bottom: 20px;
          }
          .warning {
            background-color: #fffbe6;
            border: 1px solid #ffe58f;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #666;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
          .button {
            display: inline-block;
            background-color: #1890ff;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WatermarkCleaner</div>
            <h2>${purpose === 'register' ? '欢迎注册' : purpose === 'login' ? '登录验证' : '修改邮箱'}</h2>
          </div>

          <div class="message">
            <p>您好！</p>
            <p>您正在${purpose === 'register' ? '注册' : purpose === 'login' ? '登录' : '修改邮箱'} WatermarkCleaner 账户。</p>
            <p>您的验证码是：</p>
          </div>

          <div class="code-box">
            <div class="code">${verificationCode}</div>
          </div>

          <div class="message">
            <p>该验证码在 <strong>5分钟</strong> 内有效，请勿泄露给他人。</p>
            <p>请在网站上输入此验证码以完成验证。</p>
          </div>

          <div class="warning">
            <strong>⚠️ 安全提示：</strong><br/>
            如果您没有进行此操作，请忽略此邮件，并确保您的账户安全。
          </div>

          <div class="footer">
            <p>此邮件由 WatermarkCleaner 系统自动发送</p>
            <p>© 2025 WatermarkCleaner. All rights reserved.</p>
            <p>如有问题，请联系 support@watermarkcleaner.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 纯文本版本（用于不支持HTML的客户端）
    const textTemplates = {
      zh: {
        register: '欢迎注册 WatermarkCleaner！\n\n您的验证码是：',
        login: '登录 WatermarkCleaner\n\n您的验证码是：',
        update_email: '修改邮箱 - WatermarkCleaner\n\n您的验证码是：'
      },
      en: {
        register: 'Welcome to WatermarkCleaner!\n\nYour verification code is:',
        login: 'Login to WatermarkCleaner\n\nYour verification code is:',
        update_email: 'Update Email - WatermarkCleaner\n\nYour verification code is:'
      }
    };

    const textT = (textTemplates as any)[locale] || textTemplates.en;
    const textSubject = textT[purpose] || textT.register;
    const textContent = `${textSubject} ${verificationCode}\n\n该验证码在5分钟内有效。\n\n如果您没有进行此操作，请忽略此邮件。`;

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'WatermarkCleaner <onboarding@resend.dev>',
      to: toEmail,
      subject: subject,
      html: htmlTemplate,
      text: textContent
    });

    if (error) {
      console.error('[Resend] Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }

    console.log('[Resend] Email sent successfully:', {
      emailId: data?.id,
      to: toEmail,
      purpose
    });

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('[Resend] Error sending verification email:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 发送欢迎邮件（注册成功后）
 * @param toEmail - 收件人邮箱
 * @param username - 用户名
 * @param locale - 语言
 */
export async function sendWelcomeEmail(
  toEmail: string,
  username?: string,
  locale: string = 'en'
) {
  try {
    const subjects = {
      zh: '欢迎加入 WatermarkCleaner！',
      en: 'Welcome to WatermarkCleaner!',
      es: '¡Bienvenido a WatermarkCleaner!'
    };

    const subject = (subjects as any)[locale] || subjects.en;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'WatermarkCleaner <onboarding@resend.dev>',
      to: toEmail,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html lang="${locale}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1890ff;">WatermarkCleaner</h1>
          </div>

          <h2>${subject}</h2>

          <p>您好${username ? ' ' + username : ''}！</p>

          <p>欢迎加入 WatermarkCleaner，您现在可以：</p>

          <ul>
            <li>✨ 去除图片水印</li>
            <li>📊 查看使用额度</li>
            <li>⚙️ 管理账户设置</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_WEB_URL}/convert" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              开始去水印
            </a>
          </div>

          <p>如果您有任何问题，请随时联系我们。</p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            <p>WatermarkCleaner 团队</p>
            <p>support@watermarkcleaner.com</p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('[Resend] Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Resend] Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default resend;
