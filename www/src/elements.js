
export const playerContainer = document.getElementById("player-container");
export const wordContainer = document.getElementById("word-container");
export const roundsSpan = document.getElementById("rounds");

export const timeLeft = document.getElementById("time-left");
export const drawingBoard = document.getElementById("drawing-board");
export const startDialog = document.getElementById("start-dialog");

export const wordDialog = document.getElementById("word-dialog");
export const wordButtonZero = document.getElementById("word-button-zero");
export const wordButtonOne = document.getElementById("word-button-one");
export const wordButtonTwo = document.getElementById("word-button-two");


export const scaleUpFactor = () => window.baseWidth / drawingBoard.clientWidth;
export const scaleDownFactor = () => drawingBoard.clientWidth / window.baseWidth;
export const scaleDown = (...vars) => vars.map(x => x * scaleDownFactor())

export const messageInput = "unimplemented"