
export const playerContainer = document.getElementById("player-container");
export const wordContainer = document.getElementById("word-container");
export const roundsSpan = document.getElementById("rounds");

export const timeLeft = document.getElementById("time-left");
export const drawingBoard = document.getElementById("drawing-board");

export const startDialog = document.getElementById("start-dialog");
export const startGameButton = document.getElementById('start-game-button')

export const wordDialog = document.getElementById("word-dialog");
export const wordButtonZero = document.getElementById("word-button-zero");
export const wordButtonOne = document.getElementById("word-button-one");
export const wordButtonTwo = document.getElementById("word-button-two");


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


