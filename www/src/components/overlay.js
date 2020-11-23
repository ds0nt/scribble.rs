import * as elements from '../elements'
import * as actions from '../actions'

export function registerOverlay() {
    // bind onclicks here because html function calling on window scope is annoying.
    elements.startGameButton.onclick = e => actions.startGameAction()
   
    elements.wordButtonZero.onclick = e => actions.chooseWordAction(0)
    elements.wordButtonOne.onclick = e => actions.chooseWordAction(1)
    elements.wordButtonTwo.onclick = e => actions.chooseWordAction(2)
   
}