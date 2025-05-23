const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let score = 0;
let lives = 5;
let words = [];
let typedWord = "";
let keysUsed = {};
let gameOver = true; // Start as game over until Start is clicked
let isPaused = false;
let startTime = null;
let animationFrameId;

// Starfield for background
let starField = [];

// DOM Elements
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const scoreListEl = document.getElementById("scoreList");

// Word list
const wordList = ["apple", "banana", "cat", "dog", "sun", "moon", "star", "rocket", "planet"];

// Initialize stars
function initStars(count) {
  for (let i = 0; i < count; i++) {
    starField.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      alpha: Math.random(),
      delta: Math.random() * 0.02
    });
  }
}

// Draw twinkling space background
function drawBackground() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";

  starField.forEach(star => {
    star.alpha += star.delta;
    if (star.alpha > 1) star.delta = -Math.random() * 0.02;
    if (star.alpha < 0) star.delta = Math.random() * 0.02;

    ctx.globalAlpha = star.alpha;
    ctx.fillRect(star.x, star.y, star.size, star.size);
    ctx.globalAlpha = 1;
  });
}

// Draw simple triangle spaceship
function drawSpaceship() {
  ctx.fillStyle = "#0ff"; // Cyan color
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height - 20); // Tip of the ship
  ctx.lineTo(canvas.width / 2 - 10, canvas.height - 5); // Left base
  ctx.lineTo(canvas.width / 2 + 10, canvas.height - 5); // Right base
  ctx.closePath();
  ctx.fill();
}

// Handle keyboard input
document.body.addEventListener("keydown", function (e) {
  if (gameOver || isPaused) return;

  if (e.key === "Backspace") {
    typedWord = typedWord.slice(0, -1);
  } else if (e.key.match(/^[a-z]$/i)) {
    typedWord += e.key.toLowerCase();
    keysUsed[e.key.toLowerCase()] = (keysUsed[e.key.toLowerCase()] || 0) + 1;
  }

  checkTypedWord();
});

// Check partial letter match
/*
function checkTypedWord() {
  words.forEach((wordObj) => {
    wordObj.matchedLetters = 0;

    for (let i = 0; i < typedWord.length; i++) {
      if (typedWord[i] === wordObj.text[i]) {
        wordObj.matchedLetters++;
      } else {
        break;
      }
    }
  });
}
*/

function checkTypedWord() {
  let matchedAny = false;

  // Try to match typedWord with any falling word from the beginning
  for (let i = 0; i < words.length; i++) {
    const wordObj = words[i];

    if (wordObj.text.startsWith(typedWord)) {
      matchedAny = true;

      // Matched letters count
      wordObj.matchedLetters = 0;
      for (let j = 0; j < typedWord.length; j++) {
        if (typedWord[j] === wordObj.text[j]) {
          wordObj.matchedLetters++;
        } else {
          break;
        }
      }
    } else {
      wordObj.matchedLetters = 0;
    }
  }

  // If no match found at all, reset the typedWord
  if (!matchedAny && typedWord !== "") {
    typedWord = "";
  }
}
// Explode a word when typed correctly
function explodeWord(word) {
  score += 10;
  updateUI();
  playSound("sound-bomb.mp3");
}

// Update UI elements
function updateUI() {
  scoreEl.innerText = score;
  livesEl.innerText = lives;
}

// Falling word class
class FallingWord {
  constructor(text) {
    this.text = text;
    this.x = Math.random() * (canvas.width - 100);
    this.y = 0;
    this.speed = 1 + Math.random() * 2;
    this.size = 24;
    this.matchedLetters = 0;
  }

  draw() {
    ctx.font = this.size + "px Arial";
    let x = this.x;

    for (let i = 0; i < this.text.length; i++) {
      if (i < this.matchedLetters) {
        ctx.fillStyle = "#0f0"; // Green for matched letters
      } else {
        ctx.fillStyle = "#ff0"; // Yellow for unmatched letters
      }
      ctx.fillText(this.text[i], x, this.y);
      x += ctx.measureText(this.text[i]).width;
    }
  }

  update() {
    this.y += this.speed;
    if (this.y > canvas.height) {
      lives--;
      updateUI();
      playSound("sound-laser-lost.mp3");
      words.splice(words.indexOf(this), 1);

      if (lives <= 0) {
        endGame();
      }
    }

    if (this.matchedLetters === this.text.length) {
      explodeWord(this);
      words.splice(words.indexOf(this), 1);
      typedWord = "";
    }
  }
}

// End game screen
function endGame() {
  gameOver = true;
  isPaused = false;
  cancelAnimationFrame(animationFrameId);

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "24px Arial";
  ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 + 20);

  saveScore(score);
  showScores();
}

// Pause game message
function showPausedMessage() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Paused", canvas.width / 2, canvas.height / 2);
}

// Animation loop
function animate() {
  if (isPaused) {
    showPausedMessage();
    return;
  }

  if (gameOver) return;

  drawBackground(); // Draw space background

  words.forEach((w) => {
    w.update();
    w.draw();
  });

  drawSpaceship(); // Draw spaceship at bottom

  animationFrameId = requestAnimationFrame(animate);
}

// Play sound helper
function playSound(src) {
  const sound = new Audio(src);
  sound.play();
}

// Download score report
function downloadScores() {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Time Spent (seconds)," + duration + "\n";
  csvContent += "Total Score," + score + "\n";
  csvContent += "Key Usage:\n";
  csvContent += "Key,Count\n";

  for (let key in keysUsed) {
    csvContent += `${key},${keysUsed[key]}\n`;
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "typing_invaders_scores.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Word spawner
function spawnWord() {
  if (!gameOver && !isPaused) {
    const word = new FallingWord(
      wordList[Math.floor(Math.random() * wordList.length)]
    );
    words.push(word);
  }
}

// Game control functions
function startGame() {
  if (!gameOver && !isPaused) return;

  resetGame();
  gameOver = false;
  isPaused = false;
  startTime = Date.now();
  animate();
  setInterval(spawnWord, 1500);
}

function pauseGame() {
  isPaused = true;
  cancelAnimationFrame(animationFrameId);
  showPausedMessage();
}

function cancelGame() {
  isPaused = false;
  gameOver = true;
  cancelAnimationFrame(animationFrameId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Canceled", canvas.width / 2, canvas.height / 2);
}

function resetGame() {
  gameOver = false;
  isPaused = false;
  score = 0;
  lives = 5;
  words = [];
  typedWord = "";
  keysUsed = {};
  updateUI();
}

// Scoreboard logic
function saveScore(finalScore) {
  let scores = JSON.parse(localStorage.getItem("typingInvadersScores") || "[]");
  scores.push(finalScore);
  scores.sort((a, b) => b - a);
  scores = scores.slice(0, 5); // Top 5 only
  localStorage.setItem("typingInvadersScores", JSON.stringify(scores));
}

function showScores() {
  let scores = JSON.parse(localStorage.getItem("typingInvadersScores") || "[]");
  scoreListEl.innerHTML = "";

  if (scores.length === 0) {
    scoreListEl.innerHTML = "<li>No scores yet.</li>";
  } else {
    scores.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      scoreListEl.appendChild(li);
    });
  }
}

// Init on page load
initStars(150);
showScores();