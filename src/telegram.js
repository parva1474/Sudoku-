// ==========================================
// telegram.js
// ارتباط با Telegram Bot API
// سازگار با Cloudflare Workers
// ==========================================

async function telegramRequest(token, method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (!data.ok) {
    console.error(
      `Telegram API Error [${method}]:`,
      JSON.stringify(data)
    );
  }

  return data;
}


// ==========================================
// ارسال پیام متنی
// ==========================================

export async function sendMessage(
  token,
  chatId,
  text,
  replyMarkup = null
) {
  const body = {
    chat_id: chatId,
    text
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  return telegramRequest(
    token,
    "sendMessage",
    body
  );
}


// ==========================================
// تبدیل SVG به Blob
//
// فعلاً برای استفاده‌های بعدی نگه داشته شده.
// ==========================================

function svgToBlob(svg) {
  return new Blob(
    [svg],
    {
      type: "image/svg+xml"
    }
  );
}


// ==========================================
// ارسال تصویر سودوکو
//
// توجه:
// Telegram برای sendPhoto فایل تصویر واقعی
// می‌خواهد. SVG خام را مستقیماً photo نمی‌کنیم.
//
// این تابع فعلاً از URL داده‌شده استفاده می‌کند.
// رندر نهایی تصویر را در مرحله بعد حل می‌کنیم.
// ==========================================

export async function sendSudokuPhoto(
  token,
  chatId,
  photoUrl,
  keyboard
) {
  return telegramRequest(
    token,
    "sendPhoto",
    {
      chat_id: chatId,

      photo: photoUrl,

      caption:
        "🧩 بازی سودوکو",

      reply_markup:
        keyboard
    }
  );
}


// ==========================================
// ویرایش تصویر پیام معمولی
// ==========================================

export async function updateSudokuPhoto(
  token,
  chatId,
  messageId,
  photoUrl,
  keyboard
) {
  return telegramRequest(
    token,
    "editMessageMedia",
    {
      chat_id: chatId,

      message_id: messageId,

      media: {
        type: "photo",

        media: photoUrl,

        caption:
          "🧩 بازی سودوکو"
      },

      reply_markup:
        keyboard
    }
  );
}


// ==========================================
// ویرایش تصویر Inline
// ==========================================

export async function updateInlineSudokuPhoto(
  token,
  inlineMessageId,
  photoUrl,
  keyboard
) {
  return telegramRequest(
    token,
    "editMessageMedia",
    {
      inline_message_id:
        inlineMessageId,

      media: {
        type: "photo",

        media: photoUrl,

        caption:
          "🧩 بازی سودوکو"
      },

      reply_markup:
        keyboard
    }
  );
}


// ==========================================
// پاسخ به Callback Query
// ==========================================

export async function answerCallback(
  token,
  callbackQueryId,
  text = null
) {
  const body = {
    callback_query_id:
      callbackQueryId
  };

  if (text) {
    body.text = text;
  }

  return telegramRequest(
    token,
    "answerCallbackQuery",
    body
  );
}
