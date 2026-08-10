// ==========================================
// src/worker.js
// Telegram Sudoku Bot
// Cloudflare Workers + D1
// ==========================================

import {
  telegramRequest,
  sendMessage,
  editMessageText,
  answerCallbackQuery
} from "./telegram.js";

import {
  newGame,
  selectCell,
  togglePencilMode,
  toggleNote,
  putNumber,
  eraseNumber,
  getProgress
} from "./game.js";

import {
  buildSudokuKeyboard,
  buildNumberKeyboard,
  buildDifficultyKeyboard,
  buildFinishedKeyboard
} from "./keyboard.js";

import {
  getHint
} from "./sudoku.js";

// ==========================================
// تنظیمات
// ==========================================

const DEFAULT_DIFFICULTY = "medium";

const VALID_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master"
];

// ==========================================
// Worker
// ==========================================

export default {

  async fetch(request, env) {

    // --------------------------------------
    // GET
    // --------------------------------------

    if (request.method === "GET") {

      return new Response(
        "🧩 Sudoku Bot is running.",
        {
          status: 200
        }
      );
    }

    // --------------------------------------
    // فقط POST
    // --------------------------------------

    if (request.method !== "POST") {

      return new Response(
        "Method Not Allowed",
        {
          status: 405
        }
      );
    }

    try {

      // ------------------------------------
      // بررسی JSON
      // ------------------------------------

      const update =
        await request.json();

      // ------------------------------------
      // Token
      // ------------------------------------

      const token =
        env.BOT_TOKEN;

      if (!token) {

        console.error(
          "BOT_TOKEN is missing."
        );

        return new Response(
          "BOT_TOKEN is missing.",
          {
            status: 500
          }
        );
      }

      // ------------------------------------
      // Message
      // ------------------------------------

      if (update.message) {

        await handleMessage(
          update.message,
          env,
          token
        );
      }

      // ------------------------------------
      // Callback
      // ------------------------------------

      if (update.callback_query) {

        await handleCallbackQuery(
          update.callback_query,
          env,
          token
        );
      }

      return new Response(
        "OK",
        {
          status: 200
        }
      );

    } catch (error) {

      console.error(
        "Worker error:",
        error
      );

      return new Response(
        "Internal Server Error",
        {
          status: 500
        }
      );
    }
  }
};

// ==========================================
// Message Handler
// ==========================================

async function handleMessage(
  message,
  env,
  token
) {

  if (!message.chat) {
    return;
  }

  const chatId =
    String(message.chat.id);

  const userId =
    String(
      message.from?.id ??
      message.chat.id
    );

  const text =
    String(
      message.text || ""
    ).trim();

  // ========================================
  // /start
  // ========================================

  if (
    text === "/start"
  ) {

    await sendWelcome(
      token,
      chatId
    );

    return;
  }

  // ========================================
  // /new
  // ========================================

  if (
    text === "/new"
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      DEFAULT_DIFFICULTY
    );

    return;
  }

  // ========================================
  // /easy
  // ========================================

  if (
    text === "/easy"
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      "easy"
    );

    return;
  }

  // ========================================
  // /medium
  // ========================================

  if (
    text === "/medium"
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      "medium"
    );

    return;
  }

  // ========================================
  // /hard
  // ========================================

  if (
    text === "/hard"
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      "hard"
    );

    return;
  }

  // ========================================
  // /expert
  // ========================================

  if (
    text === "/expert"
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      "expert"
    );

    return;
  }

  // ========================================
  // /master
  // ========================================

  if (
    text === "/master"
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      "master"
    );

    return;
  }

  // ========================================
  // /game
  // ========================================

  if (
    text === "/game"
  ) {

    const game =
      await loadGame(
        env,
        chatId
      );

    if (!game) {

      await sendMessage(
        token,
        chatId,
        "هنوز بازی فعالی نداری.\n\nبرای شروع /new را بزن."
      );

      return;
    }

    await sendGameMessage(
      token,
      chatId,
      game
    );

    return;
  }

  // ========================================
  // /help
  // ========================================

  if (
    text === "/help"
  ) {

    await sendHelp(
      token,
      chatId
    );

    return;
  }
}

// ==========================================
// Welcome
// ==========================================

async function sendWelcome(
  token,
  chatId
) {

  const text = [
    "🧩 <b>Sudoku</b>",
    "",
    "به بازی سودوکو خوش آمدی!",
    "",
    "از دستورهای زیر استفاده کن:",
    "",
    "🟢 /easy",
    "🟡 /medium",
    "🔴 /hard",
    "🟣 /expert",
    "⚫ /master",
    "",
    "یا برای شروع سریع:",
    "/new"
  ].join("\n");

  await sendMessage(
    token,
    chatId,
    text,
    buildDifficultyKeyboard()
  );
}

// ==========================================
// Help
// ==========================================

async function sendHelp(
  token,
  chatId
) {

  const text = [
    "🧩 <b>راهنمای Sudoku</b>",
    "",
    "1️⃣ روی یک خانه بزن.",
    "2️⃣ عدد موردنظر را انتخاب کن.",
    "3️⃣ برای یادداشت از ✏️ مداد استفاده کن.",
    "4️⃣ برای پاک کردن عدد 🧹 را بزن.",
    "5️⃣ با 💡 می‌توانی راهنمایی بگیری.",
    "",
    "عددهای اولیه با 🔒 مشخص هستند و قابل تغییر نیستند."
  ].join("\n");

  await sendMessage(
    token,
    chatId,
    text
  );
}

// ==========================================
// شروع بازی جدید
// ==========================================

async function startNewGame(
  env,
  token,
  chatId,
  userId,
  difficulty
) {

  if (
    !VALID_DIFFICULTIES.includes(
      difficulty
    )
  ) {
    difficulty =
      DEFAULT_DIFFICULTY;
  }

  let game;

  try {

    game =
      newGame(difficulty);

  } catch (error) {

    console.error(
      "Sudoku generation error:",
      error
    );

    await sendMessage(
      token,
      chatId,
      "❌ در ساخت جدول Sudoku مشکلی پیش آمد. دوباره تلاش کن."
    );

    return;
  }

  await saveGame(
    env,
    chatId,
    userId,
    game
  );

  await sendGameMessage(
    token,
    chatId,
    game
  );
}

// ==========================================
// Callback Query
// ==========================================

async function handleCallbackQuery(
  callback,
  env,
  token
) {

  const callbackId =
    callback.id;

  const message =
    callback.message;

  if (!message) {

    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }

  const chatId =
    String(
      message.chat.id
    );

  const userId =
    String(
      callback.from?.id ??
      message.chat.id
    );

  const data =
    String(
      callback.data || ""
    );

  // ========================================
  // بازی را از D1 بخوان
  // ========================================

  let game =
    await loadGame(
      env,
      chatId
    );

  // ========================================
  // انتخاب درجه سختی
  // ========================================

  if (
    data.startsWith(
      "difficulty:"
    )
  ) {

    const difficulty =
      data.split(":")[1];

    if (
      !VALID_DIFFICULTIES.includes(
        difficulty
      )
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "درجه سختی نامعتبر است."
      );

      return;
    }

    game =
      newGame(
        difficulty
      );

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    await editGameMessage(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callbackId,
      `Sudoku ${difficulty} ساخته شد.`
    );

    return;
  }

  // ========================================
  // اگر بازی وجود ندارد
  // ========================================

  if (!game) {

    await answerCallbackQuery(
      token,
      callbackId,
      "بازی فعالی پیدا نشد."
    );

    return;
  }

  // ========================================
  // انتخاب خانه
  // ========================================

  if (
    data.startsWith(
      "cell:"
    )
  ) {

    const index =
      Number(
        data.split(":")[1]
      );

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= 81
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "خانه نامعتبر است."
      );

      return;
    }

    selectCell(
      game,
      index
    );

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    await editGameMessage(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }

  // ========================================
  // حالت Pencil
  // ========================================

  if (
    data === "mode:pencil"
  ) {

    togglePencilMode(
      game
    );

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    await editGameMessage(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callbackId,
      game.pencilMode
        ? "✏️ مداد روشن شد."
        : "✏️ مداد خاموش شد."
    );

    return;
  }

  // ========================================
  // پاک کردن
  // ========================================

  if (
    data === "mode:erase"
  ) {

    if (
      game.selectedCell === -1
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "اول یک خانه انتخاب کن."
      );

      return;
    }

    const result =
      eraseNumber(
        game,
        game.selectedCell
      );

    if (!result.ok) {

      await answerCallbackQuery(
        token,
        callbackId,
        result.message
      );

      return;
    }

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    await editGameMessage(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callbackId,
      "پاک شد."
    );

    return;
  }

  // ========================================
  // وارد کردن عدد
  // ========================================

  if (
    data.startsWith(
      "num:"
    )
  ) {

    if (
      game.selectedCell === -1
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "اول یک خانه انتخاب کن."
      );

      return;
    }

    const number =
      Number(
        data.split(":")[1]
      );

    const index =
      game.selectedCell;

    // --------------------------------------
    // Pencil
    // --------------------------------------

    if (
      game.pencilMode
    ) {

      const result =
        toggleNote(
          game,
          index,
          number
        );

      if (!result.ok) {

        await answerCallbackQuery(
          token,
          callbackId,
          result.message
        );

        return;
      }

      await saveGame(
        env,
        chatId,
        userId,
        game
      );

      await editGameMessage(
        token,
        message,
        game
      );

      await answerCallbackQuery(
        token,
        callbackId,
        result.added
          ? `✏️ ${number} اضافه شد.`
          : `✏️ ${number} حذف شد.`
      );

      return;
    }

    // --------------------------------------
    // عدد واقعی
    // --------------------------------------

    const result =
      putNumber(
        game,
        index,
        number
      );

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    await editGameMessage(
      token,
      message,
      game
    );

    if (
      result.mistake
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        `❌ اشتباه! تعداد خطا: ${result.mistakes}`,
        false
      );

      return;
    }

    if (
      result.won
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "🎉 برنده شدی!",
        false
      );

      return;
    }

    await answerCallbackQuery(
      token,
      callbackId,
      "✅ درست!"
    );

    return;
  }

  // ========================================
  // راهنمایی
  // ========================================

  if (
    data === "action:hint"
  ) {

    const result =
      await processHint(
        token,
        chatId,
        userId,
        game,
        message,
        env
      );

    await answerCallbackQuery(
      token,
      callbackId,
      result
    );

    return;
  }

  // ========================================
  // بازی جدید
  // ========================================

  if (
    data === "action:new"
  ) {

    const freshGame =
      newGame(
        game.difficulty
      );

    await saveGame(
      env,
      chatId,
      userId,
      freshGame
    );

    await editGameMessage(
      token,
      message,
      freshGame
    );

    await answerCallbackQuery(
      token,
      callbackId,
      "🔄 بازی جدید ساخته شد."
    );

    return;
  }

  // ========================================
  // بازگشت به جدول
  // ========================================

  if (
    data === "action:board"
  ) {

    await editGameMessage(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }

  // ========================================
  // Callback ناشناخته
  // ========================================

  await answerCallbackQuery(
    token,
    callbackId
  );
}

// ==========================================
// راهنمایی Sudoku
// ==========================================

async function processHint(
  token,
  chatId,
  userId,
  game,
  message,
  env
) {

  if (
    game.status !== "playing"
  ) {
    return "این بازی تمام شده است.";
  }

  try {

    const result =
      getHint(
        game.board
      );

    game.hints++;

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    /*
     * بسته به API sudoku-core،
     * hint ممکن است اطلاعات مختلفی
     * درباره حرکت پیشنهادی برگرداند.
     */

    if (!result) {

      return "💡 فعلاً راهنمایی مناسبی پیدا نشد.";
    }

    const hintText =
      formatHint(result);

    await editGameMessage(
      token,
      message,
      game
    );

    return hintText;

  } catch (error) {

    console.error(
      "Hint error:",
      error
    );

    return "❌ دریافت راهنمایی با خطا مواجه شد.";
  }
}

// ==========================================
// تبدیل Hint به متن
// ==========================================

function formatHint(result) {

  if (
    typeof result === "string"
  ) {
    return `💡 ${result}`;
  }

  if (
    result.message
  ) {
    return `💡 ${result.message}`;
  }

  if (
    result.description
  ) {
    return `💡 ${result.description}`;
  }

  if (
    result.strategy
  ) {
    return `💡 روش پیشنهادی: ${result.strategy}`;
  }

  return "💡 یک حرکت منطقی برای ادامه بازی پیدا شد.";
}

// ==========================================
// نمایش بازی
// ==========================================

async function sendGameMessage(
  token,
  chatId,
  game
) {

  const text =
    createBoardText(
      game
    );

  const keyboard =
    buildSudokuKeyboard(
      game
    );

  await sendMessage(
    token,
    chatId,
    text,
    keyboard
  );
}

// ==========================================
// ویرایش بازی
// ==========================================

async function editGameMessage(
  token,
  message,
  game
) {

  const text =
    createBoardText(
      game
    );

  // --------------------------------------
  // بازی تمام شده
  // --------------------------------------

  if (
    game.status === "won"
  ) {

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      text,
      buildFinishedKeyboard()
    );

    return;
  }

  // --------------------------------------
  // حالت عادی
  // --------------------------------------

  await editMessageText(
    token,
    message.chat.id,
    message.message_id,
    text,
    buildSudokuKeyboard(
      game
    )
  );
}

// ==========================================
// ساخت متن جدول
// ==========================================

function createBoardText(
  game
) {

  const lines = [];

  lines.push(
    "🧩 <b>Sudoku</b>"
  );

  lines.push(
    `🎯 سطح: ${getDifficultyName(game.difficulty)}`
  );

  lines.push(
    `📊 پیشرفت: ${getProgress(game)}%`
  );

  lines.push(
    `❌ اشتباه: ${game.mistakes}`
  );

  lines.push(
    `💡 راهنمایی: ${game.hints}`
  );

  lines.push("");

  // --------------------------------------
  // جدول
  // --------------------------------------

  for (
    let row = 0;
    row < 9;
    row++
  ) {

    const cells = [];

    for (
      let col = 0;
      col < 9;
      col++
    ) {

      const index =
        row * 9 + col;

      const value =
        game.board[index];

      let text;

      if (
        value !== null
      ) {

        text =
          String(value);

      } else {

        const notes =
          game.notes[index];

        text =
          notes.length > 0
            ? notes.join("")
            : "·";
      }

      cells.push(
        text
      );
    }

    lines.push(
      cells.join(" ")
    );
  }

  lines.push("");

  // --------------------------------------
  // وضعیت
  // --------------------------------------

  if (
    game.status === "won"
  ) {

    lines.push(
      "🎉 <b>تبریک! جدول حل شد.</b>"
    );

  } else if (
    game.pencilMode
  ) {

    lines.push(
      "✏️ <b>حالت مداد فعال است</b>"
    );

  } else if (
    game.selectedCell !== -1
  ) {

    lines.push(
      `📍 خانه انتخاب‌شده: ${formatCell(game.selectedCell)}`
    );

  } else {

    lines.push(
      "👆 یک خانه را انتخاب کن."
    );
  }

  return lines.join("\n");
}

// ==========================================
// نام فارسی درجه سختی
// ==========================================

function getDifficultyName(
  difficulty
) {

  const names = {

    easy:
      "🟢 آسان",

    medium:
      "🟡 متوسط",

    hard:
      "🔴 سخت",

    expert:
      "🟣 خیلی سخت",

    master:
      "⚫ استاد"
  };

  return (
    names[difficulty] ||
    difficulty
  );
}

// ==========================================
// نمایش مختصات خانه
// ==========================================

function formatCell(index) {

  const row =
    Math.floor(index / 9);

  const col =
    index % 9;

  const letters = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I"
  ];

  return (
    `${letters[col]}${row + 1}`
  );
}

// ==========================================
// ذخیره بازی در D1
// =========================================

async function saveGame(
  env,
  chatId,
  userId,
  game
) {

  if (!env.DB) {

    throw new Error(
      "D1 binding DB is missing."
    );
  }

  const now =
    Date.now();

  await env.DB
    .prepare(`
      INSERT OR REPLACE INTO games (
        chat_id,
        user_id,
        puzzle,
        solution,
        board,
        notes,
        selected_cell,
        difficulty,
        mistakes,
        hints,
        pencil_mode,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(

      chatId,

      userId,

      JSON.stringify(
        game.puzzle
      ),

      JSON.stringify(
        game.solution
      ),

      JSON.stringify(
        game.board
      ),

      JSON.stringify(
        game.notes
      ),

      game.selectedCell,

      game.difficulty,

      game.mistakes,

      game.hints,

      game.pencilMode
        ? 1
        : 0,

      game.status,

      game.createdAt ||
        now,

      now

    )
    .run();
}

// ==========================================
// دریافت بازی از D1
// ==========================================

async function loadGame(
  env,
  chatId
) {

  if (!env.DB) {

    throw new Error(
      "D1 binding DB is missing."
    );
  }

  const row =
    await env.DB
      .prepare(`
        SELECT *
        FROM games
        WHERE chat_id = ?
        LIMIT 1
      `)
      .bind(chatId)
      .first();

  if (!row) {
    return null;
  }

  return {

    puzzle:
      JSON.parse(
        row.puzzle
      ),

    solution:
      JSON.parse(
        row.solution
      ),

    board:
      JSON.parse(
        row.board
      ),

    notes:
      JSON.parse(
        row.notes
      ),

    selectedCell:
      Number(
        row.selected_cell
      ),

    difficulty:
      row.difficulty,

    mistakes:
      Number(
        row.mistakes
      ),

    hints:
      Number(
        row.hints
      ),

    pencilMode:
      Boolean(
        row.pencil_mode
      ),

    status:
      row.status,

    createdAt:
      Number(
        row.created_at
      )
  };
