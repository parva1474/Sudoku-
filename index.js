import { generateSudoku, buildSudokuKeyboard, buildNumberKeyboard } from './sudoku.js';

const REQUIRED_CHANNELS = ['@nwechannell', '@parvapoem'];

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Bot is running and ready!');
    }

    try {
      const update = await request.json();
      const token = env.BOT_TOKEN;

      if (!token) {
        return new Response('BOT_TOKEN is not set in environment variables', { status: 500 });
      }

      if (update.inline_query) {
        await handleInlineQuery(update.inline_query, token);
      } else if (update.callback_query) {
        await handleCallbackQuery(update.callback_query, token);
      }

      return new Response('OK');
    } catch (e) {
      console.error(e);
      return new Response(e.message, { status: 500 });
    }
  }
};

async function handleInlineQuery(inlineQuery, token) {
  const queryId = inlineQuery.id;
  const puzzle = generateSudoku();
  const keyboard = buildSudokuKeyboard(puzzle);

  const results = [
    {
      type: 'article',
      id: String(Date.now()),
      title: '🧩 شروع بازی سودوکو',
      description: 'برای ارسال جدول سودوکو در گروه کلیک کنید',
      input_message_content: {
        message_text: "🧩 **بازی سودوکو گروهی**\n\nبرای بازی روی خانه‌های جدول کلیک کنید.",
        parse_mode: 'Markdown'
      },
      reply_markup: {
        inline_keyboard: keyboard
      }
    }
  ];

  await fetch(`https://api.telegram.org/bot${token}/answerInlineQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inline_query_id: queryId,
      results: results,
      cache_time: 0,
      is_personal: true
    })
  });
}

async function checkUserMembership(userId, token) {
  for (const channel of REQUIRED_CHANNELS) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${channel}&user_id=${userId}`);
      const data = await res.json();
      if (!data.ok || ['left', 'kicked', 'restricted'].includes(data.result.status)) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  return true;
}

async function handleCallbackQuery(callbackQuery, token) {
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;

  const isMember = await checkUserMembership(userId, token);
  if (!isMember) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: "⚠️ برای بازی باید ابتدا در کانال‌های @nwechannell و @parvapoem عضو شوید!",
        show_alert: true
      })
    });
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id })
  });

  if (data.startsWith('cell_')) {
    const [, r, c] = data.split('_');
    const numberKeyboard = buildNumberKeyboard(r, c);

    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: numberKeyboard }
      })
    });
  } 
  else if (data === 'back_to_board' || data === 'new_game') {
    const puzzle = generateSudoku();
    const boardKeyboard = buildSudokuKeyboard(puzzle);

    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: boardKeyboard }
      })
    });
  }
  else if (data.startsWith('set_')) {
    const [, r, c, val] = data.split('_');
    const puzzle = generateSudoku();
    puzzle[r][c] = parseInt(val);
    const boardKeyboard = buildSudokuKeyboard(puzzle);

    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: boardKeyboard }
      })
    });
  }
        }
