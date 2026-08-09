import { generateNewGame, isValid } from './sudoku.js';
import { renderSudokuSVG } from './sudokuRenderer.js';
import { sendSudokuPhoto, updateSudokuPhoto, answerCallback } from './telegram.js';
import { buildControlKeyboard } from './utils.js';

const BOT_TOKEN = '8604292634:AAHBsJ9HXgISutUw6S0qTRcOWi08nn38ZuY';
const REQUIRED_CHANNELS = ['@nwechannell', '@parvapoem'];

// ذخیره‌سازی وضعیت بازی و امتیازات کاربران به صورت تفکیک‌شده برای هر گروه/چت
const activeGames = new Map();
const selectedCellsMap = new Map();
const userScoresMap = new Map(); // ذخیره امتیازات و خطاهای هر کاربر در هر بازی: { userId: { score: 100, mistakes: 0 } }

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

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Sudoku Bot is running!');
    }

    try {
      const update = await request.json();

      if (update.message && update.message.text === '/start') {
        const chatId = update.message.chat.id;
        const userId = update.message.from.id;

        // بررسی عضویت اجباری در کانال‌ها
        const isMember = await checkUserMembership(userId, BOT_TOKEN);
        if (!isMember) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: "⚠️ برای بازی سودوکو باید ابتدا در کانال‌های زیر عضو شوید:\n1️⃣ @nwechannell\n2️⃣ @parvapoem\n\nسپس دوباره دستور /start را ارسال کنید."
            })
          });
          return new Response('OK');
        }

        const gameState = generateNewGame();
        const sessionKey = `chat_${chatId}`;
        
        activeGames.set(sessionKey, gameState);
        selectedCellsMap.set(sessionKey, null);
        userScoresMap.set(sessionKey, new Map()); // ریست امتیازات گروه

        const svg = renderSudokuSVG(gameState, null);
        const keyboard = buildControlKeyboard(gameState, null);

        await sendSudokuPhoto(BOT_TOKEN, chatId, svg, keyboard);
      } 
      else if (update.inline_query) {
        const inlineQuery = update.inline_query;
        const queryId = inlineQuery.id;
        const gameState = generateNewGame();
        const sessionKey = `inline_${queryId}`;
        
        activeGames.set(sessionKey, gameState);
        selectedCellsMap.set(sessionKey, null);
        userScoresMap.set(sessionKey, new Map());

        const svg = renderSudokuSVG(gameState, null);
        
        const results = [
          {
            type: 'article',
            id: 'sudoku_' + Date.now(),
            title: '🧩 شروع بازی گروهی سودوکو',
            description: 'ارسال جدول سودوکو به گروه (چندنفره با ثبت امتیاز مجزا)',
            input_message_content: {
              message_text: "🧩 **بازی گروهی سودوکو**\n\nهر کاربر می‌تواند خانه انتخاب کند و امتیازش ثبت شود. (حداکثر ۳ خطا مجاز برای هر نفر)",
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
      else if (update.callback_query) {
        const cq = update.callback_query;
        const userId = cq.from.id;
        const userName = cq.from.first_name || 'کاربر';
        const chatId = cq.message ? cq.message.chat.id : null;
        const messageId = cq.message ? cq.message.message_id : null;
        const sessionKey = chatId ? `chat_${chatId}` : `inline_${cq.inline_message_id}`;

        // بررسی عضویت اجباری برای کلیک روی دکمه‌ها
        const isMember = await checkUserMembership(userId, BOT_TOKEN);
        if (!isMember) {
          await answerCallback(BOT_TOKEN, cq.id, "⚠️ ابتدا باید در کانال‌های @nwechannell و @parvapoem عضو شوید!");
          return new Response('OK');
        }

        if (!activeGames.has(sessionKey)) {
          activeGames.set(sessionKey, generateNewGame());
          userScoresMap.set(sessionKey, new Map());
        }

        let gameState = activeGames.get(sessionKey);
        let selectedCell = selectedCellsMap.get(sessionKey) || null;
        let scores = userScoresMap.get(sessionKey);

        if (!scores.has(userId)) {
          scores.set(userId, { name: userName, score: 100, mistakes: 0 });
        }
        let userStats = scores.get(userId);

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
          userScoresMap.set(sessionKey, new Map());
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
          // بررسی محدودیت خطای کاربر (حداکثر ۳ خطا، خطای چهارم اخراج از ثبت حرکت)
          if (userStats.mistakes >= 3) {
            await answerCallback(BOT_TOKEN, cq.id, "❌ شما ۳ خطای خود را مصرف کرده‌اید و دیگر نمی‌توانید حرکتی انجام دهید!");
            return new Response('OK');
          }

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

                // بررسی صحت حرکت (اگر اشتباه باشد یا با solution نخواند)
                if (!isValidLocal || val !== cell.solutionValue) {
                  cell.isError = true;
                  userStats.mistakes++;
                  userStats.score = Math.max(0, userStats.score - 5); // کسر ۵ امتیاز به ازای هر خطا
                  gameState.mistakes++;
                } else {
                  cell.isError = false;
                  userStats.score += 10; // پاداش حرکت درست
                }
              }
            }

            // بررسی وضعیت اتمام بازی
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
        const keyboard = buildControlKeyboard(gameState, selectedCell, scores);

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
