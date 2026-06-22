const initSqlJs = require('sql.js');
const fs = require('fs');

initSqlJs().then(SQL => {
  const db = new SQL.Database(fs.readFileSync('../data/exammaster.sqlite'));
  try {
    const res = db.exec(`
      SELECT q.id, q.title, q.quiz_code, q.subject, qa.id as attempt_id, qa.score, qa.total_questions, qa.submitted_at as completed_at, qa.user_id 
      FROM quiz_attempts qa 
      JOIN quizzes q ON qa.quiz_id = q.id
    `);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('SQL ERROR:', e.message);
  }
});
