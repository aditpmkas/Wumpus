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
    pathToGold = []; // Reset path to gold
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

// Check for hazards (wumpus or pit) around the agent
function getAvailableMoves() {
    const moves = [];

    // Directions: {dx, dy, direction}
    const directions = [
        { dx: -1, dy: 0, direction: "up" },    // Up
        { dx: 1, dy: 0, direction: "down" },  // Down
        { dx: 0, dy: -1, direction: "left" },  // Left
        { dx: 0, dy: 1, direction: "right" }   // Right
    ];

    for (const { dx, dy, direction } of directions) {
        const newX = agentPosition.x + dx;
        const newY = agentPosition.y + dy;

        // Check bounds and avoid hazards
        if (newX >= 0 && newX < world.length && newY >= 0 && newY < world[newX].length) {
            if (world[newX][newY] !== "pit") {
                moves.push({ x: newX, y: newY, direction });
            }
        }
    }

    return moves;
}

// Move the agent based on direction
function moveAgent(newPosition) {
    agentPosition = { x: newPosition.x, y: newPosition.y };
    agentDirection = newPosition.direction; // Update the direction agent is facing
    pathToGold.push(newPosition); // Store the path taken
    checkCell();
    drawWorld();
}

// Check the contents of the current cell (including gold collection)
function checkCell() {
    const currentCell = world[agentPosition.x][agentPosition.y];
    
    if (currentCell === "wumpus") {
        // If the cell has a Wumpus, shoot it
        shootArrow();
        // After shooting, check the cell again
        checkCell();
    } else if (currentCell === "pit") {
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

// Move towards the target while avoiding obstacles
function aiMove() {
    if (isGameRunning) return; // Prevent multiple clicks

    isGameRunning = true; // Set the game to running

    const goldPosition = findGoldPosition();

    // If gold is found, move towards it
    if (goldPosition) {
        const interval = setInterval(() => {
            const availableMoves = getAvailableMoves();

            // Prioritize moving to the gold position if possible
            const targetMove = availableMoves.find(move => 
                move.x === goldPosition.x && move.y === goldPosition.y
            );

            if (targetMove) {
                moveAgent(targetMove);
            } else if (availableMoves.length > 0) {
                // If no direct move to gold, move randomly from available moves
                const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                moveAgent(randomMove);
            } else {
                alert("No available moves! AI is stuck.");
                clearInterval(interval);
                isGameRunning = false;
            }

            // Check if the agent has reached the gold
            if (agentPosition.x === goldPosition.x && agentPosition.y === goldPosition.y) {
                goldCollected = true;
                alert("AI collected the gold! Returning to start.");
                clearInterval(interval); // Stop moving towards gold
                returnToStart(); // Move back to start position
            }
        }, 1000); // Move every second
    } else {
        alert("No gold available.");
        isGameRunning = false; // Reset game running status
    }
}

// Find the gold position
function findGoldPosition() {
    for (let row = 0; row < world.length; row++) {
        for (let col = 0; col < world[row].length; col++) {
            if (world[row][col] === "gold") {
                return { x: row, y: col };
            }
        }
    }
    return null; // No gold found
}

// Return to starting position after collecting gold
function returnToStart() {
    if (pathToGold.length === 0) {
        alert("AI has returned to the start position.");
        isGameRunning = false;
        return;
    }

    const startX = 3;
    const startY = 0;
    const interval = setInterval(() => {
        const availableMoves = getAvailableMoves();

        // Find the next best move towards the start
        const returnMove = availableMoves.find(move => 
            move.x === startX && move.y === startY
        );

        if (returnMove) {
            moveAgent(returnMove); // Move back to start
        } else if (availableMoves.length > 0) {
            const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            moveAgent(randomMove);
        } else {
            alert("No available moves!");
            clearInterval(interval);
            isGameRunning = false;
        }
    }, 1000); // Move every second
}

// Shoot an arrow to deal with the Wumpus
function shootArrow() {
    if (arrowCount > 0) {
        arrowCount--;
        updateArrowCount();
        alert("Arrow shot at Wumpus!");
    } else {
        alert("No arrows left!");
    }
}

// Add event listener to the start button
startButton.addEventListener("click", () => {
    if (!isGameRunning) {
        generateRandomWorld(); // Generate a new random world on start
        drawWorld(); // Draw the world with the agent
        aiMove(); // Start AI movement
    }
});
