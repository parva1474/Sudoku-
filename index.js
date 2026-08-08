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
        return new Response('BOT_TOKEN is not set', { status: 500 });
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
  const boardString = encodeBoard(puzzle);
  const keyboard = buildSudokuKeyboard(puzzle, null, boardString);

  const results = [
    {
      type: 'article',
      id: 'sudoku_' + Date.now(),
      title: '🧩 شروع بازی سودوکو',
      description: 'برای ارسال جدول سودوکو به گروه کلیک کنید',
      input_message_content: {
        message_text: "🧩 **بازی سودوکو گروهی**\n\nبرای بازی روی خانه‌های جدول کلیک کنید.\n\n⚠️ *توجه: برای بازی باید عضو کانال‌های زیر باشید:* \n@nwechannell \n@parvapoem",
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
      cache_time: 0
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

  const parts = data.split('_');
  const action = parts[0];

  if (action === 'cell') {
    const r = parseInt(parts[1]);
    const c = parseInt(parts[2]);
    const boardString = parts[3];
    const puzzle = decodeBoard(boardString);

    const numberKeyboard = buildNumberKeyboard(r, c, boardString);

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
  else if (action === 'back' || action === 'new') {
    const puzzle = generateSudoku();
    const boardString = encodeBoard(puzzle);
    const boardKeyboard = buildSudokuKeyboard(puzzle, null, boardString);

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
  else if (action === 'set') {
    const r = parseInt(parts[1]);
    const c = parseInt(parts[2]);
    const val = parseInt(parts[3]);
    const boardString = parts[4];
    
    const puzzle = decodeBoard(boardString);
    puzzle[r][c] = val;

    const newBoardString = encodeBoard(puzzle);
    const boardKeyboard = buildSudokuKeyboard(puzzle, null, newBoardString);

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

function encodeBoard(board) {
  return board.flat().join('');
}

function decodeBoard(str) {
  let board = [];
  for (let i = 0; i < 9; i++) {
    let row = [];
    for (let j = 0; j < 9; j++) {
      row.push(parseInt(str[i * 9 + j]));
    }
    board.push(row);
  }
  return board;
    }
