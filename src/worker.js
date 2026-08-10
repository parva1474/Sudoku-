// ==========================================
// src/worker.js
// Telegram Sudoku Bot
// Cloudflare Workers + D1
// جدول 9×9 به صورت PNG
// ==========================================

import {
  sendMessage,
  sendPhoto,
  editMessageText,
  editMessagePhoto,
  answerCallbackQuery
} from "./telegram.js";

import {
  newGame,
  selectCell,
  togglePencilMode,
  toggleNote,
  putNumber,
  eraseNumber,
  getProgress,
  applyHint
} from "./game.js";

import {
  buildNumberKeyboard,
  buildDifficultyKeyboard,
  buildFinishedKeyboard,
  buildBlockKeyboard,
  buildCellKeyboard
} from "./keyboard.js";

import {
  getHint
} from "./sudoku.js";

import {
  renderSudokuPNG
} from "./sudoku-image.js";

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

    if (request.method === "GET") {

      return new Response(
        "🧩 Sudoku Bot is running.",
        { status: 200 }
      );
    }

    if (request.method !== "POST") {

      return new Response(
        "Method Not Allowed",
        { status: 405 }
      );
    }

    try {

      const update =
        await request.json();

      const token =
        env.BOT_TOKEN;

      if (!token) {

        console.error(
          "BOT_TOKEN is missing."
        );

        return new Response(
          "BOT_TOKEN is missing.",
          { status: 500 }
        );
      }

      if (update.message) {

        await handleMessage(
          update.message,
          env,
          token
        );
      }

      if (update.callback_query) {

        await handleCallbackQuery(
          update.callback_query,
          env,
          token
        );
      }

      return new Response("OK");

    } catch (error) {

      console.error(
        "Worker error:",
        error
      );

      return new Response(
        "Internal Server Error",
        { status: 500 }
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

  // ----------------------------------------
  // /start
  // ----------------------------------------

  if (text === "/start") {

    await sendWelcome(
      token,
      chatId
    );

    return;
  }

  // ----------------------------------------
  // /new
  // ----------------------------------------

  if (text === "/new") {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      DEFAULT_DIFFICULTY
    );

    return;
  }

  // ----------------------------------------
  // Difficulty commands
  // ----------------------------------------

  const difficultyCommands = {
    "/easy": "easy",
    "/medium": "medium",
    "/hard": "hard",
    "/expert": "expert",
    "/master": "master"
  };

  if (
    difficultyCommands[text]
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      difficultyCommands[text]
    );

    return;
  }

  // ----------------------------------------
  // /game
  // ----------------------------------------

  if (text === "/game") {

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

  // ----------------------------------------
  // /help
  // ----------------------------------------

  if (text === "/help") {

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
    "درجه سختی را انتخاب کن:"
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
    "🔲 ابتدا یکی از ۹ بلوک را انتخاب کن.",
    "👆 سپس خانه موردنظر را انتخاب کن.",
    "🔢 عدد موردنظر را وارد کن.",
    "✏️ برای Pencil حالت مداد را روشن کن.",
    "🧹 برای پاک کردن عدد استفاده کن.",
    "💡 راهنمایی یک حرکت درست را وارد می‌کند.",
    "",
    "🔒 خانه‌های اولیه قابل تغییر نیستند."
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
      "❌ ساخت جدول Sudoku با خطا مواجه شد."
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
// Callback Handler
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
    String(message.chat.id);

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
  // Difficulty
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

    const game =
      newGame(difficulty);

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

    await answerCallbackQuery(
      token,
      callbackId,
      "🎮 بازی شروع شد."
    );

    return;
  }

  // ========================================
  // Load game
  // ========================================

  let game =
    await loadGame(
      env,
      chatId
    );

  if (!game) {

    await answerCallbackQuery(
      token,
      callbackId,
      "بازی فعالی پیدا نشد."
    );

    return;
  }

  // ========================================
  // انتخاب بلوک 3×3
  // ========================================

  if (
    data.startsWith("block:")
  ) {

    const block =
      Number(
        data.split(":")[1]
      );

    if (
      !Number.isInteger(block) ||
      block < 0 ||
      block > 8
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "بلوک نامعتبر است."
      );

      return;
    }

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createCellSelectionText(
        game,
        block
      ),
      buildCellKeyboard(block)
    );

    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }

  // ========================================
  // انتخاب خانه داخل بلوک
  // ========================================

  if (
    data.startsWith("cell:")
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

    if (
      game.puzzle[index] !== null
    ) {

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createBoardInfoText(game),
        buildBlockKeyboard()
      );

      await answerCallbackQuery(
        token,
        callbackId,
        "🔒 این خانه ثابت است."
      );

      return;
    }

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createNumberScreenText(game),
      buildNumberKeyboard(game)
    );

    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }

  // ========================================
  // Pencil
  // ========================================

  if (
    data === "mode:pencil"
  ) {

    togglePencilMode(game);

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    if (
      game.selectedCell !== -1 &&
      game.puzzle[
        game.selectedCell
      ] === null
    ) {

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createNumberScreenText(game),
        buildNumberKeyboard(game)
      );

    } else {

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createBoardInfoText(game),
        buildBlockKeyboard()
      );
    }

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
  // Erase
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

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createNumberScreenText(game),
      buildNumberKeyboard(game)
    );

    await answerCallbackQuery(
      token,
      callbackId,
      result.ok
        ? "🧹 پاک شد."
        : result.message
    );

    return;
  }

  // ========================================
  // Number
  // ========================================

  if (
    data.startsWith("num:")
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

      await saveGame(
        env,
        chatId,
        userId,
        game
      );

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createNumberScreenText(game),
        buildNumberKeyboard(game)
      );

      await answerCallbackQuery(
        token,
        callbackId,
        result.ok
          ? (
              result.added
                ? `✏️ ${number} اضافه شد.`
                : `✏️ ${number} حذف شد.`
            )
          : result.message
      );

      return;
    }

    // --------------------------------------
    // عدد اصلی
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

    // --------------------------------------
    // برد
    // --------------------------------------

    if (
      result.won
    ) {

      await updateSudokuPhoto(
        token,
        message,
        game,
        createBoardInfoText(game),
        buildFinishedKeyboard()
      );

      await answerCallbackQuery(
        token,
        callbackId,
        "🎉 تبریک! Sudoku حل شد."
      );

      return;
    }

    // --------------------------------------
    // اشتباه
    // --------------------------------------

    if (
      result.mistake
    ) {

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createNumberScreenText(game),
        buildNumberKeyboard(game)
      );

      await answerCallbackQuery(
        token,
        callbackId,
        `❌ اشتباه! خطا: ${game.mistakes}`
      );

      return;
    }

    // --------------------------------------
    // عدد صحیح
    // --------------------------------------

    await updateSudokuPhoto(
      token,
      message,
      game,
      createBoardInfoText(game),
      buildBlockKeyboard()
    );

    await answerCallbackQuery(
      token,
      callbackId,
      "✅ درست!"
    );

    return;
  }

  // ========================================
  // Hint
  // ========================================

  if (
    data === "action:hint"
  ) {

    let hintResult = null;

    try {

      hintResult =
        getHint(
          game.board
        );

    } catch (error) {

      console.error(
        "Hint error:",
        error
      );
    }

    const result =
      applyHint(
        game,
        hintResult
      );

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    if (
      result.won
    ) {

      await updateSudokuPhoto(
        token,
        message,
        game,
        createBoardInfoText(game),
        buildFinishedKeyboard()
      );

      await answerCallbackQuery(
        token,
        callbackId,
        "🎉 راهنمایی باعث تکمیل جدول شد."
      );

      return;
    }

    await updateSudokuPhoto(
      token,
      message,
      game,
      createBoardInfoText(game),
      buildBlockKeyboard()
    );

    await answerCallbackQuery(
      token,
      callbackId,
      result.message
    );

    return;
  }

  // ========================================
  // New Game
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

    await updateSudokuPhoto(
      token,
      message,
      freshGame,
      createBoardInfoText(freshGame),
      buildBlockKeyboard()
    );

    await answerCallbackQuery(
      token,
      callbackId,
      "🔄 بازی جدید ساخته شد."
    );

    return;
  }

  // ========================================
  // Back to blocks
  // ========================================

  if (
    data === "action:blocks"
  ) {

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createBoardInfoText(game),
      buildBlockKeyboard()
    );

    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }

  // ========================================
  // Back to board
  // ========================================

  if (
    data === "action:board"
  ) {

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createBoardInfoText(game),
      buildBlockKeyboard()
    );

    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }

  await answerCallbackQuery(
    token,
    callbackId
  );
}

// ==========================================
// ارسال بازی جدید
// ==========================================

async function sendGameMessage(
  token,
  chatId,
  game
) {

  const png =
    await renderSudokuPNG(game);

  await sendPhoto(
    token,
    chatId,
    png,
    createBoardInfoText(game),
    buildBlockKeyboard()
  );
}

// ==========================================
// بروزرسانی تصویر Sudoku
// ==========================================

async function updateSudokuPhoto(
  token,
  message,
  game,
  caption,
  replyMarkup
) {

  /*
   * پیام بازی جدید باید عکس باشد.
   *
   * در صورتی که پیام فعلی هنوز متن باشد،
   * ابتدا پیام متن را ویرایش نمی‌کنیم.
   */

  const png =
    await renderSudokuPNG(game);

  try {

    await editMessagePhoto(
      token,
      message.chat.id,
      message.message_id,
      png,
      caption,
      replyMarkup
    );

  } catch (error) {

    /*
     * اگر پیام فعلی عکس نباشد،
     * آن را با یک پیام متنی جایگزین می‌کنیم.
     *
     * این حالت فقط برای بازی‌های قدیمی
     * که قبل از نسخه تصویری ساخته شده‌اند
     * اتفاق می‌افتد.
     */

    console.error(
      "editMessagePhoto failed:",
      error
    );

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      caption,
      replyMarkup
    );
  }
}

// ==========================================
// متن اطلاعات بازی
// ==========================================

function createBoardInfoText(
  game
) {

  const lines = [
    "🧩 <b>Sudoku</b>",
    "",
    `🎯 سطح: ${getDifficultyName(game.difficulty)}`,
    `📊 پیشرفت: ${getProgress(game)}%`,
    `❌ اشتباه: ${game.mistakes}`,
    `💡 راهنمایی: ${game.hints}`,
    ""
  ];

  if (
    game.status === "won"
  ) {

    lines.push(
      "🎉 <b>جدول حل شد!</b>"
    );

  } else if (
    game.selectedCell !== -1
  ) {

    const row =
      Math.floor(
        game.selectedCell / 9
      ) + 1;

    const col =
      (
        game.selectedCell % 9
      ) + 1;

    lines.push(
      `📍 خانه انتخاب‌شده: ${row},${col}`
    );

  } else {

    lines.push(
      "👆 ابتدا یکی از بلوک‌های ۳×۳ را انتخاب کن."
    );
  }

  return lines.join("\n");
}

// ==========================================
// انتخاب خانه
// ==========================================

function createCellSelectionText(
  game,
  block
) {

  const blockRow =
    Math.floor(block / 3);

  const blockCol =
    block % 3;

  const startRow =
    blockRow * 3 + 1;

  const startCol =
    blockCol * 3 + 1;

  return [
    "🧩 <b>انتخاب خانه</b>",
    "",
    `📦 بلوک: ${block + 1}`,
    `📍 سطرهای ${startRow} تا ${startRow + 2}`,
    `📍 ستون‌های ${startCol} تا ${startCol + 2}`,
    "",
    "👆 یکی از خانه‌های این بلوک را انتخاب کن."
  ].join("\n");
}

// ==========================================
// صفحه انتخاب عدد
// ==========================================

function createNumberScreenText(
  game
) {

  const index =
    game.selectedCell;

  const row =
    Math.floor(index / 9) + 1;

  const col =
    (index % 9) + 1;

  const notes =
    Array.isArray(
      game.notes[index]
    )
      ? game.notes[index]
      : [];

  const current =
    game.board[index];

  return [
    "🔢 <b>انتخاب عدد</b>",
    "",
    `📍 خانه: سطر ${row}، ستون ${col}`,
    `🔢 مقدار فعلی: ${current ?? "خالی"}`,
    `✏️ یادداشت‌ها: ${
      notes.length
        ? notes.join(" ")
        : "—"
    }`,
    "",
    game.pencilMode
      ? "✏️ <b>حالت مداد فعال است</b>"
      : "عدد موردنظر را انتخاب کن:"
  ].join("\n");
}

// ==========================================
// نام درجه سختی
// ==========================================

function getDifficultyName(
  difficulty
) {

  const names = {

    easy: "🟢 آسان",

    medium: "🟡 متوسط",

    hard: "🔴 سخت",

    expert: "🟣 خیلی سخت",

    master: "⚫ استاد"
  };

  return (
    names[difficulty] ||
    difficulty
  );
}

// ==========================================
// ذخیره بازی
// ==========================================

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
      JSON.stringify(game.puzzle),
      JSON.stringify(game.solution),
      JSON.stringify(game.board),
      JSON.stringify(game.notes),
      game.selectedCell,
      game.difficulty,
      game.mistakes,
      game.hints,
      game.pencilMode ? 1 : 0,
      game.status,
      game.createdAt || now,
      now
    )
    .run();
}

// ==========================================
// دریافت بازی
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
      JSON.parse(row.puzzle),

    solution:
      JSON.parse(row.solution),

    board:
      JSON.parse(row.board),

    notes:
      JSON.parse(row.notes),

    selectedCell:
      Number(row.selected_cell),

    difficulty:
      row.difficulty,

    mistakes:
      Number(row.mistakes),

    hints:
      Number(row.hints),

    pencilMode:
      Boolean(row.pencil_mode),

    status:
      row.status,

    createdAt:
      Number(row.created_at)
  };
}
