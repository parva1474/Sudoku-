/// ==========================================
// src/handlers.js
// Telegram Sudoku Bot
// Cloudflare Workers + KV
// ==========================================

import {
  buildSudokuGridKeyboard,
  buildBoxCellsKeyboard,
  buildNumberKeyboard,
  buildDifficultyKeyboard,
  buildFinishedKeyboard
} from './keyboard.js';

import { generateSudoku } from './sudokuGenerator.js';


// ==========================================
// امتیازات سراسری موقت Worker
// ==========================================

const globalScores = {};


// ==========================================
// ساخت متن جدول
// ==========================================

export function createBoardText(game, highlightCell = -1) {

  const board =
    Array.isArray(game.board)
      ? game.board
      : Array(81).fill(0);

  const solution =
    Array.isArray(game.solution)
      ? game.solution
      : Array(81).fill(0);

  const playerNames =
    game.playerNames || {};

  const errors =
    game.errors || {};

  const isFinished =
    board.every(
      (val, idx) =>
        val === solution[idx]
    );

  const filledCount =
    board.filter(
      v => v !== 0
    ).length;

  game.progress =
    Math.round(
      (filledCount / 81) * 100
    );


  // ========================================
  // عنوان
  // ========================================

  const statusEmoji =
    isFinished
      ? "✅"
      : "🧩";


  const currentPlayer =
    playerNames[game.turnUserId] ||
    "بازیکن";


  let gridStr =
    `${statusEmoji} <b>سودوکو چندنفره آنلاین</b>\n` +
    `👤 بازیکن: ${escapeHtml(currentPlayer)}\n\n` +
    `<code>`;


  // ========================================
  // ساخت جدول
  // ========================================

  for (let row = 0; row < 9; row++) {

    for (let col = 0; col < 9; col++) {

      const idx =
        row * 9 + col;

      const val =
        board[idx];

      const display =
        val !== 0
          ? String(val)
          : ".";


      if (idx === highlightCell) {

        gridStr +=
          `[${display}]`;

      } else {

        gridStr +=
          ` ${display} `;
      }


      if (
        (col + 1) % 3 === 0 &&
        col < 8
      ) {

        gridStr += "|";
      }
    }


    gridStr += "\n";


    if (
      (row + 1) % 3 === 0 &&
      row < 8
    ) {

      gridStr +=
        "---------+---------+---------\n";
    }
  }


  gridStr += "</code>";


  if (isFinished) {

    gridStr +=
      "\n\n🎉 <b>تبریک! این جدول کاملاً حل شد.</b>";
  }


  // ========================================
  // تعداد باقی مانده هر عدد
  // ========================================

  const counts = {};

  for (let i = 1; i <= 9; i++) {
    counts[i] = 9;
  }


  for (let i = 0; i < 81; i++) {

    const val =
      board[i];

    if (
      val >= 1 &&
      val <= 9
    ) {

      counts[val]--;
    }
  }


  let remainingText =
    "\n🔢 <b>باقیمانده اعداد:</b>\n";


  const line1 = [];
  const line2 = [];


  for (let i = 1; i <= 5; i++) {

    line1.push(
      `${i}:(${counts[i]})`
    );
  }


  for (let i = 6; i <= 9; i++) {

    line2.push(
      `${i}:(${counts[i]})`
    );
  }


  remainingText +=
    line1.join(" | ") +
    "\n" +
    line2.join(" | ");


  // ========================================
  // امتیازات
  // ========================================

  let scoresSummary =
    "\n⭐ <b>امتیازات کل:</b>\n";


  for (
    const pId in playerNames
  ) {

    const totalScore =
      globalScores[pId] || 0;


    const name =
      escapeHtml(
        playerNames[pId]
      );


    scoresSummary +=
      `👤 ${name}: ${totalScore} امتیاز\n`;
  }


  const currentErrors =
    errors[game.turnUserId] || 0;


  return (
    `${gridStr}\n` +
    `${remainingText}\n` +
    `${scoresSummary}\n` +
    `📊 <b>پیشرفت:</b> ${game.progress}% | ` +
    `❌ <b>خطا:</b> ${currentErrors}/4`
  );
}


// ==========================================
// HTML Escape
// ==========================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


// ==========================================
// بررسی تکمیل بودن بلوک
// ==========================================

function isBoxComplete(
  board,
  boxIndex
) {

  if (
    !Array.isArray(board) ||
    board.length !== 81
  ) {

    return false;
  }


  const startRow =
    Math.floor(boxIndex / 3) * 3;

  const startCol =
    (boxIndex % 3) * 3;


  for (
    let r = 0;
    r < 3;
    r++
  ) {

    for (
      let c = 0;
      c < 3;
      c++
    ) {

      const idx =
        (startRow + r) * 9 +
        (startCol + c);


      if (
        board[idx] === 0
      ) {

        return false;
      }
    }
  }


  return true;
}


// ==========================================
// درخواست به Telegram API
// ==========================================

async function callTelegram(
  token,
  method,
  payload
) {

  if (!token) {

    console.error(
      "❌ BOT_TOKEN is missing"
    );

    return {
      ok: false,
      description:
        "BOT_TOKEN is missing"
    };
  }


  const url =
    `https://api.telegram.org/bot${token}/${method}`;


  console.log(
    `📡 Telegram → ${method}`
  );


  try {

    const response =
      await fetch(
        url,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(payload)
        }
      );


    const text =
      await response.text();


    let result;


    try {

      result =
        JSON.parse(text);

    } catch {

      result = {
        ok: false,
        description:
          `Invalid Telegram response: ${text}`
      };
    }


    console.log(
      `📥 Telegram ${method}:`,
      JSON.stringify(result)
    );


    if (!response.ok || !result.ok) {

      console.error(
        `❌ Telegram API ERROR [${method}]`,
        JSON.stringify(result)
      );
    }


    return result;

  } catch (error) {

    console.error(
      `❌ Telegram FETCH ERROR [${method}]`,
      error?.stack || error
    );


    return {
      ok: false,
      description:
        String(
          error?.message ||
          error
        )
    };
  }
}


// ==========================================
// ذخیره بازی
// ==========================================

async function saveGame(
  kv,
  gameKey,
  game
) {

  if (!kv) {

    console.warn(
      "⚠️ SUDOKU_KV is not available"
    );

    return;
  }


  try {

    await kv.put(
      gameKey,
      JSON.stringify(game),
      {
        expirationTtl: 86400
      }
    );

  } catch (error) {

    console.error(
      "❌ KV PUT ERROR:",
      error?.stack || error
    );
  }
}


// ==========================================
// دریافت بازی
// ==========================================

async function loadGame(
  kv,
  gameKey
) {

  if (!kv) {

    console.warn(
      "⚠️ SUDOKU_KV is not available"
    );

    return null;
  }


  try {

    const gameStr =
      await kv.get(gameKey);


    if (!gameStr) {

      return null;
    }


    return JSON.parse(
      gameStr
    );

  } catch (error) {

    console.error(
      "❌ KV GET/JSON ERROR:",
      error?.stack || error
    );

    return null;
  }
}


// ==========================================
// ایجاد Payload ویرایش پیام
// ==========================================

function buildEditPayload(
  query,
  text,
  replyMarkup
) {

  const payload = {

    text,

    parse_mode:
      "HTML"
  };


  if (
    query.message &&
    query.message.chat
  ) {

    payload.chat_id =
      query.message.chat.id;

    payload.message_id =
      query.message.message_id;

  } else if (
    query.inline_message_id
  ) {

    payload.inline_message_id =
      query.inline_message_id;

  } else {

    return null;
  }


  if (replyMarkup) {

    payload.reply_markup =
      replyMarkup;
  }


  return payload;
}


// ==========================================
// Handler اصلی
// ==========================================

export async function handleUpdate(
  update,
  env
) {

  const token =
    env.BOT_TOKEN;

  const kv =
    env.SUDOKU_KV;


  if (!token) {

    console.error(
      "❌ BOT_TOKEN is missing"
    );

    return;
  }


  console.log(
    "📨 UPDATE:",
    JSON.stringify(update)
  );


  // ========================================
  // MESSAGE
  // ========================================

  if (update.message) {

    const msg =
      update.message;


    const text =
      msg.text || "";


    // /start
    if (
      text === "/start" ||
      text.startsWith("/start@")
    ) {

      const result =
        await callTelegram(
          token,
          "sendMessage",
          {
            chat_id:
              msg.chat.id,

            text:
              "🧩 <b>سودوکو چندنفره آنلاین</b>\n\n" +
              "هر بازیکن ۴ اجازه خطا دارد. " +
              "اگر ۴ خطا کنید، پس از ۱۰ دقیقه " +
              "می‌توانید دوباره به بازی برگردید!\n\n" +
              "هر عدد درست ۱+ امتیاز و هر خطا ۲- امتیاز دارد.\n\n" +
              "لطفاً درجه سختی بازی را انتخاب کنید:",

            parse_mode:
              "HTML",

            reply_markup:
              buildDifficultyKeyboard()
          }
        );


      if (!result.ok) {

        console.error(
          "❌ /start failed:",
          JSON.stringify(result)
        );
      }


      return;
    }
  }


  // ========================================
  // INLINE QUERY
  // ========================================

  if (update.inline_query) {

    const inlineQuery =
      update.inline_query;


    const queryId =
      inlineQuery.id;


    const results = [

      {
        type:
          "article",

        id:
          "start_sudoku",

        title:
          "🧩 شروع بازی سودوکو آنلاین",

        description:
          "کلیک کنید تا جدول سودوکو چندنفره ساخته شود",

        input_message_content: {

          message_text:
            "🧩 <b>سودوکو چندنفره آنلاین</b>\n\n" +
            "لطفاً درجه سختی بازی را انتخاب کنید:",

          parse_mode:
            "HTML"
        },

        reply_markup:
          buildDifficultyKeyboard()
      }

    ];


    const result =
      await callTelegram(
        token,
        "answerInlineQuery",
        {
          inline_query_id:
            queryId,

          results,

          cache_time:
            0,

          is_personal:
            true
        }
      );


    if (!result.ok) {

      console.error(
        "❌ answerInlineQuery failed:",
        JSON.stringify(result)
      );
    }


    return;
  }


  // ========================================
  // CALLBACK QUERY
  // ========================================

  if (update.callback_query) {

    const query =
      update.callback_query;


    const data =
      query.data || "";


    const userId =
      query.from?.id;


    const userName =
      query.from?.first_name ||
      "بازیکن";


    console.log(
      `🎮 CALLBACK: ${data} | USER: ${userId}`
    );


    // ======================================
    // پاسخ اولیه به callback
    // ======================================

    await callTelegram(
      token,
      "answerCallbackQuery",
      {
        callback_query_id:
          query.id
      }
    );


    const chatId =
      query.message?.chat?.id ||
      null;


    const messageId =
      query.message?.message_id ||
      null;


    const inlineMessageId =
      query.inline_message_id ||
      null;


    if (
      !chatId &&
      !inlineMessageId
    ) {

      console.error(
        "❌ Callback has no message_id or inline_message_id"
      );

      return;
    }


    // ======================================
    // کلید بازی
    // ======================================

    const gameKey =
      chatId
        ? `game_${chatId}`
        : `game_${inlineMessageId}`;


    let game =
      await loadGame(
        kv,
        gameKey
      );


    // ======================================
    // بازی جدید
    // ======================================

    if (
      data.startsWith(
        "difficulty:"
      ) ||
      data === "action:new"
    ) {

      const difficulty =
        data.startsWith(
          "difficulty:"
        )
          ? data.split(":")[1]
          : (
              game?.difficulty ||
              "easy"
            );


      let newPuzzleObj;


      try {

        newPuzzleObj =
          generateSudoku(
            difficulty
          );

      } catch (error) {

        console.error(
          "❌ generateSudoku ERROR:",
          error?.stack || error
        );


        await callTelegram(
          token,
          "answerCallbackQuery",
          {
            callback_query_id:
              query.id,

            text:
              "❌ خطا در ساخت جدول سودوکو.",

            show_alert:
              true
          }
        );


        return;
      }


      if (
        !newPuzzleObj ||
        !Array.isArray(newPuzzleObj.puzzle) ||
        !Array.isArray(newPuzzleObj.solution)
      ) {

        console.error(
          "❌ Invalid puzzle generated:",
          JSON.stringify(newPuzzleObj)
        );


        return;
      }


      game = {

        board:
          [...newPuzzleObj.puzzle],

        puzzle:
          [...newPuzzleObj.puzzle],

        solution:
          [...newPuzzleObj.solution],

        difficulty,

        scores:
          {},

        errors:
          {},

        banTimes:
          {},

        playerNames:
          {},

        turnUserId:
          userId,

        progress:
          0
      };


      game.playerNames[userId] =
        userName;


      await saveGame(
        kv,
        gameKey,
        game
      );


      const boardText =
        createBoardText(
          game,
          -1
        ) +
        "\n\n👇 <b>یک بلوک انتخاب کنید:</b>";


      // ====================================
      // action:new در چت
      // ====================================

      if (
        data === "action:new" &&
        chatId
      ) {

        const result =
          await callTelegram(
            token,
            "sendMessage",
            {

              chat_id:
                chatId,

              text:
                boardText,

              parse_mode:
                "HTML",

              reply_markup:
                buildSudokuGridKeyboard(
                  game.board
                )
            }
          );


        if (!result.ok) {

          console.error(
            "❌ New game sendMessage failed:",
            JSON.stringify(result)
          );
        }


        return;
      }


      // ====================================
      // ویرایش پیام
      // ====================================

      const editPayload =
        buildEditPayload(
          query,
          boardText,
          buildSudokuGridKeyboard(
            game.board
          )
        );


      if (!editPayload) {

        console.error(
          "❌ Cannot edit message"
        );

        return;
      }


      const result =
        await callTelegram(
          token,
          "editMessageText",
          editPayload
        );


      if (!result.ok) {

        console.error(
          "❌ editMessageText failed:",
          JSON.stringify(result)
        );
      }


      return;
    }


    // ======================================
    // اگر بازی وجود ندارد
    // ======================================

    if (!game) {

      await callTelegram(
        token,
        "answerCallbackQuery",
        {
          callback_query_id:
            query.id,

          text:
            "❌ بازی پیدا نشد یا منقضی شده است. لطفاً /start را بزنید.",

          show_alert:
            true
        }
      );


      return;
    }


    // ======================================
    // ثبت بازیکن
    // ======================================

    if (
      !game.playerNames
    ) {

      game.playerNames =
        {};
    }


    if (
      !game.scores
    ) {

      game.scores =
        {};
    }


    if (
      !game.errors
    ) {

      game.errors =
        {};
    }


    if (
      !game.banTimes
    ) {

      game.banTimes =
        {};
    }


    if (
      !game.playerNames[userId]
    ) {

      game.playerNames[userId] =
        userName;
    }


    if (
      game.scores[userId] === undefined
    ) {

      game.scores[userId] =
        0;
    }


    if (
      game.errors[userId] === undefined
    ) {

      game.errors[userId] =
        0;
    }


    game.turnUserId =
      userId;


    // ======================================
    // بررسی اخراج
    // ======================================

    if (
      game.errors[userId] >= 4
    ) {

      const banTime =
        game.banTimes[userId] ||
        0;


      const now =
        Date.now();


      const tenMinutes =
        10 * 60 * 1000;


      if (
        now - banTime <
        tenMinutes
      ) {

        const remainingSeconds =
          Math.ceil(
            (
              tenMinutes -
              (now - banTime)
            ) / 1000
          );


        const remainingMinutes =
          Math.floor(
            remainingSeconds / 60
          );


        const secs =
          remainingSeconds % 60;


        await callTelegram(
          token,
          "answerCallbackQuery",
          {

            callback_query_id:
              query.id,

            text:
              `❌ شما به دلیل ۴ خطا اخراج شده‌اید!\n` +
              `لطفاً ${remainingMinutes} دقیقه و ${secs} ثانیه دیگر صبر کنید.`,

            show_alert:
              true
          }
        );


        return;
      }


      game.errors[userId] =
        0;


      delete game.banTimes[userId];
    }


    // ======================================
    // Payload پایه ویرایش
    // ======================================

    const editPayload =
      buildEditPayload(
        query,
        "",
        null
      );


    if (!editPayload) {

      return;
    }


    // ======================================
    // حل چهار خانه آخر
    // ======================================

    if (
      data === "solve_last_four"
    ) {

      const emptyCount =
        game.board.filter(
          v => v === 0
        ).length;


      if (
        emptyCount > 0 &&
        emptyCount <= 4
      ) {

        for (
          let i = 0;
          i < 81;
          i++
        ) {

          if (
            game.board[i] === 0
          ) {

            game.board[i] =
              game.solution[i];
          }
        }


        const sortedScores =
          Object.entries(
            game.scores
          ).sort(
            (a, b) =>
              b[1] - a[1]
          );


        let scoresText =
          sortedScores
            .map(
              (
                [id, score],
                index
              ) => {

                const medal =
                  index === 0
                    ? "👑 برنده:"
                    : "👤";


                return (
                  `${medal} ` +
                  `${escapeHtml(game.playerNames[id])}: ` +
                  `امتیاز این بازی: ${score} | ` +
                  `امتیاز کل: ${globalScores[id] || 0}`
                );
              }
            )
            .join("\n");


        editPayload.text =
          createBoardText(
            game,
            -1
          ) +
          "\n\n⚡ <b>چهار عدد آخر حل شد و جدول کامل گردید!</b>\n\n" +
          scoresText;


        editPayload.reply_markup =
          buildFinishedKeyboard();


        await saveGame(
          kv,
          gameKey,
          game
        );


        await callTelegram(
          token,
          "editMessageText",
          editPayload
        );
      }


      return;
    }


    // ======================================
    // راهنما
    // ======================================

    if (
      data.startsWith("hint:")
    ) {

      const parts =
        data.split(":");


      const cellIndex =
        parseInt(
          parts[1],
          10
        );


      if (
        !Number.isInteger(cellIndex) ||
        cellIndex < 0 ||
        cellIndex >= 81
      ) {

        return;
      }


      const userScore =
        game.scores[userId] ||
        0;


      if (
        userScore >= 5
      ) {

        game.scores[userId] -=
          5;


        globalScores[userId] =
          Math.max(
            0,
            (globalScores[userId] || 0) - 5
          );


        game.board[cellIndex] =
          game.solution[cellIndex];


        const boxIndex =
          Math.floor(
            cellIndex / 27
          ) * 3 +
          Math.floor(
            (cellIndex % 9) / 3
          );


        const isFinished =
          game.board.every(
            (val, idx) =>
              val === game.solution[idx]
          );


        if (isFinished) {

          const sortedScores =
            Object.entries(
              game.scores
            ).sort(
              (a, b) =>
                b[1] - a[1]
            );


          const scoresText =
            sortedScores
              .map(
                (
                  [id, score],
                  index
                ) => {

                  const medal =
                    index === 0
                      ? "👑 برنده:"
                      : "👤";


                  return (
                    `${medal} ` +
                    `${escapeHtml(game.playerNames[id])}: ` +
                    `امتیاز این بازی: ${score} | ` +
                    `امتیاز کل: ${globalScores[id] || 0}`
                  );
                }
              )
              .join("\n");


          editPayload.text =
            createBoardText(
              game,
              -1
            ) +
            "\n\n🏆 <b>بازی به پایان رسید و جدول کامل شد!</b>\n\n" +
            scoresText;


          editPayload.reply_markup =
            buildFinishedKeyboard();

        } else {

          editPayload.text =
            createBoardText(
              game,
              cellIndex
            ) +
            "\n\n💡 <b>راهنما استفاده شد (-5 امتیاز). عدد درست قرار گرفت!</b>\n\n" +
            "👇 <b>عدد را انتخاب کنید:</b>";


          editPayload.reply_markup =
            buildNumberKeyboard(
              game.board,
              boxIndex,
              cellIndex,
              game.scores[userId]
            );
        }


        await saveGame(
          kv,
          gameKey,
          game
        );


        await callTelegram(
          token,
          "editMessageText",
          editPayload
        );

      } else {

        await callTelegram(
          token,
          "answerCallbackQuery",
          {

            callback_query_id:
              query.id,

            text:
              "امتیاز شما برای استفاده از راهنما کافی نیست (حداقل ۵ امتیاز لازم است).",

            show_alert:
              true
          }
        );
      }


      return;
    }


    // ======================================
    // بلوک تکمیل شده
    // ======================================

    if (
      data.startsWith("box_done:")
    ) {

      await callTelegram(
        token,
        "answerCallbackQuery",
        {

          callback_query_id:
            query.id,

          text:
            "این بلوک قبلاً تکمیل شده است!",

          show_alert:
            true
        }
      );


      return;
    }


    // ======================================
    // عدد تکمیل شده
    // ======================================

    if (
      data.startsWith("num_done:")
    ) {

      await callTelegram(
        token,
        "answerCallbackQuery",
        {

          callback_query_id:
            query.id,

          text:
            "این عدد ۹ بار کامل روی جدول استفاده شده است!",

          show_alert:
            true
        }
      );


      return;
    }


    // ======================================
    // انتخاب بلوک
    // ======================================

    if (
      data.startsWith("box:")
    ) {

      const boxIndex =
        parseInt(
          data.split(":")[1],
          10
        );


      if (
        !Number.isInteger(boxIndex) ||
        boxIndex < 0 ||
        boxIndex > 8
      ) {

        return;
      }


      if (
        isBoxComplete(
          game.board,
          boxIndex
        )
      ) {

        await callTelegram(
          token,
          "answerCallbackQuery",
          {

            callback_query_id:
              query.id,

            text:
              "این بلوک کامل شده است و قابل انتخاب نیست!",

            show_alert:
              true
          }
        );


        return;
      }


      editPayload.text =
        createBoardText(
          game,
          -1
        ) +
        "\n\n👇 <b>خانه مورد نظر را انتخاب کنید:</b>";


      editPayload.reply_markup =
        buildBoxCellsKeyboard(
          game.board,
          game.puzzle,
          boxIndex
        );


      await callTelegram(
        token,
        "editMessageText",
        editPayload
      );


      return;
    }


    // ======================================
    // انتخاب خانه
    // ======================================

    if (
      data.startsWith("cell:")
    ) {

      const parts =
        data.split(":");


      const boxIndex =
        parseInt(
          parts[1],
          10
        );


      const cellIndex =
        parseInt(
          parts[2],
          10
        );


      if (
        !Number.isInteger(cellIndex) ||
        cellIndex < 0 ||
        cellIndex >= 81
      ) {

        return;
      }


      // خانه ثابت
      if (
        game.puzzle &&
        game.puzzle[cellIndex] !== 0
      ) {

        await callTelegram(
          token,
          "answerCallbackQuery",
          {

            callback_query_id:
              query.id,

            text:
              "🔒 این خانه جزء اعداد اصلی و ثابت جدول است و قابل تغییر نیست!",

            show_alert:
              true
          }
        );


        return;
      }


      game.activeBox =
        boxIndex;


      game.activeCell =
        cellIndex;


      const userScore =
        game.scores[userId] ||
        0;


      editPayload.text =
        createBoardText(
          game,
          cellIndex
        ) +
        "\n\n👇 <b>عدد را انتخاب کنید:</b>";


      editPayload.reply_markup =
        buildNumberKeyboard(
          game.board,
          boxIndex,
          cellIndex,
          userScore
        );


      await saveGame(
        kv,
        gameKey,
        game
      );


      await callTelegram(
        token,
        "editMessageText",
        editPayload
      );


      return;
    }


    // ======================================
    // انتخاب عدد
    // ======================================

    if (
      data.startsWith("num:")
    ) {

      const parts =
        data.split(":");


      const cellIndex =
        parseInt(
          parts[1],
          10
        );


      const num =
        parseInt(
          parts[2],
          10
        );


      if (
        !Number.isInteger(cellIndex) ||
        cellIndex < 0 ||
        cellIndex >= 81
      ) {

        return;
      }


      if (
        !Number.isInteger(num) ||
        num < 0 ||
        num > 9
      ) {

        return;
      }


      const boxIndex =
        game.activeBox !== undefined
          ? game.activeBox
          : Math.floor(cellIndex / 27) * 3 +
            Math.floor((cellIndex % 9) / 3);


      // خانه ثابت
      if (
        game.puzzle &&
        game.puzzle[cellIndex] !== 0
      ) {

        await callTelegram(
          token,
          "answerCallbackQuery",
          {

            callback_query_id:
              query.id,

            text:
              "🔒 این خانه ثابت است!",

            show_alert:
              true
          }
        );


        return;
      }


      if (
        game.scores[userId] === undefined
      ) {

        game.scores[userId] =
          0;
      }


      if (
        game.errors[userId] === undefined
      ) {

        game.errors[userId] =
          0;
      }


      if (
        globalScores[userId] === undefined
      ) {

        globalScores[userId] =
          0;
      }


      // ====================================
      // پاک کردن خانه
      // ====================================

      if (
        num === 0
      ) {

        game.board[cellIndex] =
          0;

      } else {

        // ================================
        // عدد صحیح
        // ================================

        if (
          game.solution[cellIndex] === num
        ) {

          game.board[cellIndex] =
            num;


          game.scores[userId] +=
            1;


          globalScores[userId] +=
            1;

        }

        // ================================
        // عدد اشتباه
        // ================================

        else {

          game.errors[userId] +=
            1;


          game.scores[userId] =
            Math.max(
              0,
              game.scores[userId] - 2
            );


          globalScores[userId] =
            Math.max(
              0,
              globalScores[userId] - 2
            );


          await callTelegram(
            token,
            "answerCallbackQuery",
            {

              callback_query_id:
                query.id,

              text:
                `❌ عدد ${num} اشتباه است!\n` +
                `خطا: ${game.errors[userId]}/4`,

              show_alert:
                false
            }
          );
        }
      }


      // ====================================
      // اخراج بازیکن
      // ====================================

      if (
        game.errors[userId] >= 4
      ) {

        game.banTimes[userId] =
          Date.now();


        await saveGame(
          kv,
          gameKey,
          game
        );


        await callTelegram(
          token,
          "answerCallbackQuery",
          {

            callback_query_id:
              query.id,

            text:
              "❌ شما ۴ خطا کردید و از بازی اخراج شدید. ۱۰ دقیقه دیگر می‌توانید برگردید!",

            show_alert:
              true
          }
        );


        editPayload.text =
          createBoardText(
            game,
            -1
          ) +
          `\n\n❌ <b>${escapeHtml(userName)}</b> ` +
          `۴ خطای مجاز را پر کرد و موقتاً اخراج شد!`;


        editPayload.reply_markup =
          buildBoxCellsKeyboard(
            game.board,
            game.puzzle,
            boxIndex
          );


        await callTelegram(
          token,
          "editMessageText",
          editPayload
        );


        return;
      }


      // ====================================
      // پایان بازی
      // ====================================

      const isFinished =
        game.board.every(
          (val, idx) =>
            val === game.solution[idx]
        );


      if (isFinished) {

        const sortedScores =
          Object.entries(
            game.scores
          ).sort(
            (a, b) =>
              b[1] - a[1]
          );


        const scoresText =
          sortedScores
            .map(
              (
                [id, score],
                index
              ) => {

                const medal =
                  index === 0
                    ? "👑 برنده:"
                    : "👤";


                return (
                  `${medal} ` +
                  `${escapeHtml(game.playerNames[id])}: ` +
                  `امتیاز این بازی: ${score} | ` +
                  `امتیاز کل: ${globalScores[id] || 0}`
                );
              }
            )
            .join("\n");


        editPayload.text =
          createBoardText(
            game,
            -1
          ) +
          "\n\n🏆 <b>بازی به پایان رسید و جدول کامل شد!</b>\n\n" +
          scoresText;


        editPayload.reply_markup =
          buildFinishedKeyboard();

      } else {

        editPayload.text =
          createBoardText(
            game,
            -1
          ) +
          "\n\n👇 <b>یک بلوک انتخاب کنید:</b>";


        editPayload.reply_markup =
          buildSudokuGridKeyboard(
            game.board
          );
      }


      await saveGame(
        kv,
        gameKey,
        game
      );


      await callTelegram(
        token,
        "editMessageText",
        editPayload
      );


      return;
    }


    // ======================================
    // برگشت به جدول
    // ======================================

    if (
      data === "action:grid"
    ) {

      editPayload.text =
        createBoardText(
          game,
          -1
        ) +
        "\n\n👇 <b>یک بلوک انتخاب کنید:</b>";


      editPayload.reply_markup =
        buildSudokuGridKeyboard(
          game.board
        );


      await saveGame(
        kv,
        gameKey,
        game
      );


      await callTelegram(
        token,
        "editMessageText",
        editPayload
      );


      return;
    }


    // ======================================
    // دستور ناشناخته
    // ======================================

    console.warn(
      "⚠️ Unknown callback:",
      data
    );


    return;
  }


  // ========================================
  // آپدیت ناشناخته
  // ========================================

  console.log(
    "ℹ️ Update type not handled."
  );
}


// ==========================================
// پایان فایل
// ==========================================
