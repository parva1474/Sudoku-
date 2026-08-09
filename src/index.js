// ==========================================
// src/index.js
// Telegram Sudoku Bot
// Cloudflare Workers
// ==========================================

import {
  generateNewGame,
  isValid
} from './sudoku.js';

import {
  renderSudokuSVG
} from './sudokuRenderer.js';

import {
  sendSudokuPhoto,
  updateSudokuPhoto,
  updateInlineSudokuPhoto,
  answerCallback,
  sendMessage
} from './telegram.js';

import {
  buildControlKeyboard
} from './utils.js';


// ==========================================
// تنظیمات
// ==========================================

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

async function checkUserMembership(
  userId,
  token
) {

  for (
    const channel of REQUIRED_CHANNELS
  ) {

    try {

      const response = await fetch(
        `https://api.telegram.org/bot${token}/getChatMember` +
        `?chat_id=${encodeURIComponent(channel)}` +
        `&user_id=${userId}`
      );

      const data =
        await response.json();


      if (!data.ok) {
        return false;
      }


      const status =
        data.result?.status;


      if (
        ['left', 'kicked'].includes(status)
      ) {
        return false;
      }


      // اگر restricted باشد ولی هنوز عضو باشد،
      // اجازه استفاده می‌دهیم.
      if (
        status === 'restricted' &&
        data.result?.is_member !== true
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
// ساخت Session Key
// ==========================================

function getSessionKey(callbackQuery) {

  // پیام معمولی داخل گروه / خصوصی
  if (callbackQuery.message) {

    return `chat_${callbackQuery.message.chat.id}`;
  }


  // پیام Inline
  if (callbackQuery.inline_message_id) {

    return `inline_${callbackQuery.inline_message_id}`;
  }


  return null;
}


// ==========================================
// گرفتن اطلاعات کاربر
// ==========================================

function getUserInfo(from) {

  const userId =
    from.id;

  const name =
    from.first_name ||
    from.username ||
    'کاربر';


  return {
    userId,
    name
  };
}


// ==========================================
// ساخت امتیاز اولیه کاربر
// ==========================================

function ensureUserScore(
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
// بررسی پایان بازی
// ==========================================

function checkGameCompletion(
  gameState
) {

  let isComplete =
    true;

  let isAllCorrect =
    true;


  for (
    let row = 0;
    row < 9;
    row++
  ) {

    for (
      let col = 0;
      col < 9;
      col++
    ) {

      const cell =
        gameState.board[row][col];


      if (
        cell.value === null
      ) {

        isComplete =
          false;
      }


      if (
        cell.value !==
        cell.solutionValue
      ) {

        isAllCorrect =
          false;
      }
    }
  }


  if (
    isComplete &&
    isAllCorrect
  ) {

    gameState.status =
      'COMPLETED';

    return true;
  }


  return false;
}


// ==========================================
// Worker
// ==========================================

export default {

  async fetch(
    request,
    env,
    ctx
  ) {

    // ======================================
    // توکن از Cloudflare Secret
    // ======================================

    const BOT_TOKEN =
      env.BOT_TOKEN;


    if (!BOT_TOKEN) {

      return new Response(
        'BOT_TOKEN is not configured.',
        {
          status: 500
        }
      );
    }


    // ======================================
    // درخواست‌های غیر POST
    // ======================================

    if (
      request.method !== 'POST'
    ) {

      return new Response(
        'Sudoku Bot is running!'
      );
    }


    try {

      const update =
        await request.json();


      // ====================================
      // /start
      // ====================================

      if (
        update.message &&
        update.message.text
      ) {

        const message =
          update.message;

        const text =
          message.text.trim();


        if (
          text === '/start' ||
          text.startsWith('/start ')
        ) {

          const chatId =
            message.chat.id;

          const userId =
            message.from.id;


          // --------------------------------
          // بررسی عضویت
          // --------------------------------

          const isMember =
            await checkUserMembership(
              userId,
              BOT_TOKEN
            );


          if (!isMember) {

            await sendMessage(
              BOT_TOKEN,
              chatId,
              `⚠️ برای بازی سودوکو ابتدا باید در کانال‌های زیر عضو شوید:

1️⃣ @nwechannell
2️⃣ @parvapoem

بعد از عضویت دوباره /start را بزنید.`
            );

            return new Response('OK');
          }


          // --------------------------------
          // ساخت بازی
          // --------------------------------

          const gameState =
            generateNewGame();


          const sessionKey =
            `chat_${chatId}`;


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


          // --------------------------------
          // ساخت SVG
          // --------------------------------

          const svg =
            renderSudokuSVG(
              gameState,
              null
            );


          const keyboard =
            buildControlKeyboard(
              gameState,
              null,
              userScoresMap.get(sessionKey)
            );


          // --------------------------------
          // ارسال جدول
          // --------------------------------

          await sendSudokuPhoto(
            BOT_TOKEN,
            chatId,
            svg,
            keyboard
          );


          return new Response('OK');
        }
      }


      // ====================================
      // Inline Query
      // ====================================

      if (
        update.inline_query
      ) {

        const inlineQuery =
          update.inline_query;

        const queryId =
          inlineQuery.id;


        const gameState =
          generateNewGame();


        const sessionKey =
          `inline_${queryId}`;


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


        const keyboard =
          buildControlKeyboard(
            gameState,
            null,
            userScoresMap.get(sessionKey)
          );


        const results = [
          {
            type: 'article',

            id:
              `sudoku_${Date.now()}`,

            title:
              '🧩 شروع بازی گروهی سودوکو',

            description:
              'ارسال جدول سودوکو به گروه',

            input_message_content: {

              message_text:
                '🧩 بازی گروهی سودوکو\n\n' +
                'برای شروع روی خانه مورد نظر بزنید.',

              parse_mode:
                'Markdown'
            },

            reply_markup:
              keyboard
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

              cache_time:
                0,

              is_personal:
                true
            })
          }
        );


        return new Response('OK');
      }


      // ====================================
      // Callback Query
      // ====================================

      if (
        update.callback_query
        console.log(
  'CALLBACK RECEIVED:',
  JSON.stringify({
    id: update.callback_query.id,
    data: update.callback_query.data,
    inline_message_id: update.callback_query.inline_message_id,
    message: update.callback_query.message
      ? {
          chat_id: update.callback_query.message.chat.id,
          message_id: update.callback_query.message.message_id
        }
      : null
  })
);
      ) {

        const cq =
          update.callback_query;


        const userId =
          cq.from.id;


        const userName =
          cq.from.first_name ||
          cq.from.username ||
          'کاربر';


        // --------------------------------
        // Session
        // --------------------------------

        const sessionKey =
          getSessionKey(cq);


        if (!sessionKey) {

          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '❌ نشست بازی پیدا نشد.'
          );

          return new Response('OK');
        }


        // --------------------------------
        // بررسی عضویت
        // --------------------------------

        const isMember =
          await checkUserMembership(
            userId,
            BOT_TOKEN
          );


        if (!isMember) {

          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '⚠️ ابتدا در کانال‌های موردنیاز عضو شوید.'
          );

          return new Response('OK');
        }


        // --------------------------------
        // ساخت بازی اگر وجود نداشت
        // --------------------------------

        if (
          !activeGames.has(sessionKey)
        ) {

          activeGames.set(
            sessionKey,
            generateNewGame()
          );

          selectedCellsMap.set(
            sessionKey,
            null
          );

          userScoresMap.set(
            sessionKey,
            new Map()
          );
        }


        const gameState =
          activeGames.get(sessionKey);


        let selectedCell =
          selectedCellsMap.get(sessionKey) ||
          null;


        let scores =
          userScoresMap.get(sessionKey);


        if (!scores) {

          scores =
            new Map();

          userScoresMap.set(
            sessionKey,
            scores
          );
        }


        const userStats =
          ensureUserScore(
            scores,
            userId,
            userName
          );


        const data =
          cq.data;


        // ==================================
        // noop
        // ==================================

        if (
          data === 'noop'
        ) {

          await answerCallback(
            BOT_TOKEN,
            cq.id
          );

          return new Response('OK');
        }


        // ==================================
        // بازی جدید
        // ==================================

        if (
          data === 'new_game'
        ) {

          const newGame =
            generateNewGame();


          activeGames.set(
            sessionKey,
            newGame
          );


          selectedCell =
            null;


          selectedCellsMap.set(
            sessionKey,
            null
          );


          scores =
            new Map();


          userScoresMap.set(
            sessionKey,
            scores
          );
        }


        // ==================================
        // حالت مداد
        // ==================================

        else if (
          data === 'toggle_pencil'
        ) {

          gameState.pencilMode =
            !gameState.pencilMode;
        }


        // ==================================
        // لغو انتخاب
        // ==================================

        else if (
          data === 'deselect'
        ) {

          selectedCell =
            null;


          selectedCellsMap.set(
            sessionKey,
            null
          );
        }


        // ==================================
        // انتخاب خانه
        // ==================================

        else if (
          data.startsWith('cell_')
        ) {

          const parts =
            data.split('_');


          const r =
            Number(parts[1]);


          const c =
            Number(parts[2]);


          if (
            Number.isInteger(r) &&
            Number.isInteger(c) &&
            r >= 0 &&
            r < 9 &&
            c >= 0 &&
            c < 9
          ) {

            selectedCell = {
              r,
              c
            };


            selectedCellsMap.set(
              sessionKey,
              selectedCell
            );


            await answerCallback(
              BOT_TOKEN,
              cq.id
            );
          }


          // --------------------------------
          // رندر مجدد
          // --------------------------------

          const updatedSvg =
            renderSudokuSVG(
              gameState,
              selectedCell
            );


          const updatedKeyboard =
            buildControlKeyboard(
              gameState,
              selectedCell,
              scores
            );


          if (
            cq.message
          ) {

            await updateSudokuPhoto(
              BOT_TOKEN,
              cq.message.chat.id,
              cq.message.message_id,
              updatedSvg,
              updatedKeyboard
            );

          } else if (
            cq.inline_message_id
          ) {

            await updateInlineSudokuPhoto(
              BOT_TOKEN,
              cq.inline_message_id,
              updatedSvg,
              updatedKeyboard
            );
          }


          return new Response('OK');
        }


        // ==================================
        // ورود عدد
        // ==================================

        else if (
          data.startsWith('input_') &&
          selectedCell
        ) {

          // --------------------------------
          // محدودیت خطا
          // --------------------------------

          if (
            userStats.mistakes >= 3
          ) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '❌ شما ۳ خطا کرده‌اید و دیگر نمی‌توانید حرکت کنید.'
            );

            return new Response('OK');
          }


          const val =
            Number(
              data.split('_')[1]
            );


          const r =
            selectedCell.r;


          const c =
            selectedCell.c;


          const cell =
            gameState.board[r][c];


          // --------------------------------
          // خانه داده اولیه
          // --------------------------------

          if (
            cell.given
          ) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '🔒 این عدد اولیه جدول است.'
            );

            return new Response('OK');
          }


          // --------------------------------
          // حالت مداد
          // --------------------------------

          if (
            gameState.pencilMode
          ) {

            if (
              val === 0
            ) {

              cell.notes = [];

            } else {

              if (
                !Array.isArray(cell.notes)
              ) {

                cell.notes = [];
              }


              if (
                cell.notes.includes(val)
              ) {

                cell.notes =
                  cell.notes.filter(
                    n => n !== val
                  );

              } else {

                cell.notes.push(val);
              }
            }
          }


          // --------------------------------
          // ورود عدد معمولی
          // --------------------------------

          else {

            if (
              val === 0
            ) {

              cell.value =
                null;

              cell.isError =
                false;

            } else {

              // ----------------------------
              // بررسی Sudoku
              // ----------------------------

              const tempBoard =
                gameState.board.map(
                  row =>
                    row.map(
                      currentCell =>
                        currentCell.value
                    )
                );


              // خانه فعلی را خالی می‌کنیم
              // تا خودش در بررسی تکراری
              // محسوب نشود.

              tempBoard[r][c] =
                null;


              const validByRules =
                isValid(
                  tempBoard,
                  r,
                  c,
                  val
                );


              const correctSolution =
                val ===
                cell.solutionValue;


              // ----------------------------
              // حرکت اشتباه
              // ----------------------------

              if (
                !validByRules ||
                !correctSolution
              ) {

                cell.value =
                  val;

                cell.isError =
                  true;


                userStats.mistakes++;


                userStats.score =
                  Math.max(
                    0,
                    userStats.score - 5
                  );


                gameState.mistakes =
                  (gameState.mistakes || 0) + 1;


                await answerCallback(
                  BOT_TOKEN,
                  cq.id,
                  '❌ عدد اشتباه است.'
                );

              }


              // ----------------------------
              // حرکت صحیح
              // ----------------------------

              else {

                cell.value =
                  val;

                cell.isError =
                  false;

                cell.notes =
                  [];


                userStats.score +=
                  10;


                await answerCallback(
                  BOT_TOKEN,
                  cq.id,
                  '✅ درست!'
                );
              }
            }
          }


          // --------------------------------
          // بررسی تکمیل جدول
          // --------------------------------

          checkGameCompletion(
            gameState
          );
        }


        // ==================================
        // Callback ناشناخته
        // ==================================

        else {

          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '❓ دستور ناشناخته است.'
          );

          return new Response('OK');
        }


        // ==================================
        // رندر نهایی
        // ==================================

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


        // ==================================
        // پیام معمولی
        // ==================================

        if (
          cq.message
        ) {

          await updateSudokuPhoto(
            BOT_TOKEN,
            cq.message.chat.id,
            cq.message.message_id,
            svg,
            keyboard
          );
        }


        // ==================================
        // پیام Inline
        // ==================================

        else if (
          cq.inline_message_id
        ) {

          await updateInlineSudokuPhoto(
            BOT_TOKEN,
            cq.inline_message_id,
            svg,
            keyboard
          );
        }


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
