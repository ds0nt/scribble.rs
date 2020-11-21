import * as actions from '../actions'
import gameState from '../game-state'

//
// circles
//

export function registerCircles() {
    document.getElementById('small-circle').style.backgroundColor = gameState.state.localColor
    document.getElementById('medium-circle').style.backgroundColor = gameState.state.localColor
    document.getElementById('huge-circle').style.backgroundColor = gameState.state.localColor

    document.getElementById('small-circle').onclick = e => actions.setLineWidthAction(15)
    document.getElementById('medium-circle').onclick = e => actions.setLineWidthAction(30)
    document.getElementById('huge-circle').onclick = e => actions.setLineWidthAction(40)


    // on set line width
    gameState.registerHandler((state, prevState) => {
        const { localLineWidth, localColor } = state
        if (localColor == prevState.localColor) {
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

        console.log(cursorColor, borderColor)

        let circleSize = localLineWidth * elements.scaleUpFactor();

        // document.documentElement.style.setProperty('--color', value);


        document.getElementById('draw-tool').style.backgroundColor = cursorColor
        document.getElementById('fill-tool').style.backgroundColor = cursorColor

        drawingBoard.style.cursor = `url('data:image/svg+xml;utf8,
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                version="1.1" 
                width="${circleSize + 2}"
                height="${circleSize + 2}">
                    <circle 
                        cx="${circleSize / 2}" 
                        cy="${circleSize / 2}" 
                        r="${circleSize / 2}" 
                        fill="${cursorColor}" 
                        stroke="${borderColor}"
                        />
            </svg>
        ') ${circleSize / 2} ${circleSize / 2}, auto`;
    })
}


//const chat = document.getElementById("chat");
// const colorPicker = document.getElementById("color-picker");
// const centerDialog = document.getElementById("center-dialog");
