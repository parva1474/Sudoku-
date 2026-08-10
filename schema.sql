CREATE TABLE IF NOT EXISTS games (
    chat_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,

    puzzle TEXT NOT NULL,
    solution TEXT NOT NULL,
    board TEXT NOT NULL,
    notes TEXT NOT NULL,

    selected_cell INTEGER NOT NULL DEFAULT -1,

    difficulty TEXT NOT NULL DEFAULT 'medium',

    mistakes INTEGER NOT NULL DEFAULT 0,
    hints INTEGER NOT NULL DEFAULT 0,

    pencil_mode INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'playing',

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_games_user_id
ON games(user_id);
