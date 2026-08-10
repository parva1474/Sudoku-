// ==========================================
// src/telegram.js
// Telegram Bot API
// ==========================================

const TELEGRAM_API =
  "https://api.telegram.org/bot";

// ==========================================
// درخواست عمومی به Telegram API
// ==========================================

export async function telegramRequest(
  token,
  method,
  body = {}
) {
  if (!token) {
    throw new Error(
      "Telegram bot token is missing."
    );
  }

  const response = await fetch(
    `${TELEGRAM_API}${token}/${method}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify(body)
    }
  );

  const data =
    await response.json();

  if (!response.ok || !data.ok) {
    console.error(
      "Telegram API Error:",
      data
    );

    throw new Error(
      data.description ||
      `Telegram API error: ${response.status}`
    );
  }

  return data;
}

// ==========================================
// ارسال پیام
// ==========================================

export async function sendMessage(
  token,
  chatId,
  text,
  replyMarkup = null
) {
  const body = {
    chat_id: chatId,
    text,

    parse_mode: "HTML",

    disable_web_page_preview:
      true
  };

  if (replyMarkup) {
    body.reply_markup =
      replyMarkup;
  }

  return telegramRequest(
    token,
    "sendMessage",
    body
  );
}

// ==========================================
// ویرایش متن پیام
// ==========================================

export async function editMessageText(
  token,
  chatId,
  messageId,
  text,
  replyMarkup = null
) {
  const body = {
    chat_id: chatId,

    message_id: messageId,

    text,

    parse_mode: "HTML",

    disable_web_page_preview:
      true
  };

  if (replyMarkup) {
    body.reply_markup =
      replyMarkup;
  }

  return telegramRequest(
    token,
    "editMessageText",
    body
  );
}

// ==========================================
// ویرایش فقط Keyboard
// ==========================================

export async function editMessageReplyMarkup(
  token,
  chatId,
  messageId,
  replyMarkup
) {
  return telegramRequest(
    token,
    "editMessageReplyMarkup",
    {
      chat_id: chatId,

      message_id:
        messageId,

      reply_markup:
        replyMarkup
    }
  );
}

// ==========================================
// پاسخ به Callback Query
// ==========================================

export async function answerCallbackQuery(
  token,
  callbackQueryId,
  text = "",
  showAlert = false
) {
  const body = {
    callback_query_id:
      callbackQueryId
  };

  if (text) {
    body.text = text;
  }

  if (showAlert) {
    body.show_alert = true;
  }

  return telegramRequest(
    token,
    "answerCallbackQuery",
    body
  );
}

// ==========================================
// حذف پیام
// ==========================================

export async function deleteMessage(
  token,
  chatId,
  messageId
) {
  return telegramRequest(
    token,
    "deleteMessage",
    {
      chat_id: chatId,

      message_id:
        messageId
    }
  );
}

// ==========================================
// تنظیم Webhook
// ==========================================

export async function setWebhook(
  token,
  webhookUrl
) {
  return telegramRequest(
    token,
    "setWebhook",
    {
      url: webhookUrl,

      allowed_updates: [
        "message",
        "callback_query"
      ]
    }
  );
}

// ==========================================
// حذف Webhook
// ==========================================

export async function deleteWebhook(
  token
) {
  return telegramRequest(
    token,
    "deleteWebhook"
  );
}

// ==========================================
// دریافت اطلاعات Webhook
// ==========================================

export async function getWebhookInfo(
  token
) {
  return telegramRequest(
    token,
    "getWebhookInfo"
  );
}

// ==========================================
// دریافت اطلاعات Bot
// ==========================================

export async function getMe(
  token
) {
  return telegramRequest(
    token,
    "getMe"
  );
}
