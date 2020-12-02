import * as canvas from './canvas'
import * as elements from './elements'
import gameState from './lib/game-state'
import socket from './lib/socket'
import { PEN, RUBBER, FILL_BUCKET } from './constants';
import { rgbStr2hex } from './lib/util';

export function startGameAction() {
    socket.sendStart()
    //Tas: not needed
    //startDialog.style.display = "hidden";
    
    elements.showDialog(startDialog)
}


export const sendMessageAction = () => {
    socket.sendMessage(elements.messageInput.value)
    elements.messageInput.value = "";

    return false;
}

export function kickAction(playerId) {
    socket.sendKickVote(playerId);
}


export function chooseWordAction(index) {
    socket.sendChooseWord(index)

    elements.hideDialog()
    
    $("#cc-toolbox").css({ 'transform': 'translateX(0)' });
    $("#player-container").css({ 'transform': 'translateX(-150%)' });

    gameState.setState({ allowDrawing: true })
}


export function setColorAction(rgbStr) {
    let localColor
    if (rgbStr === undefined) {
        localColor = elements.colorPicker.value
    } else {
        rgbStr = rgbStr2hex(rgbStr)
        elements.colorPicker.value = rgbStr;
        localColor = rgbStr
    }
    gameState.setState({ localColor });
}

export function setLineWidthAction(value) {
    gameState.setState({
        localLineWidthUnscaled: value,
        localLineWidth: value * elements.scaleDownFactor(),
    })
}

export function chooseToolAction(value) {
    if (value === PEN || value === RUBBER || value === FILL_BUCKET) {
        gameState.setState({ localTool: value })
    }
}

export function fillAction(x, y) {
    canvas.fill(x, y, gameState.state.localColor);
    let _x = x * elements.scaleUpFactor()
    let _y = y * elements.scaleUpFactor()
    
    gameState.addFill(_x, _y, gameState.state.localColor)
    socket.sendFill(_x, _y, gameState.state.localColor)

}

export function drawAction(x1, y1, x2, y2) {
    const { localColor, localLineWidth, localTool } = gameState.state
    let _color
    if (localTool === RUBBER) {
        _color = "#ffffff";
    } else {
        _color = localColor
    }

    canvas.drawLine(x1, y1, x2, y2, _color, localLineWidth);

    let _x1 = x1 * elements.scaleUpFactor()
    let _y1 = y1 * elements.scaleUpFactor()
    let _x2 = x2 * elements.scaleUpFactor()
    let _y2 = y2 * elements.scaleUpFactor()
    let _lineWidth = localLineWidth * elements.scaleUpFactor()
    
    gameState.addLine(_x1, _y1, _x2, _y2, _color, _lineWidth)
    socket.sendLine(_x1, _y1, _x2, _y2, _color, _lineWidth, gameState.state.gestureId)
}

export function clearAction() {
    canvas.clear();
    gameState.clearDrawing()
    socket.sendClear()
}

export function undoAction() {
    const { currentDrawing } = gameState.state
    if (currentDrawing.length == 0) {
        return
    }
    
    gameState.undoDrawing()
    
    socket.sendUndo()

    canvas.applyDrawData(gameState.state.currentDrawing)
}
