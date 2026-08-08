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
// توابع بازی سودوکو
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

function buildSudokuKeyboard(board) {
  let keyboard = [];
  const emojis = ['⬛', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = board[r][c];
      let text = emojis[val];

      row.push({
        text: text,
        callback_data: `cell_${r}_${c}`
      });
    }
    keyboard.push(row);
  }

  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "new_game" },
    { text: "💡 راهنما", callback_data: "help_game" }
  ]);

  return keyboard;
}

function buildNumberKeyboard(r, c) {
  return [
    [
      { text: "1️⃣", callback_data: `set_${r}_${c}_1` },
      { text: "2️⃣", callback_data: `set_${r}_${c}_2` },
      { text: "3️⃣", callback_data: `set_${r}_${c}_3` }
    ],
    [
      { text: "4️⃣", callback_data: `set_${r}_${c}_4` },
      { text: "5️⃣", callback_data: `set_${r}_${c}_5` },
      { text: "6️⃣", callback_data: `set_${r}_${c}_6` }
    ],
    [
      { text: "7️⃣", callback_data: `set_${r}_${c}_7` },
      { text: "8️⃣", callback_data: `set_${r}_${c}_8` },
      { text: "9️⃣", callback_data: `set_${r}_${c}_9` }
    ],
    [
      { text: "❌ پاک کردن", callback_data: `set_${r}_${c}_0` },
      { text: "🔙 بازگشت به جدول", callback_data: "back_to_board" }
    ]
  ];
}

// ----------------------------------------------------
// توابع مدیریت درخواست‌ها
// ----------------------------------------------------
async function handleInlineQuery(inlineQuery, token) {
  const queryId = inlineQuery.id;
  const puzzle = generateSudoku();
  const keyboard = buildSudokuKeyboard(puzzle);

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

  // بررسی عضویت
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

  // حذف علامت لودینگ دکمه
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id })
  });

  // ساختار لازم برای تغییر دکمه پیام‌ها چه در ربات چه در گروه‌ها (حالت اینلاین)
  let editPayload = {};
  if (callbackQuery.inline_message_id) {
    editPayload.inline_message_id = callbackQuery.inline_message_id;
  } else if (callbackQuery.message) {
    editPayload.chat_id = callbackQuery.message.chat.id;
    editPayload.message_id = callbackQuery.message.message_id;
  }

  // دقیقاً همان منطقی که گفتید سالم است
  if (data.startsWith('cell_')) {
    const [, r, c] = data.split('_');
    editPayload.reply_markup = { inline_keyboard: buildNumberKeyboard(r, c) };

    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPayload)
    });
  } 
  else if (data === 'back_to_board' || data === 'new_game') {
    const puzzle = generateSudoku();
    editPayload.reply_markup = { inline_keyboard: buildSudokuKeyboard(puzzle) };

    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPayload)
    });
  }
  else if (data.startsWith('set_')) {
    const [, r, c, val] = data.split('_');
    const puzzle = generateSudoku();
    puzzle[r][c] = parseInt(val);
    editPayload.reply_markup = { inline_keyboard: buildSudokuKeyboard(puzzle) };

    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPayload)
    });
  }
}
