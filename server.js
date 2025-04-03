// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Instantiate the express app
const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data', 'scores.json');

/**
 * Utility: Load the entire data file or create a default structure if not found.
 * Data structure example:
 * {
 *   submissions: [ { userId, score, checkedQuestions, timestamp }, ... ],
 *   stats: {
 *     totalSubmissions: 0,
 *     sumOfScores: 0,
 *     questionCounts: {
 *       "1": 0,
 *       "2": 0,
 *       ...
 *       "100": 0
 *     }
 *   }
 * }
 */
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    // If file doesn't exist, create a default
    const defaultData = {
      submissions: [],
      stats: {
        totalSubmissions: 0,
        sumOfScores: 0,
        questionCounts: {}
      }
    };
    // Initialize questionCounts for up to 100 questions
    for (let i = 1; i <= 100; i++) {
      defaultData.stats.questionCounts[i] = 0;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }

  // Otherwise read the file
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

/**
 * Save the updated data structure back to scores.json
 */
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * POST /submit
 * Receives JSON: { userId, score, checkedQuestions }
 */
app.post('/submit', (req, res) => {
  const { userId, score, checkedQuestions } = req.body;

  // Basic validation
  if (typeof score !== 'number' || isNaN(score)) {
    return res.status(400).json({ error: 'Score must be a valid number.' });
  }
  if (!Array.isArray(checkedQuestions)) {
    return res.status(400).json({ error: 'checkedQuestions must be an array.' });
  }

  // Load existing data
  const data = loadData();
  const stats = data.stats;

  // 1) Add a new submission
  const newSubmission = {
    userId: userId || 'anonymous',
    score: score,
    checkedQuestions: checkedQuestions,
    timestamp: Date.now()
  };
  data.submissions.push(newSubmission);

  // 2) Update stats
  stats.totalSubmissions += 1;
  stats.sumOfScores += score;

  // For each question that was checked, increment questionCounts
  checkedQuestions.forEach((qIndex) => {
    // Make sure the question index is within 1..100
    if (qIndex >= 1 && qIndex <= 100) {
      stats.questionCounts[qIndex] += 1;
    }
  });

  // 3) Save updated data
  saveData(data);

  // 4) Return updated stats (like message, totalSubmissions, averageScore, etc.)
  const averageScore = (stats.sumOfScores / stats.totalSubmissions).toFixed(2);

  // Optional: compute question-level percentages
  // e.g. question 1 => questionCounts[1] / totalSubmissions * 100
  const questionPercentages = {};
  for (let i = 1; i <= 100; i++) {
    if (stats.totalSubmissions > 0) {
      questionPercentages[i] = (
        (stats.questionCounts[i] / stats.totalSubmissions) * 100
      ).toFixed(2);
    } else {
      questionPercentages[i] = "0.00";
    }
  }

  return res.json({
    message: 'Score recorded successfully.',
    totalSubmissions: stats.totalSubmissions,
    averageScore: averageScore,
    questionStats: questionPercentages
  });
});

/**
 * GET /stats
 * Returns global stats: total submissions, average score,
 * plus per-question percentages (optional).
 */
app.get('/stats', (req, res) => {
  const data = loadData();
  const { totalSubmissions, sumOfScores, questionCounts } = data.stats;

  if (totalSubmissions === 0) {
    // If no submissions yet
    return res.json({
      totalSubmissions: 0,
      averageScore: 0,
      questionStats: {}
    });
  }

  const averageScore = sumOfScores / totalSubmissions;

  // Compute question-level percentage
  const questionPercentages = {};
  for (let i = 1; i <= 100; i++) {
    questionPercentages[i] = (
      (questionCounts[i] / totalSubmissions) * 100
    ).toFixed(2);
  }

  res.json({
    totalSubmissions,
    averageScore: averageScore.toFixed(2),
    questionStats: questionPercentages
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
