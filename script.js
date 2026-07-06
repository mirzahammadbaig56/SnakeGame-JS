// Basic settings
let box = 36;              // size of one cell in pixels
let cols = null;
let rows = null;

// Get elements
const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const highScoreText = document.getElementById("high-score");
const timeText = document.getElementById("time");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const pauseBtn = document.getElementById("pause-btn");
const startOverlay = document.getElementById("start-overlay");
const gameOverOverlay = document.getElementById("game-over-overlay");
const pauseOverlay = document.getElementById("pause-overlay");
const finalScoreText = document.getElementById("final-score");
const playAgainBtn = document.getElementById("play-again-btn");

// Game variables
let blocks = {};
let highlightedCells = [];
let snake = [];
let direction = "RIGHT";
let food = {};
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let isNewHighScore = false;
let seconds = 0;
let speed = 150;
let isPaused = false;
let gameLoop;
let timerLoop;

highScoreText.textContent = highScore;

function isMobile() {
  return window.matchMedia("(max-width: 600px), (pointer: coarse)").matches;
}
function getBoxSize() {
  return isMobile() ? 28 : 36;
}

function buildBoard() {
  box = getBoxSize();
  const wrapper = document.querySelector(".board-wrapper");
  const availableWidth = wrapper.clientWidth - 40;   // minus the wrapper's own padding
  const availableHeight = wrapper.clientHeight - 40;

  cols = Math.floor(availableWidth / box);
  rows = Math.floor(availableHeight / box);

  board.style.gridTemplateColumns = `repeat(${cols}, ${box}px)`;
  board.style.gridTemplateRows = `repeat(${rows}, ${box}px)`;

  board.innerHTML = "";
  blocks = {};

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      board.appendChild(cell);
      blocks[`${i}-${j}`] = cell;
    }
  }
}

function setup() {
  const startRow = Math.floor(rows / 2);
  const startCol = Math.floor(cols / 2);

  snake = [
    { row: startRow, col: startCol },
    { row: startRow, col: startCol - 1 },
    { row: startRow, col: startCol - 2 },
  ];
  direction = "RIGHT";
  score = 0;
  seconds = 0;
  scoreText.textContent = score;
  timeText.textContent = "00:00";
  placeFood();
}

function placeFood() {
  let newFood;
  do {
    newFood = {
      row: Math.floor(Math.random() * rows),
      col: Math.floor(Math.random() * cols),
    };
  } while (snake.some(part => part.row === newFood.row && part.col === newFood.col));

  food = newFood;
}

function getHeadRotation() {
  if (direction === "RIGHT") return "0deg";
  if (direction === "DOWN") return "90deg";
  if (direction === "LEFT") return "180deg";
  if (direction === "UP") return "270deg";
  return "0deg";
}

function draw() {
  highlightedCells.forEach(key => {
    blocks[key].className = "cell";
    blocks[key].style.transform = "";
  });
  highlightedCells = [];

  // snake
  snake.forEach((part, index) => {
    const key = `${part.row}-${part.col}`;
    const cell = blocks[key];

    if (index === 0) {
      cell.className = "cell snake snake-head";
      cell.style.transform = `rotate(${getHeadRotation()})`;
    } else {
      cell.className = "cell snake";
    }

    highlightedCells.push(key);
  });

  // food
  const foodKey = `${food.row}-${food.col}`;
  blocks[foodKey].className = "cell food";
  highlightedCells.push(foodKey);
}

// Move the snake one step
function move() {
  const head = { row: snake[0].row, col: snake[0].col };

  if (direction === "RIGHT") head.col += 1;
  if (direction === "LEFT") head.col -= 1;
  if (direction === "UP") head.row -= 1;
  if (direction === "DOWN") head.row += 1;

  // hit wall
  if (head.row < 0 || head.col < 0 || head.row >= rows || head.col >= cols) {
    return gameOver();
  }

  // hit itself
  if (snake.some(part => part.row === head.row && part.col === head.col)) {
    return gameOver();
  }

  snake.unshift(head);

  // eat food
  if (head.row === food.row && head.col === food.col) {
    score += 10;
    scoreText.textContent = score;

    if (score > highScore) {
      highScore = score;
      highScoreText.textContent = highScore;
      localStorage.setItem("snakeHighScore", highScore);
      isNewHighScore = true;  
    }
    if (speed > 80) {
      speed -= 5;
      clearInterval(gameLoop);
      gameLoop = setInterval(move, speed);
    }

    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

// End the game
function gameOver() {
  clearInterval(gameLoop);
  clearInterval(timerLoop);
  finalScoreText.textContent = score;

  if (isNewHighScore) {
    finalScoreText.innerHTML = `${score} High Score 🎉`;
    finalScoreText.style.color = "#4ade80";
  } else {
    finalScoreText.textContent = score;
    finalScoreText.style.color = "#ff4d4d";
  }

  gameOverOverlay.classList.add("show");
}

// Start / restart the game
function startGame() {
  clearInterval(gameLoop);
  clearInterval(timerLoop);

  isPaused = false;
  isNewHighScore = false; 
  speed = isMobile() ? 230 : 150;

  startOverlay.classList.remove("show");
  gameOverOverlay.classList.remove("show");

  buildBoard();
  setup();
  draw();

  gameLoop = setInterval(move, speed);

  timerLoop = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timeText.textContent = m + ":" + s;
  }, 1000);
}

function togglePause() {
  if (startOverlay.classList.contains("show") || gameOverOverlay.classList.contains("show")) {
    return;
  }

  isPaused = !isPaused;

  if (isPaused) {
    clearInterval(gameLoop);
    clearInterval(timerLoop);
    pauseOverlay.classList.add("show");
    pauseBtn.textContent = "▶";
  } else {
    gameLoop = setInterval(move, speed);
    timerLoop = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      timeText.textContent = m + ":" + s;
    }, 1000);
    pauseOverlay.classList.remove("show");
    pauseBtn.textContent = "⏸";
  }
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (startOverlay.classList.contains("show")) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      startGame();
    }
    return;   
  }

  if (gameOverOverlay.classList.contains("show")) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      startGame();
    }
    return; 
  }

  if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  if (e.key === " ") {
    e.preventDefault();
    togglePause();
  }
});

// Mobile button controls
document.getElementById("up-btn").addEventListener("click", () => {
  if (direction !== "DOWN") direction = "UP";
});
document.getElementById("down-btn").addEventListener("click", () => {
  if (direction !== "UP") direction = "DOWN";
});
document.getElementById("left-btn").addEventListener("click", () => {
  if (direction !== "RIGHT") direction = "LEFT";
});
document.getElementById("right-btn").addEventListener("click", () => {
  if (direction !== "LEFT") direction = "RIGHT";
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

window.addEventListener("resize", buildBoard);

buildBoard();