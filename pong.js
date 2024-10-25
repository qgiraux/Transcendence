// Select the canvas and get its context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');




// Define the ball, paddles, and game logic
let paddle1 = { x: canvas.width/80, y: canvas.height / 2 - canvas.height / 8, width: canvas.width/80, height: canvas.height/4, dy: canvas.height/40 };
let paddle2 = { x: canvas.width - canvas.width/40, y: canvas.height / 2 - canvas.height / 8, width: canvas.width/80, height: canvas.height/4, dy: canvas.height/40 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 4, dy: 4 };
let endScore = 3;
let score1 = 0;
let score2 = 0;
let commands = {up: 0, down: 0, w: 0, s: 0};

// Function to draw paddles
function drawPaddle(paddle) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "white";
    let gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, "lightgrey");
    gradient.addColorStop(0.5, "lightblue");
    gradient.addColorStop(1, "lightgrey");
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowColor = "transparent";
}


function drawScore(){ 
    ctx.fillRect((canvas.width / 4) - 7, 25, 30, 30);
    ctx.fillRect((canvas.width / 4) * 3 - 7, 25, 30, 30);
    ctx.fillStyle = "black";
    ctx.fillText(score1, (canvas.width / 4), 50);
    ctx.fillText(score2, (canvas.width / 4) * 3, 50);
    ctx.fillStyle = "white";
}

// Function to draw the ball
function drawBall() {
    // Create a radial gradient centered on the ball
    let gradient = ctx.createRadialGradient(ball.x, ball.y, ball.radius / 4, ball.x, ball.y, ball.radius);
    
    // Add color stops for light blue in the center and white on the edges
    gradient.addColorStop(0, "lightblue");
    gradient.addColorStop(1, "lightgrey");

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = gradient;  // Use the gradient as the fill style
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    
    // Reset the shadow for other drawings
    ctx.shadowColor = "transparent";
}


// Event listeners for key presses
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowUp':
            commands.up = 1;
            break;
        case 'ArrowDown':
            commands.down = 1;
            break;
        case 'w':
            commands.w = 1;
            break;
        case 's':
            commands.s = 1;
            break;
    }
});
document.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'ArrowUp':
            commands.up = 0;
            break;
        case 'ArrowDown':
            commands.down = 0;
            break;
        case 'w':
            commands.w = 0;
            break;
        case 's':
            commands.s = 0;
            break;
    }
});

function movepaddles()
{
    if (commands.up == 1)
        paddle2.y = Math.max(paddle2.y - paddle2.dy, 0);
    if (commands.down == 1)
        paddle2.y = Math.min(paddle2.y + paddle2.dy, canvas.height - paddle2.height);
    if (commands.w == 1)
        paddle1.y = Math.max(paddle1.y - paddle1.dy, 0);
    if (commands.s == 1)
        paddle1.y = Math.min(paddle1.y + paddle1.dy, canvas.height - paddle1.height);
}

function pingpong()
{
    // Ball collision with walls
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) 
        {
            ball.dy = -ball.dy;  // Reverse direction
        }
        //Ball collision with paddles
        if (ball.x + ball.radius > canvas.width - 20 && ball.y + ball.radius > paddle2.y && ball.y + ball.radius < paddle2.y + 100 && ball.dx > 0)
        {
            ball.dx = -ball.dx;
            let deltaY = (ball.y - (paddle1.y + paddle2.height / 2)) / (paddle2.height / 2);
            ball.dy = deltaY * 2;  // Adjust the multiplier as needed
        }
        else if (ball.x + ball.radius < 40 && ball.y + ball.radius > paddle1.y && ball.y + ball.radius < paddle1.y + 100 && ball.dx < 0)
        {
            ball.dx = -ball.dx;
            let deltaY = (ball.y - (paddle1.y + paddle1.height / 2)) / (paddle1.height / 2);
            ball.dy = deltaY * 2;  // Adjust the multiplier as needed
        }
}

function gameEnd()
{
    if (score1 > score2)
        ctx.fillText("PLAYER 1 WON!!", (canvas.width * 1 / 3), (canvas.height / 2));
    else
        ctx.fillText("PLAYER 2 WON!!", (canvas.width * 1 / 3), (canvas.height / 2));
        ctx.fillText("press space for new game", (canvas.width * 1 / 3) - 33, (canvas.height / 2) + 30);
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas
    // Draw scores
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    drawScore()
    movepaddles()
    drawPaddle(paddle1);
    drawPaddle(paddle2);
    drawBall();

    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;
    pingpong();
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) 
    {
        let winner;
        ball.dx > 0 ? (score1 = score1 + 1, winner = 1) : (score2 = score2 + 1, winner = 2);
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.dx = ball.dx > 0 ? -4 : +4;
        ball.dy = 4;
        // Pause the game and wait for spacebar press to resume
        let paused = true;
        ctx.fillText(`PLAYER ${winner} SCORED!!`, (canvas.width * 1 / 3), (canvas.height / 2));
        ctx.fillText("press space for next game", (canvas.width * 1 / 3) - 33, (canvas.height / 2) + 30);
        document.addEventListener('keydown', function resumeGame(event) {
            if (event.code === 'Space') {
                paused = false;
                document.removeEventListener('keydown', resumeGame);
                requestAnimationFrame(gameLoop);
            }
        });

        // Stop the game loop until spacebar is pressed
        if (paused) return;
    }
    if (score1 == endScore || score2 == endScore)
    {
        gameEnd();
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.dx = ball.dx > 0 ? -4 : +4;
        ball.dy = 4;
        let paused = true;
            document.addEventListener('keydown', function resumeGame(event) {
                if (event.code === 'Space') {
                    score1 = 0;
                    score2 = 0;
                    paused = false;
                    document.removeEventListener('keydown', resumeGame);
                    requestAnimationFrame(gameLoop);
                }
            });
            // Stop the game loop until spacebar is pressed
            if (paused) return;

    };
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
