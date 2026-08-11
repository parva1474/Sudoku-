// ==========================================
// src/telegram.js
// Telegram API
// Cloudflare Workers
// ==========================================


// ==========================================
// Telegram API Request
// ==========================================

async function telegramRequest(
  token,
  method,
  body
) {

  if (!token) {

    throw new Error(
      "Telegram BOT_TOKEN is missing."
    );
  }


  const url =
    `https://api.telegram.org/bot${token}/${method}`;


  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)
      }
    );


  let data;


  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      `Telegram returned invalid JSON. HTTP ${response.status}`
    );
  }


  if (
    !response.ok ||
    !data.ok
  ) {

    const description =
      data?.description ||
      `HTTP ${response.status}`;


    console.error(
      `Telegram API error [${method}]:`,
      description
    );


    throw new Error(
      `Telegram API error: ${description}`
    );
  }


  return data.result;
}


// ==========================================
// Send Message
// ==========================================

export async function sendMessage(
  token,
  chatId,
  text,
  replyMarkup = null
) {

  const body = {

    chat_id:
      chatId,

    text:
      String(text ?? ""),

    parse_mode:
      "HTML",

    disable_web_page_preview:
      true

  };


  if (
    replyMarkup
  ) {

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
// Edit Message Text
// ==========================================

export async function editMessageText(
  token,
  chatId,
  messageId,
  text,
  replyMarkup = null
) {

  const body = {

    chat_id:
      chatId,

    message_id:
      Number(messageId),

    text:
      String(text ?? ""),

    parse_mode:
      "HTML",

    disable_web_page_preview:
      true

  };


  if (
    replyMarkup
  ) {

    body.reply_markup =
      replyMarkup;

  } else {

    body.reply_markup = {

      inline_keyboard: []

    };
  }


  return telegramRequest(
    token,
    "editMessageText",
    body
  );
}


// ==========================================
// Answer Callback Query
// ==========================================

export async function answerCallbackQuery(
  token,
  callbackQueryId,
  text = "",
  showAlert = false
) {

  const body = {

    callback_query_id:
      callbackQueryId,

    show_alert:
      Boolean(showAlert)

  };


  if (
    text
  ) {

    body.text =
      String(text);
  }


  return telegramRequest(
    token,
    "answerCallbackQuery",
    body
  );
}


// ==========================================
// Delete Message
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

      chat_id:
        chatId,

      message_id:
        Number(messageId)

    }
  );
}


// ==========================================
// Edit Reply Markup
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

      chat_id:
        chatId,

      message_id:
        Number(messageId),

      reply_markup:
        replyMarkup || {
          inline_keyboard: []
        }

    }
  );
}


// ==========================================
// Set Webhook
// ==========================================

export async function setWebhook(
  token,
  webhookUrl
) {

  return telegramRequest(
    token,
    "setWebhook",
    {

      url:
        webhookUrl

    }
  );
}


// ==========================================
// Delete Webhook
// ==========================================

export async function deleteWebhook(
  token
) {

  return telegramRequest(
    token,
    "deleteWebhook",
    {

      drop_pending_updates:
        true

    }
  );
}


// ==========================================
// Get Webhook Info
// ==========================================

export async function getWebhookInfo(
  token
) {

  return telegramRequest(
    token,
    "getWebhookInfo",
    {}
  );
}


// ==========================================
// Get Me
// ==========================================

export async function getMe(
  token
) {

  return telegramRequest(
    token,
    "getMe",
    {}
  );
}


// ==========================================
// Export low-level API
// ==========================================

export {
  telegramRequest
};
