import { 
  buildSudokuGridKeyboard, 
  buildNumberKeyboard, 
  buildDifficultyKeyboard, 
  buildFinishedKeyboard 
} from './keyboard.js';
import { generateSudoku, solveSudoku } from 'sudoku-core';

// شیء ذخیره موقت وضعیت بازی‌ها (در حافظه ورکر)
const activeGames = new Map();

export function createBoardText(game, selectedCell = -1) {
  let gridStr = "🧩 <b>سودوکو آنلاین</b>\n\n<code>";
  
  const board = game.board || Array(81).fill(0);

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col;
      const val = board[idx];
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

async function callTelegram(token, method, payload) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await response.json();
}

export async function handleUpdate(update, env) {
  const token = env.BOT_TOKEN;

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

    await callTelegram(token, 'answerCallbackQuery', {
      callback_query_id: query.id
    });

    let game = activeGames.get(chatId);

    if (data.startsWith('difficulty:') || data === 'action:new') {
      const difficulty = data.startsWith('difficulty:') ? data.split(':')[1] : (game?.difficulty || 'easy');
      
      // تولید سودوکوی واقعی با استفاده از پکیج sudoku-core
      const puzzle = generateSudoku({ difficulty });
      
      game = {
        board: puzzle.puzzle.map(val => val === null ? 0 : val),
        solution: puzzle.solution,
        difficulty: difficulty,
        progress: 0,
        errors: 0
      };
      
      activeGames.set(chatId, game);

      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(game),
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(game.board)
      });
      return new Response('OK', { status: 200 });
    }

    if (!game) {
      // اگر بازی موجود نبود، یک بازی پیش‌فرض می‌سازیم
      const puzzle = generateSudoku({ difficulty: 'easy' });
      game = {
        board: puzzle.puzzle.map(val => val === null ? 0 : val),
        solution: puzzle.solution,
        difficulty: 'easy',
        progress: 0,
        errors: 0
      };
      activeGames.set(chatId, game);
    }

    if (data.startsWith('row:')) {
      const rowIndex = parseInt(data.split(':')[1], 10);
      game.selectedRow = rowIndex;

      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(game) + `\n\n📍 سطر ${rowIndex + 1} انتخاب شد. حالا عدد مورد نظر را انتخاب کنید:`,
        parse_mode: 'HTML',
        reply_markup: buildNumberKeyboard(game)
      });
    }

    if (data === 'action:grid') {
      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(game),
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(game.board)
      });
    }
  }

  return new Response('OK', { status: 200 });
}
