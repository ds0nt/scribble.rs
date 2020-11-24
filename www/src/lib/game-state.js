import { PEN } from '../constants';

class GameState {
    state = {
        allowDrawing: false,
        localColor: "#000000",
        localLineWidth: 5,
        localLineWidthUnscaled: 5,
        localTool: PEN,
        currentDrawing: [],

        ownID: null,
        ownerID: null,
        maxRounds: 0,
        roundEndTime: 0,
        gestureId: 0,
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


    clearDrawing = () => {
        this.setState({
            currentDrawing: [],
            gestureId: 0,
        });
    }

    addPkt = (pkt) => {
        const { currentDrawing } = this.state
        this.setState({
            currentDrawing: [
                ...currentDrawing,
                pkt,            
            ]
        });
    }

    addFill = (x, y, color) => {
        const { currentDrawing } = this.state
        this.setState({
            currentDrawing: [
                ...currentDrawing,
                {
                type: "fill",
                data: {
                    x: x,
                    y: y,
                    color: color
                },
            }]
        });
    }

    addLine = (x1, y1, x2, y2, color, lineWidth, gestureId=0) => {
        const { currentDrawing } = this.state
        this.setState({
            currentDrawing: [
                ...currentDrawing,
                {
                    type: "line",
                    data: {
                        fromX: x1,
                        fromY: y1,
                        toX: x2,
                        toY: y2,
                        color: color,
                        lineWidth: lineWidth,
                    },
                }                
            ]
        });
    }
    incLineGesture = () => { 
        this.setState({
            gestureId: this.state.gestureId+1
        })

    }
    undoDrawing = () => {
        let  currentDrawing = [ ...this.state.currentDrawing ]
        let final = currentDrawing.splice(-1, 1)        
        this.setState({ currentDrawing })
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
