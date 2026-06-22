/**
 * database.ts — Uses sql.js (pure WebAssembly SQLite, zero native compilation).
 * Works on any OS, any Node version, no build tools needed.
 * Data is persisted to a .sqlite file on disk and loaded back on restart.
 */

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const DB_PATH = path.join(dbDir, 'exammaster.sqlite');

// We export a wrapper that has the same .prepare().run() / .prepare().all() API
// so the rest of the code doesn't need to change much.

export class SyncDb {
  private db!: SqlJsDatabase;

  async init() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    this.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        subject TEXT NOT NULL,
        text TEXT NOT NULL,
        text_tamil TEXT,
        options TEXT NOT NULL,
        options_tamil TEXT,
        correct_option_index INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        explanation_tamil TEXT,
        language TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        approved INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS mock_tests (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        created_at TEXT NOT NULL,
        language TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        questions TEXT NOT NULL,
        score INTEGER,
        correct_count INTEGER,
        time_spent INTEGER,
        total_time INTEGER NOT NULL,
        selected_answers TEXT,
        is_completed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        related_question_id TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS ai_generation_usage (
        user_id TEXT NOT NULL,
        usage_date TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, usage_date)
      );

      CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        usage_date TEXT NOT NULL,
        estimated_tokens INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        quiz_code TEXT UNIQUE,
        title TEXT NOT NULL,
        created_by TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        time_limit_minutes INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        published_at TEXT
      );

      CREATE TABLE IF NOT EXISTS quiz_questions (
        quiz_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        question_order INTEGER NOT NULL,
        PRIMARY KEY (quiz_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        display_name TEXT,
        score INTEGER,
        total_questions INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        submitted_at TEXT,
        UNIQUE(quiz_id, user_id)
      );
    `);

    // Clean up old title naming conventions for existing tests
    this.exec(`
      UPDATE mock_tests 
      SET title = subject 
      WHERE title = 'Custom Compiled Practice revision';

      UPDATE mock_tests 
      SET title = replace(title, ' AI Practice Exam', '')
      WHERE title LIKE '% AI Practice Exam';
    `);

    // Schema migrations for existing databases
    try {
      this.exec(`ALTER TABLE questions ADD COLUMN user_id TEXT;`);
    } catch (err) { /* column likely exists */ }
    
    try {
      this.exec(`ALTER TABLE mock_tests ADD COLUMN user_id TEXT;`);
    } catch (err) { /* column likely exists */ }
    
    try {
      this.exec(`ALTER TABLE chat_history ADD COLUMN user_id TEXT;`);
    } catch (err) { /* column likely exists */ }

    try {
      this.exec(`ALTER TABLE quiz_attempts ADD COLUMN display_name TEXT;`);
    } catch (err) { /* column likely exists */ }

    try {
      this.exec(`ALTER TABLE quiz_attempts ADD COLUMN answers_json TEXT;`);
    } catch (err) { /* column likely exists */ }

    console.log('✅ SQLite (sql.js) database initialized');
  }

  /** Persist in-memory DB to disk after every write */
  private save() {
    const data = this.db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  exec(sql: string) {
    this.db.run(sql);
    this.save();
  }

  prepare(sql: string) {
    const self = this;
    return {
      run(...params: any[]) {
        self.db.run(sql, params);
        self.save();
        return { changes: 1 };
      },
      all(...params: any[]): any[] {
        const stmt = self.db.prepare(sql);
        const rows: any[] = [];
        stmt.bind(params);
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      },
      get(...params: any[]): any | undefined {
        const stmt = self.db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      }
    };
  }
}

export const db = new SyncDb();

/** Call this once at server startup before using db */
export async function initDb() {
  await db.init();
}
