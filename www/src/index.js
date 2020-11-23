import * as canvas from './canvas'
import * as audio from './audio'
import * as elements from './elements'

import gameState from './game-state'
import socket from './socket.js';

import { registerMessages} from './components/messages'
import { registerCircles, registerTools } from './components/tools';
import { registerOverlay } from './components/overlay';


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
        elements.startDialog.style.display = "block";
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
    messages.applyMessage("", pkt.data.author, pkt.data.content);
})
socket.addHandler("system-message", (pkt) => {
    messages.applyMessage("system-message", "System", pkt.data);
})
socket.addHandler("non-guessing-player-message", (pkt) => {
    messages.applyMessage("non-guessing-player-message", pkt.data.author, pkt.data.content);
})
socket.addHandler("persist-username", (pkt) => {
    document.cookie = "username=" + pkt.data + ";expires=Tue, 19 Jan 2038 00:00:00 UTC;path=/;samesite=strict";
})
socket.addHandler("reset-username", (pkt) => {
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
})
socket.addHandler("line", (pkt) => {
    canvas.drawLine(
        ...elements.scaleDown(pkt.data.fromX, pkt.data.fromY, pkt.data.toX, pkt.data.toY),
        pkt.data.color,
        elements.scaleDown(pkt.data.lineWidth)[0]
    );
})
socket.addHandler("fill", (pkt) => {
    canvas.fill(...elements.scaleDown(pkt.data.x, pkt.data.y), pkt.data.color);
})
socket.addHandler("clear-drawing-board", (pkt) => {
    canvas.clear()
})
socket.addHandler("next-turn", (pkt) => {
    $("#cc-toolbox").css({ 'transform': 'translateX(-150%)' });
    $("#player-container").css({ 'transform': 'translateX(0)' });
    //If a player doesn't choose, the dialog will still be up.
    elements.wordDialog.style.display = "none";
    audio.endTurn()

    canvas.clear();

    applyRounds(pkt.data.round, gameState.state.maxRounds);
    applyPlayers(pkt.data.players);

    //We clear this, since there's no word chosen right now.
    elements.wordContainer.innerHTML = "";

    gameState.setState({
        roundEndTime: pkt.data.roundEndTime,
        allowDrawing: false
    })
})
socket.addHandler("your-turn", (pkt) => {
    audio.yourTurn()
    elements.wordButtonZero.textContent = pkt.data[0];
    elements.wordButtonOne.textContent = pkt.data[1];
    elements.wordButtonTwo.textContent = pkt.data[2];
    elements.wordDialog.style.display = "block";
    show("#word-dialog")
    $("#cc-toolbox").css({ 'transform': 'translateX(0)' });
    $("#player-container").css({ 'transform': 'translateX(-150%)' });
})


window.setInterval(function () {
    let secondsLeft = Math.floor((gameState.state.roundEndTime - (new Date().getTime())) / 1000);
    if (secondsLeft >= 0) {
        elements.timeLeft.innerText = secondsLeft;
    } else {
        elements.timeLeft.innerText = "∞";
    }
}, 500);


// <div class="playerBox">
//         <img src="../resources/image/avatar_phillip.png" alt="">
//         <div class="playerName self">james</div>
//         <div class="playerScore">0</div>
//     </div> 
function applyPlayers(players) {
    const ownID = gameState.state.ownID
    elements.playerContainer.innerHTML = "";
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
        elements.playerContainer.appendChild(newPlayer);

    });
}

function applyRounds(round, maxRound) {
    elements.roundsSpan.innerText = 'Round ' + round + ' of ' + maxRound;
}

function applyWordHints(wordHints) {
    elements.wordContainer.innerHTML = "";
    //If no hint has been revealed
    wordHints.forEach(function (hint) {
        if (hint.character === 0) {
            elements.wordContainer.innerHTML += '<span class="guess-letter guess-letter-underline">&nbsp;</span>';
        } else {
            let char = String.fromCharCode(hint.character);
            if (hint.underline) {
                elements.wordContainer.innerHTML += '<span class="guess-letter guess-letter-underline">' + char + '</span>'
            } else {
                elements.wordContainer.innerHTML += '<span class="guess-letter">' + char + '</span>';
            }
        }
    });
}

function applyDrawData(drawElements) {
    canvas.clear();
    drawElements.forEach(function (drawElement) {
        let drawData = drawElement.data;
        if (drawElement.type === "fill") {
            canvas.fill(...elements.scaleDown(drawData.x, drawData.y), drawData.color);
        } else if (drawElement.type === "line") {
            canvas.drawLine(
                ...elements.scaleDown(
                    drawData.fromX,
                    drawData.fromY,
                    drawData.toX,
                    drawData.toY,
                ),
                drawData.color,
                elements.scaleDown(drawData.lineWidth)[0]
            );
        } else {
            console.log("Unknown draw element type: " + drawData.type)
        }
    });
}

export function applyMessage(styleClass, author, message) {
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

registerOverlay()
registerCircles()
registerTools()
registerMessages()

socket.open()
