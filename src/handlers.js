// ==========================================
// src/handlers.js (Sudoku Bot - Grid 9x9 Version)
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
  buildSudokuGridKeyboard,
  buildNumberKeyboard,
  buildDifficultyKeyboard,
  buildFinishedKeyboard
} from "./keyboard.js";

import {
  generateSudoku,
  getHint
} from "./sudoku.js";

const DEFAULT_DIFFICULTY = "medium";
const VALID_DIFFICULTIES = ["easy", "medium", "hard", "expert", "master"];

export async function handleUpdate(update, env, token) {
  if (update?.message) {
    await handleMessage(update.message, env, token);
    return;
  }
  if (update?.callback_query) {
    await handleCallbackQuery(update.callback_query, env, token);
    return;
  }
}

async function handleMessage(message, env, token) {
  if (!message?.chat) return;

  const chatId = String(message.chat.id);
  const userId = String(message.from?.id ?? message.chat.id);
  const text = String(message.text || "").trim();

  if (text === "/start") {
    await sendWelcome(token, chatId);
    return;
  }

  if (text === "/new" || text === "/game") {
    await startNewGame(env, token, chatId, userId, DEFAULT_DIFFICULTY);
    return;
  }
}

async function sendWelcome(token, chatId) {
  const text = "🧩 <b>سودوکو گروهی</b>\n\nلطفاً درجه سختی بازی را انتخاب کنید:";
  await sendMessage(token, chatId, text, buildDifficultyKeyboard());
}

async function startNewGame(env, token, chatId, userId, difficulty) {
  if (!VALID_DIFFICULTIES.includes(difficulty)) difficulty = DEFAULT_DIFFICULTY;

  let generated;
  try {
    generated = generateSudoku(difficulty);
  } catch (e) {
    await sendMessage(token, chatId, "❌ خطا در ساخت جدول سودوکو.");
    return;
  }

  const game = newGame(difficulty, generated.puzzle, generated.solution);
  await saveGame(env, chatId, userId, game);
  await sendGameMessage(token, chatId, game);
}

async function sendGameMessage(token, chatId, game) {
  const text = createBoardText(game);
  await sendMessage(token, chatId, text, buildSudokuGridKeyboard(game.board, game.selectedCell));
}

async function editGameMessage(token, message, game) {
  const text = createBoardText(game);
  const keyboard = game.status === "won" ? buildFinishedKeyboard() : buildSudokuGridKeyboard(game.board, game.selectedCell);
  
  await editMessageText(token, message.chat.id, message.message_id, text, keyboard);
}

async function handleCallbackQuery(callback, env, token) {
  const callbackId = callback.id;
  const message = callback.message;
  await answerCallbackQuery(token, callbackId).catch(() => {});
  if (!message) return;

  const chatId = String(message.chat.id);
  const userId = String(callback.from?.id ?? message.chat.id);
  const data = String(callback.data || "");

  if (data.startsWith("difficulty:")) {
    const difficulty = data.split(":")[1];
    await startNewGame(env, token, chatId, userId, difficulty);
    return;
  }

  const game = await loadGame(env, chatId);
  if (!game) return;

  if (data.startsWith("cell:")) {
    const index = Number(data.split(":")[1]);
    if (!Number.isInteger(index) || index < 0 || index >= 81) return;

    selectCell(game, index);
    await saveGame(env, chatId, userId, game);

    // اگر خانه خالی یا قابل تغییر بود، صفحه انتخاب عدد را باز کن یا جدول را آپدیت کن
    await editGameMessage(token, message, game);
    return;
  }

  if (data === "mode:pencil") {
    togglePencilMode(game);
    await saveGame(env, chatId, userId, game);
    await editGameMessage(token, message, game);
    return;
  }

  if (data === "mode:erase") {
    if (game.selectedCell !== -1) {
      eraseNumber(game, game.selectedCell);
      await saveGame(env, chatId, userId, game);
      await editGameMessage(token, message, game);
    }
    return;
  }

  if (data.startsWith("num:")) {
    if (game.selectedCell === -1) return;
    const number = Number(data.split(":")[1]);

    if (game.pencilMode) {
      toggleNote(game, number);
    } else {
      putNumber(game, game.selectedCell, number);
    }

    await saveGame(env, chatId, userId, game);
    await editGameMessage(token, message, game);
    return;
  }

  if (data === "action:hint") {
    const hint = getHint(game.board, game.solution);
    if (hint) {
      applyHint(game, game.selectedCell, hint.index, hint.number);
      await saveGame(env, chatId, userId, game);
      await editGameMessage(token, message, game);
    }
    return;
  }

  if (data === "action:new") {
    await startNewGame(env, token, chatId, userId, game.difficulty);
    return;
  }
}

function createBoardText(game) {
  return [
    "🧩 <b>سودوکو آنلاین</b>",
    `📊 پیشرفت: ${getProgress(game)}% | ❌ اشتباه: ${game.mistakes || 0}`,
    "",
    game.status === "won" ? "🎉 <b>تبریک! جدول کامل شد.</b>" : "👆 روی هر خانه از جدول زیر کلیک کنید:"
  ].join("\n");
}

async function saveGame(env, chatId, userId, game) {
  const now = Date.now();
  await env.DB.prepare(`
    INSERT OR REPLACE INTO games (chat_id, user_id, puzzle, solution, board, notes, selected_cell, difficulty, mistakes, hints, pencil_mode, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    chatId, userId,
    JSON.stringify(game.puzzle),
    JSON.stringify(game.solution),
    JSON.stringify(game.board),
    JSON.stringify(game.notes || []),
    Number(game.selectedCell ?? -1),
    game.difficulty,
    Number(game.mistakes || 0),
    Number(game.hints || 0),
    game.pencilMode ? 1 : 0,
    game.status || "playing",
    Number(game.createdAt || now),
    now
  ).run();
}

async function loadGame(env, chatId) {
  const row = await env.DB.prepare(`SELECT * FROM games WHERE chat_id = ? LIMIT 1`).bind(chatId).first();
  if (!row) return null;
  return {
    puzzle: JSON.parse(row.puzzle),
    solution: JSON.parse(row.solution),
    board: JSON.parse(row.board),
    notes: safeJSON(row.notes, []),
    selectedCell: Number(row.selected_cell ?? -1),
    difficulty: row.difficulty,
    mistakes: Number(row.mistakes || 0),
    hints: Number(row.hints || 0),
    pencilMode: Boolean(row.pencil_mode),
    status: row.status,
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0)
  };
}

function safeJSON(val, fallback) {
  try { return JSON.parse(val); } catch { return fallback; }
}
