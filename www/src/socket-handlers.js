import * as canvas from './canvas'
import * as audio from './lib/audio'
import * as elements from './elements'

import gameState from './lib/game-state'
import socket from './lib/socket';
import { resetTools } from './components/tools';
import { PEN, SMALL_CIRCLE } from './constants';


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

        if (ready.round === 0) {
            if (ready.ownerId === ready.playerId) {
                elements.showDialog(elements.startDialog)                
            } else {
                elements.showDialog(elements.startDialogWaiting)               
            }
        }

        if (ready.players) {
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
    socket.addHandler("line", (pkt) => {
        if (pkt.data.gestureId > gameState.state.gestureId) {
            gameState.setState({ gestureId: pkt.data.gestureId })
        }
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
        if (pkt.data.round === 0) {
            if (gameState.state.ownID === gameState.state.ownerID) {
                elements.showDialog(elements.startDialog)                
            } else {
                elements.showDialog(elements.startDialogWaiting)               
            }
        } else {
            elements.hideDialog()
        }

        elements.hideToolbox()
        //If a player doesn't choose, the dialog will still be up.

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
        resetTools()
        audio.yourTurn()
        if (!!pkt.data) {
            elements.wordButtonZero.textContent = pkt.data[0];
            elements.wordButtonOne.textContent = pkt.data[1];
            elements.wordButtonTwo.textContent = pkt.data[2];
            if (pkt.data.round !== 0) {
                elements.showDialog(elements.wordDialog)
            }
        }
        elements.showToolbox()
    })
}

