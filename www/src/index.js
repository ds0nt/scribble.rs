
import * as elements from './elements'

import gameState from './lib/game-state'
import socket from './lib/socket';

import { registerMessages } from './components/messages'
import { registerCircles, registerTools } from './components/tools';
import { registerOverlay } from './components/overlay';
import { registerSocketHandlers } from './socket-handlers'


window.setInterval(function () {
    let secondsLeft = Math.floor((gameState.state.roundEndTime - (new Date().getTime())) / 1000);
    if (secondsLeft >= 0) {
        elements.timeLeft.innerText = secondsLeft;
    } else {
        elements.timeLeft.innerText = "∞";
    }
}, 500);

registerSocketHandlers()

registerOverlay()
registerCircles()
registerTools()
registerMessages()

socket.open()
