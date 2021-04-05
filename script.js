const gameWrap = document.querySelector('.app__game');
const time = document.querySelector('.game-time');

const startButton = document.querySelector('.app__start-btn');
const pauseButton = document.querySelector('.app__pause-btn');
const stopButton = document.querySelector('.app__stop-btn');

const stopPauseBtnWrap = document.querySelector('.app__stop-pause-btn-wrap');
const startBtnWrap = document.querySelector('.app__start-btn-wrap');

const HOMEPAGE = 'HOMEPAGE';
const RUNNING = 'RUNNING';
const PAUSED = 'PAUSED';
const TIMEOVER = 'TIMEOVER';

const GAMESTATE_STORE = {HOMEPAGE, RUNNING, PAUSED, TIMEOVER};

let gameState = GAMESTATE_STORE.HOMEPAGE;

let startTime = 60;
let currentTime = startTime;
let statusTimer = false;
let intervalStart;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.height = 500;
canvas.width = 700;
time.textContent = startTime;


function startTimer() {
    if (!statusTimer) {
        time.innerHTML = currentTime;
        intervalStart = setInterval(newTimer, 1000);
        statusTimer = true;
    }
}

function toggleTimer() {
    if (!statusTimer) {
        startTimer();
    } else {
        pauseTimer();
    }
}

function resetTimer() {
    clearInterval(intervalStart);
    statusTimer = false;
    currentTime = startTime;
    time.innerHTML = currentTime;
}

function pauseTimer() {
    clearInterval(intervalStart);
    statusTimer = false;
}

function newTimer() {
    currentTime--;
    time.innerHTML = currentTime;
    if (currentTime === 0) {
        pauseTimer();
    }
}

const randVal = function () {
    return Math.floor(Math.random() * 255);
};

const randColor = function () {
    let red = randVal();
    let green = randVal();
    let blue = randVal();

    return "rgb(" + red + "," + green + "," + blue + ")";
};

let randomRadius = 20;
const calcRandomRadius = function () {
    randomRadius = Math.floor(Math.random() * 30);
    if (randomRadius < 10) {
        randomRadius = 10;
    }
    return randomRadius
};

class Balloon {
    constructor(x, y, radius, color, dx, dy, gameWidth, gameHeight, needle) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = dx;
        this.dy = dy;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.needle = needle;

        this.markedForRemove = false;
        this.doneScore = '';
        this.loseScore = '';
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x + this.radius > this.gameWidth || this.x < 0) {
            this.dx *= -1;
        }

        if (this.x + this.radius >= this.needle.position.x
            && this.x <= this.needle.position.x + this.needle.width
            && this.y + this.radius <= this.needle.height * 1.7
            && this.markedForRemove !== true
        ) {
            this.dx = 0;
            this.dy = 0;
            this.y = 7;
            this.doneScore = 'done';
            this.markedForRemove = true;
        }

        if (this.y <= 0) {
            this.loseScore = 'lose';
            this.markedForRemove = true;
        }
    }
}


function createBalloons(gameHeight, gameWidth, gameTime, needle) {
    let balloons = [];
    let startChangeTimer = 2000;
    let interval;

    intervalFunc();

    function changeTimer() {
        startChangeTimer = startChangeTimer * 0.978;
    }

    function intervalFunc() {
        if (gameState === GAMESTATE_STORE.RUNNING) {

            clearInterval(interval);
            const radius = calcRandomRadius();
            const x = Math.random() * (gameWidth - radius);
            const y = gameHeight + radius / 2;
            const angle = Math.atan2(gameHeight / 2 - y, gameWidth / 2 - x);
            const color = randColor();
            const dx = Math.cos(angle) * 10;
            const dy = Math.sin(angle) * 5;

            balloons.push(new Balloon(x, y, radius, color, dx, dy, gameWidth, gameHeight, needle));
            changeTimer();

        } else if (gameState === GAMESTATE_STORE.PAUSED || gameState === GAMESTATE_STORE.HOMEPAGE
            || gameState === GAMESTATE_STORE.TIMEOVER) {
            clearInterval(interval);
        }

        interval = setInterval(intervalFunc, startChangeTimer);
    }

    return balloons;
}


class Needle {
    constructor(game) {
        this.gameWidth = game.gameWidth;
        this.width = 6;
        this.height = 22;
        this.position = {
            x: game.gameWidth / 2 - this.width / 2,
            y: 0
        };
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.moveTo(this.position.x, this.height);
        ctx.lineTo(this.position.x + 30, this.position.y);
        ctx.lineTo(this.position.x - 30, this.position.y);
        ctx.fill();
    }
}

class Game {
    constructor(gameWidth, gameHeight, gameTime) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.gameTime = gameTime;
        this.balloons = [];
        this.filterBalloons = [];
        this.done = 0;
        this.lose = 0;
        this.needle = new Needle(this);
        this.needleArray = []
    }

    start() {
        if (gameState !== GAMESTATE_STORE.HOMEPAGE) {
            return;
        }

        gameState = GAMESTATE_STORE.RUNNING;
        this.needleArray = [this.needle];
        this.balloons = createBalloons(this.gameHeight, this.gameWidth, this.gameTime, this.needle);
    }

    stop() {
        gameState = GAMESTATE_STORE.HOMEPAGE;
    }

    draw(ctx) {

        this.filterBalloons.forEach(item => item.draw(ctx));

        if (gameState === GAMESTATE_STORE.RUNNING) {
            gameWrap.style.display = 'flex';
            stopPauseBtnWrap.style.display = 'flex';
            stopButton.style.display = 'flex';
            stopButton.innerHTML = 'Stop';
            pauseButton.style.display = 'flex';
            startBtnWrap.style.display = 'none';

            [...this.needleArray].forEach(element => element.draw(ctx));

            ctx.font = '20px Helvetica';
            ctx.fillStyle = '#ff1500';
            ctx.fillText("Score: " + this.done, 110, this.gameHeight - 50);
            ctx.fillText("Lose: " + this.lose, this.gameWidth - 110, this.gameHeight - 50);
        }


        if (gameState === GAMESTATE_STORE.PAUSED) {
            ctx.rect(0, 0, this.gameWidth, this.gameHeight);
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fill();

            ctx.font = "30px Helvetica";
            ctx.fillStyle = "#3e3e3e";
            ctx.textAlign = "center";
            ctx.fillText("Paused", this.gameWidth / 2, this.gameHeight / 2);
        }


        if (gameState === GAMESTATE_STORE.HOMEPAGE) {
            gameWrap.style.display = 'none';
            stopPauseBtnWrap.style.display = 'none';
            startBtnWrap.style.display = 'flex';

            ctx.rect(0, 0, this.gameWidth, this.gameHeight);
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.fill();

            ctx.font = "20px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Сlick on start", this.gameWidth / 2, this.gameHeight / 2);


        }

        if (gameState === GAMESTATE_STORE.TIMEOVER) {
            pauseButton.style.display = 'none';
            stopButton.innerHTML = 'Reload';


            ctx.rect(0, 0, this.gameWidth, this.gameHeight);
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.fill();

            ctx.font = "33px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(`Score: ${this.done}`, this.gameWidth / 2, this.gameHeight / 2 - 25);
            ctx.fillText(`Lose: ${this.lose}`, this.gameWidth / 2, this.gameHeight / 2 + 25);
        }
    }


    update() {
        if (time.innerHTML === '0') {
            this.filterBalloons.length = 0;
            gameState = GAMESTATE_STORE.TIMEOVER;
        }

        if (gameState === GAMESTATE_STORE.PAUSED || gameState === GAMESTATE_STORE.HOMEPAGE) {
            return;
        }

        if (gameState === GAMESTATE_STORE.RUNNING) {
            this.balloons.forEach(item => item.update());

            let balloon = this.balloons.filter(balloon => !balloon.markedForRemove);
            this.filterBalloons = [...balloon];

            let done = this.balloons.filter(balloon => balloon.doneScore === 'done');
            this.done = done.length;

            let lose = this.balloons.filter(balloon => balloon.loseScore === 'lose');
            this.lose = lose.length
        }
    }

    togglePause() {
        if (gameState === GAMESTATE_STORE.PAUSED) {
            gameState = GAMESTATE_STORE.RUNNING;
        } else {
            gameState = GAMESTATE_STORE.PAUSED;
        }
    }
}


function handlerClick(game) {
    stopButton.addEventListener('click', () => {
        game.stop();
        resetTimer();
    });

    let pauseButtonState = false;

    pauseButton.addEventListener('click', () => {
        if (pauseButtonState) {
            pauseButton.innerHTML = 'Pause';
            pauseButtonState = false;
        } else {
            pauseButton.innerHTML = 'Play';
            pauseButtonState = true;
        }

        game.togglePause();
        toggleTimer();
    });

    const needleCenteringAxisX = (document.documentElement.clientWidth - canvas.width) / 2;

    document.addEventListener('mousemove', (e) => {
        game.needle.position.x = e.pageX - needleCenteringAxisX;
    });

    startButton.addEventListener('click', () => {
        game.start();
        startTimer();
    });
}


const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GAME_TIME = time.textContent;

let game = new Game(GAME_WIDTH, GAME_HEIGHT, GAME_TIME);

function play() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    game.update();
    game.draw(ctx);
    requestAnimationFrame(play)
}

requestAnimationFrame(play);
handlerClick(game);
