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

export function createBoardText(game, highlightCell = -1) {
  let gridStr = `🧩 <b>سودوکو چندنفره آنلاین</b>\n👤 بازیکن: ${game.playerNames[game.turnUserId] || 'بازیکن'}\n\n<code>`;
  
  const board = game.board || Array(81).fill(0);

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col;
      const val = board[idx];
      
      if (idx === highlightCell) {
        gridStr += `[${val !== 0 ? val : '.'}]`;
      } else if (val !== 0) {
        gridStr += ` ${val} `;
      } else {
        gridStr += ` . `;
      }
      
      if ((col + 1) % 3 === 0 && col < 8) {
        gridStr += "|";
      } else {
        gridStr += " ";
      }
    }
    gridStr += "\n";
    
    if ((row + 1) % 3 === 0 && row < 8) {
      gridStr += "-----------------------+\n";
    }
  }
  
  const filledCount = board.filter(v => v !== 0).length;
  game.progress = Math.round((filledCount / 81) * 100);

  gridStr += `</code>\n\n📊 <b>پیشرفت:</b> ${game.progress}% | ⭐ <b>امتیاز:</b> ${game.scores[game.turnUserId] || 0} | ❌ <b>خطا:</b> ${game.errors[game.turnUserId] || 0}/4`;
  
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
        text: '🧩 <b>سودوکو چندنفره آنلاین</b>\n\nهر بازیکن ۴ اجازه خطا دارد. اگر ۴ خطا کنید، پس از ۱۰ دقیقه می‌توانید دوباره به بازی برگردید!\nهر عدد درست ۱+ امتیاز و هر خطا ۲- امتیاز دارد.\n\nلطفاً درجه سختی بازی را انتخاب کنید:',
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
    const userId = query.from.id;
    const userName = query.from.first_name || 'بازیکن';

    await callTelegram(token, 'answerCallbackQuery', {
      callback_query_id: query.id
    });

    const chatId = query.message && query.message.chat ? query.message.chat.id : null;
    const messageId = query.message ? query.message.message_id : null;
    const inlineMessageId = query.inline_message_id;

    if (!chatId && !inlineMessageId) {
      return new Response('OK', { status: 200 });
    }

    const gameKey = chatId ? chatId : inlineMessageId;
    let game = activeGames.get(gameKey);

    if (data.startsWith('difficulty:') || data === 'action:new') {
      const difficulty = data.startsWith('difficulty:') ? data.split(':')[1] : (game?.difficulty || 'easy');
      const newPuzzleObj = generateSudoku(difficulty);
      
      game = {
        board: [...newPuzzleObj.puzzle],
        solution: [...newPuzzleObj.solution],
        difficulty: difficulty,
        scores: {},
        errors: {},
        banTimes: {},
        playerNames: {},
        usedPuzzles: new Set([newPuzzleObj.id])
      };
      
      activeGames.set(gameKey, game);

      game.playerNames[userId] = userName;
      game.turnUserId = userId;

      const payload = {
        text: createBoardText(game, -1) + "\n\n👇 <b>یک بلوک انتخاب کنید:</b>",
        parse_mode: 'HTML',
        reply_markup: buildSudokuGridKeyboard(game.board)
      };

      if (chatId) {
        payload.chat_id = chatId;
        payload.message_id = messageId;
      } else {
        payload.inline_message_id = inlineMessageId;
      }

      await callTelegram(token, 'editMessageText', payload);
      return new Response('OK', { status: 200 });
    }

    if (!game) {
      await callTelegram(token, 'answerCallbackQuery', {
        callback_query_id: query.id,
        text: 'بازی منقضی شده است. لطفاً دوباره شروع کنید.',
        show_alert: true
      });
      return new Response('OK', { status: 200 });
    }

    if (!game.playerNames[userId]) {
      game.playerNames[userId] = userName;
    }
    game.turnUserId = userId;

    if (game.errors[userId] >= 4) {
      const banTime = game.banTimes[userId] || 0;
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;

      if (now - banTime < tenMinutes) {
        const remainingSeconds = Math.ceil((tenMinutes - (now - banTime)) / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;

        await callTelegram(token, 'answerCallbackQuery', {
          callback_query_id: query.id,
          text: `❌ شما به دلیل ۴ خطا اخراج شده‌اید!\nلطفاً ${remainingMinutes} دقیقه و ${secs} ثانیه دیگر صبر کنید.`,
          show_alert: true
        });
        return new Response('OK', { status: 200 });
      } else {
        game.errors[userId] = 0;
        delete game.banTimes[userId];
      }
    }

    const editPayload = {
      parse_mode: 'HTML'
    };
    if (chatId) {
      editPayload.chat_id = chatId;
      editPayload.message_id = messageId;
    } else {
      editPayload.inline_message_id = inlineMessageId;
    }

    if (data.startsWith('box:')) {
      const boxIndex = parseInt(data.split(':')[1], 10);
      editPayload.text = createBoardText(game, -1) + `\n\n👇 <b>خانه مورد نظر را انتخاب کنید:</b>`;
      editPayload.reply_markup = buildBoxCellsKeyboard(game.board, boxIndex);
      
      await callTelegram(token, 'editMessageText', editPayload);
      return new Response('OK', { status: 200 });
    }

    if (data.startsWith('cell:')) {
      const parts = data.split(':');
      const boxIndex = parseInt(parts[1], 10);
      const cellIndex = parseInt(parts[2], 10);

      game.activeBox = boxIndex;
      game.activeCell = cellIndex;

      editPayload.text = createBoardText(game, cellIndex) + `\n\n👇 <b>عدد را انتخاب کنید:</b>`;
      editPayload.reply_markup = buildNumberKeyboard(boxIndex, cellIndex);

      await callTelegram(token, 'editMessageText', editPayload);
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
        game.banTimes[userId] = Date.now();
        
        await callTelegram(token, 'answerCallbackQuery', {
          callback_query_id: query.id,
          text: 'شما ۴ خطا کردید و از بازی اخراج شدید. ۱۰ دقیقه دیگر می‌توانید برگردید!',
          show_alert: true
        });

        editPayload.text = createBoardText(game, -1) + `\n\n❌ <b>${userName}</b> ۴ خطای مجاز را پر کرد و موقتاً اخراج شد!`;
        editPayload.reply_markup = buildBoxCellsKeyboard(game.board, boxIndex);
        await callTelegram(token, 'editMessageText', editPayload);
        return new Response('OK', { status: 200 });
      }

      const isFinished = game.board.every((val, idx) => val === game.solution[idx]);

      if (isFinished) {
        let sortedScores = Object.entries(game.scores).sort((a, b) => b[1] - a[1]);
        
        let scoresText = sortedScores
          .map(([id, score], index) => {
            const medal = index === 0 ? '👑 برنده:' : `👤`;
            return `${medal} ${game.playerNames[id]}: ${score} امتیاز`;
          })
          .join('\n');

        editPayload.text = createBoardText(game, -1) + `\n\n🏆 <b>بازی به پایان رسید و جدول کامل شد!</b>\n\n${scoresText}`;
        editPayload.reply_markup = buildFinishedKeyboard();
      } else {
        editPayload.text = createBoardText(game, -1) + `\n\n👇 <b>خانه دیگری انتخاب کنید:</b>`;
        editPayload.reply_markup = buildBoxCellsKeyboard(game.board, boxIndex);
      }

      await callTelegram(token, 'editMessageText', editPayload);
      return new Response('OK', { status: 200 });
    }

    if (data === 'action:grid') {
      editPayload.text = createBoardText(game, -1) + "\n\n👇 <b>یک بلوک انتخاب کنید:</b>";
      editPayload.reply_markup = buildSudokuGridKeyboard(game.board);
      
      await callTelegram(token, 'editMessageText', editPayload);
      return new Response('OK', { status: 200 });
    }
  }

  return new Response('OK', { status: 200 });
              }
