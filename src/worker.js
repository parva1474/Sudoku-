// ==========================================
// src/worker.js
// Telegram Sudoku Bot
// Cloudflare Workers + D1
// ==========================================

import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  sendPhoto
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

import {
  renderSudokuPng
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
        {
          status: 200
        }
      );
    }

    if (request.method !== "POST") {

      return new Response(
        "Method Not Allowed",
        {
          status: 405
        }
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
          {
            status: 500
          }
        );
      }


      // ======================================
      // Message
      // ======================================

      if (update.message) {

        await handleMessage(
          update.message,
          env,
          token
        );
      }


      // ======================================
      // Callback
      // ======================================

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
if (
    data === "action:new"
  ) {

    const freshGenerated =
      generateSudoku(
        game.difficulty
      );


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


    await sendGameMessage(
      token,
      chatId,
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
  // Unknown
  // ========================================

  await answerCallbackQuery(
    token,
    callbackId
  );
}


// ==========================================
// متن جدول متنی
// ==========================================

function createBoardText(
  game
) {

  const lines = [];


  lines.push(
    "🧩 <b>Sudoku</b>"
  );


  lines.push(
    `🎯 سطح: ${
      getDifficultyName(
        game.difficulty
      )
    }`
  );


  lines.push(
    `📊 پیشرفت: ${
      getProgress(game)
    }%`
  );


  lines.push(
    `❌ اشتباه: ${
      game.mistakes || 0
    }`
  );


  lines.push(
    `💡 راهنمایی: ${
      game.hints || 0
    }`
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
        value === null ||
        value === undefined
          ? "·"
          : String(value)
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


  if (
    game.status === "won"
  ) {

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
    index % 9 + 1;


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

    `🔢 مقدار فعلی: ${
      value ?? "خالی"
    }`,

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
      .bind(
        chatId
      )
      .first();


  if (!row) {

    return null;
  }


  return {

    puzzle:
      safeJSON(
        row.puzzle,
        Array(81).fill(null)
      ),

    solution:
      safeJSON(
        row.solution,
        Array(81).fill(null)
      ),

    board:
      safeJSON(
        row.board,
        Array(81).fill(null)
      ),

    notes:
      safeJSON(
        row.notes,
        Array.from(
          { length: 81 },
          () => []
        )
      ),

    selectedCell:
      Number(
        row.selected_cell ?? -1
      ),

    difficulty:
      row.difficulty || "medium",

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


    return JSON.parse(
      value
    );

  } catch {

    return fallback;
  }
      }
