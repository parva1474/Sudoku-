// ==========================================
// telegram.js
// توابع ارتباط با Telegram Bot API
// ==========================================

/**
 * ارسال درخواست به Telegram API
 */
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
      `Telegram API Error (${method}):`,
      data
    );
  }

  return data;
}


/**
 * ارسال عکس سودوکو
 *
 * svg باید به صورت string باشد.
 */
export async function sendSudokuPhoto(
  token,
  chatId,
  svg,
  keyboard
) {
  const base64 = btoa(
    unescape(
      encodeURIComponent(svg)
    )
  );

  return await telegramRequest(
    token,
    "sendPhoto",
    {
      chat_id: chatId,

      photo: `data:image/svg+xml;base64,${base64}`,

      caption: "🧩 بازی سودوکو",

      reply_markup: keyboard
    }
  );
}


/**
 * آپدیت عکس سودوکو در پیام معمولی
 *
 * برای پیام‌هایی که chat_id و message_id دارند.
 */
export async function updateSudokuPhoto(
  token,
  chatId,
  messageId,
  svg,
  keyboard
) {
  const base64 = btoa(
    unescape(
      encodeURIComponent(svg)
    )
  );

  return await telegramRequest(
    token,
    "editMessageMedia",
    {
      chat_id: chatId,

      message_id: messageId,

      media: {
        type: "photo",

        media:
          `data:image/svg+xml;base64,${base64}`,

        caption: "🧩 بازی سودوکو"
      },

      reply_markup: keyboard
    }
  );
}


/**
 * آپدیت پیام Inline
 *
 * این تابع برای زمانی است که بازی
 * از طریق Inline Mode ارسال شده باشد.
 */
export async function updateInlineSudokuPhoto(
  token,
  inlineMessageId,
  svg,
  keyboard
) {
  const base64 = btoa(
    unescape(
      encodeURIComponent(svg)
    )
  );

  return await telegramRequest(
    token,
    "editMessageMedia",
    {
      inline_message_id: inlineMessageId,

      media: {
        type: "photo",

        media:
          `data:image/svg+xml;base64,${base64}`,

        caption: "🧩 بازی سودوکو"
      },

      reply_markup: keyboard
    }
  );
}


/**
 * پاسخ به callback query
 *
 * باعث می‌شود لودینگ روی دکمه تلگرام
 * متوقف شود.
 */
export async function answerCallback(
  token,
  callbackQueryId,
  text = null
) {
  const body = {
    callback_query_id: callbackQueryId
  };

  if (text) {
    body.text = text;
  }

  return await telegramRequest(
    token,
    "answerCallbackQuery",
    body
  );
}
