import { scaleDownFactor, scaleDown } from './elements'
import { hexToRgb } from './lib/util.js'
import { drawingBoard } from './elements'
import * as actions from './actions'
import { PEN, RUBBER, FILL_BUCKET } from './constants';

import gameState from './lib/game-state.js';


var context = drawingBoard.getContext("2d")

function handleCanvasResize() {
    drawingBoard.width = drawingBoard.clientWidth;
    drawingBoard.height = drawingBoard.clientHeight;
    
    gameState.setState({
        localLineWidthUnscaled: gameState.state.localLineWidthUnscaled,
        localLineWidth: gameState.state.localLineWidthUnscaled * scaleDownFactor(),
    })
}

handleCanvasResize();
window.addEventListener("resize", handleCanvasResize, false);


export function applyDrawData(drawElements) {
    clear();
    
    drawElements.forEach(function (drawElement) {
        let drawData = drawElement.data;
        if (drawElement.type === "fill") {
            fill(...scaleDown(drawData.x, drawData.y), drawData.color);
        } else if (drawElement.type === "line") {
            drawLine(
                ...scaleDown(
                    drawData.fromX,
                    drawData.fromY,
                    drawData.toX,
                    drawData.toY,
                ),
                drawData.color,
                scaleDown(drawData.lineWidth)[0]
            );
        } else {
            console.log("Unknown draw element type: " + drawData.type)
        }
    });
}

export function clear() {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, drawingBoard.width, drawingBoard.height);
}

export function fill(x1, y1, color) {
    context.fillStyle = color;
    //There seems to be some bug where setting the tolerance to 0 causes a freeze when painting black on white.
    context.fillFlood(x1, y1, 1);
}


export function drawLine(x1, y1, x2, y2, color, lineWidth) {
    // the coordinates must be whole numbers to improve performance.
    // also, decimals as coordinates is not making sense.
    // FIXME quick and dirty fix to apply the window scale to all drawing activities.
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);
    x2 = Math.floor(x2);
    y2 = Math.floor(y2);
    lineWidth = Math.ceil(lineWidth);

    // color = hexToRgb(color);

    context.beginPath();
    context.lineWidth = lineWidth
    context.lineCap = "round"
    context.strokeStyle = color
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
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
                actions.drawAction(cursorX, cursorY, offsetX, offsetY);
                cursorX = offsetX;
                cursorY = offsetY;

                return;
            }
        }
    }
};

drawingBoard.ontouchcancel = function (e) {
    gameState.incLineGesture()
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
        gameState.incLineGesture()
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
        actions.drawAction(cursorX, cursorY, offsetX, offsetY);
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
            actions.fillAction(e.offsetX, e.offsetY)
        } else {
            actions.drawAction(e.offsetX, e.offsetY, e.offsetX, e.offsetY);
        }
        cursorDrawing = false;
    }
};
