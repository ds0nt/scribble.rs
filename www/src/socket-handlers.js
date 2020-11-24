import * as canvas from './canvas'
import * as audio from './lib/audio'
import * as elements from './elements'

import gameState from './lib/game-state'
import socket from './lib/socket';


export function registerSocketHandlers() {

    socket.addHandler("ready", (pkt) => {
        let ready = pkt.data;

        gameState.setState({
            ownerID: ready.ownerId,
            allowDrawing: ready.drawing,
            ownID: ready.playerId,
            maxRounds: ready.maxRounds,
            roundEndTime: ready.roundEndTime,
        })
        elements.applyRounds(ready.round, ready.maxRounds);

        if (ready.round === 0 && ready.ownerId === ready.playerId) {
            show("#start-dialog")
            elements.startDialog.style.display = "block";
        }

        if (ready.players && ready.players.length) {
            elements.applyPlayers(ready.players, gameState.state.ownID)
        }
        if (ready.currentDrawing && ready.currentDrawing.length) {
            canvas.applyDrawData(ready.currentDrawing)
        }
        if (ready.wordHints && ready.wordHints.length) {
            elements.applyWordHints(ready.wordHints)
        }
    })

    socket.addHandler("update-players", (pkt) => {
        elements.applyPlayers(pkt.data, gameState.state.ownID);
    })
    socket.addHandler("correct-guess", (pkt) => {
        audio.plop()
    })
    socket.addHandler("update-wordhint", (pkt) => {
        elements.applyWordHints(pkt.data);
    })
    socket.addHandler("message", (pkt) => {
        elements.applyMessage("", pkt.data.author, pkt.data.content);
    })
    socket.addHandler("system-message", (pkt) => {
        elements.applyMessage("system-message", "System", pkt.data);
    })
    socket.addHandler("non-guessing-player-message", (pkt) => {
        elements.applyMessage("non-guessing-player-message", pkt.data.author, pkt.data.content);
    })
    socket.addHandler("persist-username", (pkt) => {
        document.cookie = "username=" + pkt.data + ";expires=Tue, 19 Jan 2038 00:00:00 UTC;path=/;samesite=strict";
    })
    socket.addHandler("reset-username", (pkt) => {
        document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    })
    socket.addHandler("line", (pkt) => {
        gameState.addPkt(pkt)

        canvas.drawLine(
            ...elements.scaleDown(pkt.data.fromX, pkt.data.fromY, pkt.data.toX, pkt.data.toY),
            pkt.data.color,
            elements.scaleDown(pkt.data.lineWidth)[0]
        );
    })
    socket.addHandler("fill", (pkt) => {
        gameState.addPkt(pkt)

        canvas.fill(...elements.scaleDown(pkt.data.x, pkt.data.y), pkt.data.color);
    })

    socket.addHandler("clear-drawing-board", (pkt) => {
        gameState.setState({ currentDrawing: [] })

        canvas.clear()
    })
    socket.addHandler("undo", (pkt) => {
        gameState.undoDrawing()

        canvas.clear();
        canvas.applyDrawData(gameState.state.currentDrawing)

        canvas.fill(...elements.scaleDown(pkt.data.x, pkt.data.y), pkt.data.color);
    })


    socket.addHandler("next-turn", (pkt) => {
        $("#cc-toolbox").css({ 'transform': 'translateX(-150%)' });
        $("#player-container").css({ 'transform': 'translateX(0)' });
        //If a player doesn't choose, the dialog will still be up.
        elements.wordDialog.style.display = "none";
        audio.endTurn()

        canvas.clear();
        gameState.clearDrawing()

        elements.applyRounds(pkt.data.round, gameState.state.maxRounds);
        elements.applyPlayers(pkt.data.players, gameState.state.ownID);

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
}

