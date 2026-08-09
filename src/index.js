// ==========================================
// index.js
// کنترل اصلی ربات سودوکو
// ==========================================

import {
  generateNewGame,
  isValid,
  isGameComplete
} from './sudoku.js';

import { renderSudokuSVG } from './sudokuRenderer.js';

import {
  sendSudokuPhoto,
  updateSudokuPhoto,
  updateInlineSudokuPhoto,
  answerCallback
} from './telegram.js';

import { buildControlKeyboard } from './utils.js';


// ==========================================
// تنظیمات
// ==========================================

// ⚠️ بهتر است بعداً این توکن را داخل Secret کلادفلر قرار بدهی.
const BOT_TOKEN = 'توکن_ربات_خودت_را_اینجا_قرار_بده';

const REQUIRED_CHANNELS = [
  '@nwechannell',
  '@parvapoem'
];


// ==========================================
// حافظه بازی‌ها
// ==========================================

const activeGames = new Map();

const selectedCellsMap = new Map();

const userScoresMap = new Map();


// ==========================================
// بررسی عضویت کاربر
// ==========================================

async function checkUserMembership(userId) {

  for (const channel of REQUIRED_CHANNELS) {

    try {

      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember` +
        `?chat_id=${channel}&user_id=${userId}`
      );

      const data = await response.json();

      if (
        !data.ok ||
        ['left', 'kicked', 'restricted'].includes(
          data.result.status
        )
      ) {
        return false;
      }

    } catch (error) {

      console.error(
        'Membership check error:',
        error
      );

      return false;
    }
  }

  return true;
}


// ==========================================
// ساخت شناسه یکتا برای بازی Inline
// ==========================================

function createGameId() {

  return (
    Date.now().toString(36) +
    '_' +
    Math.random()
      .toString(36)
      .substring(2, 8)
  );
}


// ==========================================
// استخراج session از callback
// ==========================================

function getSessionFromCallback(cq) {

  // پیام معمولی گروه / خصوصی
  if (cq.message) {

    return {
      type: 'chat',
      sessionKey: `chat_${cq.message.chat.id}`,
      chatId: cq.message.chat.id,
      messageId: cq.message.message_id,
      inlineMessageId: null
    };
  }

  // پیام Inline
  if (cq.inline_message_id) {

    return {
      type: 'inline',
      sessionKey: `inline_${cq.inline_message_id}`,
      chatId: null,
      messageId: null,
      inlineMessageId: cq.inline_message_id
    };
  }

  return null;
}


// ==========================================
// ساخت بازی جدید
// ==========================================

function createGameSession(sessionKey) {

  const gameState = generateNewGame();

  activeGames.set(
    sessionKey,
    gameState
  );

  selectedCellsMap.set(
    sessionKey,
    null
  );

  userScoresMap.set(
    sessionKey,
    new Map()
  );

  return gameState;
}


// ==========================================
// دریافت اطلاعات بازیکن
// ==========================================

function getUserStats(
  scores,
  userId,
  userName
) {

  if (!scores.has(userId)) {

    scores.set(
      userId,
      {
        name: userName,
        score: 100,
        mistakes: 0
      }
    );
  }

  return scores.get(userId);
}


// ==========================================
// پردازش انتخاب خانه
// ==========================================

function selectCell(
  sessionKey,
  gameState,
  row,
  col
) {

  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    row > 8 ||
    col < 0 ||
    col > 8
  ) {
    return null;
  }

  const cell = gameState.board[row][col];

  const selectedCell = {
    r: row,
    c: col
  };

  selectedCellsMap.set(
    sessionKey,
    selectedCell
  );

  return selectedCell;
}


// ==========================================
// پردازش ورود عدد
// ==========================================

function processNumberInput(
  gameState,
  selectedCell,
  userStats,
  value
) {

  if (!selectedCell) {

    return {
      ok: false,
      message: '👇 ابتدا یک خانه را انتخاب کنید.'
    };
  }


  const {
    r,
    c
  } = selectedCell;


  const cell = gameState.board[r][c];


  // ========================================
  // خانه ثابت
  // ========================================

  if (cell.given) {

    return {
      ok: false,
      message: '🔒 این خانه از ابتدا پر شده و قابل تغییر نیست.'
    };
  }


  // ========================================
  // محدودیت خطا
  // ========================================

  if (userStats.mistakes >= 3) {

    return {
      ok: false,
      message:
        '❌ شما ۳ خطا داشته‌اید و دیگر نمی‌توانید حرکت انجام دهید.'
    };
  }


  // ========================================
  // پاک کردن
  // ========================================

  if (value === 0) {

    cell.value = null;
    cell.isError = false;

    return {
      ok: true
    };
  }


  // ========================================
  // حالت مداد
  // ========================================

  if (gameState.pencilMode) {

    if (cell.notes.includes(value)) {

      cell.notes =
        cell.notes.filter(
          n => n !== value
        );

    } else {

      // فقط عددهای 1 تا 9
      if (value >= 1 && value <= 9) {

        cell.notes.push(value);

        cell.notes.sort(
          (a, b) => a - b
        );
      }
    }

    return {
      ok: true
    };
  }


  // ========================================
  // حالت عادی
  // ========================================

  const boardValues =
    gameState.board.map(
      row =>
        row.map(
          currentCell =>
            currentCell.value ?? 0
        )
    );


  // خانه فعلی را موقتاً خالی می‌کنیم
  boardValues[r][c] = 0;


  // ========================================
  // بررسی قوانین سودوکو
  // ========================================

  const validByRules =
    isValid(
      boardValues,
      r,
      c,
      value
    );


  // ========================================
  // عدد اشتباه
  // ========================================

  if (
    !validByRules ||
    value !== cell.solutionValue
  ) {

    cell.value = value;
    cell.isError = true;

    userStats.mistakes++;

    userStats.score =
      Math.max(
        0,
        userStats.score - 5
      );

    gameState.mistakes++;

    return {
      ok: true,
      error: true,
      message:
        !validByRules
          ? '❌ این عدد با قوانین سودوکو سازگار نیست.'
          : '❌ عدد واردشده جواب این خانه نیست.'
    };
  }


  // ========================================
  // عدد صحیح
  // ========================================

  cell.value = value;

  cell.notes = [];

  cell.isError = false;

  userStats.score += 10;


  // ========================================
  // بررسی تکمیل بازی
  // ========================================

  if (
    isGameComplete(gameState)
  ) {

    gameState.status =
      'COMPLETED';

    return {
      ok: true,
      completed: true,
      message:
        '🎉 تبریک! سودوکو را کامل حل کردید!'
    };
  }


  return {
    ok: true
  };
}


// ==========================================
// Handler اصلی
// ==========================================

export default {

  async fetch(
    request,
    env,
    ctx
  ) {

    // ========================================
    // فقط POST
    // ========================================

    if (request.method !== 'POST') {

      return new Response(
        'Sudoku Bot is running!'
      );
    }


    try {

      const update =
        await request.json();


      // ======================================
      // /start
      // ======================================

      if (
        update.message &&
        update.message.text === '/start'
      ) {

        const chatId =
          update.message.chat.id;

        const userId =
          update.message.from.id;


        // بررسی عضویت
        const isMember =
          await checkUserMembership(
            userId
          );


        if (!isMember) {

          await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body: JSON.stringify({
                chat_id: chatId,

                text:
                  '⚠️ برای بازی سودوکو باید ابتدا در کانال‌های زیر عضو شوید:\n\n' +
                  '1️⃣ @nwechannell\n' +
                  '2️⃣ @parvapoem\n\n' +
                  'سپس دوباره /start را ارسال کنید.'
              })
            }
          );

          return new Response('OK');
        }


        // ساخت بازی
        const sessionKey =
          `chat_${chatId}`;

        const gameState =
          createGameSession(
            sessionKey
          );


        const svg =
          renderSudokuSVG(
            gameState,
            null
          );


        const keyboard =
          buildControlKeyboard(
            gameState,
            null,
            null
          );


        await sendSudokuPhoto(
          BOT_TOKEN,
          chatId,
          svg,
          keyboard
        );


        return new Response('OK');
      }


      // ======================================
      // Inline Query
      // ======================================

      if (update.inline_query) {

        const inlineQuery =
          update.inline_query;

        const queryId =
          inlineQuery.id;


        /*
         * بازی واقعی هنوز پیام نشده،
         * بنابراین session بعداً با inline_message_id
         * ساخته/شناسایی می‌شود.
         */

        const results = [

          {
            type: 'article',

            id:
              'sudoku_' +
              Date.now(),

            title:
              '🧩 شروع بازی گروهی سودوکو',

            description:
              'سودوکوی ۹×۹ چندنفره',

            input_message_content: {

              message_text:
                '🧩 بازی سودوکو\n\n' +
                'برای شروع، جدول را از دکمه‌های زیر بازی کنید.',

              parse_mode:
                'Markdown'
            },

            reply_markup: {

              inline_keyboard: [

                [
                  {
                    text:
                      '🎮 ساخت بازی سودوکو',

                    callback_data:
                      `inline_start_${queryId}`
                  }
                ]

              ]
            }
          }

        ];


        await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/answerInlineQuery`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              inline_query_id:
                queryId,

              results,

              cache_time: 0,

              is_personal: true
            })
          }
        );


        return new Response('OK');
      }


      // ======================================
      // Callback Query
      // ======================================

      if (update.callback_query) {

        const cq =
          update.callback_query;

        const userId =
          cq.from.id;

        const userName =
          cq.from.first_name ||
          'کاربر';

        const data =
          cq.data || '';


        // ====================================
        // callback مربوط به شروع Inline
        // ====================================

        if (
          data.startsWith(
            'inline_start_'
          )
        ) {

          /*
           * این callback فقط برای پیام Inline است.
           *
           * وقتی کاربر روی دکمه کلیک کرد،
           * inline_message_id در اختیار ماست.
           */

          if (!cq.inline_message_id) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '❌ خطا: شناسه پیام Inline پیدا نشد.'
            );

            return new Response('OK');
          }


          const sessionKey =
            `inline_${cq.inline_message_id}`;


          const gameState =
            createGameSession(
              sessionKey
            );


          const selectedCell =
            null;


          const scores =
            userScoresMap.get(
              sessionKey
            );


          const svg =
            renderSudokuSVG(
              gameState,
              selectedCell
            );


          const keyboard =
            buildControlKeyboard(
              gameState,
              selectedCell,
              scores
            );


          await updateInlineSudokuPhoto(
            BOT_TOKEN,

            cq.inline_message_id,

            svg,

            keyboard
          );


          await answerCallback(
            BOT_TOKEN,
            cq.id
          );


          return new Response('OK');
        }


        // ====================================
        // شناسایی بازی
        // ====================================

        const session =
          getSessionFromCallback(cq);


        if (!session) {

          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '❌ بازی پیدا نشد.'
          );

          return new Response('OK');
        }


        const {
          sessionKey,
          type,
          chatId,
          messageId,
          inlineMessageId
        } = session;


        // ====================================
        // عضویت اجباری
        // ====================================

        const isMember =
          await checkUserMembership(
            userId
          );


        if (!isMember) {

          await answerCallback(
            BOT_TOKEN,
            cq.id,

            '⚠️ ابتدا در کانال‌های @nwechannell و @parvapoem عضو شوید!'
          );

          return new Response('OK');
        }


        // ====================================
        // اگر بازی وجود نداشت
        // ====================================

        if (
          !activeGames.has(
            sessionKey
          )
        ) {

          createGameSession(
            sessionKey
          );
        }


        const gameState =
          activeGames.get(
            sessionKey
          );


        let selectedCell =
          selectedCellsMap.get(
            sessionKey
          ) || null;


        const scores =
          userScoresMap.get(
            sessionKey
          );


        const userStats =
          getUserStats(
            scores,
            userId,
            userName
          );


        // ====================================
        // noop
        // ====================================

        if (
          data === 'noop'
        ) {

          await answerCallback(
            BOT_TOKEN,
            cq.id
          );

          return new Response('OK');
        }


        // ====================================
        // بازی جدید
        // ====================================

        if (
          data === 'new_game'
        ) {

          const newGame =
            generateNewGame();


          activeGames.set(
            sessionKey,
            newGame
          );


          selectedCellsMap.set(
            sessionKey,
            null
          );


          userScoresMap.set(
            sessionKey,
            new Map()
          );


          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '🔄 بازی جدید ساخته شد.'
          );


          const newSvg =
            renderSudokuSVG(
              newGame,
              null
            );


          const newScores =
            userScoresMap.get(
              sessionKey
            );


          const newKeyboard =
            buildControlKeyboard(
              newGame,
              null,
              newScores
            );


          if (
            type === 'chat'
          ) {

            await updateSudokuPhoto(
              BOT_TOKEN,
              chatId,
              messageId,
              newSvg,
              newKeyboard
            );

          } else {

            await updateInlineSudokuPhoto(
              BOT_TOKEN,
              inlineMessageId,
              newSvg,
              newKeyboard
            );
          }


          return new Response('OK');
        }


        // ====================================
        // انتخاب خانه
        // ====================================

        if (
          data.startsWith('cell_')
        ) {

          const parts =
            data.split('_');


          const row =
            Number(parts[1]);

          const col =
            Number(parts[2]);


          if (
            !Number.isInteger(row) ||
            !Number.isInteger(col) ||
            row < 0 ||
            row > 8 ||
            col < 0 ||
            col > 8
          ) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '❌ خانه نامعتبر است.'
            );

            return new Response('OK');
          }


          selectedCell =
            selectCell(
              sessionKey,
              gameState,
              row,
              col
            );


          await answerCallback(
            BOT_TOKEN,
            cq.id
          );


          const selectedSvg =
            renderSudokuSVG(
              gameState,
              selectedCell
            );


          const selectedKeyboard =
            buildControlKeyboard(
              gameState,
              selectedCell,
              scores
            );


          if (
            type === 'chat'
          ) {

            await updateSudokuPhoto(
              BOT_TOKEN,
              chatId,
              messageId,
              selectedSvg,
              selectedKeyboard
            );

          } else {

            await updateInlineSudokuPhoto(
              BOT_TOKEN,
              inlineMessageId,
              selectedSvg,
              selectedKeyboard
            );
          }


          return new Response('OK');
        }


        // ====================================
        // لغو انتخاب
        // ====================================

        if (
          data === 'deselect'
        ) {

          selectedCell =
            null;

          selectedCellsMap.set(
            sessionKey,
            null
          );


          await answerCallback(
            BOT_TOKEN,
            cq.id
          );


          const deselectedSvg =
            renderSudokuSVG(
              gameState,
              null
            );


          const deselectedKeyboard =
            buildControlKeyboard(
              gameState,
              null,
              scores
            );


          if (
            type === 'chat'
          ) {

            await updateSudokuPhoto(
              BOT_TOKEN,
              chatId,
              messageId,
              deselectedSvg,
              deselectedKeyboard
            );

          } else {

            await updateInlineSudokuPhoto(
              BOT_TOKEN,
              inlineMessageId,
              deselectedSvg,
              deselectedKeyboard
            );
          }


          return new Response('OK');
        }


        // ====================================
        // تغییر حالت مداد
        // ====================================

        if (
          data === 'toggle_pencil'
        ) {

          gameState.pencilMode =
            !gameState.pencilMode;


          await answerCallback(
            BOT_TOKEN,
            cq.id,

            gameState.pencilMode
              ? '✏️ حالت مداد روشن شد.'
              : '✏️ حالت مداد خاموش شد.'
          );


          const pencilSvg =
            renderSudokuSVG(
              gameState,
              selectedCell
            );


          const pencilKeyboard =
            buildControlKeyboard(
              gameState,
              selectedCell,
              scores
            );


          if (
            type === 'chat'
          ) {

            await updateSudokuPhoto(
              BOT_TOKEN,
              chatId,
              messageId,
              pencilSvg,
              pencilKeyboard
            );

          } else {

            await updateInlineSudokuPhoto(
              BOT_TOKEN,
              inlineMessageId,
              pencilSvg,
              pencilKeyboard
            );
          }


          return new Response('OK');
        }


        // ====================================
        // ورود عدد
        // ====================================

        if (
          data.startsWith('input_')
        ) {

          const value =
            Number(
              data.split('_')[1]
            );


          const result =
            processNumberInput(
              gameState,
              selectedCell,
              userStats,
              value
            );


          if (!result.ok) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              result.message ||
                '❌ این حرکت امکان‌پذیر نیست.'
            );

            return new Response('OK');
          }


          // پاسخ به callback
          await answerCallback(
            BOT_TOKEN,
            cq.id,
            result.message || null
          );


          // اگر بازی تمام شد
          if (
            result.completed
          ) {

            gameState.status =
              'COMPLETED';
          }


          const inputSvg =
            renderSudokuSVG(
              gameState,
              selectedCell
            );


          const inputKeyboard =
            buildControlKeyboard(
              gameState,
              selectedCell,
              scores
            );


          if (
            type === 'chat'
          ) {

            await updateSudokuPhoto(
              BOT_TOKEN,
              chatId,
              messageId,
              inputSvg,
              inputKeyboard
            );

          } else {

            await updateInlineSudokuPhoto(
              BOT_TOKEN,
              inlineMessageId,
              inputSvg,
              inputKeyboard
            );
          }


          return new Response('OK');
        }


        // ====================================
        // callback ناشناخته
        // ====================================

        await answerCallback(
          BOT_TOKEN,
          cq.id,
          '❓ دستور ناشناخته است.'
        );

        return new Response('OK');
      }

      return new Response('OK');

    } catch (error) {

      console.error(
        'MAIN ERROR:',
        error
      );

      return new Response(
        error?.message ||
          'Internal Server Error',
        {
          status: 500
        }
      );
    }
  }
};
