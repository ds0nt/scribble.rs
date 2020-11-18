
const messageInput = document.getElementById("message-input");
const playerContainer = document.getElementById("player-container");
const wordContainer = document.getElementById("word-container");
const messageContainer = document.getElementById("message-container");
const roundsSpan = document.getElementById("rounds");
const timeLeft = document.getElementById("time-left");
const drawingBoard = document.getElementById("drawing-board");
//const chat = document.getElementById("chat");
const colorPicker = document.getElementById("color-picker");
const centerDialog = document.getElementById("center-dialog");

const startDialog = document.getElementById("start-dialog");
const wordDialog = document.getElementById("word-dialog");
const wordButtonZero = document.getElementById("word-button-zero");
const wordButtonOne = document.getElementById("word-button-one");
const wordButtonTwo = document.getElementById("word-button-two");


class Socket {
    constructor() {

        // let wsURL = (location.protocol === 'https:' ? "wss://" : "ws://") + location.hostname + ":" + location.port + "/v1/ws?lobby_id=" + window.lobbyId
        let wsURL = "ws://" + location.hostname + ":" + location.port + "/v1/ws?lobby_id=" + window.lobbyId
        this.socket = new ReconnectingWebSocket(wsURL, null, { debug: true, reconnectInterval: 3000 });
        this.handlers = {}
        this.socket.onmessage = e => {
            let parsed = JSON.parse(e.data);
            console.dir(parsed)
            if (typeof this.handlers[parsed.type] == 'undefined') {
                console.error("socket received unknown message type " + parsed.type)
            }
            this.handlers[parsed.type](parsed)
        }
        this.socket.onerror = err => console.error("websocket error: ", err);
    }
        
    addHandler = (type, fn) => {
        this.handlers[type] = fn
    }

    sendStart = () => {
        this.socket.send(JSON.stringify({
            type: "start",
        }));
    }

    sendClear = () => {
        this.socket.send(JSON.stringify({
            type: "clear-drawing-board"
        }));
    }

    sendMessage = (text) => {
        this.socket.send(JSON.stringify({
            type: "message",
            data: text,
        }));
    }

    sendChooseWord = (index) => {
        this.socket.send(JSON.stringify({
            type: "choose-word",
            data: index
        }));
    }

    sendKickVote = (playerId) => {
        this.socket.send(JSON.stringify({
            type: "kick-vote",
            data: playerId,
        }));
    }

    sendFill = (x, y, color) => {
        this.socket.send(JSON.stringify({
            type: "fill",
            data: {
                x: x,
                y: y,
                color: color
            },
        }));
    }

    sendLine = (x1, y1, x2, y2, color, lineWidth) => {
        let drawInstruction = {
            type: "line",
            data: {
                fromX: x1,
                fromY: y1,
                toX: x2,
                toY: y2,
                color: color,
                lineWidth: lineWidth * scaleUpFactor(),
            }
        }
        this.socket.send(JSON.stringify(drawInstruction));
    }
}

let socket = new Socket()


function clearCanvasAndSendEvent() {
    //Avoid unnecessary traffic back to us.
    clear(context);
    socket.sendClear()
}

const sendMessage = () => {
    Socket.sendMessage(messageInput.value)
    messageInput.value = "";

    // Necessary in order to keep the page from submitting.
    return false;
};

function chooseWord(index) {
    Socket.sendChooseWord(index)

    allowDrawing = true;
    hide("#word-dialog");
    wordDialog.style.display = "none";
    $("#cc-toolbox").css({ 'transform': 'translateX(0)' });
    $("#player-container").css({ 'transform': 'translateX(-150%)' });
}

function onClickKickButton(playerId) {
    Socket.sendKickVote(playerId);
}

function fillAndSendEvent(context, x, y, color) {
    fill(context, x, y, color);
    let _x = x * scaleUpFactor()
    let _y = y * scaleUpFactor()
    Socket.sendFill(_x, _y, color)

}

function drawLineAndSendEvent(context, x1, y1, x2, y2, color, lineWidth) {
    if (localTool === 1) {
        color = "#ffffff";
    }

    drawLine(context, x1, y1, x2, y2, color, lineWidth);

    let _x1 = x1 * scaleUpFactor()
    let _y1 = y1 * scaleUpFactor()
    let _x2 = x2 * scaleUpFactor()
    let _y2 = y2 * scaleUpFactor()
    let _lineWidth = lineWidth * scaleUpFactor()
    Socket.sendLine(_x1, _y1, _x2, _y2, color, _lineWidth)
}

// const noSoundIcon = "🔇";
// const soundIcon = "🔊";
// const soundToggleLabel = document.getElementById("sound-toggle-label");
// let sound = localStorage.getItem("sound") === "true";
//  updateSoundIcon();

/*  function toggleSound() {
      sound = !sound;
      localStorage.setItem("sound", sound.toString());
      updateSoundIcon();
  }
 
  function updateSoundIcon() {
      if (sound) {
          soundToggleLabel.innerText = soundIcon;
      } else {
          soundToggleLabel.innerText = noSoundIcon;
      }
  }*/

//The drawing board has a base size. This base size results in a certain ratio
//that the actual canvas has to be resized accordingly too. This is needed
//since not every client has the same screensize.
let boardRatio = baseWidth / baseHeight;

function handleCanvasResize() {
    drawingBoard.width = drawingBoard.clientWidth;
    drawingBoard.height = drawingBoard.clientHeight;
    setLineWidth(localLineWidthUnscaled);
    // chat.style.maxHeight = drawingBoard.height + "px";
}

// Moving this here to extract the context after resizing
const context = drawingBoard.getContext("2d");

function scaleUpFactor() {
    return baseWidth / drawingBoard.clientWidth;
}

function scaleDownFactor() {
    return drawingBoard.clientWidth / baseWidth;
}

const pen = 0;
const rubber = 1;
const fillBucket = 2;

let allowDrawing = false;
let localColor = "#000000";
let localLineWidth;
let localLineWidthUnscaled;
let localTool = pen;
setLineWidth(5);


function setColor(value) {
    if (value === undefined) {
        localColor = colorPicker.value;
    } else {
        localColor = value;
        colorPicker.value = value;
    }
    document.documentElement.style.setProperty('--color', value);
    //updateCursor();
}

function setLineWidth(value) {
    localLineWidthUnscaled = value;
    localLineWidth = value * scaleDownFactor();
    updateCursor();
}

function chooseTool(value) {
    if (value === pen || value === rubber || value === fillBucket) {
        localTool = value;
    } else {
        //If this ends up with an invalid value, we use the pencil.
        localTool = pen;
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function updateCursor() {
    let cursorColor;
    let borderColor = "#FFFFFF";
    if (localColor.startsWith("#")) {
        cursorColor = hexToRgb(localColor);

        const hsp = Math.sqrt(
            0.299 * (cursorColor[0] * cursorColor[0]) +
            0.587 * (cursorColor[1] * cursorColor[1]) +
            0.114 * (cursorColor[2] * cursorColor[2])
        );

        if (hsp > 127.5) {
            borderColor = "rgb(0,0,0)";
        } else {
            borderColor = "rgb(255,255,255)";
        }

        cursorColor = "rgb(" + cursorColor[0] + "," + cursorColor[1] + "," + cursorColor[2] + ")";
    } else {
        cursorColor = localColor;
    }

    let circleSize = localLineWidth * scaleUpFactor();
    drawingBoard.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + (circleSize + 2) + "\" height=\"" + (circleSize + 2) + "\"><circle cx=\"" + (circleSize / 2) + "\" cy=\"" + (circleSize / 2) + "\" r=\"" + (circleSize / 2) + "\" style=\"fill: " + cursorColor + "; stroke: " + borderColor + ";\"/></svg>') " + (circleSize / 2) + " " + (circleSize / 2) + ", auto";
}

let ownID, ownerID;
let maxRounds = 0;
let roundEndTime = 0;

socket.addHandler("ready", (pkt) => {
    let ready = pkt.data;
    ownerID = ready.ownerId;
    allowDrawing = ready.drawing;
    ownID = ready.playerId;
    maxRounds = ready.maxRounds;
    roundEndTime = ready.roundEndTime;
    applyRounds(ready.round, ready.maxRounds);

    if (ready.round === 0 && ownerID === ownID) {
        show("#start-dialog")
        startDialog.style.display = "block";
    }

    if (ready.players && ready.players.length) {
        applyPlayers(ready.players)
    }
    if (ready.currentDrawing && ready.currentDrawing.length) {
        applyDrawData(ready.currentDrawing)
    }
    if (ready.wordHints && ready.wordHints.length) {
        applyWordHints(ready.wordHints)
    }
})
socket.addHandler("update-players", (pkt) => {
    applyPlayers(pkt.data);
})
socket.addHandler("correct-guess", (pkt) => {
    playWav('/resources/plop.wav');
})
socket.addHandler("update-wordhint", (pkt) => {
    applyWordHints(pkt.data);
})
socket.addHandler("message", (pkt) => {
    applyMessage("", pkt.data.author, pkt.data.content);
})
socket.addHandler("system-message", (pkt) => {
    applyMessage("system-message", "System", pkt.data);
})
socket.addHandler("non-guessing-player-message", (pkt) => {
    applyMessage("non-guessing-player-message", pkt.data.author, pkt.data.content);
})
socket.addHandler("persist-username", (pkt) => {
    document.cookie = "username=" + pkt.data + ";expires=Tue, 19 Jan 2038 00:00:00 UTC;path=/;samesite=strict";
})
socket.addHandler("reset-username", (pkt) => {
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
})
socket.addHandler("line", (pkt) => {
    drawLine(context, pkt.data.fromX * scaleDownFactor(), pkt.data.fromY * scaleDownFactor(), pkt.data.toX * scaleDownFactor(), pkt.data.toY * scaleDownFactor(), pkt.data.color, pkt.data.lineWidth * scaleDownFactor());
})
socket.addHandler("fill", (pkt) => {
    fill(context, pkt.data.x * scaleDownFactor(), pkt.data.y * scaleDownFactor(), pkt.data.color);
})
socket.addHandler("clear-drawing-board", (pkt) => {
    clear(context)
})
socket.addHandler("next-turn", (pkt) => {
    $("#cc-toolbox").css({ 'transform': 'translateX(-150%)' });
    $("#player-container").css({ 'transform': 'translateX(0)' });
    //If a player doesn't choose, the dialog will still be up.
    wordDialog.style.display = "none";
    playWav('/resources/end-turn.wav');

    clear(context);

    roundEndTime = pkt.data.roundEndTime;
    applyRounds(pkt.data.round, maxRounds);
    applyPlayers(pkt.data.players);

    //We clear this, since there's no word chosen right now.
    wordContainer.innerHTML = "";

    allowDrawing = false;
})
socket.addHandler("your-turn", (pkt) => {
    playWav('/resources/your-turn.wav');
    promptWords(pkt.data[0], pkt.data[1], pkt.data[2]);
    show("#word-dialog")
    $("#cc-toolbox").css({ 'transform': 'translateX(0)' });
    $("#player-container").css({ 'transform': 'translateX(-150%)' });
})


function promptWords(wordOne, wordTwo, wordThree) {
    wordButtonZero.textContent = wordOne;
    wordButtonOne.textContent = wordTwo;
    wordButtonTwo.textContent = wordThree;
    wordDialog.style.display = "block";
    //show("#word-dialog");
}

function playWav(file) {
    //Tas: add this ine
    if (true) {
        let audio = new Audio(file);
        audio.type = 'audio/wav';
        audio.play();
    }
}

window.setInterval(function () {
    let secondsLeft = Math.floor((roundEndTime - new Date().getTime()) / 1000);
    if (secondsLeft >= 0) {
        timeLeft.innerText = secondsLeft;
    } else {
        timeLeft.innerText = "∞";
    }
}, 500);

function applyMessage(styleClass, author, message) {
    console.log(message);
    if (message === "Game over. Type !start again to start a new round.") {
        show("#score-dialog");
        return;
    }
    if (messageContainer.childElementCount >= 100) {
        messageContainer.removeChild(messageContainer.firstChild)
    }

    messageContainer.innerHTML += `<div class="message ` + styleClass + `">
                            <span class="chat-name">` + author + `</span>
                            <span class="message-content">` + message + `</span>
                        </div>`;
}

// <div class="playerBox">
//         <img src="../resources/image/avatar_phillip.png" alt="">
//         <div class="playerName self">james</div>
//         <div class="playerScore">0</div>
//     </div> 
function applyPlayers(players) {
    playerContainer.innerHTML = "";
    players.forEach(function (player) {
        //We don't wanna show the disconnected players.
        if (!player.connected) {
            return;
        }

        let stateStyleClass;
        if (player.state === 2) {
            stateStyleClass = 'player-done';
        } else {
            stateStyleClass = '';
        }
        let newPlayerElement = '<div class="playerBox">' +
            ' <img src="../resources/image/avatar_phillip.png" alt="">' +
            '<div class="name';
        //Tas: not sure if we need to add this
        // if (player.id === ownID) {
        //     newPlayerElement += ' playername-self';
        // }
        newPlayerElement += '">' + player.name + '</div>';
        if (player.id !== ownID) {
            newPlayerElement +=
                '<button class="kick-button" id="kick-button" type="button" title="Vote to kick this player" alt="Vote to kick this player" onclick="onClickKickButton(' + player.id + ')">👋</button>';
        }
        newPlayerElement +=
            '<span class="score">' + player.score + '</span>' +
            '<span class="last-turn-score">(Last turn: ' + player.lastScore + ')</span>' +
            '</div>';
        if (player.state === 1) {
            newPlayerElement += '<span>✏️</span>';
        } else if (player.state === 2) {
            newPlayerElement += '<span>✔️</span>';
        }
        newPlayerElement += '</div></div></div>';
        let newPlayer = document.createRange().createContextualFragment(newPlayerElement);
        console.log(newPlayer);
        playerContainer.appendChild(newPlayer);
        //playerContainer.innerHTML += newPlayerElement;

    });
}

function applyRounds(round, maxRound) {
    roundsSpan.innerText = 'Round ' + round + ' of ' + maxRound;
}

function applyWordHints(wordHints) {
    wordContainer.innerHTML = "";
    //If no hint has been revealed
    wordHints.forEach(function (hint) {
        if (hint.character === 0) {
            wordContainer.innerHTML += '<span class="guess-letter guess-letter-underline">&nbsp;</span>';
        } else {
            let char = String.fromCharCode(hint.character);
            if (hint.underline) {
                wordContainer.innerHTML += '<span class="guess-letter guess-letter-underline">' + char + '</span>'
            } else {
                wordContainer.innerHTML += '<span class="guess-letter">' + char + '</span>';
            }
        }
    });
}

function applyDrawData(drawElements) {
    clear(context);
    drawElements.forEach(function (drawElement) {
        let drawData = drawElement.data;
        if (drawElement.type === "fill") {
            fill(context, drawData.x * scaleDownFactor(), drawData.y * scaleDownFactor(), drawData.color);
        } else if (drawElement.type === "line") {
            drawLine(context, drawData.fromX * scaleDownFactor(), drawData.fromY * scaleDownFactor(), drawData.toX * scaleDownFactor(), drawData.toY * scaleDownFactor(), drawData.color, drawData.lineWidth * scaleDownFactor());
        } else {
            console.log("Unknown draw element type: " + drawData.type)
        }
    });
}

let isDrawing = false;
let x = 0;
let y = 0;

// asdf

// Touch input
let touchID = 0;

drawingBoard.ontouchstart = function (e) {
    if (!isDrawing && allowDrawing) {
        touchID = e.touches[0].identifier;

        if (allowDrawing && localTool !== 2) {
            // calculate the offset coordinates based on client touch position and drawing board client origin
            let clientRect = drawingBoard.getBoundingClientRect();
            x = (e.touches[0].clientX - clientRect.left);
            y = (e.touches[0].clientY - clientRect.top);

            isDrawing = true;
        }
    }
};

drawingBoard.ontouchmove = function (e) {
    //FIXME Explanation? Does this prevent moving the page?
    e.preventDefault();

    if (allowDrawing && isDrawing) {
        // find touch with correct ID
        for (let i = e.changedTouches.length - 1; i >= 0; i--) {
            if (e.changedTouches[i].identifier === touchID) {
                let touch = e.changedTouches[i];

                // calculate the offset coordinates based on client touch position and drawing board client origin
                let clientRect = drawingBoard.getBoundingClientRect();
                let offsetX = (touch.clientX - clientRect.left);
                let offsetY = (touch.clientY - clientRect.top);

                // drawing functions must check for context boundaries
                drawLineAndSendEvent(context, x, y, offsetX, offsetY, localColor, localLineWidth);
                x = offsetX;
                y = offsetY;

                return;
            }
        }
    }
};

drawingBoard.ontouchcancel = function (e) {
    if (isDrawing) {
        // find touch with correct ID
        for (let i = e.changedTouches.length - 1; i >= 0; i--) {
            if (e.changedTouches[i].identifier === touchID) {
                isDrawing = false;
                return;
            }
        }
    }
}
drawingBoard.ontouchend = drawingBoard.ontouchcancel

// Mouse input
drawingBoard.onmousedown = function (e) {
    if (allowDrawing && e.button === 0 && localTool !== 2) {
        x = e.offsetX;
        y = e.offsetY;

        isDrawing = true;
    }

    return false;
};

// This is executed even if the mouse is not above the browser anymore.
window.onmouseup = function (e) {
    if (isDrawing === true) {
        isDrawing = false;
    }
};

drawingBoard.onmousemove = function (e) {
    if (allowDrawing && isDrawing === true && e.button === 0) {
        // calculate the offset coordinates based on client mouse position and drawing board client origin
        let clientRect = drawingBoard.getBoundingClientRect();
        let offsetX = (e.clientX - clientRect.left);
        let offsetY = (e.clientY - clientRect.top);

        // drawing functions must check for context boundaries
        drawLineAndSendEvent(context, x, y, offsetX, offsetY, localColor, localLineWidth);
        x = offsetX;
        y = offsetY;
    }
};

// necessary for mousemove to not use the previous exit coordinates.
drawingBoard.onmouseenter = function (e) {
    x = e.offsetX;
    y = e.offsetY;
};

drawingBoard.onclick = function (e) {
    if (allowDrawing && e.button === 0) {
        if (localTool === 2) {
            fillAndSendEvent(context, e.offsetX, e.offsetY, localColor)
        } else {
            drawLineAndSendEvent(context, e.offsetX, e.offsetY, e.offsetX, e.offsetY, localColor, localLineWidth);
        }
        isDrawing = false;
    }
};

function clear(context) {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, drawingBoard.width, drawingBoard.height);
}

function fill(context, x1, y1, color) {
    context.fillStyle = color;
    //There seems to be some bug where setting the tolerance to 0 causes a freeze when painting black on white.
    context.fillFlood(x1, y1, 1);
}


function drawLine(context, x1, y1, x2, y2, color, lineWidth) {
    // the coordinates must be whole numbers to improve performance.
    // also, decimals as coordinates is not making sense.
    // FIXME quick and dirty fix to apply the window scale to all drawing activities.
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);
    x2 = Math.floor(x2);
    y2 = Math.floor(y2);
    lineWidth = Math.ceil(lineWidth);

    color = hexToRgb(color);
    color[3] = 255; //alpha channel

    const circleMap = generateCircleMap(Math.floor(lineWidth / 2));
    const offset = Math.floor(circleMap.length / 2);
    const imageData = context.getImageData(0, 0, context.canvas.clientWidth, context.canvas.clientHeight);

    for (let ix = 0; ix < circleMap.length; ix++) {
        for (let iy = 0; iy < circleMap[ix].length; iy++) {
            if (circleMap[ix][iy] === 1 || (x1 === x2 && y1 === y2 && circleMap[ix][iy] === 2)) {
                const newX1 = x1 + ix - offset;
                const newY1 = y1 + iy - offset;
                const newX2 = x2 + ix - offset;
                const newY2 = y2 + iy - offset;
                drawBresenhamLine(imageData, newX1, newY1, newX2, newY2, color);
            }
        }
    }
    context.putImageData(imageData, 0, 0);
}

function drawBresenhamLine(imageData, x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        //check if pixel is inside the canvas
        if (x0 < 0 || x0 >= imageData.width || y0 < 0 || y0 >= imageData.height) return;
        setPixel(imageData, x0, y0, color);

        if ((x0 === x1) && (y0 === y1)) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}

function generateCircleMap(radius) {
    let circleData = [];

    for (x = 0; x < 2 * radius; x++) {
        circleData[x] = [];
        for (y = 0; y < 2 * radius; y++) {
            const distanceToRadius = Math.sqrt(Math.pow(radius - x, 2) + Math.pow(radius - y, 2));
            if (distanceToRadius > radius) {
                circleData[x][y] = 0;
            } else if (distanceToRadius < radius - 2) {
                //optimize for performance: fill circle only when mouse was not moved
                circleData[x][y] = 2;
            } else {
                circleData[x][y] = 1;
            }
        }
    }

    return circleData;
}

function setPixel(imageData, x, y, color) {
    const offset = (y * imageData.width + x) * 4;
    imageData.data[offset] = color[0];
    imageData.data[offset + 1] = color[1];
    imageData.data[offset + 2] = color[2];
    imageData.data[offset + 3] = color[3];
}

//Call intially to correct initial state
handleCanvasResize();
window.addEventListener("resize", handleCanvasResize, false);

function startGame() {
    socket.gameStart()
    //Tas: not needed
    //startDialog.style.display = "hidden";
    hide("#start-dialog");
    show("#word-dialog");
    wordDialog.style.display = "block";
}