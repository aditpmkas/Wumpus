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
    const interval = setInterval(() => {
        if (pathToGold.length === 0) {
            alert("AI has returned to the start position.");
            clearInterval(interval);
            isGameRunning = false;
            return;
        }

        // Get the last move in pathToGold (the move taken towards gold)
        const lastMove = pathToGold.pop();
        moveAgent(lastMove); // Move back to the last position
    }, 1000); // Move every second
}

// Function to allow agent to attack the Wumpus
function shootArrow() {
    if (arrowCount === 0) {
        alert("You have no more arrows!");
        return;
    }

    let arrowHits = false;

    // Check if the arrow hits the Wumpus based on the direction the agent is facing
    if (agentDirection === "up") {
        for (let x = agentPosition.x - 1; x >= 0; x--) {
            if (world[x][agentPosition.y] === "wumpus") {
                arrowHits = true;
                world[x][agentPosition.y] = ""; // Wumpus is killed
                break;
            }
        }
    } else if (agentDirection === "down") {
        for (let x = agentPosition.x + 1; x < world.length; x++) {
            if (world[x][agentPosition.y] === "wumpus") {
                arrowHits = true;
                world[x][agentPosition.y] = ""; // Wumpus is killed
                break;
            }
        }
    } else if (agentDirection === "left") {
        for (let y = agentPosition.y - 1; y >= 0; y--) {
            if (world[agentPosition.x][y] === "wumpus") {
                arrowHits = true;
                world[agentPosition.x][y] = ""; // Wumpus is killed
                break;
            }
        }
    } else if (agentDirection === "right") {
        for (let y = agentPosition.y + 1; y < world[agentPosition.x].length; y++) {
            if (world[agentPosition.x][y] === "wumpus") {
                arrowHits = true;
                world[agentPosition.x][y] = ""; // Wumpus is killed
                break;
            }
        }
    }

    arrowCount--; // Decrease arrow count
    if (arrowHits) {
        alert("You shot the Wumpus! It's dead.");
    } else {
        alert("You missed the Wumpus.");
    }
    drawWorld(); // Redraw the world after shooting
}

// Reset the game by generating a new random world
function resetGame() {
    generateRandomWorld(); // Generate a new random world layout
    arrowCount = 5; // Reset arrows to 5
    goldCollected = false; // Reset gold collected status
    pathToGold = []; // Reset path to gold
    drawWorld();
}

// Initialize the world grid for the first time
generateRandomWorld();
drawWorld();

// Start the AI when the button is clicked
startButton.addEventListener("click", aiMove);

// Add keyboard controls for W (up), A (left), S (down), D (right), Space (attack)
document.addEventListener("keydown", function(event) {
    if (event.key === "w" || event.key === "W") moveAgent({ x: agentPosition.x - 1, y: agentPosition.y, direction: "up" });
    if (event.key === "a" || event.key === "A") moveAgent({ x: agentPosition.x, y: agentPosition.y - 1, direction: "left" });
    if (event.key === "s" || event.key === "S") moveAgent({ x: agentPosition.x + 1, y: agentPosition.y, direction: "down" });
    if (event.key === "d" || event.key === "D") moveAgent({ x: agentPosition.x, y: agentPosition.y + 1, direction: "right" });
    if (event.key === " ") shootArrow(); // Spacebar to shoot arrow
});
