import * as canvas from './canvas'
import * as elements from './elements'
import gameState from './game-state'
import socket from './socket'
import { PEN, RUBBER, FILL_BUCKET } from './constants';
import { rgbStr2hex } from './util';

export function startGameAction() {
    socket.sendStart()
    //Tas: not needed
    //startDialog.style.display = "hidden";
    hide("#start-dialog");
    show("#word-dialog");
    elements.wordDialog.style.display = "block";
}

export function clearAction() {
    canvas.clear();
    socket.sendClear()
}

export const sendMessageAction = () => {
    socket.sendMessage(elements.messageInput.value)
    elements.messageInput.value = "";

    return false;
};

export function chooseWordAction(index) {
    socket.sendChooseWord(index)

    hide("#word-dialog");
    elements.wordDialog.style.display = "none";
    $("#cc-toolbox").css({ 'transform': 'translateX(0)' });
    $("#player-container").css({ 'transform': 'translateX(-150%)' });

    gameState.setState({ allowDrawing: true })
}

export function kickAction(playerId) {
    socket.sendKickVote(playerId);
}

export function fillAction(x, y) {
    canvas.fill(x, y, gameState.state.localColor);
    let _x = x * elements.scaleUpFactor()
    let _y = y * elements.scaleUpFactor()
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
    socket.sendLine(_x1, _y1, _x2, _y2, _color, _lineWidth)
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