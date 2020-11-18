function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
var messageInput = document.getElementById("message-input");
var playerContainer = document.getElementById("player-container");
var wordContainer = document.getElementById("word-container");
var messageContainer = document.getElementById("message-container");
var roundsSpan = document.getElementById("rounds");
var timeLeft = document.getElementById("time-left");
var drawingBoard = document.getElementById("drawing-board");
//const chat = document.getElementById("chat");
var colorPicker = document.getElementById("color-picker");
var startDialog = document.getElementById("start-dialog");
var wordDialog = document.getElementById("word-dialog");
var wordButtonZero = document.getElementById("word-button-zero");
var wordButtonOne = document.getElementById("word-button-one");
var wordButtonTwo = document.getElementById("word-button-two");
var Socket = function Socket() {
    "use strict";
    _classCallCheck(this, Socket);
    _defineProperty(this, "addHandler", (function(type, fn) {
        this.handlers[type] = fn;
    }).bind(this));
    _defineProperty(this, "sendStart", (function() {
        this.socket.send(JSON.stringify({
            type: "start"
        }));
    }).bind(this));
    _defineProperty(this, "sendClear", (function() {
        this.socket.send(JSON.stringify({
            type: "clear-drawing-board"
        }));
    }).bind(this));
    _defineProperty(this, "sendMessage", (function(text) {
        this.socket.send(JSON.stringify({
            type: "message",
            data: text
        }));
    }).bind(this));
    _defineProperty(this, "sendChooseWord", (function(index) {
        this.socket.send(JSON.stringify({
            type: "choose-word",
            data: index
        }));
    }).bind(this));
    _defineProperty(this, "sendKickVote", (function(playerId) {
        this.socket.send(JSON.stringify({
            type: "kick-vote",
            data: playerId
        }));
    }).bind(this));
    _defineProperty(this, "sendFill", (function(x, y, color) {
        this.socket.send(JSON.stringify({
            type: "fill",
            data: {
                x: x,
                y: y,
                color: color
            }
        }));
    }).bind(this));
    _defineProperty(this, "sendLine", (function(x1, y1, x2, y2, color, lineWidth) {
        var drawInstruction;
        this.socket.send(JSON.stringify({
            type: "line",
            data: {
                fromX: x1,
                fromY: y1,
                toX: x2,
                toY: y2,
                color: color,
                lineWidth: lineWidth * scaleUpFactor()
            }
        }));
    }).bind(this));
    // let wsURL = (location.protocol === 'https:' ? "wss://" : "ws://") + location.hostname + ":" + location.port + "/v1/ws?lobby_id=" + window.lobbyId
    var wsURL = "ws://" + location.hostname + ":" + location.port + "/v1/ws?lobby_id=" + window.lobbyId;
    this.socket = new ReconnectingWebSocket(wsURL, null, {
        debug: true,
        reconnectInterval: 3000
    });
    this.handlers = {
    };
    this.socket.onmessage = (function(e) {
        var parsed = JSON.parse(e.data);
        console.dir(parsed);
        if (typeof this.handlers[parsed.type] == 'undefined') console.error("socket received unknown message type " + parsed.type);
        this.handlers[parsed.type](parsed);
    }).bind(this);
    this.socket.onerror = function(err) {
        return console.error("websocket error: ", err);
    };
};
var socket = new Socket();
function fillAndSendEvent(context, x, y, color) {
    fill(context, x, y, color);
    var _x;
    var _y;
    Socket.sendFill(x * scaleUpFactor(), y * scaleUpFactor(), color);
}
function drawLineAndSendEvent(context, x1, y1, x2, y2, color, lineWidth) {
    if (localTool === 1) color = "#ffffff";
    drawLine(context, x1, y1, x2, y2, color, lineWidth);
    var _x1;
    var _y1;
    var _x2;
    var _y2;
    var _lineWidth;
    Socket.sendLine(x1 * scaleUpFactor(), y1 * scaleUpFactor(), x2 * scaleUpFactor(), y2 * scaleUpFactor(), color, lineWidth * scaleUpFactor());
}
function handleCanvasResize() {
    drawingBoard.width = drawingBoard.clientWidth;
    drawingBoard.height = drawingBoard.clientHeight;
    setLineWidth(localLineWidthUnscaled);
}
// Moving this here to extract the context after resizing
var context = drawingBoard.getContext("2d");
function scaleUpFactor() {
    return baseWidth / drawingBoard.clientWidth;
}
function scaleDownFactor() {
    return drawingBoard.clientWidth / baseWidth;
}
var pen = 0;
var rubber = 1;
var fillBucket = 2;
var allowDrawing = false;
var localColor = "#000000";
var localLineWidth;
var localLineWidthUnscaled;
var localTool = pen;
setLineWidth(5);
function setLineWidth(value) {
    localLineWidthUnscaled = value;
    localLineWidth = value * scaleDownFactor();
    updateCursor();
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
    var cursorColor;
    var borderColor = "#FFFFFF";
    if (localColor.startsWith("#")) {
        cursorColor = hexToRgb(localColor);
        var hsp = Math.sqrt(0.299 * (cursorColor[0] * cursorColor[0]) + 0.587 * (cursorColor[1] * cursorColor[1]) + 0.114 * (cursorColor[2] * cursorColor[2]));
        if (hsp > 127.5) borderColor = "rgb(0,0,0)";
        else borderColor = "rgb(255,255,255)";
        cursorColor = "rgb(" + cursorColor[0] + "," + cursorColor[1] + "," + cursorColor[2] + ")";
    } else cursorColor = localColor;
    var circleSize = localLineWidth * scaleUpFactor();
    drawingBoard.style.cursor = "url(\'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + (circleSize + 2) + "\" height=\"" + (circleSize + 2) + "\"><circle cx=\"" + circleSize / 2 + "\" cy=\"" + circleSize / 2 + "\" r=\"" + circleSize / 2 + "\" style=\"fill: " + cursorColor + "; stroke: " + borderColor + ";\"/></svg>\') " + circleSize / 2 + " " + circleSize / 2 + ", auto";
}
var ownID, ownerID;
var maxRounds = 0;
var roundEndTime = 0;
socket.addHandler("ready", function(pkt) {
    var ready = pkt.data;
    ownerID = ready.ownerId;
    allowDrawing = ready.drawing;
    ownID = ready.playerId;
    maxRounds = ready.maxRounds;
    roundEndTime = ready.roundEndTime;
    applyRounds(ready.round, ready.maxRounds);
    if (ready.round === 0 && ownerID === ownID) {
        show("#start-dialog");
        startDialog.style.display = "block";
    }
    if (ready.players && ready.players.length) applyPlayers(ready.players);
    if (ready.currentDrawing && ready.currentDrawing.length) applyDrawData(ready.currentDrawing);
    if (ready.wordHints && ready.wordHints.length) applyWordHints(ready.wordHints);
});
socket.addHandler("update-players", function(pkt) {
    applyPlayers(pkt.data);
});
socket.addHandler("correct-guess", function(pkt) {
    playWav('/resources/plop.wav');
});
socket.addHandler("update-wordhint", function(pkt) {
    applyWordHints(pkt.data);
});
socket.addHandler("message", function(pkt) {
    applyMessage("", pkt.data.author, pkt.data.content);
});
socket.addHandler("system-message", function(pkt) {
    applyMessage("system-message", "System", pkt.data);
});
socket.addHandler("non-guessing-player-message", function(pkt) {
    applyMessage("non-guessing-player-message", pkt.data.author, pkt.data.content);
});
socket.addHandler("persist-username", function(pkt) {
    document.cookie = "username=" + pkt.data + ";expires=Tue, 19 Jan 2038 00:00:00 UTC;path=/;samesite=strict";
});
socket.addHandler("reset-username", function(pkt) {
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});
socket.addHandler("line", function(pkt) {
    drawLine(context, pkt.data.fromX * scaleDownFactor(), pkt.data.fromY * scaleDownFactor(), pkt.data.toX * scaleDownFactor(), pkt.data.toY * scaleDownFactor(), pkt.data.color, pkt.data.lineWidth * scaleDownFactor());
});
socket.addHandler("fill", function(pkt) {
    fill(context, pkt.data.x * scaleDownFactor(), pkt.data.y * scaleDownFactor(), pkt.data.color);
});
socket.addHandler("clear-drawing-board", function(pkt) {
    clear(context);
});
socket.addHandler("next-turn", function(pkt) {
    $("#cc-toolbox").css({
        'transform': 'translateX(-150%)'
    });
    $("#player-container").css({
        'transform': 'translateX(0)'
    });
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
});
socket.addHandler("your-turn", function(pkt) {
    playWav('/resources/your-turn.wav');
    promptWords(pkt.data[0], pkt.data[1], pkt.data[2]);
    show("#word-dialog");
    $("#cc-toolbox").css({
        'transform': 'translateX(0)'
    });
    $("#player-container").css({
        'transform': 'translateX(-150%)'
    });
});
function promptWords(wordOne, wordTwo, wordThree) {
    wordButtonZero.textContent = wordOne;
    wordButtonOne.textContent = wordTwo;
    wordButtonTwo.textContent = wordThree;
    wordDialog.style.display = "block";
}
function playWav(file) {
    {
        var audio = new Audio(file);
        audio.type = 'audio/wav';
        audio.play();
    }
}
window.setInterval(function() {
    var secondsLeft = Math.floor((roundEndTime - new Date().getTime()) / 1000);
    if (secondsLeft >= 0) timeLeft.innerText = secondsLeft;
    else timeLeft.innerText = "\u{221e}";
}, 500);
function applyMessage(styleClass, author, message) {
    console.log(message);
    if (message === "Game over. Type !start again to start a new round.") {
        show("#score-dialog");
        return;
    }
    if (messageContainer.childElementCount >= 100) messageContainer.removeChild(messageContainer.firstChild);
    messageContainer.innerHTML += "<div class=\"message " + styleClass + "\">\n                            <span class=\"chat-name\">" + author + "</span>\n                            <span class=\"message-content\">" + message + "</span>\n                        </div>";
}
// <div class="playerBox">
//         <img src="../resources/image/avatar_phillip.png" alt="">
//         <div class="playerName self">james</div>
//         <div class="playerScore">0</div>
//     </div> 
function applyPlayers(players) {
    playerContainer.innerHTML = "";
    players.forEach(function(player) {
        //We don't wanna show the disconnected players.
        if (!player.connected) return;
        var stateStyleClass;
        if (player.state === 2) stateStyleClass = 'player-done';
        else stateStyleClass = '';
        var newPlayerElement = '<div class=\"playerBox\"> <img src=\"../resources/image/avatar_phillip.png\" alt=\"\"><div class=\"name';
        //Tas: not sure if we need to add this
        // if (player.id === ownID) {
        //     newPlayerElement += ' playername-self';
        // }
        newPlayerElement += '\">' + player.name + '</div>';
        if (player.id !== ownID) newPlayerElement += '<button class=\"kick-button\" id=\"kick-button\" type=\"button\" title=\"Vote to kick this player\" alt=\"Vote to kick this player\" onclick=\"onClickKickButton(' + player.id + ')\">\u{1f44b}</button>';
        newPlayerElement += '<span class=\"score\">' + player.score + '</span>' + '<span class=\"last-turn-score\">(Last turn: ' + player.lastScore + ')</span>' + '</div>';
        if (player.state === 1) newPlayerElement += '<span>\u{270f}\u{fe0f}</span>';
        else if (player.state === 2) newPlayerElement += '<span>\u{2714}\u{fe0f}</span>';
        newPlayerElement += '</div></div></div>';
        var newPlayer = document.createRange().createContextualFragment(newPlayerElement);
        console.log(newPlayer);
        playerContainer.appendChild(newPlayer);
    });
}
function applyRounds(round, maxRound) {
    roundsSpan.innerText = 'Round ' + round + ' of ' + maxRound;
}
function applyWordHints(wordHints) {
    wordContainer.innerHTML = "";
    //If no hint has been revealed
    wordHints.forEach(function(hint) {
        if (hint.character === 0) wordContainer.innerHTML += '<span class=\"guess-letter guess-letter-underline\">&nbsp;</span>';
        else {
            var char = String.fromCharCode(hint.character);
            if (hint.underline) wordContainer.innerHTML += '<span class=\"guess-letter guess-letter-underline\">' + char + '</span>';
            else wordContainer.innerHTML += '<span class=\"guess-letter\">' + char + '</span>';
        }
    });
}
function applyDrawData(drawElements) {
    clear(context);
    drawElements.forEach(function(drawElement) {
        var drawData = drawElement.data;
        if (drawElement.type === "fill") fill(context, drawData.x * scaleDownFactor(), drawData.y * scaleDownFactor(), drawData.color);
        else if (drawElement.type === "line") drawLine(context, drawData.fromX * scaleDownFactor(), drawData.fromY * scaleDownFactor(), drawData.toX * scaleDownFactor(), drawData.toY * scaleDownFactor(), drawData.color, drawData.lineWidth * scaleDownFactor());
        else console.log("Unknown draw element type: " + drawData.type);
    });
}
var isDrawing = false;
var x = 0;
var y = 0;
// asdf
// Touch input
var touchID = 0;
drawingBoard.ontouchstart = function(e) {
    if (!isDrawing && allowDrawing) {
        touchID = e.touches[0].identifier;
        if (allowDrawing && localTool !== 2) {
            // calculate the offset coordinates based on client touch position and drawing board client origin
            var clientRect = drawingBoard.getBoundingClientRect();
            x = e.touches[0].clientX - clientRect.left;
            y = e.touches[0].clientY - clientRect.top;
            isDrawing = true;
        }
    }
};
drawingBoard.ontouchmove = function(e) {
    //FIXME Explanation? Does this prevent moving the page?
    e.preventDefault();
    if (allowDrawing && isDrawing) // find touch with correct ID
    for(var i = e.changedTouches.length - 1; i >= 0; i--)if (e.changedTouches[i].identifier === touchID) {
        var touch = e.changedTouches[i];
        // calculate the offset coordinates based on client touch position and drawing board client origin
        var clientRect = drawingBoard.getBoundingClientRect();
        var offsetX = touch.clientX - clientRect.left;
        var offsetY = touch.clientY - clientRect.top;
        // drawing functions must check for context boundaries
        drawLineAndSendEvent(context, x, y, offsetX, offsetY, localColor, localLineWidth);
        x = offsetX;
        y = offsetY;
        return;
    }
};
drawingBoard.ontouchcancel = function(e) {
    if (isDrawing) // find touch with correct ID
    for(var i = e.changedTouches.length - 1; i >= 0; i--)if (e.changedTouches[i].identifier === touchID) {
        isDrawing = false;
        return;
    }
};
drawingBoard.ontouchend = drawingBoard.ontouchcancel;
// Mouse input
drawingBoard.onmousedown = function(e) {
    if (allowDrawing && e.button === 0 && localTool !== 2) {
        x = e.offsetX;
        y = e.offsetY;
        isDrawing = true;
    }
    return false;
};
// This is executed even if the mouse is not above the browser anymore.
window.onmouseup = function(e) {
    if (isDrawing === true) isDrawing = false;
};
drawingBoard.onmousemove = function(e) {
    if (allowDrawing && isDrawing === true && e.button === 0) {
        // calculate the offset coordinates based on client mouse position and drawing board client origin
        var clientRect = drawingBoard.getBoundingClientRect();
        var offsetX = e.clientX - clientRect.left;
        var offsetY = e.clientY - clientRect.top;
        // drawing functions must check for context boundaries
        drawLineAndSendEvent(context, x, y, offsetX, offsetY, localColor, localLineWidth);
        x = offsetX;
        y = offsetY;
    }
};
// necessary for mousemove to not use the previous exit coordinates.
drawingBoard.onmouseenter = function(e) {
    x = e.offsetX;
    y = e.offsetY;
};
drawingBoard.onclick = function(e) {
    if (allowDrawing && e.button === 0) {
        if (localTool === 2) fillAndSendEvent(context, e.offsetX, e.offsetY, localColor);
        else drawLineAndSendEvent(context, e.offsetX, e.offsetY, e.offsetX, e.offsetY, localColor, localLineWidth);
        isDrawing = false;
    }
};
function clear(context1) {
    context1.fillStyle = "#FFFFFF";
    context1.fillRect(0, 0, drawingBoard.width, drawingBoard.height);
}
function fill(context1, x1, y1, color) {
    context1.fillStyle = color;
    //There seems to be some bug where setting the tolerance to 0 causes a freeze when painting black on white.
    context1.fillFlood(x1, y1, 1);
}
function drawLine(context1, x1, y1, x2, y2, color, lineWidth) {
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
    var circleMap = generateCircleMap(Math.floor(lineWidth / 2));
    var offset = Math.floor(circleMap.length / 2);
    var imageData = context1.getImageData(0, 0, context1.canvas.clientWidth, context1.canvas.clientHeight);
    for(var ix = 0; ix < circleMap.length; ix++)for(var iy = 0; iy < circleMap[ix].length; iy++)if (circleMap[ix][iy] === 1 || x1 === x2 && y1 === y2 && circleMap[ix][iy] === 2) {
        var newX1 = x1 + ix - offset;
        var newY1 = y1 + iy - offset;
        var newX2 = x2 + ix - offset;
        var newY2 = y2 + iy - offset;
        drawBresenhamLine(imageData, newX1, newY1, newX2, newY2, color);
    }
    context1.putImageData(imageData, 0, 0);
}
function drawBresenhamLine(imageData, x0, y0, x1, y1, color) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var err = dx - dy;
    while(true){
        //check if pixel is inside the canvas
        if (x0 < 0 || x0 >= imageData.width || y0 < 0 || y0 >= imageData.height) return;
        setPixel(imageData, x0, y0, color);
        if (x0 === x1 && y0 === y1) break;
        var e2 = 2 * err;
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
    var circleData = [];
    for(x = 0; x < 2 * radius; x++){
        circleData[x] = [];
        for(y = 0; y < 2 * radius; y++){
            var distanceToRadius = Math.sqrt(Math.pow(radius - x, 2) + Math.pow(radius - y, 2));
            if (distanceToRadius > radius) circleData[x][y] = 0;
            else if (distanceToRadius < radius - 2) //optimize for performance: fill circle only when mouse was not moved
            circleData[x][y] = 2;
            else circleData[x][y] = 1;
        }
    }
    return circleData;
}
function setPixel(imageData, x1, y1, color) {
    var offset = (y1 * imageData.width + x1) * 4;
    imageData.data[offset] = color[0];
    imageData.data[offset + 1] = color[1];
    imageData.data[offset + 2] = color[2];
    imageData.data[offset + 3] = color[3];
}
//Call intially to correct initial state
handleCanvasResize();
window.addEventListener("resize", handleCanvasResize, false);
