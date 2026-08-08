const BOT_TOKEN = '8604292634:AAHBsJ9HXgISutUw6S0qTRcOWi08nn38ZuY';
const REQUIRED_CHANNELS = ['@nwechannell', '@parvapoem'];

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Bot is running and ready!');
    }

    try {
      const update = await request.json();

      if (update.inline_query) {
        await handleInlineQuery(update.inline_query, BOT_TOKEN);
      } else if (update.callback_query) {
        await handleCallbackQuery(update.callback_query, BOT_TOKEN);
      }

      return new Response('OK');
    } catch (e) {
      console.error(e);
      return new Response(e.message, { status: 500 });
    }
  }
};

// ----------------------------------------------------
// توابع بازی سودوکو و بلاک‌بندی ۳ در ۳
// ----------------------------------------------------
function generateSudoku() {
  const base = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 1, 5, 6, 4, 8, 9, 7],
    [5, 6, 4, 8, 9, 7, 2, 3, 1],
    [8, 9, 7, 2, 3, 1, 5, 6, 4],
    [3, 1, 2, 6, 4, 5, 9, 7, 8],
    [6, 4, 5, 9, 7, 8, 3, 1, 2],
    [9, 7, 8, 3, 1, 2, 6, 4, 5]
  ];

  let puzzle = base.map(row => [...row]);
  let removedCount = 0;
  while (removedCount < 35) {
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removedCount++;
    }
  }

  return puzzle;
}

// ساخت کیبورد با بلوک‌بندی ۳ تایی و کلیدهای اعداد در پایین صفحه
function buildSudokuKeyboard(board, selectedCell = null) {
  let keyboard = [];
  const emojis = ['⬛', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = board[r][c];
      let text = emojis[val];

      // اگر این خانه انتخاب شده باشد، دور آن علامت می‌گذاریم
      if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        text = '📍 ' + text;
      }

      row.push({
        text: text,
        callback_data: `select_${r}_${c}`
      });
    }
    keyboard.push(row);

    // ایجاد فاصله و بلوک‌بندی بصری بعد از سطرهای 3 و 6
    if (r === 2 || r === 5) {
      keyboard.push([
        { text: "➖ ➖ ➖ ➖ ➖ ➖ ➖ ➖ ➖", callback_data: "noop" }
      ]);
    }
  }

  // اگر خانه‌ای انتخاب شده باشد، کیبورد اعداد را زیر جدول نمایش می‌دهیم
  if (selectedCell) {
    const { r, c } = selectedCell;
    keyboard.push([
      { text: "1️⃣", callback_data: `set_${r}_${c}_1` },
      { text: "2️⃣", callback_data: `set_${r}_${c}_2` },
      { text: "3️⃣", callback_data: `set_${r}_${c}_3` },
      { text: "4️⃣", callback_data: `set_${r}_${c}_4` },
      { text: "5️⃣", callback_data: `set_${r}_${c}_5` }
    ]);
    keyboard.push([
      { text: "6️⃣", callback_data: `set_${r}_${c}_6` },
      { text: "7️⃣", callback_data: `set_${r}_${c}_7` },
      { text: "8️⃣", callback_data: `set_${r}_${c}_8` },
      { text: "9️⃣", callback_data: `set_${r}_${c}_9` },
      { text: "❌ پاک", callback_data: `set_${r}_${c}_0` }
    ]);
  }

  // دکمه‌های کنترلی پایانی
  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "new_game" },
    { text: "💡 راهنما", callback_data: "help_game" }
  ]);

  return keyboard;
}

// ----------------------------------------------------
// مدیریت درخواست‌ها
// ----------------------------------------------------
async function handleInlineQuery(inlineQuery, token) {
  const queryId = inlineQuery.id;
  const puzzle = generateSudoku();
  const keyboard = buildSudokuKeyboard(puzzle, null);

  const results = [
    {
      type: 'article',
      id: 'sudoku_' + Date.now(),
      title: '🧩 شروع بازی سودوکو',
      description: 'برای ارسال جدول سودوکو به گروه کلیک کنید',
      input_message_content: {
        message_text: "🧩 **بازی سودوکو گروهی**\n\nبرای بازی روی خانه‌های جدول کلیک کنید تا انتخاب شوند، سپس عدد مورد نظر را از پایین انتخاب کنید.\n\n⚠️ *توجه: برای بازی باید عضو کانال‌های زیر باشید:* \n@nwechannell \n@parvapoem",
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

// متغیر موقت برای نگهداری وضعیت جدول‌ها در حافظه Worker
const activePuzzles = new Map();

async function handleCallbackQuery(callbackQuery, token) {
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (data === 'noop') {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQuery.id })
    });
    return;
  }

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

  let editPayload = {};
  let messageKey = '';
  if (callbackQuery.inline_message_id) {
    editPayload.inline_message_id = callbackQuery.inline_message_id;
    messageKey = callbackQuery.inline_message_id;
  } else if (callbackQuery.message) {
    editPayload.chat_id = callbackQuery.message.chat.id;
    editPayload.message_id = callbackQuery.message.message_id;
    messageKey = `${callbackQuery.message.chat.id}_${callbackQuery.message.message_id}`;
  }

  if (!activePuzzles.has(messageKey)) {
    activePuzzles.set(messageKey, generateSudoku());
  }
  let puzzle = activePuzzles.get(messageKey);

  let selectedCell = null;

  if (data === 'new_game') {
    puzzle = generateSudoku();
    activePuzzles.set(messageKey, puzzle);
  } else if (data.startsWith('select_')) {
    const [, r, c] = data.split('_');
    selectedCell = { r: parseInt(r), c: parseInt(c) };
  } else if (data.startsWith('set_')) {
    const [, r, c, val] = data.split('_');
    puzzle[r][c] = parseInt(val);
    activePuzzles.set(messageKey, puzzle);
  }

  editPayload.reply_markup = { inline_keyboard: buildSudokuKeyboard(puzzle, selectedCell) };

  await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(editPayload)
  });
    }
