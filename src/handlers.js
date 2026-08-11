// ==========================================
// src/handlers.js
// Telegram Sudoku Handlers
// ==========================================

import {
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
  getProgress,
  applyHint
} from "./game.js";

import {
  buildSudokuKeyboard,
  buildBlockKeyboard,
  buildCellKeyboard,
  buildNumberKeyboard,
  buildDifficultyKeyboard,
  buildFinishedKeyboard
} from "./keyboard.js";

import {
  generateSudoku,
  getHint
} from "./sudoku.js";


// ==========================================
// تنظیمات
// ==========================================

const DEFAULT_DIFFICULTY =
  "medium";

const VALID_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master"
];


// ==========================================
// Message Handler
// ==========================================

export async function handleMessage(
  message,
  env,
  token
) {

  if (!message?.chat) {
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

  if (text === "/start") {

    await sendWelcome(
      token,
      chatId
    );

    return;
  }


  // ========================================
  // /new
  // ========================================

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


  // ========================================
  // Difficulty commands
  // ========================================

  const difficultyCommands = {

    "/easy": "easy",
    "/medium": "medium",
    "/hard": "hard",
    "/expert": "expert",
    "/master": "master"

  };


  if (difficultyCommands[text]) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      difficultyCommands[text]
    );

    return;
  }


  // ========================================
  // /game
  // ========================================

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


  // ========================================
  // /help
  // ========================================

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
    "👆 ابتدا یکی از ۹ بلوک را انتخاب کن.",
    "🔲 سپس خانه موردنظر را انتخاب کن.",
    "🔢 بعد عدد موردنظر را انتخاب کن.",
    "✏️ برای Pencil حالت مداد را روشن کن.",
    "🧹 برای پاک کردن عدد استفاده کن.",
    "💡 راهنمایی یک حرکت درست انجام می‌دهد.",
    "",
    "🔒 خانه‌های اولیه قابل تغییر نیستند.",
    "",
    "👥 بازی در گروه قابل انجام است."

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


  let generated;

  try {

    generated =
      generateSudoku(
        difficulty
      );

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


  const game =
    newGame(
      difficulty,
      generated.puzzle,
      generated.solution
    );


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
// ارسال صفحه بازی
// ==========================================

async function sendGameMessage(
  token,
  chatId,
  game
) {

  await sendMessage(
    token,
    chatId,
    createBoardText(game),
    buildBlockKeyboard(game)
  );
}


// ==========================================
// ویرایش صفحه بازی
// ==========================================

async function editGameMessage(
  token,
  message,
  game
) {

  if (game.status === "won") {

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createBoardText(game),
      buildFinishedKeyboard()
    );

    return;
  }


  await editMessageText(
    token,
    message.chat.id,
    message.message_id,
    createBoardText(game),
    buildBlockKeyboard(game)
  );
}


// ==========================================
// Callback Handler
// ==========================================

export async function handleCallbackQuery(
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
  // Difficulty
  // ========================================

  if (data.startsWith("difficulty:")) {

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


    let generated;

    try {

      generated =
        generateSudoku(
          difficulty
        );

    } catch (error) {

      console.error(
        "Sudoku generation error:",
        error
      );

      await answerCallbackQuery(
        token,
        callbackId,
        "❌ خطا در ساخت جدول."
      );

      return;
    }


    const game =
      newGame(
        difficulty,
        generated.puzzle,
        generated.solution
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
      "🎮 بازی شروع شد."
    );

    return;
  }


  // ========================================
  // Load Game
  // ========================================

  const game =
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
  // انتخاب بلوک
  // ========================================

  if (data.startsWith("block:")) {

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
      createBoardText(game),
      buildCellKeyboard(
        block,
        game
      )
    );


    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }


  // ========================================
  // برگشت به بلوک‌ها
  // ========================================

  if (data === "action:blocks") {

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createBoardText(game),
      buildBlockKeyboard(game)
    );


    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }


  // ========================================
  // برگشت به خانه‌ها
  // ========================================

  if (data === "action:cells") {

    const selected =
      Number(
        game.selectedCell
      );


    if (
      Number.isInteger(selected) &&
      selected >= 0 &&
      selected < 81
    ) {

      const row =
        Math.floor(
          selected / 9
        );

      const col =
        selected % 9;

      const block =
        Math.floor(row / 3) * 3 +
        Math.floor(col / 3);


      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createBoardText(game),
        buildCellKeyboard(
          block,
          game
        )
      );

    } else {

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createBoardText(game),
        buildBlockKeyboard(game)
      );
    }


    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }


  // ========================================
  // انتخاب خانه
  // ========================================

  if (data.startsWith("cell:")) {

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


    // --------------------------------------
    // خانه ثابت
    // --------------------------------------

    if (
      game.puzzle[index] !== null &&
      game.puzzle[index] !== undefined
    ) {

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createBoardText(game),
        buildNumberKeyboard(game)
      );


      await answerCallbackQuery(
        token,
        callbackId,
        "🔒 این خانه ثابت است."
      );

      return;
    }


    // --------------------------------------
    // خانه آزاد
    // --------------------------------------

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

  if (data === "mode:pencil") {

    togglePencilMode(
      game
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
      game.pencilMode
        ? "✏️ مداد روشن شد."
        : "✏️ مداد خاموش شد."
    );

    return;
  }


  // ========================================
  // Erase
  // ========================================

  if (data === "mode:erase") {

    if (game.selectedCell === -1) {

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

  if (data.startsWith("num:")) {

    if (game.selectedCell === -1) {

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


    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > 9
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "عدد نامعتبر است."
      );

      return;
    }


    const index =
      game.selectedCell;


    // --------------------------------------
    // Pencil
    // --------------------------------------

    if (game.pencilMode) {

      const result =
        toggleNote(
          game,
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
    // برنده
    // --------------------------------------

    if (result.won) {

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createBoardText(game),
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

    if (result.mistake) {

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
    // درست
    // --------------------------------------

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createBoardText(game),
      buildBlockKeyboard(game)
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

  if (data === "action:hint") {

    let hintResult = null;


    try {

      hintResult =
        getHint(
          game.board,
          game.solution
        );

    } catch (error) {

      console.error(
        "Hint error:",
        error
      );
    }


    if (!hintResult) {

      await answerCallbackQuery(
        token,
        callbackId,
        "💡 راهنمایی در دسترس نیست."
      );

      return;
    }


    const result =
      applyHint(
        game,
        game.selectedCell,
        hintResult.index,
        hintResult.number
      );


    await saveGame(
      env,
      chatId,
      userId,
      game
    );


    if (result.won) {

      await editMessageText(
        token,
        message.chat.id,
        message.message_id,
        createBoardText(game),
        buildFinishedKeyboard()
      );


      await answerCallbackQuery(
        token,
        callbackId,
        "🎉 راهنمایی باعث تکمیل جدول شد."
      );

      return;
    }


    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createBoardText(game),
      buildBlockKeyboard(game)
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

  if (data === "action:new") {

    let freshGenerated;

    try {

      freshGenerated =
        generateSudoku(
          game.difficulty
        );

    } catch (error) {

      console.error(
        "New game generation error:",
        error
      );

      await answerCallbackQuery(
        token,
        callbackId,
        "❌ ساخت بازی جدید ناموفق بود."
      );

      return;
    }


    const freshGame =
      newGame(
        game.difficulty,
        freshGenerated.puzzle,
        freshGenerated.solution
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
  // Unknown callback
  // ========================================

  await answerCallbackQuery(
    token,
    callbackId
  );
}


// ==========================================
// متن جدول
// ==========================================

function createBoardText(
  game
) {

  const lines = [];


  lines.push(
    "🧩 <b>Sudoku</b>"
  );


  lines.push(
    `🎯 سطح: ${getDifficultyName(
      game.difficulty
    )}`
  );


  lines.push(
    `📊 پیشرفت: ${getProgress(game)}%`
  );


  lines.push(
    `❌ اشتباه: ${game.mistakes || 0}`
  );


  lines.push(
    `💡 راهنمایی: ${game.hints || 0}`
  );


  lines.push("");


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

      cells.push(
        value !== null &&
        value !== undefined
          ? String(value)
          : "·"
      );
    }


    lines.push(
      cells.slice(0, 3).join(" ") +
      " │ " +
      cells.slice(3, 6).join(" ") +
      " │ " +
      cells.slice(6, 9).join(" ")
    );


    if (
      row === 2 ||
      row === 5
    ) {

      lines.push(
        "──────┼──────┼──────"
      );
    }
  }


  lines.push("");


  if (game.status === "won") {

    lines.push(
      "🎉 <b>جدول حل شد!</b>"
    );

  } else {

    lines.push(
      "👆 ابتدا یکی از ۹ بلوک را انتخاب کن."
    );
  }


  return lines.join("\n");
}


// ==========================================
// صفحه انتخاب عدد
// ==========================================

function createNumberScreenText(
  game
) {

  const index =
    Number(
      game.selectedCell
    );


  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return [
      "🔢 <b>انتخاب عدد</b>",
      "",
      "اول یک خانه را انتخاب کن."
    ].join("\n");
  }


  const row =
    Math.floor(index / 9) + 1;

  const col =
    (index % 9) + 1;

  const value =
    game.board[index];


  const notes =
    Array.isArray(
      game.notes?.[index]
    )
      ? game.notes[index]
      : [];


  return [

    "🔢 <b>انتخاب عدد</b>",
    "",
    `📍 خانه: سطر ${row}، ستون ${col}`,
    `🔢 مقدار فعلی: ${value ?? "خالی"}`,
    `✏️ Pencil: ${
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
// نام سختی
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
        game.notes || []
      ),

      Number(
        game.selectedCell ?? -1
      ),

      game.difficulty,

      Number(
        game.mistakes || 0
      ),

      Number(
        game.hints || 0
      ),

      game.pencilMode
        ? 1
        : 0,

      game.status ||
        "playing",

      Number(
        game.createdAt ||
        now
      ),

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
      safeJSON(
        row.puzzle,
        []
      ),

    solution:
      safeJSON(
        row.solution,
        []
      ),

    board:
      safeJSON(
        row.board,
        []
      ),

    notes:
      safeJSON(
        row.notes,
        []
      ),

    selectedCell:
      Number(
        row.selected_cell ?? -1
      ),

    difficulty:
      row.difficulty,

    mistakes:
      Number(
        row.mistakes || 0
      ),

    hints:
      Number(
        row.hints || 0
      ),

    pencilMode:
      Boolean(
        row.pencil_mode
      ),

    status:
      row.status || "playing",

    createdAt:
      Number(
        row.created_at || 0
      ),

    updatedAt:
      Number(
        row.updated_at || 0
      )
  };
}


// ==========================================
// JSON امن
// ==========================================

function safeJSON(
  value,
  fallback
) {

  try {

    if (
      value === null ||
      value === undefined
    ) {

      return fallback;
    }


    if (
      typeof value !== "string"
    ) {

      return value;
    }


    return JSON.parse(
      value
    );

  } catch {

    return fallback;
  }
}
