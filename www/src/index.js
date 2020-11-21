import * as canvas from './canvas'
import * as audio from './audio'

import { PEN, RUBBER, FILL_BUCKET } from './constants';
import gameState from './game-state'

import Socket from './socket.js';
window.socket = new Socket()

import {
    hexToRgb,
    hexToRgbStr,
    contrastShade,
} from './util.js'
import { registerCircles } from './components/tools';
import { setLineWidthAction, drawAction, fillAction, chooseWordAction, chooseToolAction, clearAction, setColorAction } from './actions';



const playerContainer = document.getElementById("player-container");
const wordContainer = document.getElementById("word-container");
const roundsSpan = document.getElementById("rounds");

const timeLeft = document.getElementById("time-left");
const drawingBoard = document.getElementById("drawing-board");
const startDialog = document.getElementById("start-dialog");

const wordDialog = document.getElementById("word-dialog");
const wordButtonZero = document.getElementById("word-button-zero");
const wordButtonOne = document.getElementById("word-button-one");
const wordButtonTwo = document.getElementById("word-button-two");


function handleCanvasResize() {
    drawingBoard.width = drawingBoard.clientWidth;
    drawingBoard.height = drawingBoard.clientHeight;
    setLineWidthAction(gameState.state.localLineWidthUnscaled);
}

canvas.setContext(drawingBoard.getContext("2d"))


// on set line width
gameState.registerHandler((state, prevState) => {
    const { localLineWidth, localColor } = state
    if (localLineWidth == prevState.localLineWidth
        && localColor == prevState.localColor) {
        return
    }
    let cursorColor;
    let borderColor = "#FFFFFF";
    if (localColor.startsWith("#")) {
        cursorColor = hexToRgbStr(localColor);
        borderColor = contrastShade(hexToRgb(localColor))
    } else {
        cursorColor = localColor;
    }

    console.log(cursorColor, borderColor)

    let circleSize = localLineWidth * canvas.scaleUpFactor();

    // document.documentElement.style.setProperty('--color', value);


    document.getElementById('draw-tool').style.backgroundColor = cursorColor
    document.getElementById('fill-tool').style.backgroundColor = cursorColor

    drawingBoard.style.cursor = `url('data:image/svg+xml;utf8,
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                version="1.1" 
                width="${circleSize + 2}"
                height="${circleSize + 2}">
                    <circle 
                        cx="${circleSize / 2}" 
                        cy="${circleSize / 2}" 
                        r="${circleSize / 2}" 
                        fill="${cursorColor}" 
                        stroke="${borderColor}"
                        />
            </svg>
        ') ${circleSize / 2} ${circleSize / 2}, auto`;
})


socket.addHandler("ready", (pkt) => {
    let ready = pkt.data;

    gameState.setState({
        ownerID: ready.ownerId,
        allowDrawing: ready.drawing,
        ownID: ready.playerId,
        maxRounds: ready.maxRounds,
        roundEndTime: ready.roundEndTime,
    })
    applyRounds(ready.round, ready.maxRounds);

    if (ready.round === 0 && ready.ownerId === ready.playerId) {
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
    audio.plop()
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
    canvas.drawLine(
        ...canvas.scaleDown(pkt.data.fromX, pkt.data.fromY, pkt.data.toX, pkt.data.toY),
        pkt.data.color,
        canvas.scaleDown(pkt.data.lineWidth)[0]
    );
})
socket.addHandler("fill", (pkt) => {
    canvas.fill(...canvas.scaleDown(pkt.data.x, pkt.data.y), pkt.data.color);
})
socket.addHandler("clear-drawing-board", (pkt) => {
    canvas.clear()
})
socket.addHandler("next-turn", (pkt) => {
    $("#cc-toolbox").css({ 'transform': 'translateX(-150%)' });
    $("#player-container").css({ 'transform': 'translateX(0)' });
    //If a player doesn't choose, the dialog will still be up.
    wordDialog.style.display = "none";
    audio.endTurn()

    canvas.clear();

    applyRounds(pkt.data.round, gameState.state.maxRounds);
    applyPlayers(pkt.data.players);

    //We clear this, since there's no word chosen right now.
    wordContainer.innerHTML = "";

    gameState.setState({
        roundEndTime: pkt.data.roundEndTime,
        allowDrawing: false
    })
})
socket.addHandler("your-turn", (pkt) => {
    audio.yourTurn()
    wordButtonZero.textContent = pkt.data[0];
    wordButtonOne.textContent = pkt.data[1];
    wordButtonTwo.textContent = pkt.data[2];
    wordDialog.style.display = "block";
    show("#word-dialog")
    $("#cc-toolbox").css({ 'transform': 'translateX(0)' });
    $("#player-container").css({ 'transform': 'translateX(-150%)' });
})


window.setInterval(function () {
    let secondsLeft = Math.floor((gameState.state.roundEndTime - (new Date().getTime())) / 1000);
    if (secondsLeft >= 0) {
        timeLeft.innerText = secondsLeft;
    } else {
        timeLeft.innerText = "∞";
    }
}, 500);


// <div class="playerBox">
//         <img src="../resources/image/avatar_phillip.png" alt="">
//         <div class="playerName self">james</div>
//         <div class="playerScore">0</div>
//     </div> 
function applyPlayers(players) {
    const ownID = gameState.state.ownID
    playerContainer.innerHTML = "";
    players.forEach(function (player) {
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
    canvas.clear();
    drawElements.forEach(function (drawElement) {
        let drawData = drawElement.data;
        if (drawElement.type === "fill") {
            canvas.fill(...canvas.scaleDown(drawData.x, drawData.y), drawData.color);
        } else if (drawElement.type === "line") {
            canvas.drawLine(
                ...canvas.scaleDown(
                    drawData.fromX,
                    drawData.fromY,
                    drawData.toX,
                    drawData.toY,
                ),
                drawData.color,
                canvas.scaleDown(drawData.lineWidth)[0]
            );
        } else {
            console.log("Unknown draw element type: " + drawData.type)
        }
    });
}

let cursorDrawing = false;
let cursorX = 0;
let cursorY = 0;

// Touch input
let touchID = 0;

drawingBoard.ontouchstart = function (e) {
    const { allowDrawing, localTool } = gameState.state

    if (!cursorDrawing && allowDrawing) {
        touchID = e.touches[0].identifier;

        if (allowDrawing && localTool !== 2) {
            // calculate the offset coordinates based on client touch position and drawing board client origin
            let clientRect = drawingBoard.getBoundingClientRect();
            cursorX = (e.touches[0].clientX - clientRect.left);
            cursorY = (e.touches[0].clientY - clientRect.top);

            cursorDrawing = true;
        }
    }
};

drawingBoard.ontouchmove = function (e) {
    const { allowDrawing } = gameState.state
    //FIXME Explanation? Does this prevent moving the page?
    e.preventDefault();

    if (allowDrawing && cursorDrawing) {
        // find touch with correct ID
        for (let i = e.changedTouches.length - 1; i >= 0; i--) {
            if (e.changedTouches[i].identifier === touchID) {
                let touch = e.changedTouches[i];

                // calculate the offset coordinates based on client touch position and drawing board client origin
                let clientRect = drawingBoard.getBoundingClientRect();
                let offsetX = (touch.clientX - clientRect.left);
                let offsetY = (touch.clientY - clientRect.top);

                // drawing functions must check for context boundaries
                drawAction(cursorX, cursorY, offsetX, offsetY);
                cursorX = offsetX;
                cursorY = offsetY;

                return;
            }
        }
    }
};

drawingBoard.ontouchcancel = function (e) {
    if (cursorDrawing) {
        // find touch with correct ID
        for (let i = e.changedTouches.length - 1; i >= 0; i--) {
            if (e.changedTouches[i].identifier === touchID) {
                cursorDrawing = false;
                return;
            }
        }
    }
}
drawingBoard.ontouchend = drawingBoard.ontouchcancel

// Mouse input
drawingBoard.onmousedown = function (e) {
    const { allowDrawing, localTool } = gameState.state

    if (allowDrawing && e.button === 0 && localTool !== 2) {
        cursorX = e.offsetX;
        cursorY = e.offsetY;

        cursorDrawing = true;
    }

    return false;
};

// This is executed even if the mouse is not above the browser anymore.
window.onmouseup = function (e) {
    if (cursorDrawing === true) {
        cursorDrawing = false;
    }
};

drawingBoard.onmousemove = function (e) {
    const { allowDrawing } = gameState.state

    if (allowDrawing && cursorDrawing === true && e.button === 0) {
        // calculate the offset coordinates based on client mouse position and drawing board client origin
        let clientRect = drawingBoard.getBoundingClientRect();
        let offsetX = (e.clientX - clientRect.left);
        let offsetY = (e.clientY - clientRect.top);

        // drawing functions must check for context boundaries
        drawAction(cursorX, cursorY, offsetX, offsetY);
        cursorX = offsetX;
        cursorY = offsetY;
    }
};

// necessary for mousemove to not use the previous exit coordinates.
drawingBoard.onmouseenter = function (e) {
    cursorX = e.offsetX;
    cursorY = e.offsetY;
};

drawingBoard.onclick = function (e) {
    const { allowDrawing, localTool } = gameState.state

    if (allowDrawing && e.button === 0) {
        if (localTool === 2) {
            fillAction(e.offsetX, e.offsetY)
        } else {
            drawAction(e.offsetX, e.offsetY, e.offsetX, e.offsetY);
        }
        cursorDrawing = false;
    }
};

//Call intially to correct initial state
handleCanvasResize();
window.addEventListener("resize", handleCanvasResize, false);

function startGame() {
    socket.sendStart()
    //Tas: not needed
    //startDialog.style.display = "hidden";
    hide("#start-dialog");
    show("#word-dialog");
    wordDialog.style.display = "block";
}


// bind onclicks here because html function calling on window scope is annoying.
document.getElementById('start-game-button').onclick = e => startGame()

document.getElementById('word-button-zero').onclick = e => chooseWordAction(0)
document.getElementById('word-button-one').onclick = e => chooseWordAction(1)
document.getElementById('word-button-two').onclick = e => chooseWordAction(2)

document.getElementById('draw-tool').onclick = e => chooseToolAction(PEN)
document.getElementById('fill-tool').onclick = e => chooseToolAction(FILL_BUCKET)
document.getElementById('erase-tool').onclick = e => chooseToolAction(RUBBER)
document.getElementById('clear-tool').onclick = e => clearAction()

document.getElementById('color-picker').onchange = setColorAction
document.getElementById('message-form').onsubmit = e => { e.preventDefault(); sendMessage() };

Array.from(document.getElementsByClassName('color-button')).forEach(
    el => {
        el.onclick = e => setColorAction(e.target.style.backgroundColor)
    }
)

registerCircles()

setLineWidthAction(5);

socket.open()
