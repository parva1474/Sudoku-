// ==========================================
// src/telegram.js
// Telegram Bot API
// Cloudflare Workers
// ==========================================

// ==========================================
// درخواست عمومی به Telegram
// ==========================================

async function telegramRequest(
  token,
  method,
  body = {}
) {
  const url =
    `https://api.telegram.org/bot${token}/${method}`;

  const response =
    await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(body)
    });

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      `Telegram returned invalid JSON. HTTP ${response.status}`
    );
  }

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram API error in ${method}: ${
        data?.description ||
        `HTTP ${response.status}`
      }`
    );
  }

  return data.result;
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
    chat_id:
      chatId,

    text,

    parse_mode:
      "HTML",

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
    chat_id:
      chatId,

    message_id:
      messageId,

    text,

    parse_mode:
      "HTML",

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
// ارسال عکس PNG
// ==========================================

export async function sendPhoto(
  token,
  chatId,
  pngBytes,
  caption = "",
  replyMarkup = null
) {
  const url =
    `https://api.telegram.org/bot${token}/sendPhoto`;

  const form =
    new FormData();

  form.append(
    "chat_id",
    String(chatId)
  );

  if (caption) {
    form.append(
      "caption",
      caption
    );

    form.append(
      "parse_mode",
      "HTML"
    );
  }

  if (replyMarkup) {
    form.append(
      "reply_markup",
      JSON.stringify(
        replyMarkup
      )
    );
  }

  // تبدیل Uint8Array به Blob
  const blob =
    new Blob(
      [pngBytes],
      {
        type:
          "image/png"
      }
    );

  form.append(
    "photo",
    blob,
    "sudoku.png"
  );

  const response =
    await fetch(
      url,
      {
        method: "POST",
        body: form
      }
    );

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      `Telegram returned invalid JSON while sending photo. HTTP ${response.status}`
    );
  }

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram API error in sendPhoto: ${
        data?.description ||
        `HTTP ${response.status}`
      }`
    );
  }

  return data.result;
}

// ==========================================
// ویرایش عکس پیام
// ==========================================

export async function editMessagePhoto(
  token,
  chatId,
  messageId,
  pngBytes,
  caption = "",
  replyMarkup = null
) {
  const url =
    `https://api.telegram.org/bot${token}/editMessageMedia`;

  const form =
    new FormData();

  form.append(
    "chat_id",
    String(chatId)
  );

  form.append(
    "message_id",
    String(messageId)
  );

  const blob =
    new Blob(
      [pngBytes],
      {
        type:
          "image/png"
      }
    );

  form.append(
    "media",
    JSON.stringify({
      type:
        "photo",

      media:
        "attach://sudoku",

      caption:
        caption,

      parse_mode:
        "HTML"
    })
  );

  form.append(
    "photo",
    blob,
    "sudoku.png"
  );

  if (replyMarkup) {
    form.append(
      "reply_markup",
      JSON.stringify(
        replyMarkup
      )
    );
  }

  const response =
    await fetch(
      url,
      {
        method: "POST",
        body: form
      }
    );

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      `Telegram returned invalid JSON while editing photo. HTTP ${response.status}`
    );
  }

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram API error in editMessageMedia: ${
        data?.description ||
        `HTTP ${response.status}`
      }`
    );
  }

  return data.result;
}

// ==========================================
// پاسخ Callback Query
// ==========================================

export async function answerCallbackQuery(
  token,
  callbackQueryId,
  text = null,
  showAlert = false
) {
  const body = {
    callback_query_id:
      callbackQueryId,

    show_alert:
      showAlert
  };

  if (text) {
    body.text =
      text;
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
      chat_id:
        chatId,

      message_id:
        messageId
    }
  );
}

// ==========================================
// Webhook
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
        webhookUrl,

      allowed_updates: [
        "message",
        "callback_query"
      ]
    }
  );
}

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

export async function getWebhookInfo(
  token
) {
  return telegramRequest(
    token,
    "getWebhookInfo"
  );
}
