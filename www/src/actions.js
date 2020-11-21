import canvas, { scaleUpFactor, scaleDownFactor } from './canvas'
import gameState from './game-state'

export function clearAction() {
    //Avoid unnecessary traffic back to us.
    canvas.clear();
    socket.sendClear()
}

const sendMessageAction = () => {
    socket.sendMessage(messageInput.value)
    messageInput.value = "";

    return false;
};

export function chooseWordAction(index) {
    socket.sendChooseWord(index)

    hide("#word-dialog");
    wordDialog.style.display = "none";
    $("#cc-toolbox").css({ 'transform': 'translateX(0)' });
    $("#player-container").css({ 'transform': 'translateX(-150%)' });

    gameState.setState({ allowDrawing: true })
}

export function kickAction(playerId) {
    socket.sendKickVote(playerId);
}

export function fillAction(x, y) {
    canvas.fill(x, y, gameState.state.localColor);
    let _x = x * scaleUpFactor()
    let _y = y * scaleUpFactor()
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

    let _x1 = x1 * scaleUpFactor()
    let _y1 = y1 * scaleUpFactor()
    let _x2 = x2 * scaleUpFactor()
    let _y2 = y2 * scaleUpFactor()
    let _lineWidth = localLineWidth * scaleUpFactor()
    socket.sendLine(_x1, _y1, _x2, _y2, _color, _lineWidth)
}

export function setColorAction(value) {
    let localColor
    if (value === undefined) {
        localColor = colorPicker.value
    } else {
        value = rgbStr2hex(value)
        colorPicker.value = value;
        localColor = value
    }
    gameState.setState({ localColor });
}

export function setLineWidthAction(value) {
    gameState.setState({
        localLineWidthUnscaled: value,
        localLineWidth: value * scaleDownFactor(),
    })
}

export function chooseToolAction(value) {
    if (value === PEN || value === RUBBER || value === FILL_BUCKET) {
        gameState.setState({ localTool: value })
    }
}