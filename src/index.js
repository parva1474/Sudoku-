// ==========================================
// src/index.js
// Sudoku Telegram Bot
// Cloudflare Workers
// ==========================================

// ==========================================
// src/index.js
// ==========================================

const BOT_TOKEN = "8604292634:AAHBsJ9HXgISutUw6S0qTRcOWi08nn38ZuY"; // توکن ربات خود را اینجا بگذارید

export default {
  async fetch(request, env, ctx) {
    // اگر از توکن داخل کد استفاده می‌کنید، آن را به عنوان متغیر به سیستم ارسال می‌کنیم
    const token = BOT_TOKEN; 

    // بقیه کدهای مربوط به پردازش درخواست و وب‌هوک...
    
    return new Response("Bot is running", { status: 200 });
  }
};

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
// بررسی عضویت
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
// ساخت کلید Session
// ==========================================

function getSessionKey(cq) {

  // پیام معمولی
  if (cq.message) {

    return (
      'chat_' +
      String(cq.message.chat.id)
    );
  }

  // پیام Inline
  if (cq.inline_message_id) {

    return (
      'inline_' +
      String(cq.inline_message_id)
    );
  }

  return null;
}


// ==========================================
// ساخت امتیاز کاربر
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
// رندر و آپدیت پیام
// ==========================================

async function updateGameMessage(
  BOT_TOKEN,
  cq,
  gameState,
  selectedCell,
  scores
) {

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


  if (cq.message) {

    return updateSudokuPhoto(
      BOT_TOKEN,
      cq.message.chat.id,
      cq.message.message_id,
      svg,
      keyboard
    );
  }


  if (cq.inline_message_id) {

    return updateInlineSudokuPhoto(
      BOT_TOKEN,
      cq.inline_message_id,
      svg,
      keyboard
    );
  }


  return null;
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

        // نکته مهم: برای اینکه بعد از ارسال اینلاین، کلید سشن با inline_message_id هماهنگ شود
        // ما از یک کلید موقت استفاده می‌کنیم یا بازی را ثبت می‌کنیم.
        // در تلگرام وقتی پیام اینلاین ارسال می‌شود، در اولین کلیک، inline_message_id به دست می‌آید.
        // برای حل این مسئله، بازی را با queryId هم ذخیره می‌کنیم تا در اولین کالبک قابل بازیابی باشد.
        const temporaryKey =
          `inline_query_${queryId}`;


        activeGames.set(
          temporaryKey,
          gameState
        );

        selectedCellsMap.set(
          temporaryKey,
          null
        );

        userScoresMap.set(
          temporaryKey,
          new Map()
        );


        const keyboard =
          buildControlKeyboard(
            gameState,
            null,
            userScoresMap.get(temporaryKey)
          );


        const results = [
          {
            type: 'article',

            id:
              `sudoku_${Date.now()}_${Math.random().toString(36).slice(2)}`,

            title:
              '🧩 شروع بازی گروهی سودوکو',

            description:
              'ارسال بازی سودوکو به گروه',

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
      ) {

        const cq =
          update.callback_query;

        const userId =
          cq.from.id;

        const userName =
          cq.from.first_name ||
          cq.from.username ||
          'کاربر';


        let sessionKey =
          getSessionKey(cq);


        if (!sessionKey) {

          await answerCallback(
            BOT_TOKEN,
            cq.id,
            '❌ نشست بازی پیدا نشد.'
          );

          return new Response('OK');
        }


        // اگر پیام اینلاین باشد و کلیدش در ممپ مستقیم نباشد، ممکن است با inline_query ذخیره شده باشد
        if (
          cq.inline_message_id &&
          !activeGames.has(sessionKey)
        ) {
          // بررسی اینکه آیا از طریق inline_query ایجاد شده بود
          // چون در اینلاین کوئری مستقیم دسترسی به query_id نداریم، 
          // یک راه استاندارد این است که اگر بازی نبود یک بازی جدید بسازیم:
          activeGames.set(sessionKey, generateNewGame());
          selectedCellsMap.set(sessionKey, null);
          userScoresMap.set(sessionKey, new Map());
        }


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


        let gameState =
          activeGames.get(
            sessionKey
          );


        if (!gameState) {

          gameState =
            generateNewGame();

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
        }


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

          gameState =
            generateNewGame();

          activeGames.set(
            sessionKey,
            gameState
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


          if (
            !Number.isInteger(r) ||
            !Number.isInteger(c) ||
            r < 0 ||
            r >= 9 ||
            c < 0 ||
            c >= 9
          ) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '❌ خانه نامعتبر است.'
            );

            return new Response('OK');
          }


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
        }


        // ==================================
        // ورود عدد
        // ==================================

        else if (
          data.startsWith('input_')
        ) {

          if (!selectedCell) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '👇 ابتدا یک خانه از جدول انتخاب کنید.'
            );

            return new Response('OK');
          }


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


          if (
            !Number.isInteger(val) ||
            val < 0 ||
            val > 9
          ) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '❌ عدد نامعتبر است.'
            );

            return new Response('OK');
          }


          const r =
            selectedCell.r;

          const c =
            selectedCell.c;

          const cell =
            gameState.board[r][c];


          if (
            cell.given
          ) {

            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '🔒 این خانه اولیه است و قابل تغییر نیست.'
            );

            return new Response('OK');
          }


          if (
            gameState.pencilMode
          ) {

            if (
              !Array.isArray(cell.notes)
            ) {

              cell.notes = [];
            }


            if (
              val === 0
            ) {

              cell.notes = [];

            } else {

              if (
                cell.notes.includes(val)
              ) {

                cell.notes =
                  cell.notes.filter(
                    n => n !== val
                  );

              } else {

                cell.notes.push(val);

                cell.notes.sort(
                  (a, b) => a - b
                );
              }
            }


            await answerCallback(
              BOT_TOKEN,
              cq.id,
              '✏️ یادداشت به‌روزرسانی شد.'
            );

          } else {

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

            } else {

              const tempBoard =
                gameState.board.map(
                  row =>
                    row.map(
                      currentCell =>
                        currentCell.value
                    )
                );

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

              } else {

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

          checkGameCompletion(
            gameState
          );
        }


        // ==================================
        // رندر و آپدیت نهایی پیام
        // ==================================

        await updateGameMessage(
          BOT_TOKEN,
          cq,
          gameState,
          selectedCell,
          scores
        );


        return new Response('OK');
      }

      return new Response('OK');

    } catch (error) {

      console.error(
        'Worker execution error:',
        error
      );

      return new Response(
        'Internal Server Error',
        {
          status: 500
        }
      );
    }
  }
};
                  
