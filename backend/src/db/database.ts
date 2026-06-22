import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const DB_PATH = path.join(dbDir, 'exammaster.sqlite');

export class DbClient {
  private sqliteDb?: SqlJsDatabase;
  private pgPool?: pg.Pool;
  private isPostgres = false;

  async init() {
    if (process.env.DATABASE_URL) {
      this.isPostgres = true;
      this.pgPool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase/Render connections
      });
      console.log('✅ PostgreSQL database connection initialized');
    } else {
      const SQL = await initSqlJs();
      if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        this.sqliteDb = new SQL.Database(fileBuffer);
      } else {
        this.sqliteDb = new SQL.Database();
      }
      console.log('✅ SQLite (sql.js) database initialized');
    }

    // Common schema execution. For Postgres, we replace datetime('now') and integer primary keys logic if needed.
    await this.exec(`
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
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
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
        timestamp TEXT DEFAULT (CURRENT_TIMESTAMP)
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
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        quiz_code TEXT UNIQUE,
        title TEXT NOT NULL,
        created_by TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        time_limit_minutes INTEGER NOT NULL,
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
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
        answers_json TEXT,
        UNIQUE(quiz_id, user_id)
      );
    `);

    // Clean up old title naming conventions for existing tests
    await this.exec(`
      UPDATE mock_tests 
      SET title = subject 
      WHERE title = 'Custom Compiled Practice revision';
    `);

    await this.exec(`
      UPDATE mock_tests 
      SET title = replace(title, ' AI Practice Exam', '')
      WHERE title LIKE '% AI Practice Exam';
    `);

    // Schema migrations for SQLite existing databases
    if (!this.isPostgres) {
      const alters = [
        'ALTER TABLE questions ADD COLUMN user_id TEXT;',
        'ALTER TABLE mock_tests ADD COLUMN user_id TEXT;',
        'ALTER TABLE chat_history ADD COLUMN user_id TEXT;',
        'ALTER TABLE quiz_attempts ADD COLUMN display_name TEXT;',
        'ALTER TABLE quiz_attempts ADD COLUMN answers_json TEXT;'
      ];
      for (const alter of alters) {
        try {
          await this.exec(alter);
        } catch (err) { /* ignore if exists */ }
      }
    }
  }

  private save() {
    if (this.sqliteDb) {
      const data = this.sqliteDb.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    }
  }

  private convertQuery(sql: string) {
    if (!this.isPostgres) return sql;
    // Replace SQLite `?` placeholders with `$1`, `$2`, etc.
    let index = 1;
    let converted = sql.replace(/\?/g, () => `$${index++}`);
    
    // SQLite specific replacements to Postgres syntax
    converted = converted.replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP');
    // Ensure ON CONFLICT clauses match postgres syntax
    converted = converted.replace(/ON CONFLICT\((.*?)\)\s*DO UPDATE SET\s*(.*)/ig, (match, cols, updates) => {
      // Postgres needs the target table explicit if referencing columns from the EXCLUDED pseudo-table
      // For simplicity, we assume basic `count = count + 1` maps to `count = ai_generation_usage.count + 1` manually in the caller
      return match;
    });

    return converted;
  }

  async exec(sql: string) {
    const converted = this.convertQuery(sql);
    if (this.isPostgres) {
      // Postgres pool doesn't like multiple statements in one query string easily if they are complex, but mostly works.
      await this.pgPool!.query(converted);
    } else {
      this.sqliteDb!.run(converted);
      this.save();
    }
  }

  prepare(sql: string) {
    const self = this;
    const converted = this.convertQuery(sql);

    return {
      async run(...params: any[]) {
        if (self.isPostgres) {
          const res = await self.pgPool!.query(converted, params);
          return { changes: res.rowCount || 0 };
        } else {
          self.sqliteDb!.run(converted, params);
          self.save();
          return { changes: 1 };
        }
      },
      async all(...params: any[]): Promise<any[]> {
        if (self.isPostgres) {
          const res = await self.pgPool!.query(converted, params);
          return res.rows;
        } else {
          const stmt = self.sqliteDb!.prepare(converted);
          const rows: any[] = [];
          stmt.bind(params);
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        }
      },
      async get(...params: any[]): Promise<any | undefined> {
        if (self.isPostgres) {
          const res = await self.pgPool!.query(converted, params);
          return res.rows[0];
        } else {
          const stmt = self.sqliteDb!.prepare(converted);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        }
      }
    };
  }
}

export const db = new DbClient();

export async function initDb() {
  await db.init();
}
