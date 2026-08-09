// ==========================================
// telegram.js
// Telegram API + SVG -> PNG
// مخصوص Cloudflare Workers
// ==========================================

import { Resvg } from "@cf-wasm/resvg/workerd";


// ==========================================
// درخواست به Telegram API
// ==========================================

async function telegramRequest(token, method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      body
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
// تبدیل SVG به PNG
// ==========================================

async function svgToPng(svg) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "original"
    }
  });

  const pngData = resvg.render();

  return pngData.asPng();
}


// ==========================================
// ساخت FormData برای Telegram
// ==========================================

function createPhotoForm(
  chatId,
  pngBytes,
  keyboard
) {
  const form = new FormData();

  form.append(
    "chat_id",
    String(chatId)
  );

  form.append(
    "photo",
    new Blob(
      [pngBytes],
      {
        type: "image/png"
      }
    ),
    "sudoku.png"
  );

  form.append(
    "caption",
    "🧩 بازی سودوکو"
  );

  if (keyboard) {
    form.append(
      "reply_markup",
      JSON.stringify(keyboard)
    );
  }

  return form;
}


// ==========================================
// ارسال عکس سودوکو
// ==========================================

export async function sendSudokuPhoto(
  token,
  chatId,
  svg,
  keyboard
) {
  try {

    const pngBytes =
      await svgToPng(svg);

    const form =
      createPhotoForm(
        chatId,
        pngBytes,
        keyboard
      );

    return await telegramRequest(
      token,
      "sendPhoto",
      form
    );

  } catch (error) {

    console.error(
      "SVG -> PNG error:",
      error
    );

    throw error;
  }
}


// ==========================================
// ویرایش عکس پیام معمولی
// ==========================================

export async function updateSudokuPhoto(
  token,
  chatId,
  messageId,
  svg,
  keyboard
) {
  try {

    const pngBytes =
      await svgToPng(svg);

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

    form.append(
      "media",
      JSON.stringify({
        type: "photo",
        media: "attach://sudoku",
        caption: "🧩 بازی سودوکو"
      })
    );

    form.append(
      "sudoku",
      new Blob(
        [pngBytes],
        {
          type: "image/png"
        }
      ),
      "sudoku.png"
    );

    form.append(
      "reply_markup",
      JSON.stringify(keyboard)
    );

    return await telegramRequest(
      token,
      "editMessageMedia",
      form
    );

  } catch (error) {

    console.error(
      "Update Sudoku photo error:",
      error
    );

    throw error;
  }
}


// ==========================================
// ویرایش عکس Inline
// ==========================================

export async function updateInlineSudokuPhoto(
  token,
  inlineMessageId,
  svg,
  keyboard
) {
  try {

    const pngBytes =
      await svgToPng(svg);

    const form =
      new FormData();

    form.append(
      "inline_message_id",
      String(inlineMessageId)
    );

    form.append(
      "media",
      JSON.stringify({
        type: "photo",
        media: "attach://sudoku",
        caption: "🧩 بازی سودوکو"
      })
    );

    form.append(
      "sudoku",
      new Blob(
        [pngBytes],
        {
          type: "image/png"
        }
      ),
      "sudoku.png"
    );

    form.append(
      "reply_markup",
      JSON.stringify(keyboard)
    );

    return await telegramRequest(
      token,
      "editMessageMedia",
      form
    );

  } catch (error) {

    console.error(
      "Update Inline Sudoku photo error:",
      error
    );

    throw error;
  }
}


// ==========================================
// پاسخ به Callback Query
// ==========================================

export async function answerCallback(
  token,
  callbackQueryId,
  text = null
) {
  const form =
    new URLSearchParams();

  form.append(
    "callback_query_id",
    String(callbackQueryId)
  );

  if (text) {
    form.append(
      "text",
      text
    );
  }

  return await telegramRequest(
    token,
    "answerCallbackQuery",
    form
  );
}


// ==========================================
// ارسال پیام متنی
// ==========================================

export async function sendMessage(
  token,
  chatId,
  text,
  keyboard = null
) {
  const form =
    new URLSearchParams();

  form.append(
    "chat_id",
    String(chatId)
  );

  form.append(
    "text",
    text
  );

  if (keyboard) {
    form.append(
      "reply_markup",
      JSON.stringify(keyboard)
    );
  }

  return await telegramRequest(
    token,
    "sendMessage",
    form
  );
}
