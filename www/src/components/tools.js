import * as actions from '../actions'
import gameState from '../lib/game-state'
import { smallCircle, mediumCircle, hugeCircle, drawTool, fillTool, selectCircle, selectTool, colorPicker, eraseTool, clearTool, scaleUpFactor, drawingBoard, undoTool } from '../elements';
import { hexToRgbStr, contrastShade, hexToRgb } from '../lib/util';
import { RUBBER, FILL_BUCKET, PEN, SMALL_CIRCLE, MEDIUM_CIRCLE, HUGE_CIRCLE } from '../constants';

export function resetTools() {
    actions.setLineWidthAction(15)
    actions.setColorAction('rgb(0,0,0)')
    actions.chooseToolAction(PEN)
    selectCircle(SMALL_CIRCLE)
    selectTool(PEN)
       
}

export function registerTools() {

    colorPicker.onchange = e => actions.setColorAction(hexToRgbStr(e.target.value))
    Array.from(document.getElementsByClassName('color-button')).forEach(
        el => {
            el.onclick = e => actions.setColorAction(e.target.style.backgroundColor)
        }
    )
    
    drawTool.onclick = e => actions.chooseToolAction(PEN)
    fillTool.onclick = e => actions.chooseToolAction(FILL_BUCKET)
    eraseTool.onclick = e => actions.chooseToolAction(RUBBER)
    clearTool.onclick = e => actions.clearAction()
    undoTool.onclick = e => actions.undoAction()

    gameState.registerHandler((state, prevState) => {
        const { localTool } = state
        if (prevState.localTool != localTool) {
            selectTool(localTool)
        }
    })
}

//
// circles
//

export function registerCircles() {
    smallCircle.style.backgroundColor = gameState.state.localColor
    mediumCircle.style.backgroundColor = gameState.state.localColor
    hugeCircle.style.backgroundColor = gameState.state.localColor

    smallCircle.onclick = e => {
        actions.setLineWidthAction(15)
        selectCircle(SMALL_CIRCLE)
    }
    mediumCircle.onclick = e => {
        actions.setLineWidthAction(30)
        selectCircle(MEDIUM_CIRCLE)
    }
    hugeCircle.onclick = e => {
        actions.setLineWidthAction(40)
        selectCircle(HUGE_CIRCLE)
    }


    // on set line width
    gameState.registerHandler((state, prevState) => {
        const { localLineWidth, localLineWidthUnscaled, localColor } = state
        if (localColor == prevState.localColor 
                && localLineWidthUnscaled == prevState.localLineWidthUnscaled) {
            return
        }
        let cursorColor;
        let borderColor = "#FFFFFF";
        if (localColor.startsWith("#")) {
            cursorColor = hexToRgbStr(localColor);
            borderColor = contrastShade(hexToRgb(localColor))
        } else {
            cursorColor = localColor;
        }

        let circleSize = localLineWidth;
1
        // document.documentElement.style.setProperty('--color', value);


        // drawTool.style.backgroundColor = cursorColor
        // fillTool.style.backgroundColor = cursorColor

        drawingBoard.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${circleSize + 2}" height="${circleSize + 2}"><circle cx="${circleSize / 2}" cy="${circleSize / 2}" r="${circleSize / 2}" fill="${cursorColor}" stroke="${borderColor}"/></svg>') ${circleSize / 2} ${circleSize / 2}, auto`;
    })
}
