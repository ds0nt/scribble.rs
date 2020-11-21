
class Socket {
    handlers = {}
    constructor() {
        // let wsURL(location.protocol === 'https:' ? "wss://" : "ws://") + location.hostname + ":" + location.port + "/v1/ws?lobby_id=" + window.lobbyId
        let wsURL = "ws://" + location.hostname + ":" + location.port + "/v1/ws?lobby_id=" + window.lobbyId

        this.socket = new ReconnectingWebSocket(wsURL, null, { debug: true, reconnectInterval: 3000, automaticOpen: false });
        this.socket.onmessage = e => {
            let parsed = JSON.parse(e.data);
            if (typeof this.handlers[parsed.type] == 'undefined') {
                console.error("socket received unknown message type " + parsed.type)
                return
            }
            this.handlers[parsed.type](parsed)
        }
        this.socket.onerror = err => console.error("websocket error: ", err);
    }

    open() {
        this.socket.open()
    }

    addHandler(type, fn) {
        this.handlers[type] = fn
    }

    sendStart() {
        this.socket.send(JSON.stringify({
            type: "start",
        }));
    }

    sendClear() {
        this.socket.send(JSON.stringify({
            type: "clear-drawing-board"
        }));
    }

    sendMessage(text) {
        this.socket.send(JSON.stringify({
            type: "message",
            data: text,
        }));
    }

    sendChooseWord(index) {
        this.socket.send(JSON.stringify({
            type: "choose-word",
            data: index
        }));
    }

    sendKickVote(playerId) {
        this.socket.send(JSON.stringify({
            type: "kick-vote",
            data: playerId,
        }));
    }

    sendFill(x, y, color) {
        this.socket.send(JSON.stringify({
            type: "fill",
            data: {
                x: x,
                y: y,
                color: color
            },
        }));
    }

    sendLine(x1, y1, x2, y2, color, lineWidth) {
        let drawInstruction = {
            type: "line",
            data: {
                fromX: x1,
                fromY: y1,
                toX: x2,
                toY: y2,
                color: color,
                lineWidth: lineWidth,
            }
        }
        this.socket.send(JSON.stringify(drawInstruction));
    }
}

export default Socket