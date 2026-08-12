import { 
  buildSudokuGridKeyboard, 
  buildNumberKeyboard, 
  buildDifficultyKeyboard, 
  buildFinishedKeyboard 
} from './keyboard.js';

// ==========================================
// تابع ساخت متن گرافیکی جدول ۹ در ۹
// ==========================================
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
      
      // جداکننده عمودی بلوک‌های ۳تایی
      if ((col + 1) % 3 === 0 && col < 8) {
        gridStr += "|";
      }
    }
    gridStr += "\n";
    
    // جداکننده افقی بلوک‌های ۳تایی
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

// ==========================================
// مدیریت دستورات و Callback Queryها
// ==========================================
export async function handleUpdate(update, env) {
  if (update.message) {
    const msg = update.message;
    if (msg.text === '/start') {
      return {
        method: 'sendMessage',
        chat_id: msg.chat.id,
        text: '🧩 <b>سودوکو آنلاین</b>\n\nلطفاً درجه سختی بازی را انتخاب کنید:',
        parse_mode: 'HTML',
        reply_markup: buildDifficultyKeyboard()
      };
    }
  }

  if (update.callback_query) {
    const query = update.callback_query;
    const data = query.data;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    // نمونه بازی فرضی برای رندر جدول
    const dummyGame = {
      board: Array(81).fill(0),
      progress: 0,
      errors: 0
    };

    if (data.startsWith('difficulty:')) {
      return {
        method: 'editMessageText',
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(dummyGame),
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(dummyGame.board)
      };
    }

    if (data.startsWith('row:')) {
      const rowIndex = parseInt(data.split(':')[1], 10);
      return {
        method: 'editMessageText',
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(dummyGame) + `\n\n📍 سطر ${rowIndex + 1} انتخاب شد.`,
        parse_mode: 'HTML',
        reply_markup: buildNumberKeyboard(dummyGame)
      };
    }

    if (data === 'action:grid' || data === 'action:new') {
      return {
        method: 'editMessageText',
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(dummyGame),
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(dummyGame.board)
      };
    }
  }

  return new Response('OK');
}
