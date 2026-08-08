import { generateSudoku, buildSudokuKeyboard } from './sudoku.js';

// لیست کانال‌هایی که عضویت در آن‌ها اجباری است
const REQUIRED_CHANNELS = ['@nwechannell', '@parvapoem'];

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('OK');
    }

    try {
      const update = await request.json();

      // ۱. مدیریت حالت Inline (وقتی کاربر توی گروه یا چت می‌نویسه @sodoko)
      if (update.inline_query) {
        await handleInlineQuery(update.inline_query, env.BOT_TOKEN);
      } 
      // ۲. مدیریت کلیک روی دکمه‌های شیشه‌ای جدول یا اعداد
      else if (update.callback_query) {
        await handleCallbackQuery(update.callback_query, env.BOT_TOKEN);
      }

      return new Response('OK');
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

// پاسخ به اینلاین کوئری برای آوردن جدول سودوکو در گروه
async function handleInlineQuery(inlineQuery, token) {
  const queryId = inlineQuery.id;
  
  // ساخت جدول اولیه
  const { puzzle, notes } = generateSudoku('easy');
  const keyboard = buildSudokuKeyboard(puzzle, notes);

  // اضافه کردن کیبورد انتخاب اعداد در زیر پیام سودوکو
  keyboard.push([
    { text: "✏️ مداد (خاموش)", callback_data: "toggle_pencil" },
    { text: "🔄 بازی جدید", callback_data: "new_game" }
  ]);

  const results = [
    {
      type: 'article',
      id: 'sudoku_game_1',
      title: '🧩 شروع بازی سودوکو جدید',
      description: 'یک جدول ۹ در ۹ سودوکو برای گروه بسازید',
      input_message_content: {
        message_text: "🧩 **بازی سودوکو گروهی**\n\nبرای بازی روی خانه‌های جدول کلیک کنید و عدد مورد نظر را از دکمه‌های پایین انتخاب کنید.\n\n*نکته: برای بازی باید عضو کانال‌های زیر باشید:* \n@nwechannell \n@parvapoem",
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

// بررسی عضویت کاربر در کانال‌ها
async function checkUserMembership(userId, token) {
  for (const channel of REQUIRED_CHANNELS) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${channel}&user_id=${userId}`);
      const data = await res.json();
      if (!data.ok || ['left', 'kicked', 'restricted'].includes(data.result.status)) {
        return false; // کاربر عضو نیست
      }
    } catch (e) {
      return false;
    }
  }
  return true; // کاربر عضو هر دو کانال است
}

// مدیریت کلیک روی دکمه‌های شیشه‌ای
async function handleCallbackQuery(callbackQuery, token) {
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;

  // چک کردن عضویت اجباری کانال‌ها قبل از اجازه دادن به بازی
  const isMember = await checkUserMembership(userId, token);
  if (!isMember) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: "⚠️ برای بازی در سودوکو باید ابتدا در کانال‌های @nwechannell و @parvapoem عضو شوید!",
        show_alert: true
      })
    });
    return;
  }

  // تایید کلیک برای جلوگیری از حالت لودینگ دکمه
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id })
  });

  // اینجا می‌توانید منطق تغییر خانه‌ها، حالت مداد و دریافت عدد از کاربر را پیاده‌سازی کنید
}
