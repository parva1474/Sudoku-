// ==========================================
// src/game.js
// Sudoku Game Engine
// Cloudflare Workers + D1
// Multiplayer
// ==========================================

// ==========================================
// ساخت بازی جدید
// ==========================================

export function createGame(
  difficulty,
  puzzle,
  solution
) {

  const now =
    Date.now();

  const gameId =
    crypto.randomUUID();

  return {

    id:
      gameId,

    difficulty:
      difficulty || "medium",

    puzzle:
      [...puzzle],

    solution:
      [...solution],

    board:
      puzzle.map(
        value =>
          value === null
            ? null
            : value
      ),

    mistakes:
      0,

    hints:
      0,

    status:
      "playing",

    createdAt:
      now,

    updatedAt:
      now
  };
}

// ==========================================
// ساخت بازیکن
// ==========================================

export function createPlayer(
  user
) {

  return {

    userId:
      String(user.id),

    username:
      user.username ||
      null,

    firstName:
      user.first_name ||
      "",

    selectedCell:
      -1,

    pencilMode:
      false,

    notes:
      [],

    mistakes:
      0,

    hints:
      0,

    joinedAt:
      Date.now(),

    updatedAt:
      Date.now()
  };
}

// ==========================================
// انتخاب خانه
// ==========================================

export function selectCell(
  player,
  index
) {

  if (
    !player
  ) {

    return {
      ok: false,
      message:
        "بازیکن پیدا نشد."
    };
  }

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message:
        "خانه نامعتبر است."
    };
  }

  player.selectedCell =
    index;

  player.updatedAt =
    Date.now();

  return {
    ok: true
  };
}

// ==========================================
// مداد
// ==========================================

export function togglePencilMode(
  player
) {

  player.pencilMode =
    !Boolean(
      player.pencilMode
    );

  player.updatedAt =
    Date.now();

  return player.pencilMode;
}

// ==========================================
// یادداشت‌های مداد
// ==========================================

export function toggleNote(
  player,
  number
) {

  if (
    !player
  ) {

    return {
      ok: false,
      message:
        "بازیکن پیدا نشد."
    };
  }

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 9
  ) {

    return {
      ok: false,
      message:
        "عدد نامعتبر است."
    };
  }

  if (
    !Array.isArray(
      player.notes
    )
  ) {

    player.notes = [];
  }

  const position =
    player.notes.indexOf(
      number
    );

  if (
    position === -1
  ) {

    player.notes.push(
      number
    );

    player.notes.sort(
      (a, b) => a - b
    );

    player.updatedAt =
      Date.now();

    return {
      ok: true,
      added: true
    };
  }

  player.notes.splice(
    position,
    1
  );

  player.updatedAt =
    Date.now();

  return {
    ok: true,
    added: false
  };
}

// ==========================================
// پاک کردن عدد
// ==========================================

export function eraseNumber(
  game,
  player
) {

  if (
    !game ||
    !player
  ) {

    return {
      ok: false,
      message:
        "بازی یا بازیکن پیدا نشد."
    };
  }

  const index =
    Number(
      player.selectedCell
    );

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message:
        "اول یک خانه انتخاب کن."
    };
  }

  // خانه ثابت قابل پاک شدن نیست

  if (
    game.puzzle[index] !== null &&
    game.puzzle[index] !== undefined
  ) {

    return {
      ok: false,
      message:
        "🔒 این خانه ثابت است."
    };
  }

  game.board[index] =
    null;

  player.notes = [];

  game.updatedAt =
    Date.now();

  player.updatedAt =
    Date.now();

  return {
    ok: true
  };
}

// ==========================================
// قرار دادن عدد
// ==========================================

export function putNumber(
  game,
  player,
  number
) {

  if (
    !game ||
    !player
  ) {

    return {
      ok: false,
      message:
        "بازی یا بازیکن پیدا نشد."
    };
  }

  const index =
    Number(
      player.selectedCell
    );

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message:
        "اول یک خانه انتخاب کن."
    };
  }

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 9
  ) {

    return {
      ok: false,
      message:
        "عدد نامعتبر است."
    };
  }

  // ----------------------------------------
  // خانه ثابت
  // ----------------------------------------

  if (
    game.puzzle[index] !== null &&
    game.puzzle[index] !== undefined
  ) {

    return {
      ok: false,
      message:
        "🔒 این خانه ثابت است."
    };
  }

  // ----------------------------------------
  // عدد صحیح
  // ----------------------------------------

  if (
    Number(
      game.solution[index]
    ) === number
  ) {

    game.board[index] =
      number;

    player.notes = [];

    game.updatedAt =
      Date.now();

    player.updatedAt =
      Date.now();

    const won =
      checkSolved(
        game
      );

    if (
      won
    ) {

      game.status =
        "won";
    }

    return {

      ok: true,

      correct: true,

      mistake: false,

      won
    };
  }

  // ----------------------------------------
  // عدد اشتباه
  // ----------------------------------------

  player.mistakes =
    Number(
      player.mistakes || 0
    ) + 1;

  game.mistakes =
    Number(
      game.mistakes || 0
    ) + 1;

  game.updatedAt =
    Date.now();

  player.updatedAt =
    Date.now();

  return {

    ok: false,

    correct: false,

    mistake: true,

    won: false,

    message:
      "❌ عدد اشتباه است."
  };
}

// ==========================================
// بررسی حل شدن
// ==========================================

export function checkSolved(
  game
) {

  if (
    !game ||
    !Array.isArray(game.board) ||
    !Array.isArray(game.solution)
  ) {

    return false;
  }

  if (
    game.board.length !== 81 ||
    game.solution.length !== 81
  ) {

    return false;
  }

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      Number(game.board[i]) !==
      Number(game.solution[i])
    ) {

      return false;
    }
  }

  return true;
}

// ==========================================
// پیشرفت
// ==========================================

export function getProgress(
  game
) {

  if (
    !game ||
    !Array.isArray(game.board)
  ) {

    return 0;
  }

  let filled =
    0;

  for (
    const value of game.board
  ) {

    if (
      value !== null &&
      value !== undefined
    ) {

      filled++;
    }
  }

  return Math.round(
    (
      filled / 81
    ) * 100
  );
}

// ==========================================
// راهنمایی
// ==========================================

export function applyHint(
  game,
  player,
  index,
  number
) {

  if (
    !game ||
    !player
  ) {

    return {
      ok: false,
      message:
        "بازی یا بازیکن پیدا نشد."
    };
  }

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message:
        "خانه نامعتبر است."
    };
  }

  if (
    game.puzzle[index] !== null &&
    game.puzzle[index] !== undefined
  ) {

    return {
      ok: false,
      message:
        "این خانه از قبل پر شده است."
    };
  }

  const correctNumber =
    Number(
      game.solution[index]
    );

  if (
    !Number.isInteger(correctNumber)
  ) {

    return {
      ok: false,
      message:
        "راهنمایی در دسترس نیست."
    };
  }

  game.board[index] =
    correctNumber;

  player.hints =
    Number(
      player.hints || 0
    ) + 1;

  game.hints =
    Number(
      game.hints || 0
    ) + 1;

  player.notes = [];

  game.updatedAt =
    Date.now();

  player.updatedAt =
    Date.now();

  const won =
    checkSolved(
      game
    );

  if (
    won
  ) {

    game.status =
      "won";
  }

  return {

    ok: true,

    won,

    number:
      correctNumber,

    message:
      `💡 عدد صحیح: ${correctNumber}`
  };
}

// ==========================================
// پاک کردن یادداشت بازیکن
// ==========================================

export function clearNotes(
  player
) {

  if (
    !player
  ) {

    return;
  }

  player.notes =
    [];

  player.updatedAt =
    Date.now();
}

// ==========================================
// تبدیل Row دیتابیس به Game
// ==========================================

export function gameFromRow(
  row
) {

  if (
    !row
  ) {

    return null;
  }

  return {

    id:
      row.id,

    chatId:
      String(
        row.chat_id
      ),

    messageId:
      row.message_id === null
        ? null
        : Number(
            row.message_id
          ),

    difficulty:
      row.difficulty,

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

    mistakes:
      Number(
        row.mistakes || 0
      ),

    hints:
      Number(
        row.hints || 0
      ),

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
// تبدیل Row دیتابیس به Player
// ==========================================

export function playerFromRow(
  row
) {

  if (
    !row
  ) {

    return null;
  }

  return {

    id:
      Number(
        row.id
      ),

    gameId:
      row.game_id,

    userId:
      String(
        row.user_id
      ),

    username:
      row.username ||
      null,

    firstName:
      row.first_name ||
      "",

    selectedCell:
      Number(
        row.selected_cell ?? -1
      ),

    pencilMode:
      Boolean(
        row.pencil_mode
      ),

    notes:
      safeJSON(
        row.notes,
        []
      ),

    mistakes:
      Number(
        row.mistakes || 0
      ),

    hints:
      Number(
        row.hints || 0
      ),

    joinedAt:
      Number(
        row.joined_at
      ),

    updatedAt:
      Number(
        row.updated_at
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

    const parsed =
      JSON.parse(
        value
      );

    return parsed;

  } catch {

    return fallback;
  }
}
