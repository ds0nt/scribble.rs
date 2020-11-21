import { PEN } from './constants';

class GameState {
    state = {
        allowDrawing: false,
        localColor: "#000000",
        localLineWidth: 5,
        localLineWidthUnscaled: 5,
        localTool: PEN,

        ownID: null,
        ownerID: null,
        maxRounds: 0,
        roundEndTime: 0,
    }
    handlers = []
    _updating = false

    setState(state) {
        if (this._updating) {
            console.error("cannot set state in state handlers")
            return
        }
        this._updating = true
        try {
            let prevState = { ...this.state }
            this.state = {
                ...this.state,
                ...state,
            }
            console.log("prev state", prevState)
            console.log("next state", this.state)
            this._propagate(prevState)
        } catch (e) {
            console.error(e)
        }
        this._updating = false
    }

    _propagate(prevState) {
        this.handlers.map(
            fn => fn(this.state, prevState)
        )
    }

    registerHandler(fn) {
        this.handlers.push(fn)
        return function unregisterHandler() {
            this.handlers.filter((v) => v != fn)
        }
    }

    reset() {
        let prevState = { ...this.state }
        this.state = {}
        this.handlers = []
        this._propagate(prevState)
    }
}

export default new GameState()
