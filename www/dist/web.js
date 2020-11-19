function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
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
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {
        };
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
function rgbStr2hex(rgb) {
    var hex = function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    };
    if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function hexToRgbStr(hex) {
    var color = hexToRgb(hex);
    return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
}
function contrastShade(colorObj) {
    var hsp = Math.sqrt(0.299 * (colorObj.r * colorObj.r) + 0.587 * (colorObj.g * colorObj.g) + 0.114 * (colorObj.b * colorObj.b));
    if (hsp > 127.5) borderColor = "rgb(0,0,0)";
    else borderColor = "rgb(255,255,255)";
    return borderColor;
}
var context = null;
function setContext(_context) {
    context = _context;
}
function clear() {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, drawingBoard.width, drawingBoard.height);
}
function fill(x1, y1, color) {
    context.fillStyle = color;
    //There seems to be some bug where setting the tolerance to 0 causes a freeze when painting black on white.
    context.fillFlood(x1, y1, 1);
}
function drawLine(x1, y1, x2, y2, color, lineWidth) {
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
    var imageData = context.getImageData(0, 0, context.canvas.clientWidth, context.canvas.clientHeight);
    for(var ix = 0; ix < circleMap.length; ix++)for(var iy = 0; iy < circleMap[ix].length; iy++)if (circleMap[ix][iy] === 1 || x1 === x2 && y1 === y2 && circleMap[ix][iy] === 2) {
        var newX1 = x1 + ix - offset;
        var newY1 = y1 + iy - offset;
        var newX2 = x2 + ix - offset;
        var newY2 = y2 + iy - offset;
        drawBresenhamLine(imageData, newX1, newY1, newX2, newY2, color);
    }
    context.putImageData(imageData, 0, 0);
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
function setPixel(imageData, x, y, color) {
    var offset = (y * imageData.width + x) * 4;
    imageData.data[offset] = color[0];
    imageData.data[offset + 1] = color[1];
    imageData.data[offset + 2] = color[2];
    imageData.data[offset + 3] = color[3];
}
function playWav(file) {
    var audio = new Audio(file);
    audio.type = 'audio/wav';
    audio.play();
}
var plop = function() {
    return playWav('/resources/plop.wav');
};
var yourTurn = function() {
    return playWav('/resources/your-turn.wav');
};
var endTurn = function() {
    return playWav('/resources/end-turn.wav');
};
var Socket = function() {
    "use strict";
    function Socket() {
        _classCallCheck(this, Socket);
        _defineProperty(this, "handlers", {
        });
        // let wsURL(location.protocol === 'https:' ? "wss://" : "ws://") + location.hostname + ":" + location.port + "/v1/ws?lobby_id=" + window.lobbyId
        var wsURL = "ws://" + location.hostname + ":" + location.port + "/v1/ws?lobby_id=" + window.lobbyId;
        this.socket = new ReconnectingWebSocket(wsURL, null, {
            debug: true,
            reconnectInterval: 3000,
            automaticOpen: false
        });
        this.socket.onmessage = (function(e) {
            var parsed = JSON.parse(e.data);
            if (typeof this.handlers[parsed.type] == 'undefined') {
                console.error("socket received unknown message type " + parsed.type);
                return;
            }
            this.handlers[parsed.type](parsed);
        }).bind(this);
        this.socket.onerror = function(err) {
            return console.error("websocket error: ", err);
        };
    }
    _createClass(Socket, [
        {
            key: "open",
            value: function open() {
                this.socket.open();
            }
        },
        {
            key: "addHandler",
            value: function addHandler(type, fn) {
                this.handlers[type] = fn;
            }
        },
        {
            key: "sendStart",
            value: function sendStart() {
                this.socket.send(JSON.stringify({
                    type: "start"
                }));
            }
        },
        {
            key: "sendClear",
            value: function sendClear() {
                this.socket.send(JSON.stringify({
                    type: "clear-drawing-board"
                }));
            }
        },
        {
            key: "sendMessage",
            value: function sendMessage(text) {
                this.socket.send(JSON.stringify({
                    type: "message",
                    data: text
                }));
            }
        },
        {
            key: "sendChooseWord",
            value: function sendChooseWord(index) {
                this.socket.send(JSON.stringify({
                    type: "choose-word",
                    data: index
                }));
            }
        },
        {
            key: "sendKickVote",
            value: function sendKickVote(playerId) {
                this.socket.send(JSON.stringify({
                    type: "kick-vote",
                    data: playerId
                }));
            }
        },
        {
            key: "sendFill",
            value: function sendFill(x, y, color) {
                this.socket.send(JSON.stringify({
                    type: "fill",
                    data: {
                        x: x,
                        y: y,
                        color: color
                    }
                }));
            }
        },
        {
            key: "sendLine",
            value: function sendLine(x1, y1, x2, y2, color, lineWidth) {
                var drawInstruction;
                this.socket.send(JSON.stringify({
                    type: "line",
                    data: {
                        fromX: x1,
                        fromY: y1,
                        toX: x2,
                        toY: y2,
                        color: color,
                        lineWidth: lineWidth
                    }
                }));
            }
        }
    ]);
    return Socket;
}();
var PEN = 0;
var RUBBER = 1;
var FILL_BUCKET = 2;
var GameState = function() {
    "use strict";
    function GameState() {
        _classCallCheck(this, GameState);
        _defineProperty(this, "state", {
            allowDrawing: false,
            localColor: "#000000",
            localLineWidth: 0,
            localLineWidthUnscaled: 0,
            localTool: PEN,
            ownID: null,
            ownerID: null,
            maxRounds: 0,
            roundEndTime: 0
        });
        _defineProperty(this, "handlers", []);
        _defineProperty(this, "_updating", false);
    }
    _createClass(GameState, [
        {
            key: "setState",
            value: function setState(state) {
                if (this._updating) {
                    console.error("cannot set state in state handlers");
                    return;
                }
                this._updating = true;
                try {
                    var prevState = _objectSpread({
                    }, this.state);
                    this.state = _objectSpread({
                    }, this.state, state);
                    this._propagate(prevState);
                } catch (e) {
                    console.error(e);
                }
                this._updating = false;
            }
        },
        {
            key: "_propagate",
            value: function _propagate(prevState) {
                this.handlers.map((function(fn) {
                    return fn(this.state, prevState);
                }).bind(this));
            }
        },
        {
            key: "registerHandler",
            value: function registerHandler(fn) {
                this.handlers.push(fn);
                return function unregisterHandler() {
                    this.handlers.filter(function(v) {
                        return v != fn;
                    });
                };
            }
        },
        {
            key: "reset",
            value: function reset() {
                var prevState = _objectSpread({
                }, this.state);
                this.state = {
                };
                this.handlers = [];
                this._propagate(prevState);
            }
        }
    ]);
    return GameState;
}();
var gameState = new GameState();
var playerContainer = document.getElementById("player-container");
var wordContainer = document.getElementById("word-container");
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
var socket = new Socket();
function clearAction() {
    //Avoid unnecessary traffic back to us.
    clear();
    socket.sendClear();
}
function chooseWordAction(index) {
    socket.sendChooseWord(index);
    hide("#word-dialog");
    wordDialog.style.display = "none";
    $("#cc-toolbox").css({
        'transform': 'translateX(0)'
    });
    $("#player-container").css({
        'transform': 'translateX(-150%)'
    });
    gameState.setState({
        allowDrawing: true
    });
}
function fillAction(x, y) {
    fill(x, y, gameState.state.color);
    var _x;
    var _y;
    socket.sendFill(x * scaleUpFactor(), y * scaleUpFactor(), gameState.state.color);
}
function drawAction(x1, y1, x2, y2) {
    if (gameState.state.localTool === RUBBER) color = "#ffffff";
    drawLine(x1, y1, x2, y2, gameState.state.localColor, gameState.state.localLineWidth);
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
    setLineWidthAction(gameState.state.localLineWidthUnscaled);
}
setContext(drawingBoard.getContext("2d"));
var scaleUpFactor = function() {
    return window.baseWidth / drawingBoard.clientWidth;
};
var scaleDownFactor = function() {
    return drawingBoard.clientWidth / window.baseWidth;
};
function setColorAction(value) {
    var localColor;
    if (value === undefined) localColor = colorPicker.value;
    else {
        value = rgbStr2hex(value);
        colorPicker.value = value;
        localColor = value;
    }
    gameState.setState({
        localColor: localColor
    });
    document.documentElement.style.setProperty('--color', value);
}
function setLineWidthAction(value) {
    gameState.setState({
        localLineWidthUnscaled: value,
        localLineWidth: value * scaleDownFactor()
    });
}
function chooseToolAction(value) {
    if (value === PEN || value === RUBBER || value === FILL_BUCKET) gameState.setState({
        localTool: value
    });
}
// on set line width
gameState.registerHandler(function(state, prevState) {
    if (state.localLineWidth == prevState.localLineWidth) return;
    var cursorColor;
    var borderColor = "#FFFFFF";
    if (state.localColor.startsWith("#")) {
        cursorColor = hexToRgbStr(state.localColor);
        borderColor = contrastShade(hexToRgb(state.localColor));
    } else cursorColor = state.localColor;
    var circleSize = state.localLineWidth * scaleUpFactor();
    drawingBoard.style.cursor = "url(\'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + (circleSize + 2) + "\" height=\"" + (circleSize + 2) + "\"><circle cx=\"" + circleSize / 2 + "\" cy=\"" + circleSize / 2 + "\" r=\"" + circleSize / 2 + "\" style=\"fill: " + cursorColor + "; stroke: " + borderColor + ";\"/></svg>\') " + circleSize / 2 + " " + circleSize / 2 + ", auto";
});
socket.addHandler("ready", function(pkt) {
    var ready = pkt.data;
    gameState.setState({
        ownerID: ready.ownerId,
        allowDrawing: ready.drawing,
        ownID: ready.playerId,
        maxRounds: ready.maxRounds,
        roundEndTime: ready.roundEndTime
    });
    applyRounds(ready.round, ready.maxRounds);
    if (ready.round === 0 && ready.ownerId === ready.playerId) {
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
    plop();
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
    drawLine(pkt.data.fromX * scaleDownFactor(), pkt.data.fromY * scaleDownFactor(), pkt.data.toX * scaleDownFactor(), pkt.data.toY * scaleDownFactor(), pkt.data.color, pkt.data.lineWidth * scaleDownFactor());
});
socket.addHandler("fill", function(pkt) {
    fill(pkt.data.x * scaleDownFactor(), pkt.data.y * scaleDownFactor(), pkt.data.color);
});
socket.addHandler("clear-drawing-board", function(pkt) {
    clear();
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
    endTurn();
    clear();
    applyRounds(pkt.data.round, gameState.state.maxRounds);
    applyPlayers(pkt.data.players);
    //We clear this, since there's no word chosen right now.
    wordContainer.innerHTML = "";
    gameState.setState({
        roundEndTime: pkt.data.roundEndTime,
        allowDrawing: false
    });
});
socket.addHandler("your-turn", function(pkt) {
    yourTurn();
    wordButtonZero.textContent = pkt.data[0];
    wordButtonOne.textContent = pkt.data[1];
    wordButtonTwo.textContent = pkt.data[2];
    wordDialog.style.display = "block";
    show("#word-dialog");
    $("#cc-toolbox").css({
        'transform': 'translateX(0)'
    });
    $("#player-container").css({
        'transform': 'translateX(-150%)'
    });
});
window.setInterval(function() {
    var secondsLeft = Math.floor((gameState.state.roundEndTime - new Date().getTime()) / 1000);
    if (secondsLeft >= 0) timeLeft.innerText = secondsLeft;
    else timeLeft.innerText = "\u{221e}";
}, 500);
// <div class="playerBox">
//         <img src="../resources/image/avatar_phillip.png" alt="">
//         <div class="playerName self">james</div>
//         <div class="playerScore">0</div>
//     </div> 
function applyPlayers(players) {
    var ownID = gameState.state.ownID;
    playerContainer.innerHTML = "";
    players.forEach(function(player) {
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
    clear();
    drawElements.forEach(function(drawElement) {
        var drawData = drawElement.data;
        if (drawElement.type === "fill") fill(drawData.x * scaleDownFactor(), drawData.y * scaleDownFactor(), drawData.color);
        else if (drawElement.type === "line") drawLine(drawData.fromX * scaleDownFactor(), drawData.fromY * scaleDownFactor(), drawData.toX * scaleDownFactor(), drawData.toY * scaleDownFactor(), drawData.color, drawData.lineWidth * scaleDownFactor());
        else console.log("Unknown draw element type: " + drawData.type);
    });
}
var cursorDrawing = false;
var cursorX = 0;
var cursorY = 0;
// Touch input
var touchID = 0;
drawingBoard.ontouchstart = function(e) {
    var _state = gameState.state, allowDrawing = _state.allowDrawing, localTool = _state.localTool;
    if (!cursorDrawing && allowDrawing) {
        touchID = e.touches[0].identifier;
        if (allowDrawing && localTool !== 2) {
            // calculate the offset coordinates based on client touch position and drawing board client origin
            var clientRect = drawingBoard.getBoundingClientRect();
            cursorX = e.touches[0].clientX - clientRect.left;
            cursorY = e.touches[0].clientY - clientRect.top;
            cursorDrawing = true;
        }
    }
};
drawingBoard.ontouchmove = function(e) {
    var _state = gameState.state, allowDrawing = _state.allowDrawing;
    //FIXME Explanation? Does this prevent moving the page?
    e.preventDefault();
    if (allowDrawing && cursorDrawing) // find touch with correct ID
    for(var i = e.changedTouches.length - 1; i >= 0; i--)if (e.changedTouches[i].identifier === touchID) {
        var touch = e.changedTouches[i];
        // calculate the offset coordinates based on client touch position and drawing board client origin
        var clientRect = drawingBoard.getBoundingClientRect();
        var offsetX = touch.clientX - clientRect.left;
        var offsetY = touch.clientY - clientRect.top;
        // drawing functions must check for context boundaries
        drawAction(cursorX, cursorY, offsetX, offsetY);
        cursorX = offsetX;
        cursorY = offsetY;
        return;
    }
};
drawingBoard.ontouchcancel = function(e) {
    if (cursorDrawing) // find touch with correct ID
    for(var i = e.changedTouches.length - 1; i >= 0; i--)if (e.changedTouches[i].identifier === touchID) {
        cursorDrawing = false;
        return;
    }
};
drawingBoard.ontouchend = drawingBoard.ontouchcancel;
// Mouse input
drawingBoard.onmousedown = function(e) {
    var _state = gameState.state, allowDrawing = _state.allowDrawing, localTool = _state.localTool;
    if (allowDrawing && e.button === 0 && localTool !== 2) {
        cursorX = e.offsetX;
        cursorY = e.offsetY;
        cursorDrawing = true;
    }
    return false;
};
// This is executed even if the mouse is not above the browser anymore.
window.onmouseup = function(e) {
    if (cursorDrawing === true) cursorDrawing = false;
};
drawingBoard.onmousemove = function(e) {
    var _state = gameState.state, allowDrawing = _state.allowDrawing;
    if (allowDrawing && cursorDrawing === true && e.button === 0) {
        // calculate the offset coordinates based on client mouse position and drawing board client origin
        var clientRect = drawingBoard.getBoundingClientRect();
        var offsetX = e.clientX - clientRect.left;
        var offsetY = e.clientY - clientRect.top;
        // drawing functions must check for context boundaries
        drawAction(cursorX, cursorY, offsetX, offsetY);
        cursorX = offsetX;
        cursorY = offsetY;
    }
};
// necessary for mousemove to not use the previous exit coordinates.
drawingBoard.onmouseenter = function(e) {
    cursorX = e.offsetX;
    cursorY = e.offsetY;
};
drawingBoard.onclick = function(e) {
    var _state = gameState.state, allowDrawing = _state.allowDrawing, localTool = _state.localTool;
    if (allowDrawing && e.button === 0) {
        if (localTool === 2) fillAction(e.offsetX, e.offsetY);
        else drawAction(e.offsetX, e.offsetY, e.offsetX, e.offsetY);
        cursorDrawing = false;
    }
};
//Call intially to correct initial state
handleCanvasResize();
window.addEventListener("resize", handleCanvasResize, false);
function startGame() {
    socket.sendStart();
    //Tas: not needed
    //startDialog.style.display = "hidden";
    hide("#start-dialog");
    show("#word-dialog");
    wordDialog.style.display = "block";
}
// bind onclicks here because html function calling on window scope is annoying.
document.getElementById('start-game-button').onclick = function(e) {
    return startGame();
};
document.getElementById('word-button-zero').onclick = function(e) {
    return chooseWordAction(0);
};
document.getElementById('word-button-one').onclick = function(e) {
    return chooseWordAction(1);
};
document.getElementById('word-button-two').onclick = function(e) {
    return chooseWordAction(2);
};
document.getElementById('small-circle').onclick = function(e) {
    return setLineWidthAction(15);
};
document.getElementById('medium-circle').onclick = function(e) {
    return setLineWidthAction(30);
};
document.getElementById('huge-circle').onclick = function(e) {
    return setLineWidthAction(40);
};
document.getElementById('draw-tool').onclick = function(e) {
    return chooseToolAction(PEN);
};
document.getElementById('fill-tool').onclick = function(e) {
    return chooseToolAction(FILL_BUCKET);
};
document.getElementById('erase-tool').onclick = function(e) {
    return chooseToolAction(RUBBER);
};
document.getElementById('clear-tool').onclick = function(e) {
    return clearAction();
};
Array.from(document.getElementsByClassName('color-button')).forEach(function(el) {
    el.onclick = function(e) {
        return setColorAction(e.target.style.backgroundColor);
    };
});
setLineWidthAction(5);
socket.open();