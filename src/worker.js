// ==========================================
// src/worker.js
// Telegram Sudoku Bot
// Cloudflare Workers + D1
// Multiplayer Architecture
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

      // --------------------------------------
      // پیام معمولی
      // --------------------------------------

      if (update.message) {

        await handleMessage(
          update.message,
          env,
          token
        );
      }

      // --------------------------------------
      // Callback
      // --------------------------------------

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

  const user =
    message.from || {};

  const userId =
    String(
      user.id ??
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

    await createMultiplayerGame(
      env,
      token,
      chatId,
      user,
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

  if (
    difficultyCommands[text]
  ) {

    await createMultiplayerGame(
      env,
      token,
      chatId,
      user,
      difficultyCommands[text]
    );

    return;
  }

  // ========================================
  // /game
  // ========================================

  if (text === "/game") {

    const game =
      await getActiveGame(
        env,
        chatId
      );

    if (!game) {

      await sendMessage(
        token,
        chatId,
        "هنوز بازی فعالی وجود ندارد.\n\nبرای شروع /new را بزن."
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
  // /join
  // ========================================

  if (text === "/join") {

    const game =
      await getActiveGame(
        env,
        chatId
      );

    if (!game) {

      await sendMessage(
        token,
        chatId,
        "❌ بازی فعالی وجود ندارد."
      );

      return;
    }

    await addPlayer(
      env,
      game.id,
      user
    );

    await sendMessage(
      token,
      chatId,
      `👤 ${getUserName(user)} وارد بازی شد.`
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
    "🧩 <b>Sudoku Multiplayer</b>",
    "",
    "سودوکوی چندنفره داخل گروه.",
    "",
    "برای شروع:",
    "/new",
    "",
    "بازیکنان دیگر می‌توانند:",
    "/join",
    "",
    "را بزنند."
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
    "/new — بازی جدید",
    "/join — ورود به بازی",
    "/game — نمایش بازی",
    "",
    "👥 بازی می‌تواند چندنفره باشد.",
    "🧩 جدول بین بازیکنان مشترک است.",
    "👤 وضعیت هر بازیکن جداگانه ذخیره می‌شود."
  ].join("\n");

  await sendMessage(
    token,
    chatId,
    text
  );
}

// ==========================================
// ساخت بازی چندنفره
// ==========================================

async function createMultiplayerGame(
  env,
  token,
  chatId,
  user,
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

  // ----------------------------------------
  // اگر بازی فعال وجود دارد
  // ----------------------------------------

  const existing =
    await getActiveGame(
      env,
      chatId
    );

  if (existing) {

    await addPlayer(
      env,
      existing.id,
      user
    );

    await sendMessage(
      token,
      chatId,
      "⚠️ یک بازی فعال از قبل وجود دارد.\n\nشما به بازی اضافه شدید."
    );

    return;
  }

  // ----------------------------------------
  // ساخت Sudoku
  // ----------------------------------------

  let sudoku;

  try {

    sudoku =
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

  const now =
    Date.now();

  const gameId =
    crypto.randomUUID();

  // ----------------------------------------
  // ذخیره بازی
  // ----------------------------------------

  await env.DB
    .prepare(`
      INSERT INTO games (
        id,
        chat_id,
        puzzle,
        solution,
        board,
        difficulty,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(

      gameId,

      chatId,

      JSON.stringify(
        sudoku.puzzle
      ),

      JSON.stringify(
        sudoku.solution
      ),

      JSON.stringify(
        sudoku.board
      ),

      difficulty,

      "playing",

      now,

      now

    )
    .run();

  // ----------------------------------------
  // سازنده بازی
  // ----------------------------------------

  await addPlayer(
    env,
    gameId,
    user
  );

  // ----------------------------------------
  // دریافت بازی
  // ----------------------------------------

  const game =
    await getGame(
      env,
      gameId
    );

  await sendGamePhoto(
    token,
    chatId,
    game
  );
}

// ==========================================
// افزودن بازیکن
// ==========================================

async function addPlayer(
  env,
  gameId,
  user
) {

  const now =
    Date.now();

  const userId =
    String(user.id);

  const username =
    user.username ||
    null;

  const firstName =
    user.first_name ||
    null;

  await env.DB
    .prepare(`
      INSERT OR IGNORE INTO players (
        game_id,
        user_id,
        username,
        first_name,
        selected_cell,
        notes,
        mistakes,
        hints,
        pencil_mode,
        score,
        joined_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, -1, '[]', 0, 0, 0, 0, ?, ?)
    `)
    .bind(

      gameId,

      userId,

      username,

      firstName,

      now,

      now

    )
    .run();
}

// ==========================================
// گرفتن بازی فعال گروه
// ==========================================

async function getActiveGame(
  env,
  chatId
) {

  const row =
    await env.DB
      .prepare(`
        SELECT *
        FROM games
        WHERE chat_id = ?
        AND status = 'playing'
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .bind(chatId)
      .first();

  if (!row) {
    return null;
  }

  return buildGameObject(row);
}

// ==========================================
// گرفتن بازی بر اساس ID
// ==========================================

async function getGame(
  env,
  gameId
) {

  const row =
    await env.DB
      .prepare(`
        SELECT *
        FROM games
        WHERE id = ?
        LIMIT 1
      `)
      .bind(gameId)
      .first();

  if (!row) {
    return null;
  }

  return buildGameObject(row);
}

// ==========================================
// تبدیل رکورد D1 به Game
// ==========================================

function buildGameObject(
  row
) {

  return {

    id:
      row.id,

    chatId:
      row.chat_id,

    messageId:
      row.message_id,

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

    difficulty:
      row.difficulty,

    status:
      row.status,

    createdAt:
      Number(
        row.created_at
      ),

    updatedAt:
      Number(
        row.updated_at
      )
  };
}

// ==========================================
// دریافت وضعیت بازیکن
// ==========================================

async function getPlayer(
  env,
  gameId,
  userId
) {

  const row =
    await env.DB
      .prepare(`
        SELECT *
        FROM players
        WHERE game_id = ?
        AND user_id = ?
        LIMIT 1
      `)
      .bind(
        gameId,
        String(userId)
      )
      .first();

  if (!row) {
    return null;
  }

  return {

    id:
      row.id,

    gameId:
      row.game_id,

    userId:
      row.user_id,

    username:
      row.username,

    firstName:
      row.first_name,

    selectedCell:
      Number(
        row.selected_cell
      ),

    notes:
      JSON.parse(
        row.notes || "[]"
      ),

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

    score:
      Number(
        row.score
      )
  };
}

// ==========================================
// ذخیره وضعیت بازیکن
// ==========================================

async function savePlayer(
  env,
  player
) {

  await env.DB
    .prepare(`
      UPDATE players
      SET
        selected_cell = ?,
        notes = ?,
        mistakes = ?,
        hints = ?,
        pencil_mode = ?,
        score = ?,
        updated_at = ?
      WHERE game_id = ?
      AND user_id = ?
    `)
    .bind(

      player.selectedCell,

      JSON.stringify(
        player.notes
      ),

      player.mistakes,

      player.hints,

      player.pencilMode
        ? 1
        : 0,

      player.score,

      Date.now(),

      player.gameId,

      player.userId

    )
    .run();
}

// ==========================================
// ذخیره جدول مشترک
// ==========================================

async function saveBoard(
  env,
  game
) {

  await env.DB
    .prepare(`
      UPDATE games
      SET
        board = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `)
    .bind(

      JSON.stringify(
        game.board
      ),

      game.status,

      Date.now(),

      game.id

    )
    .run();
}

// ==========================================
// ارسال عکس Sudoku
// ==========================================

async function sendGamePhoto(
  token,
  chatId,
  game
) {

  const png =
    await renderSudokuPNG(game);

  const caption =
    createCaption(game);

  const keyboard =
    buildNumberKeyboard(game);

  await sendPhoto(
    token,
    chatId,
    png,
    caption,
    keyboard
  );
}

// ==========================================
// ویرایش عکس Sudoku
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
    createCaption(game);

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
// Callback
// ==========================================

async function handleCallbackQuery(
  callback,
  env,
  token
) {

  const message =
    callback.message;

  if (!message) {

    await answerCallbackQuery(
      token,
      callback.id
    );

    return;
  }

  const chatId =
    String(
      message.chat.id
    );

  const user =
    callback.from || {};

  const userId =
    String(user.id);

  const data =
    String(
      callback.data || ""
    );

  // ----------------------------------------
  // پیدا کردن بازی
  // ----------------------------------------

  let game =
    await getActiveGame(
      env,
      chatId
    );

  if (!game) {

    await answerCallbackQuery(
      token,
      callback.id,
      "❌ بازی فعال نیست."
    );

    return;
  }

  // ----------------------------------------
  // اطمینان از عضویت بازیکن
  // ----------------------------------------

  let player =
    await getPlayer(
      env,
      game.id,
      userId
    );

  if (!player) {

    await addPlayer(
      env,
      game.id,
      user
    );

    player =
      await getPlayer(
        env,
        game.id,
        userId
      );
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
        callback.id,
        "خانه نامعتبر است."
      );

      return;
    }

    player.selectedCell =
      index;

    await savePlayer(
      env,
      player
    );

    await editGamePhoto(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callback.id,
      `📍 خانه ${Math.floor(index / 9) + 1},${(index % 9) + 1}`
    );

    return;
  }

  // ========================================
  // Pencil
  // ========================================

  if (
    data === "mode:pencil"
  ) {

    player.pencilMode =
      !player.pencilMode;

    await savePlayer(
      env,
      player
    );

    await editGamePhoto(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callback.id,
      player.pencilMode
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
      player.selectedCell === -1
    ) {

      await answerCallbackQuery(
        token,
        callback.id,
        "اول یک خانه انتخاب کن."
      );

      return;
    }

    const gameState = {

      board:
        [...game.board],

      puzzle:
        game.puzzle,

      solution:
        game.solution,

      selectedCell:
        player.selectedCell,

      notes:
        player.notes,

      pencilMode:
        player.pencilMode,

      mistakes:
        player.mistakes,

      hints:
        player.hints,

      status:
        game.status
    };

    const result =
      eraseNumber(
        gameState,
        player.selectedCell
      );

    game.board =
      gameState.board;

    player.notes =
      gameState.notes;

    await saveBoard(
      env,
      game
    );

    await savePlayer(
      env,
      player
    );

    await editGamePhoto(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callback.id,
      result.ok
        ? "🧹 پاک شد."
        : result.message
    );

    return;
  }

  // ========================================
  // عدد
  // ========================================

  if (
    data.startsWith("num:")
  ) {

    if (
      player.selectedCell === -1
    ) {

      await answerCallbackQuery(
        token,
        callback.id,
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
        callback.id,
        "عدد نامعتبر است."
      );

      return;
    }

    const gameState = {

      board:
        [...game.board],

      puzzle:
        game.puzzle,

      solution:
        game.solution,

      selectedCell:
        player.selectedCell,

      notes:
        player.notes,

      pencilMode:
        player.pencilMode,

      mistakes:
        player.mistakes,

      hints:
        player.hints,

      status:
        game.status
    };

    // --------------------------------------
    // Pencil
    // --------------------------------------

    if (
      player.pencilMode
    ) {

      const result =
        toggleNote(
          gameState,
          player.selectedCell,
          number
        );

      player.notes =
        gameState.notes;

      await savePlayer(
        env,
        player
      );

      await editGamePhoto(
        token,
        message,
        game
      );

      await answerCallbackQuery(
        token,
        callback.id,
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
        gameState,
        player.selectedCell,
        number
      );

    game.board =
      gameState.board;

    player.mistakes =
      gameState.mistakes;

    // --------------------------------------
    // امتیاز
    // --------------------------------------

    if (
      result.mistake
    ) {

      player.score =
        Math.max(
          0,
          player.score - 1
        );

    } else {

      player.score += 10;
    }

    // --------------------------------------
    // برد
    // --------------------------------------

    if (
      result.won
    ) {

      game.status =
        "won";

      await saveBoard(
        env,
        game
      );

      await savePlayer(
        env,
        player
      );

      await editGamePhoto(
        token,
        message,
        game,
        true
      );

      await answerCallbackQuery(
        token,
        callback.id,
        `🎉 ${getUserName(user)} برنده شد!`
      );

      return;
    }

    await saveBoard(
      env,
      game
    );

    await savePlayer(
      env,
      player
    );

    await editGamePhoto(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callback.id,
      result.mistake
        ? `❌ اشتباه! خطا: ${player.mistakes}`
        : "✅ درست!"
    );

    return;
  }

  // ========================================
  // بازی جدید
  // ========================================

  if (
    data === "action:new"
  ) {

    const fresh =
      newGame(
        game.difficulty
      );

    game.puzzle =
      fresh.puzzle;

    game.solution =
      fresh.solution;

    game.board =
      fresh.board;

    game.status =
      "playing";

    await saveBoard(
      env,
      game
    );

    await editGamePhoto(
      token,
      message,
      game
    );

    await answerCallbackQuery(
      token,
      callback.id,
      "🔄 بازی جدید ساخته شد."
    );

    return;
  }

  // ========================================
  // Hint
  // ========================================

  if (
    data === "action:hint"
  ) {

    const gameState = {

      board:
        [...game.board],

      puzzle:
        game.puzzle,

      solution:
        game.solution,

      selectedCell:
        player.selectedCell,

      notes:
        player.notes,

      pencilMode:
        player.pencilMode,

      mistakes:
        player.mistakes,

      hints:
        player.hints,

      status:
        game.status
    };

    const result =
      applyHint(
        gameState
      );

    game.board =
      gameState.board;

    player.hints =
      gameState.hints;

    await saveBoard(
      env,
      game
    );

    await savePlayer(
      env,
      player
    );

    await editGamePhoto(
      token,
      message,
      game,
      result.won
    );

    await answerCallbackQuery(
      token,
      callback.id,
      result.message
    );

    return;
  }

  // ========================================
  // Difficulty
  // ========================================

  if (
    data.startsWith("difficulty:")
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
        callback.id,
        "درجه سختی نامعتبر است."
      );

      return;
    }

    await createMultiplayerGame(
      env,
      token,
      chatId,
      user,
      difficulty
    );

    await answerCallbackQuery(
      token,
      callback.id,
      "🎮 بازی آماده شد."
    );

    return;
  }

  await answerCallbackQuery(
    token,
    callback.id
  );
}

// ==========================================
// Caption
// ==========================================

function createCaption(
  game
) {

  return [
    "🧩 <b>Sudoku Multiplayer</b>",
    "",
    `🎯 سطح: ${getDifficultyName(game.difficulty)}`,
    `📊 پیشرفت: ${getProgress(game)}%`,
    "",
    "👥 این بازی چندنفره است.",
    "👆 خانه موردنظر را انتخاب کن."
  ].join("\n");
}

// ==========================================
// نام کاربر
// ==========================================

function getUserName(
  user
) {

  if (user.username) {

    return `@${user.username}`;
  }

  if (user.first_name) {

    return user.first_name;
  }

  return "بازیکن";
}

// ==========================================
// Difficulty Name
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
