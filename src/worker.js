// ==========================================
// src/worker.js
// Telegram Sudoku Bot
// Cloudflare Workers + D1
// جدول Sudoku به صورت PNG
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
  buildFinishedKeyboard
} from "./keyboard.js";

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
  // Difficulty
  // ========================================

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

    await sendGamePhoto(
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
    "👆 خانه موردنظر را انتخاب کن.",
    "🔢 سپس عدد را انتخاب کن.",
    "✏️ برای یادداشت از حالت مداد استفاده کن.",
    "🧹 برای پاک کردن عدد استفاده کن.",
    "💡 راهنمایی یک حرکت درست انجام می‌دهد.",
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
// شروع بازی
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

  await sendGamePhoto(
    token,
    chatId,
    game
  );
}

// ==========================================
// ارسال عکس جدول
// ==========================================

async function sendGamePhoto(
  token,
  chatId,
  game
) {

  const png =
    await renderSudokuPNG(game);

  const caption =
    createBoardCaption(game);

  await sendPhoto(
    token,
    chatId,
    png,
    caption,
    buildNumberKeyboard(game)
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

    await sendGamePhoto(
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
  // Load Game
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
  // انتخاب خانه
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

      await editGamePhoto(
        token,
        message,
        game
      );

      await answerCallbackQuery(
        token,
        callbackId,
        "🔒 این خانه ثابت است."
      );

      return;
    }

    await editGamePhoto(
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

    await editGamePhoto(
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

    await editGamePhoto(
      token,
      message,
      game
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

    if (
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

    // ======================================
    // Pencil
    // ======================================

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

      await editGamePhoto(
        token,
        message,
        game
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

    // ======================================
    // عدد اصلی
    // ======================================

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

    // ======================================
    // برد
    // ======================================

    if (
      result.won
    ) {

      await editGamePhoto(
        token,
        message,
        game,
        true
      );

      await answerCallbackQuery(
        token,
        callbackId,
        "🎉 تبریک! Sudoku حل شد."
      );

      return;
    }

    // ======================================
    // اشتباه
    // ======================================

    if (
      result.mistake
    ) {

      await editGamePhoto(
        token,
        message,
        game
      );

      await answerCallbackQuery(
        token,
        callbackId,
        `❌ اشتباه! خطا: ${game.mistakes}`
      );

      return;
    }

    // ======================================
    // صحیح
    // ======================================

    await editGamePhoto(
      token,
      message,
      game
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

    const result =
      applyHint(
        game
      );

    await saveGame(
      env,
      chatId,
      userId,
      game
    );

    await editGamePhoto(
      token,
      message,
      game,
      result.won
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

    await editGamePhoto(
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
  // پایان
  // ========================================

  await answerCallbackQuery(
    token,
    callbackId
  );
}

// ==========================================
// ویرایش عکس جدول
// ==========================================

async function editGamePhoto(
  token,
  message,
  game,
  finished = false
) {

  const png =
    await renderSudokuPNG(game);

  const caption =
    createBoardCaption(game);

  const keyboard =
    finished
      ? buildFinishedKeyboard()
      : buildNumberKeyboard(game);

  await editMessagePhoto(
    token,
    message.chat.id,
    message.message_id,
    png,
    caption,
    keyboard
  );
}

// ==========================================
// Caption جدول
// ==========================================

function createBoardCaption(
  game
) {

  const lines = [

    "🧩 <b>Sudoku</b>",

    `🎯 سطح: ${
      getDifficultyName(
        game.difficulty
      )
    }`,

    `📊 پیشرفت: ${
      getProgress(game)
    }%`,

    `❌ اشتباه: ${
      game.mistakes
    }`,

    `💡 راهنمایی: ${
      game.hints
    }`
  ];

  if (
    game.status === "won"
  ) {

    lines.push(
      "",
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
      "",
      `📍 خانه انتخاب‌شده: ${row},${col}`
    );

  } else {

    lines.push(
      "",
      "👆 یک خانه را انتخاب کن."
    );
  }

  return lines.join("\n");
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
}
