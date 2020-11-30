
export const playerContainer = document.getElementById("player-container");
export const wordContainer = document.getElementById("word-container");
export const roundsSpan = document.getElementById("rounds");

export const timeLeft = document.getElementById("time-left");
export const drawingBoard = document.getElementById("drawing-board");

export const startDialog = document.getElementById("start-dialog");
export const startDialogWaiting = document.getElementById("start-dialog-waiting");

export const startGameButton = document.getElementById('start-game-button')

export const wordDialog = document.getElementById("word-dialog");
export const wordButtonZero = document.getElementById("word-button-zero");
export const wordButtonOne = document.getElementById("word-button-one");
export const wordButtonTwo = document.getElementById("word-button-two");
export const scoreDialog = document.getElementById("score-dialog");


export const scaleUpFactor = () => window.baseWidth / drawingBoard.clientWidth;
export const scaleDownFactor = () => drawingBoard.clientWidth / window.baseWidth;
export const scaleDown = (...vars) => vars.map(x => x * scaleDownFactor())

export const messageContainer = document.getElementById("message-container");
export const messageInput = document.getElementById("message-input");
export const messageForm = document.getElementById('message-form')

export const colorPicker = document.getElementById("color-picker");
export const centerDialog = document.getElementById("center-dialog");
export const chat = document.getElementById("chat");


export const eraseTool = document.getElementById('erase-tool')
export const clearTool = document.getElementById('clear-tool')
export const drawTool = document.getElementById('draw-tool')
export const fillTool = document.getElementById('fill-tool')
export const undoTool = document.getElementById('undo-tool')

export const smallCircle = document.getElementById('small-circle')
export const mediumCircle = document.getElementById('medium-circle')
export const hugeCircle = document.getElementById('huge-circle')

import { SMALL_CIRCLE, MEDIUM_CIRCLE, HUGE_CIRCLE, PEN, RUBBER, FILL_BUCKET } from "./constants";

export const selectCircle = index => {
    smallCircle.className = index == SMALL_CIRCLE ? 'active' : ''
    mediumCircle.className = index == MEDIUM_CIRCLE ? 'active' : ''
    hugeCircle.className = index == HUGE_CIRCLE ? 'active' : ''
} 
export const selectTool = index => {
    drawTool.className = index == PEN ? 'draw active' : 'draw'
    eraseTool.className = index == RUBBER ? 'erase active' : 'erase'
    fillTool.className = index == FILL_BUCKET ? 'fill active' : 'fill'
}

export function showDialog(dialog) {
    centerDialog.style.display = "block"
    startDialog.style.display = "none"
    wordDialog.style.display = "none"
    scoreDialog.style.display = "none"
    
    dialog.style.display = "block"
}

export const hideDialog = () => {
    centerDialog.style.display = "none"
    startDialog.style.display = "none"
    wordDialog.style.display = "none"
    scoreDialog.style.display = "none"
}
export function applyPlayers(players, ownID) {
    
    playerContainer.innerHTML = "";
    Object.keys(players).forEach(function (key) {
        let player = players[key]
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
            // '<span class="last-turn-score">(Last turn: ' + player.lastScore + ')</span>' +
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

export function applyRounds(round, maxRound) {
    roundsSpan.innerText = 'Round ' + round + ' of ' + maxRound;
}

export function applyWordHints(wordHints) {
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

export function applyMessage(styleClass, author, message) {
    console.log("message", author, message)
}