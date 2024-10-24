// Select the canvas and get its context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');




// Define the ball, paddles, and game logic
let paddle1 = { x: 10, y: canvas.height / 2 - 50, width: 10, height: 100, dy: 20 };
let paddle2 = { x: canvas.width - 20, y: canvas.height / 2 - 50, width: 10, height: 100, dy: 5 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 4, dy: 4 };
let score1 = 0;
let score2 = 0

// Function to draw paddles
function drawPaddle(paddle) {
    ctx.fillStyle = "white";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Function to draw the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

// Event listeners for key presses
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowUp':
            paddle2.y = Math.max(paddle2.y - paddle2.dy, 0);
            break;
        case 'ArrowDown':
            paddle2.y = Math.min(paddle2.y + paddle2.dy, canvas.height - paddle2.height);
            break;
        case 'w':
            paddle1.y = Math.max(paddle1.y - paddle1.dy, 0);
            break;
        case 's':
            paddle1.y = Math.min(paddle1.y + paddle1.dy, canvas.height - paddle1.height);
            break;
    }
});
// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas
    // Draw scores
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(score1, canvas.width / 4, 50);
    ctx.fillText(score2, (canvas.width / 4) * 3, 50);
    drawPaddle(paddle1);
    drawPaddle(paddle2);
    drawBall();

    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with walls
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) 
    {
        ball.dy = -ball.dy;  // Reverse direction
    }
    //Ball collision with paddles
    if (ball.x + ball.radius > canvas.width - 20 && ball.y + ball.radius > paddle2.y && ball.y + ball.radius < paddle2.y + 100)
    {
        ball.dx = -ball.dx;
    }
    if (ball.x + ball.radius < 40 && ball.y + ball.radius > paddle1.y && ball.y + ball.radius < paddle1.y + 100)
    {
        ball.dx = -ball.dx;
    }
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx > 0 ? score1 = score1 + 1 : score2 = score2 + 1;
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.dx = ball.dx > 0 ? -4 : +4;
        ball.dy = 4;
        // Pause the game and wait for spacebar press to resume
        let paused = true;
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
    // Call gameLoop recursively to animate the game
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
