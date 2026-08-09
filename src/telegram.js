// ==========================================
// src/telegram.js
// Telegram API
// Cloudflare Workers
// SVG -> PNG با resvg
// ==========================================

import {
  Resvg
} from '@cf-wasm/resvg/workerd';


// ==========================================
// درخواست به Telegram API
// ==========================================

async function telegramRequest(
  token,
  method,
  body
) {

  const response =
    await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: 'POST',
        body
      }
    );


  const data =
    await response.json();


  if (!data.ok) {

    console.error(
      `Telegram API Error [${method}]:`,
      JSON.stringify(data)
    );
  }


  return data;
}


// ==========================================
// SVG -> PNG
// ==========================================

async function svgToPng(svg) {

  const renderer =
    new Resvg(
      svg,
      {
        fitTo: {
          mode: 'original'
        }
      }
    );


  const png =
    renderer.render();


  return png.asPng();
}


// ==========================================
// ارسال عکس
// ==========================================

export async function sendSudokuPhoto(
  token,
  chatId,
  svg,
  keyboard
) {

  const png =
    await svgToPng(svg);


  const form =
    new FormData();


  form.append(
    'chat_id',
    String(chatId)
  );


  form.append(
    'photo',
    new Blob(
      [png],
      {
        type: 'image/png'
      }
    ),
    'sudoku.png'
  );


  form.append(
    'caption',
    '🧩 بازی سودوکو'
  );


  if (keyboard) {

    form.append(
      'reply_markup',
      JSON.stringify(keyboard)
    );
  }


  return telegramRequest(
    token,
    'sendPhoto',
    form
  );
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

  const png =
    await svgToPng(svg);


  const form =
    new FormData();


  form.append(
    'chat_id',
    String(chatId)
  );


  form.append(
    'message_id',
    String(messageId)
  );


  form.append(
    'media',
    JSON.stringify({
      type: 'photo',
      media: 'attach://sudoku',
      caption: '🧩 بازی سودوکو'
    })
  );


  form.append(
    'sudoku',
    new Blob(
      [png],
      {
        type: 'image/png'
      }
    ),
    'sudoku.png'
  );


  if (keyboard) {

    form.append(
      'reply_markup',
      JSON.stringify(keyboard)
    );
  }


  return telegramRequest(
    token,
    'editMessageMedia',
    form
  );
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

  const png =
    await svgToPng(svg);


  const form =
    new FormData();


  form.append(
    'inline_message_id',
    String(inlineMessageId)
  );


  form.append(
    'media',
    JSON.stringify({
      type: 'photo',
      media: 'attach://sudoku',
      caption: '🧩 بازی سودوکو'
    })
  );


  form.append(
    'sudoku',
    new Blob(
      [png],
      {
        type: 'image/png'
      }
    ),
    'sudoku.png'
  );


  if (keyboard) {

    form.append(
      'reply_markup',
      JSON.stringify(keyboard)
    );
  }


  return telegramRequest(
    token,
    'editMessageMedia',
    form
  );
}


// ==========================================
// پاسخ Callback
// ==========================================

export async function answerCallback(
  token,
  callbackQueryId,
  text = null
) {

  const form =
    new URLSearchParams();


  form.append(
    'callback_query_id',
    String(callbackQueryId)
  );


  if (text) {

    form.append(
      'text',
      text
    );
  }


  return telegramRequest(
    token,
    'answerCallbackQuery',
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
    'chat_id',
    String(chatId)
  );


  form.append(
    'text',
    text
  );


  if (keyboard) {

    form.append(
      'reply_markup',
      JSON.stringify(keyboard)
    );
  }


  return telegramRequest(
    token,
    'sendMessage',
    form
  );
}
