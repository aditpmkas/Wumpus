const grid = document.getElementById("world-grid");
const arrowCountDisplay = document.createElement("div"); // Create a div to display arrow count
document.body.appendChild(arrowCountDisplay); // Add arrow count display to the body

// Track the agent's position and direction
let agentPosition = { x: 3, y: 0 };
let agentDirection = "right"; // Agent starts facing right
let arrowCount = 5; // Agent starts with 5 arrows
let world = Array.from({ length: 8 }, () => Array(8).fill("empty"));

// Function to generate random world map
function generateRandomWorld() {
    // Empty world grid
    world = [
        ["", "", "", ""],
        ["", "", "", ""],
        ["", "", "", ""],
        ["", "", "", ""]
    ];

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
}

// Utility function to shuffle an array
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

// Function to update arrow count display
function updateArrowCount() {
    arrowCountDisplay.innerHTML = `Arrows left: ${arrowCount}`;
}

// Function to draw the world grid
// Function to draw the world grid
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


// Move the agent based on direction
function moveAgent(direction) {
    let newX = agentPosition.x;
    let newY = agentPosition.y;

    if (direction === "up" && newX > 0) newX--;
    if (direction === "down" && newX < 3) newX++;
    if (direction === "left" && newY > 0) newY--;
    if (direction === "right" && newY < 3) newY++;

    agentPosition = { x: newX, y: newY };
    agentDirection = direction; // Update the direction agent is facing
    checkCell();
    drawWorld();
}

// Check the contents of the current cell
function checkCell() {
    const currentCell = world[agentPosition.x][agentPosition.y];
    
    if (currentCell === "wumpus") {
        alert("Oh no! The Wumpus got you! Game over.");
        resetGame();
    } else if (currentCell === "pit") {
        alert("You fell into a pit! Game over.");
        resetGame();
    }
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
        for (let x = agentPosition.x + 1; x <= 3; x++) {
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
        for (let y = agentPosition.y + 1; y <= 3; y++) {
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

// Function to pick up gold
function pickUpGold() {
    if (world[agentPosition.x][agentPosition.y] === "gold") {
        world[agentPosition.x][agentPosition.y] = ""; // Remove the gold
        alert("You picked up the gold! You win!");
        resetGame();
    } else {
        alert("There's no gold here.");
    }
}

// Reset the game by generating a new random world
function resetGame() {
    generateRandomWorld(); // Generate a new random world layout
    arrowCount = 5; // Reset arrows to 5
    drawWorld();
}

// Initialize the world grid for the first time
generateRandomWorld();
drawWorld();

// Add keyboard controls for W (up), A (left), S (down), D (right), Space (attack), Enter (pick up gold)
document.addEventListener("keydown", function(event) {
    if (event.key === "w" || event.key === "W") moveAgent("up");
    if (event.key === "a" || event.key === "A") moveAgent("left");
    if (event.key === "s" || event.key === "S") moveAgent("down");
    if (event.key === "d" || event.key === "D") moveAgent("right");
    if (event.key === " ") shootArrow(); // Spacebar to shoot arrow
    if (event.key === "Enter") pickUpGold(); // Enter to pick up gold
});

