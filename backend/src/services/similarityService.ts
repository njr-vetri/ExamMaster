import type { SyncDb } from '../db/database.js';

/**
 * Simple Jaccard similarity to detect near-duplicate questions.
 * Returns true if the question is too similar to an existing one.
 * Threshold: 70% word overlap = duplicate.
 */
export async function checkSimilarity(newText: string, db: any): Promise<boolean> {
  const existing = db.prepare('SELECT text FROM questions').all() as { text: string }[];
  if (existing.length === 0) return false;

  const newWords = tokenize(newText);

  for (const row of existing) {
    const existingWords = tokenize(row.text);
    const similarity = jaccardSimilarity(newWords, existingWords);
    if (similarity >= 0.70) {
      console.log(`Duplicate detected (similarity: ${(similarity * 100).toFixed(1)}%) — skipping`);
      return true;
    }
  }

  return false;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s\u0B80-\u0BFF]/g, '') // keep alphanumeric + Tamil Unicode range
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}
