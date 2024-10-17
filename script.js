const grid = document.getElementById("world-grid");
const arrowCountDisplay = document.createElement("div");
const scoreDisplay = document.createElement("div"); // Create a div to display the score
document.body.appendChild(arrowCountDisplay);
document.body.appendChild(scoreDisplay); // Add score display to the body

const startButton = document.createElement("button");
startButton.innerText = "Start AI";
document.body.appendChild(startButton);

// Track the agent's position, direction, and game state
let agentPosition = { x: 3, y: 0 };
let agentDirection = "right";
let arrowCount = 5;
let world = Array.from({ length: 4 }, () => Array(4).fill("empty"));
let goldCollected = false;
let isGameRunning = false;
let pathToGold = [];
let pathToStart = [];
let goldPosition = null;
let score = 0; // Initialize score

// Generate random world map
function generateRandomWorld() {
    world = Array.from({ length: 4 }, () => Array(4).fill("empty"));

    const positions = shuffleArray([
        { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
        { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 },
        { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
        { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }
    ]);

    const wumpusPos = positions[0];
    const goldPos = positions[1];
    const pit1Pos = positions[2];
    const pit2Pos = positions[3];

    world[wumpusPos.x][wumpusPos.y] = "wumpus";
    world[goldPos.x][goldPos.y] = "gold";
    world[pit1Pos.x][pit1Pos.y] = "pit";
    world[pit2Pos.x][pit2Pos.y] = "pit";

    agentPosition = { x: 3, y: 0 };
    agentDirection = "right";
    goldPosition = goldPos;
    pathToGold = [];
    pathToStart = [];
    score = 0; // Reset score at the beginning
    updateScore(); // Display initial score
}

// Shuffle an array utility function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Update arrow count display
function updateArrowCount() {
    arrowCountDisplay.innerHTML = `Arrows left: ${arrowCount}`;
}

// Update score display
function updateScore() {
    scoreDisplay.innerHTML = `Score: ${score}`;
}

// Draw the world grid
function drawWorld() {
    grid.innerHTML = "";
    for (let row = 0; row < world.length; row++) {
        for (let col = 0; col < world[row].length; col++) {
            let cell = document.createElement("div");
            cell.classList.add("cell");

            if (row === agentPosition.x && col === agentPosition.y) {
                cell.classList.add("agent");
            } else if (world[row][col] === "wumpus") {
                cell.classList.add("wumpus");
            } else if (world[row][col] === "pit") {
                cell.classList.add("pit");
            } else if (world[row][col] === "gold") {
                cell.classList.add("gold");
            } else {
                cell.classList.add("hidden");
            }
            grid.appendChild(cell);
        }
    }
    updateArrowCount();
    updateScore();
}

// Find the shortest path to the goal using BFS
function findShortestPath(startX, startY, goalX, goalY) {
    const directions = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 }
    ];

    const queue = [{ x: startX, y: startY, path: [] }];
    const visited = Array.from({ length: 4 }, () => Array(4).fill(false));
    visited[startX][startY] = true;

    while (queue.length > 0) {
        const { x, y, path } = queue.shift();

        if (x === goalX && y === goalY) {
            return path;
        }

        for (const { dx, dy } of directions) {
            const newX = x + dx;
            const newY = y + dy;

            if (newX >= 0 && newX < 4 && newY >= 0 && newY < 4 &&
                !visited[newX][newY] && world[newX][newY] !== "pit" && world[newX][newY] !== "wumpus") {
                visited[newX][newY] = true;
                queue.push({ x: newX, y: newY, path: [...path, { x: newX, y: newY }] });
            }
        }
    }

    return [];
}

// Move the agent to the next position
function moveAgent(nextPosition) {
    agentPosition = { x: nextPosition.x, y: nextPosition.y };
    score -= 1; // Subtract 1 for each move
    drawWorld();
    checkCell();
}

// Check the current cell for events
function checkCell() {
    const currentCell = world[agentPosition.x][agentPosition.y];

    if (currentCell === "pit") {
        alert("You fell into a pit! Game over.");
        score -= 1000; // Subtract 1000 for falling into a pit
        updateScore();
        resetGame();
    } else if (currentCell === "gold") {
        alert("You picked up the gold! Now return to the start.");
        goldCollected = true;
        world[agentPosition.x][agentPosition.y] = "";
        score += 1000; // Add 1000 for collecting the gold
        updateScore();
    }

    if (goldCollected && agentPosition.x === 3 && agentPosition.y === 0) {
        alert("Congratulations! You've returned to the start with the gold. You win!");
        resetGame();
    }
}

// Alpha-Beta Pruning decision making
function alphabeta(world, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || isGameOver(world)) {
        return evaluateState(world);
    }

    const possibleMoves = getPossibleMoves(world, maximizingPlayer);

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            const newWorld = applyMove(world, move);
            const eval = alphabeta(newWorld, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            const newWorld = applyMove(world, move);
            const eval = alphabeta(newWorld, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// AI Move to collect gold and return to start
function aiMove() {
    if (isGameRunning) return;
    isGameRunning = true;

    const pathToGoldResult = findShortestPath(agentPosition.x, agentPosition.y, goldPosition.x, goldPosition.y);

    if (pathToGoldResult.length > 0) {
        const interval = setInterval(() => {
            if (pathToGoldResult.length > 0) {
                const nextMove = pathToGoldResult.shift();
                moveAgent(nextMove);
            } else {
                clearInterval(interval);
                alert("AI collected the gold! Now returning to start.");
                pathToStart = findShortestPath(agentPosition.x, agentPosition.y, 3, 0);
                returnToStart();
            }
        }, 1000);
    } else {
        alert("No gold available.");
        isGameRunning = false;
    }
}

// Return to starting position after collecting gold
function returnToStart() {
    if (pathToStart.length > 0) {
        const interval = setInterval(() => {
            if (pathToStart.length > 0) {
                const nextMove = pathToStart.shift();
                moveAgent(nextMove);
            } else {
                clearInterval(interval);
                alert("AI has returned to the start point.");
                isGameRunning = false;
            }
        }, 1000);
    }
}

// Reset the game state
function resetGame() {
    isGameRunning = false;
    generateRandomWorld();
    drawWorld();
}

// Initialize the game
generateRandomWorld();
drawWorld();
startButton.addEventListener("click", aiMove);
