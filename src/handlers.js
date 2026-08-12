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
const globalScores = {};

export function createBoardText(game, highlightCell = -1) {
  const board = game.board || Array(81).fill(0);

  const filledCount = board.filter(v => v !== 0).length;
  game.progress = Math.round((filledCount / 81) * 100);

  // جدول با فاصله استاندارد و خوانا داخل تگ code
  let gridStr = `🧩 <b>سودوکو چندنفره آنلاین</b>\n👤 بازیکن: ${game.playerNames[game.turnUserId] || 'بازیکن'}\n\n<code>`;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col;
      const val = board[idx];
      let display = val !== 0 ? val : '.';
      
      if (idx === highlightCell) {
        gridStr += `[${display}]`;
      } else {
        gridStr += ` ${display} `;
      }
      
      if ((col + 1) % 3 === 0 && col < 8) {
        gridStr += "|";
      }
    }
    gridStr += "\n";
    
    if ((row + 1) % 3 === 0 && row < 8) {
      gridStr += "-------------------------+\n";
    }
  }
  gridStr += `</code>`;

  // آمار و امتیازات خارج از تگ code برای جلوگیری از به هم ریختگی
  const counts = {};
  for (let i = 1; i <= 9; i++) {
    counts[i] = 9;
  }
  for (let i = 0; i < 81; i++) {
    const val = board[i];
    if (val >= 1 && val <= 9) {
      counts[val]--;
    }
  }

  let remainingText = "\n🔢 <b>باقیمانده اعداد:</b>\n";
  let line1 = [];
  let line2 = [];
  for (let i = 1; i <= 5; i++) {
    line1.push(`${i}:(${counts[i]})`);
  }
  for (let i = 6; i <= 9; i++) {
    line2.push(`${i}:(${counts[i]})`);
  }
  remainingText += line1.join(' | ') + "\n" + line2.join(' | ');

  let scoresSummary = "\n⭐ <b>امتیازات کل:</b>\n";
  for (let pId in game.playerNames) {
    const totalScore = globalScores[pId] || 0;
    scoresSummary += `👤 ${game.playerNames[pId]}: ${totalScore} امتیاز\n`;
  }

  return `${gridStr}\n${remainingText}\n${scoresSummary}\n📊 <b>پیشرفت:</b> ${game.progress}% | ❌ <b>خطا:</b> ${game.errors[game.turnUserId] || 0}/4`;
}

function isBoxComplete(board, boxIndex) {
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = (startRow + r) * 9 + (startCol + c);
      if (board[idx] === 0) return false;
    }
  }
  return true;
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
      
      let newPuzzleObj;
      let attempts = 0;
      do {
        newPuzzleObj = generateSudoku(difficulty);
        attempts++;
      } while (game && game.usedPuzzles && game.usedPuzzles.has(newPuzzleObj.id) && attempts < 10);

      const usedPuzzlesSet = game && game.usedPuzzles ? game.usedPuzzles : new Set();
      usedPuzzlesSet.add(newPuzzleObj.id);

      if (data === 'action:new' && chatId) {
        game = {
          board: [...newPuzzleObj.puzzle],
          solution: [...newPuzzleObj.solution],
          difficulty: difficulty,
          scores: {},
          errors: {},
          banTimes: {},
          playerNames: {},
          usedPuzzles: usedPuzzlesSet
        };
        activeGames.set(gameKey, game);
        game.playerNames[userId] = userName;
        game.turnUserId = userId;

        await callTelegram(token, 'sendMessage', {
          chat_id: chatId,
          text: createBoardText(game, -1) + "\n\n👇 <b>یک بلوک انتخاب کنید:</b>",
          parse_mode: 'HTML',
          reply_markup: buildSudokuGridKeyboard(game.board)
        });
        return new Response('OK', { status: 200 });
      }
      
      game = {
        board: [...newPuzzleObj.puzzle],
        solution: [...newPuzzleObj.solution],
        difficulty: difficulty,
        scores: {},
        errors: {},
        banTimes: {},
        playerNames: {},
        usedPuzzles: usedPuzzlesSet
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

    if (data.startsWith('box_done:')) {
      await callTelegram(token, 'answerCallbackQuery', {
        callback_query_id: query.id,
        text: 'این بلوک قبلاً تکمیل شده است!',
        show_alert: true
      });
      return new Response('OK', { status: 200 });
    }

    if (data.startsWith('num_done:')) {
      await callTelegram(token, 'answerCallbackQuery', {
        callback_query_id: query.id,
        text: 'این عدد ۹ بار کامل روی جدول استفاده شده است!',
        show_alert: true
      });
      return new Response('OK', { status: 200 });
    }

    if (data.startsWith('box:')) {
      const boxIndex = parseInt(data.split(':')[1], 10);
      
      if (isBoxComplete(game.board, boxIndex)) {
        await callTelegram(token, 'answerCallbackQuery', {
          callback_query_id: query.id,
          text: 'این بلوک کامل شده است و قابل انتخاب نیست!',
          show_alert: true
        });
        return new Response('OK', { status: 200 });
      }

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
      editPayload.reply_markup = buildNumberKeyboard(game.board, boxIndex, cellIndex);

      await callTelegram(token, 'editMessageText', editPayload);
      return new Response('OK', { status: 200 });
    }

    if (data.startsWith('num:')) {
      const parts = data.split(':');
      const cellIndex = parseInt(parts[1], 10);
      const num = parseInt(parts[2], 10);
      
      const boxIndex = game.activeBox !== undefined ? game.activeBox : 0;

      if (!game.scores[userId]) game.scores[userId] = 0;
      if (!globalScores[userId]) globalScores[userId] = 0;
      if (!game.errors[userId]) game.errors[userId] = 0;

      if (num === 0) {
        game.board[cellIndex] = 0;
      } else {
        if (game.solution[cellIndex] === num) {
          game.board[cellIndex] = num;
          game.scores[userId] += 1;
          globalScores[userId] += 1;
        } else {
          game.errors[userId] += 1;
          game.scores[userId] = Math.max(0, game.scores[userId] - 2);
          globalScores[userId] = Math.max(0, globalScores[userId] - 2);
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
            return `${medal} ${game.playerNames[id]}: امتیاز این بازی: ${score} | امتیاز کل: ${globalScores[id]}`;
          })
          .join('\n');

        editPayload.text = createBoardText(game, -1) + `\n\n🏆 <b>بازی به پایان رسید و جدول کامل شد!</b>\n\n${scoresText}`;
        editPayload.reply_markup = buildFinishedKeyboard();
      } else {
        editPayload.text = createBoardText(game, -1) + `\n\n👇 <b>یک بلوک انتخاب کنید:</b>`;
        editPayload.reply_markup = buildSudokuGridKeyboard(game.board);
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
