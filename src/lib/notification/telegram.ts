
/**
 * Telegram Notification Service
 * Sends notifications to a Telegram Chat via Bot API
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface PaymentNotificationData {
  orderNo: string;
  amount: number;
  currency: string;
  productName: string;
  email: string;
  credits: number;
}

/**
 * Send payment success notification to Telegram
 */
export async function sendTelegramPaymentNotification(data: PaymentNotificationData) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Missing configuration, skipping notification');
    return;
  }

  const message = `
💰 <b>New Payment Received!</b>

👤 <b>User:</b> ${data.email}
💎 <b>Plan:</b> ${data.productName}
💵 <b>Amount:</b> ${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}
🪙 <b>Credits:</b> ${data.credits}
📝 <b>Order:</b> ${data.orderNo}
⏰ <b>Time:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Telegram] Failed to send notification:', error);
    } else {
      console.log('[Telegram] Payment notification sent');
    }
  } catch (error) {
    console.error('[Telegram] Error sending notification:', error);
  }
}
