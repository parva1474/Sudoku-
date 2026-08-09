import { generateNewGame, isValid } from './sudoku.js';
import { renderSudokuSVG } from './sudokuRenderer.js';
import { sendSudokuPhoto, updateSudokuPhoto, answerCallback } from './telegram.js';
import { buildControlKeyboard } from './utils.js';

const BOT_TOKEN = '8604292634:AAHBsJ9HXgISutUw6S0qTRcOWi08nn38ZuY';
const activeGames = new Map();
const selectedCellsMap = new Map();

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Sudoku Bot is running!');
    }

    try {
      const update = await request.json();

      // ۱. پشتیبانی از دستور /start در چت شخصی
      if (update.message && update.message.text === '/start') {
        const chatId = update.message.chat.id;
        const gameState = generateNewGame();
        const sessionKey = `chat_${chatId}`;
        
        activeGames.set(sessionKey, gameState);
        selectedCellsMap.set(sessionKey, null);

        const svg = renderSudokuSVG(gameState, null);
        const keyboard = buildControlKeyboard(gameState, null);

        await sendSudokuPhoto(BOT_TOKEN, chatId, svg, keyboard);
      } 
      // ۲. پشتیبانی از حالت اینلاین (Inline Query) وقتی کاربر @botname را تایپ می‌کند
      else if (update.inline_query) {
        const inlineQuery = update.inline_query;
        const queryId = inlineQuery.id;
        const gameState = generateNewGame();
        const sessionKey = `inline_${queryId}`;
        
        activeGames.set(sessionKey, gameState);
        selectedCellsMap.set(sessionKey, null);

        const svg = renderSudokuSVG(gameState, null);
        
        // ارسال عکس یا مقاله اینلاین به تلگرام
        // نکته: برای اینلاین کوئری معمولاً متن یا عکس با لینک ارسال می‌شود
        const results = [
          {
            type: 'article',
            id: 'sudoku_' + Date.now(),
            title: '🧩 شروع بازی سودوکو کلاسیک',
            description: 'کلیک کنید تا جدول سودوکو برای گروه ارسال شود',
            input_message_content: {
              message_text: "🧩 **بازی سودوکو گروهی**\n\nبرای بازی و تعامل با جدول، از دکمه‌های زیر استفاده کنید.",
              parse_mode: 'Markdown'
            },
            reply_markup: buildControlKeyboard(gameState, null)
          }
        ];

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerInlineQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inline_query_id: queryId,
            results: results,
            cache_time: 0
          })
        });
      } 
      // ۳. مدیریت کلیک روی دکمه‌های شیشه‌ای (Callback Query)
      else if (update.callback_query) {
        const cq = update.callback_query;
        const chatId = cq.message ? cq.message.chat.id : null;
        const messageId = cq.message ? cq.message.message_id : null;
        const sessionKey = chatId ? `chat_${chatId}` : `inline_${cq.inline_message_id}`;

        if (!activeGames.has(sessionKey)) {
          activeGames.set(sessionKey, generateNewGame());
        }

        let gameState = activeGames.get(sessionKey);
        let selectedCell = selectedCellsMap.get(sessionKey) || null;
        const data = cq.data;

        if (data === 'noop') {
          await answerCallback(BOT_TOKEN, cq.id);
          return new Response('OK');
        }

        if (data === 'new_game') {
          gameState = generateNewGame();
          activeGames.set(sessionKey, gameState);
          selectedCell = null;
          selectedCellsMap.set(sessionKey, null);
        } else if (data === 'toggle_pencil') {
          gameState.pencilMode = !gameState.pencilMode;
        } else if (data === 'deselect') {
          selectedCell = null;
          selectedCellsMap.set(sessionKey, null);
        } else if (data.startsWith('cell_')) {
          const [, r, c] = data.split('_');
          selectedCell = { r: parseInt(r), c: parseInt(c) };
          selectedCellsMap.set(sessionKey, selectedCell);
        } else if (data.startsWith('input_') && selectedCell) {
          const val = parseInt(data.split('_')[1]);
          const { r, c } = selectedCell;
          let cell = gameState.board[r][c];

          if (!cell.given) {
            if (gameState.pencilMode) {
              if (val === 0) {
                cell.notes = [];
              } else {
                if (cell.notes.includes(val)) {
                  cell.notes = cell.notes.filter(n => n !== val);
                } else {
                  cell.notes.push(val);
                }
              }
            } else {
              if (val === 0) {
                cell.value = null;
                cell.isError = false;
              } else {
                cell.value = val;
                cell.notes = [];

                let tempVals = gameState.board.map(row => row.map(cell => cell.value));
                tempVals[r][c] = null;
                let isValidLocal = isValid(tempVals, r, c, val);

                if (!isValidLocal || val !== cell.solutionValue) {
                  cell.isError = true;
                  gameState.mistakes++;
                } else {
                  cell.isError = false;
                }
              }
            }

            let isComplete = true;
            let isAllCorrect = true;
            for (let row = 0; row < 9; row++) {
              for (let col = 0; col < 9; col++) {
                let cl = gameState.board[row][col];
                if (cl.value === null) isComplete = false;
                if (cl.value !== cl.solutionValue) isAllCorrect = false;
              }
            }
            if (isComplete && isAllCorrect) {
              gameState.status = 'COMPLETED';
            }
          }
        }

        await answerCallback(BOT_TOKEN, cq.id);

        const svg = renderSudokuSVG(gameState, selectedCell);
        const keyboard = buildControlKeyboard(gameState, selectedCell);

        if (chatId && messageId) {
          await updateSudokuPhoto(BOT_TOKEN, chatId, messageId, svg, keyboard);
        }
      }

      return new Response('OK');
    } catch (e) {
      console.error(e);
      return new Response(e.message, { status: 500 });
    }
  }
};
