// ==========================================
// src/index.js - قسمت اول
// Sudoku Telegram Bot
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
// حافظه موقت بازی‌ها
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

        console.error(
          'Membership API error:',
          data
        );

        return false;
      }


      const status =
        data.result?.status;


      if (
        status === 'left' ||
        status === 'kicked'
      ) {

        return false;
      }


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

function getSessionKey(cq) {

  if (cq.message) {

    return (
      'chat_' +
      cq.message.chat.id
    );
  }


  if (cq.inline_message_id) {

    return (
      'inline_' +
      cq.inline_message_id
    );
  }


  return null;
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

  let complete = true;

  let correct = true;


  for (
    let r = 0;
    r < 9;
    r++
  ) {

    for (
      let c = 0;
      c < 9;
      c++
    ) {

      const cell =
        gameState.board[r][c];


      if (
        cell.value === null ||
        cell.value === undefined
      ) {

        complete = false;
      }


      if (
        cell.value !==
        cell.solutionValue
      ) {

        correct = false;
      }
    }
  }


  if (
    complete &&
    correct
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

    // --------------------------------------
    // توکن ربات
    // --------------------------------------

    const BOT_TOKEN =
      env.BOT_TOKEN;


    if (!BOT_TOKEN) {

      console.error(
        'BOT_TOKEN is missing.'
      );

      return new Response(
        'BOT_TOKEN is not configured.',
        {
          status: 500
        }
      );
    }


    // --------------------------------------
    // درخواست غیر POST
    // --------------------------------------

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


      console.log(
        'UPDATE TYPE:',
        Object.keys(update)
      );


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


          console.log(
            'START RECEIVED:',
            chatId,
            userId
          );


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
          // ساخت بازی جدید
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
          // ساخت تصویر
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
              userScoresMap.get(
                sessionKey
              )
            );


          // --------------------------------
          // ارسال جدول
          // --------------------------------

          const result =
            await sendSudokuPhoto(
              BOT_TOKEN,
              chatId,
              svg,
              keyboard
            );


          console.log(
            'SEND PHOTO RESULT:',
            JSON.stringify(result)
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


        console.log(
          'INLINE QUERY RECEIVED:',
          queryId
        );


        // --------------------------------
        // ساخت بازی
        // --------------------------------

        const gameState =
          generateNewGame();


        const sessionKey =
          `inline_query_${queryId}`;


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
        // کیبورد
        // --------------------------------

        const keyboard =
          buildControlKeyboard(
            gameState,
            null,
            userScoresMap.get(
              sessionKey
            )
          );


        // --------------------------------
        // نتیجه Inline
        // --------------------------------

        const results = [
          {

            type:
              'article',

            id:
              `sudoku_${Date.now()}`,

            title:
              '🧩 شروع بازی گروهی سودوکو',

            description:
              'ارسال بازی سودوکو',

            input_message_content: {

              message_text:
                '🧩 **بازی گروهی سودوکو**\n\n' +
                'روی یکی از خانه‌های جدول بزنید.',

              parse_mode:
                'Markdown'
            },

            reply_markup:
              keyboard
          }
        ];


        // --------------------------------
        // پاسخ به Inline Query
        // --------------------------------

        const inlineResponse =
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


        const inlineData =
          await inlineResponse.json();


        console.log(
          'INLINE ANSWER RESULT:',
          JSON.stringify(inlineData)
        );


        return new Response('OK');
      }


      // ====================================
      // Callback Query
      // ====================================

      if (update.callback_query) {

        // ----------------------------------
        // لاگ دریافت Callback
        // ----------------------------------

        console.log(
          'CALLBACK RECEIVED:',
          JSON.stringify({
            id:
              update.callback_query.id,

            data:
              update.callback_query.data,

            inline_message_id:
              update.callback_query.inline_message_id,

            message:
              update.callback_query.message
                ? {
                    chat_id:
                      update.callback_query.message.chat.id,

                    message_id:
                      update.callback_query.message.message_id
                  }
                : null
          })
        );


        const cq =
          update.callback_query;


        const userId =
          cq.from.id;


        const userName =
          cq.from.first_name ||
          cq.from.username ||
          'کاربر';


        // ----------------------------------
        // Session
        // ----------------------------------

        const sessionKey =
          getSessionKey(cq);


        console.log(
          'SESSION KEY:',
          sessionKey
        );


        if (!sessionKey) {

          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '❌ نشست بازی پیدا نشد.'
          );

          return new Response('OK');
        }


        // ----------------------------------
        // بررسی عضویت
        // ----------------------------------

        const isMember =
          await checkUserMembership(
            userId,
            BOT_TOKEN
          );


        if (!isMember) {

          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '⚠️ ابتدا عضو کانال‌های موردنیاز شوید.'
          );

          return new Response('OK');
        }


        // ----------------------------------
        // اگر بازی پیدا نشد
        // ----------------------------------

        if (
          !activeGames.has(sessionKey)
        ) {

          console.log(
            'GAME NOT FOUND:',
            sessionKey
          );


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


        // ----------------------------------
        // دریافت وضعیت بازی
        // ----------------------------------

        const gameState =
          activeGames.get(
            sessionKey
          );


        let selectedCell =
          selectedCellsMap.get(
            sessionKey
          ) || null;


        let scores =
          userScoresMap.get(
            sessionKey
          );


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


        console.log(
          'CALLBACK DATA:',
          data
        );


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


          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '🔄 بازی جدید ساخته شد.'
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


          await answerCallback(
            BOT_TOKEN,
            cq.id,
            gameState.pencilMode
              ? '✏️ حالت مداد روشن شد.'
              : '✏️ حالت مداد خاموش شد.'
          );
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


          await answerCallback(
            BOT_TOKEN,
            cq.id
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


          console.log(
            'CELL CLICK:',
            {
              r,
              c
            }
          );


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
              cq.id,
              `📍 خانه ${r + 1}،${c + 1} انتخاب شد.`
            );

          } else {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '❌ خانه نامعتبر است.'
            );
          }


          // --------------------------------
          // رندر بعد از انتخاب خانه
          // --------------------------------

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


          // --------------------------------
          // پیام معمولی
          // --------------------------------

          if (
            cq.message
          ) {

            const editResult =
              await updateSudokuPhoto(
                BOT_TOKEN,
                cq.message.chat.id,
                cq.message.message_id,
                selectedSvg,
                selectedKeyboard
              );


            console.log(
              'EDIT MESSAGE RESULT:',
              JSON.stringify(editResult)
            );
          }


          // --------------------------------
          // پیام Inline
          // --------------------------------

          else if (
            cq.inline_message_id
          ) {

            const editResult =
              await updateInlineSudokuPhoto(
                BOT_TOKEN,
                cq.inline_message_id,
                selectedSvg,
                selectedKeyboard
              );


            console.log(
              'EDIT INLINE RESULT:',
              JSON.stringify(editResult)
            );
          }


          return new Response('OK');
        }



    // ==================================
        // ورود عدد
        // ==================================

        else if (
          data.startsWith('input_')
        ) {

          // -------------------------------
          // آیا خانه‌ای انتخاب شده؟
          // -------------------------------

          if (!selectedCell) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '👇 ابتدا یک خانه از جدول انتخاب کنید.'
            );

            return new Response('OK');
          }


          // -------------------------------
          // حداکثر ۳ خطا
          // -------------------------------

          if (
            userStats.mistakes >= 3
          ) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '❌ شما ۳ خطای مجاز خود را مصرف کرده‌اید.'
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


          // -------------------------------
          // خانه اولیه جدول
          // -------------------------------

          if (
            cell.given
          ) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '🔒 این خانه از ابتدا پر شده و قابل تغییر نیست.'
            );

            return new Response('OK');
          }


          // =================================
          // حالت مداد
          // =================================

          if (
            gameState.pencilMode
          ) {

            if (
              !Array.isArray(cell.notes)
            ) {

              cell.notes = [];
            }


            // پاک کردن یادداشت‌ها
            if (
              val === 0
            ) {

              cell.notes = [];

            } else {

              // حذف یادداشت موجود
              if (
                cell.notes.includes(val)
              ) {

                cell.notes =
                  cell.notes.filter(
                    n => n !== val
                  );

              }

              // اضافه کردن یادداشت
              else {

                cell.notes.push(val);
              }
            }


            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '✏️ یادداشت به‌روزرسانی شد.'
            );
          }


          // =================================
          // حالت ورود عدد
          // =================================

          else {

            // -----------------------------
            // پاک کردن خانه
            // -----------------------------

            if (
              val === 0
            ) {

              cell.value =
                null;

              cell.isError =
                false;


              await answerCallback(
                BOT_TOKEN,
                cq.id,
                '🧹 خانه پاک شد.'
              );
            }


            // -----------------------------
            // وارد کردن عدد
            // -----------------------------

            else {

              // ---------------------------
              // ساخت کپی وضعیت فعلی جدول
              // ---------------------------

              const tempBoard =
                gameState.board.map(
                  row =>
                    row.map(
                      currentCell =>
                        currentCell.value
                    )
                );


              // خانه فعلی را موقتاً خالی می‌کنیم
              tempBoard[r][c] =
                null;


              // ---------------------------
              // بررسی قانون سودوکو
              // ---------------------------

              const validByRules =
                isValid(
                  tempBoard,
                  r,
                  c,
                  val
                );


              // ---------------------------
              // بررسی جواب واقعی
              // ---------------------------

              const isCorrect =
                val ===
                cell.solutionValue;


              // ---------------------------
              // عدد اشتباه
              // ---------------------------

              if (
                !validByRules ||
                !isCorrect
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
                  '❌ عدد اشتباه است. ۵ امتیاز کم شد.'
                );
              }


              // ---------------------------
              // عدد صحیح
              // ---------------------------

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
                  '✅ درست! ۱۰ امتیاز گرفتی.'
                );
              }
            }
          }
        }


        // ==================================
        // Callback ناشناخته
        // ==================================

        else {

          console.log(
            'UNKNOWN CALLBACK:',
            data
          );


          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '❓ دستور ناشناخته است.'
          );


          return new Response('OK');
        }


        // ==================================
        // بررسی کامل شدن جدول
        // ==================================

        checkGameCompletion(
          gameState
        );


        // ==================================
        // ساخت تصویر جدید
        // ==================================

        const finalSvg =
          renderSudokuSVG(
            gameState,
            selectedCell
          );


        // ==================================
        // ساخت کیبورد جدید
        // ==================================

        const finalKeyboard =
          buildControlKeyboard(
            gameState,
            selectedCell,
            scores
          );


        // ==================================
        // ویرایش پیام معمولی
        // ==================================

        if (
          cq.message
        ) {

          const result =
            await updateSudokuPhoto(
              BOT_TOKEN,
              cq.message.chat.id,
              cq.message.message_id,
              finalSvg,
              finalKeyboard
            );


          console.log(
            'FINAL EDIT RESULT:',
            JSON.stringify(result)
          );
        }


        // ==================================
        // ویرایش پیام Inline
        // ==================================

        else if (
          cq.inline_message_id
        ) {

          const result =
            await updateInlineSudokuPhoto(
              BOT_TOKEN,
              cq.inline_message_id,
              finalSvg,
              finalKeyboard
            );


          console.log(
            'FINAL INLINE RESULT:',
            JSON.stringify(result)
          );
        }


        return new Response('OK');
      }


      // ====================================
      // هیچ آپدیت شناخته‌شده‌ای نیست
      // ====================================

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
