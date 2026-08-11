-- ==========================================
-- Sudoku Bot
-- Cloudflare D1
-- Multiplayer Group Schema
-- ==========================================

PRAGMA foreign_keys = ON;

-- ==========================================
-- Games
-- یک رکورد برای هر بازی
-- ==========================================

CREATE TABLE IF NOT EXISTS games (

    id TEXT PRIMARY KEY,

    chat_id TEXT NOT NULL,

    message_id INTEGER,

    puzzle TEXT NOT NULL,

    solution TEXT NOT NULL,

    board TEXT NOT NULL,

    difficulty TEXT NOT NULL DEFAULT 'medium',

    status TEXT NOT NULL DEFAULT 'waiting',

    created_at INTEGER NOT NULL,

    updated_at INTEGER NOT NULL
);

-- ==========================================
-- Players
-- وضعیت اختصاصی هر بازیکن
-- ==========================================

CREATE TABLE IF NOT EXISTS players (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    game_id TEXT NOT NULL,

    user_id TEXT NOT NULL,

    username TEXT,

    first_name TEXT,

    selected_cell INTEGER NOT NULL DEFAULT -1,

    notes TEXT NOT NULL DEFAULT '[]',

    mistakes INTEGER NOT NULL DEFAULT 0,

    hints INTEGER NOT NULL DEFAULT 0,

    pencil_mode INTEGER NOT NULL DEFAULT 0,

    score INTEGER NOT NULL DEFAULT 0,

    joined_at INTEGER NOT NULL,

    updated_at INTEGER NOT NULL,

    UNIQUE(game_id, user_id),

    FOREIGN KEY(game_id)
        REFERENCES games(id)
        ON DELETE CASCADE
);

-- ==========================================
-- ایندکس‌ها
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_games_chat
ON games(chat_id);

CREATE INDEX IF NOT EXISTS idx_games_status
ON games(status);

CREATE INDEX IF NOT EXISTS idx_players_game
ON players(game_id);

CREATE INDEX IF NOT EXISTS idx_players_user
ON players(user_id);
