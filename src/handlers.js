import { 
  buildSudokuGridKeyboard, 
  buildNumberKeyboard, 
  buildDifficultyKeyboard, 
  buildFinishedKeyboard 
} from './keyboard.js';

const activeGames = new Map();

const SUDOKU_PUZZLES = {
  easy: {
    puzzle: [
      5,3,0, 0,7,0, 0,0,0,
      6,0,0, 1,9,5, 0,0,0,
      0,9,8, 0,0,0, 0,6,0,
      8,0,0, 0,6,0, 0,0,3,
      4,0,0, 8,0,3, 0,0,1,
      7,0,0, 0,2,0, 0,0,6,
      0,6,0, 0,0,0, 2,8,0,
      0,0,0, 4,1,9, 0,0,5,
      0,0,0, 0,8,0, 0,7,9
    ],
    solution: [
      5,3,4, 6,7,8, 9,1,2,
      6,7,2, 1,9,5, 3,4,8,
      1,9,8, 3,4,2, 5,6,7,
      8,5,9, 7,6,1, 4,2,3,
      4,2,6, 8,5,3, 7,9,1,
      7,1,3, 9,2,4, 8,5,6,
      9,6,1, 5,3,7, 2,8,4,
      2,8,7, 4,1,9, 6,3,5,
      3,4,5, 2,8,6, 1,7,9
    ]
  },
  medium: {
    puzzle: [
      0,0,0, 2,6,0, 7,0,1,
      6,8,0, 0,7,0, 0,9,0,
      1,9,0, 0,0,4, 5,0,0,
      8,2,0, 1,0,0, 0,4,0,
      0,0,4, 6,0,2, 9,0,0,
      0,5,0, 0,0,3, 0,2,8,
      0,0,9, 3,0,0, 0,7,4,
      0,4,0, 0,5,0, 0,3,6,
      7,0,3, 0,1,8, 0,0,0
    ],
    solution: [
      4,3,5, 2,6,9, 7,8,1,
      6,8,2, 5,7,1, 4,9,3,
      1,9,7, 8,3,4, 5,6,2,
      8,2,6, 1,9,5, 3,4,7,
      3,7,4, 6,8,2, 9,1,5,
      9,5,1, 7,4,3, 6,2,8,
      5,1,9, 3,2,6, 8,7,4,
      2,4,8, 9,5,7, 1,3,6,
      7,6,3, 4,1,8, 2,5,9
    ]
  },
  hard: {
    puzzle: [
      0,2,0, 0,0,0, 0,0,0,
      0,0,0, 6,0,0, 0,0,3,
      0,7,4, 0,8,0, 0,0,0,
      0,0,0, 0,0,3, 0,2,0,
      0,8,0, 0,4,0, 0,1,0,
      0,1,0, 9,0,0, 0,0,0,
      0,0,0, 0,2,0, 4,8,0,
      0,0,0, 0,0,8, 0,0,7,
      0,0,0, 0,0,0, 0,3,0
    ],
    solution: [
      1,2,6,4,3,7,9,5,8,
      8,9,5,6,1,2,7,4,3,
      3,7,4,5,8,9,1,6,2,
      9,5,7,1,6,3,8,2,4,
      2,8,3,7,4,5,6,1,9,
      4,1,1,9,2,6,3,7,5,
      7,3,9,3,2,1,4,8,6,
      5,6,2,8,9,8,5,9,7,
      6,4,8,2,7,4,2,3,1
    ]
  }
};

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
  
  // محاسبه درصد پیشرفت بر اساس خانه‌های پرشده
  const filledCount = board.filter(v => v !== 0).length;
  game.progress = Math.round((filledCount / 81) * 100);

  gridStr += "</code>\n\n📊 <b>پیشرفت:</b> " + game.progress + "% | ❌ <b>اشتباه:</b> " + (game.errors || 0);
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
      const template = SUDOKU_PUZZLES[difficulty] || SUDOKU_PUZZLES.easy;
      
      game = {
        board: [...template.puzzle],
        solution: [...template.solution],
        difficulty: difficulty,
        initial: [...template.puzzle],
        errors: 0,
        selectedRow: null
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
      const template = SUDOKU_PUZZLES.easy;
      game = {
        board: [...template.puzzle],
        solution: [...template.solution],
        difficulty: 'easy',
        initial: [...template.puzzle],
        errors: 0,
        selectedRow: null
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

    if (data.startsWith('num:')) {
      const num = parseInt(data.split(':')[1], 10);
      
      if (game.selectedRow !== null && game.selectedRow !== undefined) {
        // پیدا کردن اولین خانه‌ی خالی (یا صفر) در آن سطر
        let targetCol = -1;
        for (let c = 0; c < 9; c++) {
          const idx = game.selectedRow * 9 + c;
          if (game.board[idx] === 0) {
            targetCol = c;
            break;
          }
        }

        if (targetCol !== -1) {
          const targetIdx = game.selectedRow * 9 + targetCol;
          // بررسی صحت عدد با پاسخنامه
          if (game.solution[targetIdx] === num) {
            game.board[targetIdx] = num;
          } else {
            game.errors = (game.errors || 0) + 1;
          }
        }
      }

      // چک کردن اتمام بازی
      const isFinished = game.board.every((val, idx) => val === game.solution[idx]);

      if (isFinished) {
        await callTelegram(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: createBoardText(game) + `\n\n🏆 تبریک! شما جدول را با موفقیت حل کردید!`,
          parse_mode: 'HTML',
          reply_markup: buildFinishedKeyboard()
        });
      } else {
        await callTelegram(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: createBoardText(game),
          parse_mode: 'HTML',
          reply_markup: buildSudokuGridKeyboard(game.board)
        });
      }
    }

    if (data === 'action:grid') {
      game.selectedRow = null;
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
