import { messageForm } from "../elements";
import { sendMessageAction } from "../actions";

export function registerMessages() {
    messageForm.onsubmit = e => { 
        e.preventDefault(); 
        sendMessageAction() 
    };
}