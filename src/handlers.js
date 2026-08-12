// ==========================================
// src/handlers.js
// ==========================================

import { 
  buildSudokuGridKeyboard, 
  buildBoxCellsKeyboard,
  buildNumberKeyboard, 
  buildDifficultyKeyboard, 
  buildFinishedKeyboard 
} from './keyboard.js';
import { generateSudoku } from './sudokuGenerator.js';

const activeGames = new Map();

const BOX_COLORS_BG = [
  "🟥", "🟥", "🟥",  "🟧", "🟧", "🟧",  "🟨", "🟨", "🟨",
  "🟥", "🟥", "🟥",  "🟧", "🟧", "🟧",  "🟨", "🟨", "🟨",
  "🟥", "🟥", "🟥",  "🟧", "🟧", "🟧",  "🟨", "🟨", "🟨",

  "🟩", "🟩", "🟩",  "🟦", "🟦", "🟦",  "🟪", "🟪", "🟪",
  "🟩", "🟩", "🟩",  "🟦", "🟦", "🟦",  "🟪", "🟪", "🟪",
  "🟩", "🟩", "🟩",  "🟦", "🟦", "🟦",  "🟪", "🟪", "🟪",

  "🟫", "🟫", "🟫",  "⬛", "⬛", "⬛",  "⬜", "⬜", "⬜",
  "🟫", "🟫", "🟫",  "⬛", "⬛", "⬛",  "⬜", "⬜", "⬜",
  "🟫", "🟫", "🟫",  "⬛", "⬛", "⬛",  "⬜", "⬜", "⬜"
];

export function createBoardText(game, highlightCell = -1) {
  let gridStr = `🧩 <b>سودوکو چندنفره آنلاین</b>\n👤 بازیکن: ${game.playerNames[game.turnUserId] || 'بازیکن'}\n\n<code>`;
  
  const board = game.board || Array(81).fill(0);

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col;
      const val = board[idx];
      const colorIcon = BOX_COLORS_BG[idx];
      
      if (idx === highlightCell) {
        gridStr += `[${val ? val + ' ' : '· '}]`;
      } else if (val !== 0) {
        gridStr += ` ${val} `;
      } else {
        gridStr += colorIcon;
      }
      
      if ((col + 1) % 3 === 0 && col < 8) {
        gridStr += "|";
      } else {
        gridStr += " ";
      }
    }
    gridStr += "\n";
    
    if ((row + 1) % 3 === 0 && row < 8) {
      gridStr += "-----------------------|\n";
    }
  }
  
  const filledCount = board.filter(v => v !== 0).length;
  game.progress = Math.round((filledCount / 81) * 100);

  gridStr += "</code>\n\n📊 <b>پیشرفت:</b> " + game.progress + "% | ⭐ <b>امتیاز:</b> " + (game.scores[game.turnUserId] || 0) + " | ❌ <b>خطاها:</b> " + (game.errors[game.turnUserId] || 0) + "/4";
  
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
        text: '🧩 <b>سودوکو چندنفره آنلاین</b>\n\nهر بازیکن ۳ اجازه خطا دارد و با خطای چهارم بازنده می‌شود.\nهر عدد درست ۱+ امتیاز و هر خطا ۲- امتیاز منفی دارد.\n\nلطفاً درجه سختی بازی را انتخاب کنید:',
        parse_mode: 'HTML',
        reply_markup: buildDifficultyKeyboard()
      });
    }
  }

  if (update.inline_query) {
    const inlineQuery = update.inline_query;
    const queryId = inlineQuery.id;
    
    const results = [
      {
        type: 'article',
        id: 'start_sudoku',
        title: '🧩 شروع بازی سودوکو آنلاین',
        description: 'کلیک کنید تا جدول سودوکو چندنفره ساخته شود',
        input_message_content: {
          message_text: '🧩 <b>سودوکو چندنفره آنلاین</b>\n\nلطفاً درجه سختی بازی را انتخاب کنید:',
          parse_mode: 'HTML'
        },
        reply_markup: buildDifficultyKeyboard()
      }
    ];

    await callTelegram(token, 'answerInlineQuery', {
      inline_query_id: queryId,
      results: results,
      cache_time: 0
    });

    return new Response('OK', { status: 200 });
  }

  if (update.callback_query) {
    const query = update.callback_query;
    const data = query.data;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;
    const userName = query.from.first_name || 'بازیکن';

    await callTelegram(token, 'answerCallbackQuery', {
      callback_query_id: query.id
    });

    let game = activeGames.get(chatId);

    if (data.startsWith('difficulty:') || data === 'action:new') {
      const difficulty = data.startsWith('difficulty:') ? data.split(':')[1] : (game?.difficulty || 'easy');
      
      const newPuzzleObj = generateSudoku(difficulty);
      
      game = {
        board: [...newPuzzleObj.puzzle],
        solution: [...newPuzzleObj.solution],
        difficulty: difficulty,
        scores: {},
        errors: {},
        playerNames: {},
        usedPuzzles: new Set([newPuzzleObj.id])
      };
      activeGames.set(chatId, game);

      game.playerNames[userId] = userName;
      game.turnUserId = userId;

      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(game, -1) + "\n\n👇 <b>یک بلوک انتخاب کنید:</b>",
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(game.board)
      });
      return new Response('OK', { status: 200 });
    }

    if (!game) {
      await callTelegram(token, 'answerCallbackQuery', {
        callback_query_id: query.id,
        text: 'بازی منقضی شده است. لطفاً /start را بزنید.',
        show_alert: true
      });
      return new Response('OK', { status: 200 });
    }

    if (!game.playerNames[userId]) {
      game.playerNames[userId] = userName;
    }
    game.turnUserId = userId;

    if (game.errors[userId] >= 4) {
      await callTelegram(token, 'answerCallbackQuery', {
        callback_query_id: query.id,
        text: 'شما ۴ خطا داشته‌اید و از این بازی حذف شده‌اید!',
        show_alert: true
      });
      return new Response('OK', { status: 200 });
    }

    if (data.startsWith('box:')) {
      const boxIndex = parseInt(data.split(':')[1], 10);

      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(game, -1) + `\n\n👇 <b>خانه مورد نظر را انتخاب کنید:</b>`,
        parse_mode: 'HTML',
        reply_markup: buildBoxCellsKeyboard(game.board, boxIndex)
      });
      return new Response('OK', { status: 200 });
    }

    if (data.startsWith('cell:')) {
      const parts = data.split(':');
      const boxIndex = parseInt(parts[1], 10);
      const cellIndex = parseInt(parts[2], 10);

      game.activeBox = boxIndex;
      game.activeCell = cellIndex;

      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(game, cellIndex) + `\n\n👇 <b>عدد را انتخاب کنید:</b>`,
        parse_mode: 'HTML',
        reply_markup: buildNumberKeyboard(boxIndex, cellIndex)
      });
      return new Response('OK', { status: 200 });
    }

    if (data.startsWith('num:')) {
      const parts = data.split(':');
      const cellIndex = parseInt(parts[1], 10);
      const num = parseInt(parts[2], 10);
      
      const boxIndex = game.activeBox !== undefined ? game.activeBox : 0;

      if (!game.scores[userId]) game.scores[userId] = 0;
      if (!game.errors[userId]) game.errors[userId] = 0;

      if (num === 0) {
        game.board[cellIndex] = 0;
      } else {
        if (game.solution[cellIndex] === num) {
          game.board[cellIndex] = num;
          game.scores[userId] += 1;
        } else {
          game.errors[userId] += 1;
          game.scores[userId] = Math.max(0, game.scores[userId] - 2);
        }
      }

      if (game.errors[userId] >= 4) {
        await callTelegram(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: createBoardText(game, -1) + `\n\n❌ <b>${userName}</b> ۴ خطای مجاز را پر کرد و باخت!`,
          parse_mode: 'HTML',
          reply_markup: buildFinishedKeyboard()
        });
        activeGames.delete(chatId);
        return new Response('OK', { status: 200 });
      }

      const isFinished = game.board.every((val, idx) => val === game.solution[idx]);

      if (isFinished) {
        let scoresText = Object.entries(game.scores)
          .map(([id, score]) => `👤 ${game.playerNames[id]}: ${score} امتیاز`)
          .join('\n');

        await callTelegram(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: createBoardText(game, -1) + `\n\n🏆 تبریک! جدول کامل شد!\n\n${scoresText}`,
          parse_mode: 'HTML',
          reply_markup: buildFinishedKeyboard()
        });
      } else {
        await callTelegram(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: createBoardText(game, -1) + `\n\n👇 <b>خانه دیگری انتخاب کنید:</b>`,
          parse_mode: 'HTML',
          reply_markup: buildBoxCellsKeyboard(game.board, boxIndex)
        });
      }
      return new Response('OK', { status: 200 });
    }

    if (data === 'action:grid') {
      await callTelegram(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: createBoardText(game, -1) + "\n\n👇 <b>یک بلوک انتخاب کنید:</b>",
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(game.board)
      });
      return new Response('OK', { status: 200 });
    }
  }

  return new Response('OK', { status: 200 });
}
