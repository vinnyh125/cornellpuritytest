// script.js

document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submitBtn');

  // OPTIONAL: If you want to track a single user across multiple sessions,
  // you can generate a random userId once and store it in localStorage.
  // If you don't care about user-based tracking, skip this part.
  let userId = localStorage.getItem('purityUserId');
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('purityUserId', userId);
  }

  submitBtn.addEventListener('click', () => {
    // 1. Get all checkboxes
    const checkboxes = document.querySelectorAll('.question');
    let checkedCount = 0;
    let checkedQuestions = [];

    // 2. Identify which questions are checked
    checkboxes.forEach((box, index) => {
      if (box.checked) {
        checkedCount++;
        // We'll store the question index (or you could store question IDs)
        checkedQuestions.push(index + 1); // +1 to make it 1-based
      }
    });

    // 3. Calculate the purity score
    const purityScore = 100 - checkedCount;

    // 4. POST data to the server for stats
    // We send:
    //  { userId, score, checkedQuestions: [1, 5, 12, ...], timestamp not needed (server can add it) }
    fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        score: purityScore,
        checkedQuestions: checkedQuestions
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log("Server Response:", data);
        // data might have: { message, totalSubmissions, averageScore, questionStats, ... }
      })
      .catch(error => {
        console.error('Error submitting to server:', error);
      });

    // 5. Redirect to results.html with score in URL
    // e.g. results.html?score=75
    window.location.href = `results.html?score=${purityScore}`;
  });
});
