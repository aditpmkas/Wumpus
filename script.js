const grid = document.getElementById("world-grid");
const arrowCountDisplay = document.createElement("div"); // Create a div to display arrow count
document.body.appendChild(arrowCountDisplay); // Add arrow count display to the body
const startButton = document.createElement("button"); // Create a start button
startButton.innerText = "Start AI"; // Set button text
document.body.appendChild(startButton); // Add start button to the body

// Track the agent's position, direction, and game state
let agentPosition = { x: 3, y: 0 };
let agentDirection = "right"; // Agent starts facing right
let arrowCount = 5; // Agent starts with 5 arrows
let world = Array.from({ length: 4 }, () => Array(4).fill("empty")); // 4x4 grid
let goldCollected = false; // Track if the player has collected the gold
let isGameRunning = false; // Track if the AI is currently moving
let pathToGold = []; // Array to store the path taken to collect gold
let pathToStart = []; // Array to store the path to return to start
let goldPosition = null; // Track gold's position

// Generate random world map
function generateRandomWorld() {
    world = Array.from({ length: 4 }, () => Array(4).fill("empty")); // Empty world grid

    // Randomly place Wumpus, Gold, and Pits, avoiding overlap
    const positions = shuffleArray([
        { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
        { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 },
        { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
        { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 } // Avoiding agent's start position (3,0)
    ]);

    const wumpusPos = positions[0]; // First position for Wumpus
    const goldPos = positions[1]; // Second position for Gold
    const pit1Pos = positions[2]; // Third position for first Pit
    const pit2Pos = positions[3]; // Fourth position for second Pit

    world[wumpusPos.x][wumpusPos.y] = "wumpus";
    world[goldPos.x][goldPos.y] = "gold";
    world[pit1Pos.x][pit1Pos.y] = "pit";
    world[pit2Pos.x][pit2Pos.y] = "pit";

    agentPosition = { x: 3, y: 0 }; // Agent starts at (3,0)
    agentDirection = "right"; // Agent always starts facing right
    goldPosition = goldPos; // Store the position of the gold
    pathToGold = []; // Reset path to gold
    pathToStart = []; // Reset path to start
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
                cell.classList.add("gold"); // Gold image will be set via CSS
            } else {
                cell.classList.add("hidden");
            }
            grid.appendChild(cell);
        }
    }
    updateArrowCount(); // Update arrow count each time the world is drawn
}

// Find the shortest path to the goal (gold or start) using BFS
function findShortestPath(startX, startY, goalX, goalY) {
    const directions = [
        { dx: -1, dy: 0 }, // Up
        { dx: 1, dy: 0 },  // Down
        { dx: 0, dy: -1 }, // Left
        { dx: 0, dy: 1 }   // Right
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

    return []; // No path found
}

// Move the agent to the next position in the path
function moveAgent(nextPosition) {
    agentPosition = { x: nextPosition.x, y: nextPosition.y };
    drawWorld();
    checkCell();
}

// Check the contents of the current cell (including gold collection)
function checkCell() {
    const currentCell = world[agentPosition.x][agentPosition.y];

    if (currentCell === "pit") {
        alert("You fell into a pit! Game over.");
        resetGame();
    } else if (currentCell === "gold") {
        alert("You picked up the gold! Now return to the start point.");
        goldCollected = true; // Player has collected the gold
        world[agentPosition.x][agentPosition.y] = ""; // Remove gold from the world
    }

    // Check if the player has returned to the start position with the gold
    if (goldCollected && agentPosition.x === 3 && agentPosition.y === 0) {
        alert("Congratulations! You've returned to the start with the gold. You win!");
        resetGame();
    }
}

// Alpha-Beta Pruning function for decision making
function alphabeta(world, depth, alpha, beta, maximizingPlayer) {
    // Base case: If max depth or game over
    if (depth === 0 || isGameOver(world)) {
        return evaluateState(world); // Evaluate the game state
    }

    const possibleMoves = getPossibleMoves(world, maximizingPlayer);

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            const newWorld = applyMove(world, move);
            const eval = alphabeta(newWorld, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break; // Beta cut-off
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            const newWorld = applyMove(world, move);
            const eval = alphabeta(newWorld, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break; // Alpha cut-off
        }
        return minEval;
    }
}

// AI Move to collect gold and return to start
function aiMove() {
    if (isGameRunning) return; // Prevent multiple clicks
    isGameRunning = true; // Set the game to running

    // Step 1: Find path to gold
    const pathToGoldResult = findShortestPath(agentPosition.x, agentPosition.y, goldPosition.x, goldPosition.y); // Find path to the gold

    if (pathToGoldResult.length > 0) {
        // Move agent step by step to the gold
        const interval = setInterval(() => {
            if (pathToGoldResult.length > 0) {
                const nextMove = pathToGoldResult.shift();
                moveAgent(nextMove);
            } else {
                clearInterval(interval);
                alert("AI collected the gold! Now returning to start.");
                // After collecting gold, find the path back to start
                pathToStart = findShortestPath(agentPosition.x, agentPosition.y, 3, 0);
                returnToStart();
            }
        }, 1000); // Move every second
    } else {
        alert("No gold available.");
        isGameRunning = false; // Reset game running status
    }
}

// Return to starting position after collecting gold
function returnToStart() {
    if (pathToStart.length > 0) {
        const interval = setInterval(() => {
            if (pathToStart.length > 0) {
                const nextMove = pathToStart.shift();
                moveAgent(nextMove); // Move back to start
            } else {
                clearInterval(interval);
                alert("AI has returned to the start point.");
                isGameRunning = false; // Reset game running status
            }
        }, 1000); // Move every second
    } else {
        alert("No path to return to start.");
        isGameRunning = false; // Reset game running status
    }
}

// Helper function to check if the game is over
function isGameOver(world) {
    return agentPosition.x === 3 && agentPosition.y === 0 && goldCollected;
}

// Helper function to evaluate the game state
function evaluateState(world) {
    // You can add logic to evaluate the world's state (gold collected, dangers, etc.)
    return goldCollected ? 100 : 0; // Basic evaluation: reward for gold collected
}

// Get possible moves (basic for now, can be expanded)
function getPossibleMoves(world, maximizingPlayer) {
    const moves = [];
    const directions = [
        { dx: -1, dy: 0 }, // Up
        { dx: 1, dy: 0 },  // Down
        { dx: 0, dy: -1 }, // Left
        { dx: 0, dy: 1 }   // Right
    ];

    directions.forEach(({ dx, dy }) => {
        const newX = agentPosition.x + dx;
        const newY = agentPosition.y + dy;

        if (newX >= 0 && newX < 4 && newY >= 0 && newY < 4 && world[newX][newY] !== "pit" && world[newX][newY] !== "wumpus") {
            moves.push({ x: newX, y: newY });
        }
    });

    return moves;
}

// Apply a move and return the new world state
function applyMove(world, move) {
    const newWorld = JSON.parse(JSON.stringify(world)); // Deep copy of the world
    agentPosition = move; // Update agent position
    return newWorld;
}

// Start AI on button click
startButton.addEventListener("click", () => {
    generateRandomWorld();
    drawWorld();
    aiMove(); // Start AI action
});
