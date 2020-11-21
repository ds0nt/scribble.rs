import { scaleDownFactor } from './elements'
import { hexToRgb } from './util.js'
import { drawingBoard } from './elements'
import * as actions from './actions'
import { PEN, RUBBER, FILL_BUCKET } from './constants';

import gameState from './game-state.js';

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

    color = hexToRgb(color);

    const circleMap = generateCircleMap(Math.floor(lineWidth / 2));
    const offset = Math.floor(circleMap.length / 2);
    const imageData = context.getImageData(0, 0, context.canvas.clientWidth, context.canvas.clientHeight);

    for (let ix = 0; ix < circleMap.length; ix++) {
        for (let iy = 0; iy < circleMap[ix].length; iy++) {
            if (circleMap[ix][iy] === 1 || (x1 === x2 && y1 === y2 && circleMap[ix][iy] === 2)) {
                const newX1 = x1 + ix - offset;
                const newY1 = y1 + iy - offset;
                const newX2 = x2 + ix - offset;
                const newY2 = y2 + iy - offset;
                drawBresenhamLine(imageData, newX1, newY1, newX2, newY2, color);
            }
        }
    }
    context.putImageData(imageData, 0, 0);
}

function drawBresenhamLine(imageData, x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        //check if pixel is inside the canvas
        if (x0 < 0 || x0 >= imageData.width || y0 < 0 || y0 >= imageData.height) return;
        setPixel(imageData, x0, y0, color);

        if ((x0 === x1) && (y0 === y1)) break;
        const e2 = 2 * err;
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
    let circleData = [];

    for (let x = 0; x < 2 * radius; x++) {
        circleData[x] = [];
        for (let y = 0; y < 2 * radius; y++) {
            const distanceToRadius = Math.sqrt(Math.pow(radius - x, 2) + Math.pow(radius - y, 2));
            if (distanceToRadius > radius) {
                circleData[x][y] = 0;
            } else if (distanceToRadius < radius - 2) {
                //optimize for performance: fill circle only when mouse was not moved
                circleData[x][y] = 2;
            } else {
                circleData[x][y] = 1;
            }
        }
    }

    return circleData;
}

function setPixel(imageData, x, y, color) {
    const offset = (y * imageData.width + x) * 4;
    imageData.data[offset] = color.r;
    imageData.data[offset + 1] = color.g;
    imageData.data[offset + 2] = color.b;
    imageData.data[offset + 3] = 255; // alpha
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
