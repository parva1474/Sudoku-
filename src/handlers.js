import { 
  buildSudokuGridKeyboard, 
  buildNumberKeyboard, 
  buildDifficultyKeyboard, 
  buildFinishedKeyboard 
} from './keyboard.js';

export function createBoardText(game, selectedCell = -1) {
  let gridStr = "🧩 <b>سودوکو آنلاین</b>\n\n<code>";
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col;
      const val = game.board ? game.board[idx] : 0;
      let char = val ? String(val) : "·";
      
      if (idx === selectedCell) {
        gridStr += `[${char}]`;
      } else {
        gridStr += ` ${char} `;
      }
      
      if ((col + 1) % 3 === 0 && col < 8) {
        gridStr += "|";
      }
    }
    gridStr += "\n";
    
    if ((row + 1) % 3 === 0 && row < 8) {
      gridStr += "---------------------\n";
    }
  }
  
  const progress = game.progress !== undefined ? game.progress : 0;
  const errors = game.errors !== undefined ? game.errors : 0;

  gridStr += "</code>\n\n📊 <b>پیشرفت:</b> " + progress + "% | ❌ <b>اشتباه:</b> " + errors;
  gridStr += "\n\n👇 روی سطر مورد نظر کلیک کنید:";
  
  return gridStr;
}

// تابع کمکی برای ارسال درخواست به تلگرام
async function callTelegram(token, method, payload) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await response.json();
}

export async function handleUpdate(request, env) {
  const update = await request.json();
  const token = env.BOT_TOKEN; // توکن ربات از متغیرهای محیطی

  if (update.message) {
    const msg = update.message;
    if (msg.text === '/start') {
      await callTelegram(token, 'sendMessage', {
        chat_id: msg.chat.id,
        text: '🧩 <b>سودوکو آنلاین</b>\n\nلطفاً درجه سختی بازی را انتخاب کنید:',
        parse_mode: 'HTML',
        reply_markup: buildDifficultyKeyboard()
      });
    }
  }

  if (update.callback_query) {
    const query = update.callback_query;
    const data = query.data;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    const dummyGame = {
      board: Array(81).fill(0),
      progress: 0,
      errors: 0
    };

    if (data.startsWith('difficulty:')) {
      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(dummyGame),
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(dummyGame.board)
      });
    }

    if (data.startsWith('row:')) {
      const rowIndex = parseInt(data.split(':')[1], 10);
      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(dummyGame) + `\n\n📍 سطر ${rowIndex + 1} انتخاب شد.`,
        parse_mode: 'HTML',
        reply_markup: buildNumberKeyboard(dummyGame)
      });
    }

    if (data === 'action:grid' || data === 'action:new') {
      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(dummyGame),
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(dummyGame.board)
      });
    }
  }

  return new Response('OK', { status: 200 });
}
