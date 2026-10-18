const cells = document.querySelectorAll(".cell");
const gameBoard = document.querySelector("#gameBoard");
const miniBoards = document.querySelectorAll(".miniBoard");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const modeAi = document.querySelector("#modeAi");
const modeTwo = document.querySelector("#modeTwo");

const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

let boards = createEmptyBoards();
let miniBoardWinners = ["", "", "", "", "", "", "", "", ""];
let activeBoard = -1;
let currentPlayer = "X";
let running = false;
let vsAi = true;
let aiTimer = null;

const AI_DELAY = 500;

initializeGame();

function createEmptyBoards() {
    const result = [];
    for (let i = 0; i < 9; i++) {
        result.push(["", "", "", "", "", "", "", "", ""]);
    }
    return result;
}

function initializeGame() {
    gameBoard.addEventListener("click", handleBoardClick);
    restartButton.addEventListener("click", restartGame);
    modeAi.addEventListener("click", () => setMode(true));
    modeTwo.addEventListener("click", () => setMode(false));
    gameStatus.textContent = `${currentPlayer}'s turn`;
    running = true;
    updateHighlight();
}

function handleBoardClick(e) {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    cellClicked(cell);
}

function setMode(aiMode) {
    vsAi = aiMode;
    modeAi.classList.toggle("active", vsAi);
    modeTwo.classList.toggle("active", !vsAi);
    restartGame();
}

function cellClicked(cell) {
    const boardIndex = Number(cell.parentElement.getAttribute("boardIndex") ?? cell.getAttribute("boardIndex"));
    const cellIndex = Number(cell.getAttribute("cellIndex"));

    if (vsAi && currentPlayer == "O") {
        return;
    }
    if (!running || boards[boardIndex][cellIndex] != "" || miniBoardWinners[boardIndex] != "") {
        return;
    }
    if (activeBoard != -1 && activeBoard != boardIndex) {
        return;
    }
    playMove(boardIndex, cellIndex);
}

function playMove(boardIndex, cellIndex) {
    updateCell(boardIndex, cellIndex);
    checkMiniBoardWinner(boardIndex);
    checkGameWinner();

    if (!running) {
        updateHighlight();
        return;
    }

    activeBoard = (miniBoardWinners[cellIndex] == "") ? cellIndex : -1;
    changePlayer();
    updateHighlight();

    if (vsAi && currentPlayer == "O") {
        aiTimer = setTimeout(makeAiMove, AI_DELAY);
    }
}

function updateCell(boardIndex, cellIndex) {
    boards[boardIndex][cellIndex] = currentPlayer;
    const cell = miniBoards[boardIndex].children[cellIndex];
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
}

function getWinningLine(marks, player) {
    return winConditions.find(line => line.every(i => marks[i] == player));
}

function hasLine(marks, player) {
    return getWinningLine(marks, player) != undefined;
}

function checkMiniBoardWinner(boardIndex) {
    if (hasLine(boards[boardIndex], currentPlayer)) {
        miniBoardWinners[boardIndex] = currentPlayer;
        miniBoards[boardIndex].classList.add(`won${currentPlayer}`);
    }
    else if (!boards[boardIndex].includes("")) {
        miniBoardWinners[boardIndex] = "D";
        miniBoards[boardIndex].classList.add("drawn");
    }
}

function checkGameWinner() {
    const winningLine = getWinningLine(miniBoardWinners, currentPlayer);

    if (winningLine) {
        gameStatus.textContent = `${currentPlayer} wins!`;
        running = false;
        highlightWinningBoards(winningLine);
    }
    else if (!miniBoardWinners.includes("")) {
        gameStatus.textContent = "Draw!";
        running = false;
    }
}

function highlightWinningBoards(line) {
    line.forEach(i => miniBoards[i].classList.add("winning"));
}

function changePlayer() {
    currentPlayer = (currentPlayer == "X") ? "O" : "X";
    gameStatus.textContent = (vsAi && currentPlayer == "O") ? "AI is thinking..." : `${currentPlayer}'s turn`;
}

function updateHighlight() {
    miniBoards.forEach((miniBoard, i) => {
        const playable = running && miniBoardWinners[i] == "" && (activeBoard == -1 || activeBoard == i);
        miniBoard.classList.toggle("playable", playable);
        miniBoard.classList.toggle("active", playable && activeBoard != -1);
    });
    gameBoard.classList.toggle("free", running && activeBoard == -1);
}

function getLegalMoves() {
    const moves = [];
    for (let b = 0; b < 9; b++) {
        if (miniBoardWinners[b] != "" || (activeBoard != -1 && activeBoard != b)) {
            continue;
        }
        for (let c = 0; c < 9; c++) {
            if (boards[b][c] == "") {
                moves.push({ b: b, c: c });
            }
        }
    }
    return moves;
}

function canWinMini(marks, player) {
    for (let i = 0; i < 9; i++) {
        if (marks[i] == "") {
            const copy = marks.slice();
            copy[i] = player;
            if (hasLine(copy, player)) {
                return true;
            }
        }
    }
    return false;
}

function scoreMove(move) {
    const b = move.b;
    const c = move.c;
    let score = 0;

    const afterO = boards[b].slice();
    afterO[c] = "O";
    const winsMini = hasLine(afterO, "O");
    if (winsMini) {
        const winnersAfter = miniBoardWinners.slice();
        winnersAfter[b] = "O";
        if (hasLine(winnersAfter, "O")) {
            return 1000;
        }
        score += 100;
    }

    const afterX = boards[b].slice();
    afterX[c] = "X";
    if (hasLine(afterX, "X")) {
        const winnersAfter = miniBoardWinners.slice();
        winnersAfter[b] = "X";
        score += hasLine(winnersAfter, "X") ? 500 : 60;
    }

    if (c == 4) {
        score += 3;
    }
    else if (c == 0 || c == 2 || c == 6 || c == 8) {
        score += 2;
    }
    if (b == 4) {
        score += 2;
    }

    const targetMarks = (c == b) ? afterO : boards[c];
    const targetDecided = miniBoardWinners[c] != "" || (c == b && winsMini) || !targetMarks.includes("");
    if (targetDecided) {
        score -= 15;
    }
    else if (canWinMini(targetMarks, "X")) {
        score -= 40;
    }

    return score + Math.random();
}

function makeAiMove() {
    if (!running) {
        return;
    }
    const moves = getLegalMoves();
    if (moves.length === 0) {
        return;
    }
    moves.forEach(move => move.score = scoreMove(move));
    moves.sort((a, b) => b.score - a.score);

    let choice = moves[0];
    if (moves.length > 1 && choice.score < 500 && Math.random() < 0.2) {
        choice = moves[1];
    }
    playMove(choice.b, choice.c);
}

function restartGame() {
    clearTimeout(aiTimer);
    boards = createEmptyBoards();
    miniBoardWinners = ["", "", "", "", "", "", "", "", ""];
    activeBoard = -1;
    currentPlayer = "X";
    running = true;
    gameStatus.textContent = `${currentPlayer}'s turn`;
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("x", "o");
    });
    miniBoards.forEach(miniBoard => miniBoard.classList.remove("wonX", "wonO", "drawn", "winning"));
    updateHighlight();
}
