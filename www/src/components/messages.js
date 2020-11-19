
const messageContainer = document.getElementById("message-container");
const messageInput = document.getElementById("message-input");

function applyMessage(styleClass, author, message) {
    console.log(message);
    if (message === "Game over. Type !start again to start a new round.") {
        show("#score-dialog");
        return;
    }
    if (messageContainer.childElementCount >= 100) {
        messageContainer.removeChild(messageContainer.firstChild)
    }

    messageContainer.innerHTML += `<div class="message ` + styleClass + `">
                            <span class="chat-name">` + author + `</span>
                            <span class="message-content">` + message + `</span>
                        </div>`;
}