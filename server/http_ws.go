package server

import (
	"errors"
	"fmt"
	"html"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"

	"github.com/scribble-rs/scribble.rs/game"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// jsEvent contains an eventtype and optionally any data.
type jsEvent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

func init() {
	game.TriggerComplexUpdateEvent = TriggerComplexUpdateEvent
	game.TriggerSimpleUpdateEvent = TriggerSimpleUpdateEvent
	game.SendDataToOtherPlayers = SendDataToOtherPlayers
	game.WriteAsJSON = WriteAsJSON
	game.WritePublicSystemMessage = WritePublicSystemMessage
	game.TriggerComplexUpdatePerPlayerEvent = TriggerComplexUpdatePerPlayerEvent
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	lobby, err := getLobbyHandler(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	if lobby.IsFull() {
		http.Error(w, "Lobby is full", http.StatusNotFound)
		return
	}

	//This issue can happen if you illegally request a websocket connection without ever having had
	//a usersession or your client having deleted the usersession cookie.
	sessionCookie := userSession(r)
	if sessionCookie == "" {
		log.Println("session not found")
		http.Error(w, "you don't have access to this lobby;usersession not set", http.StatusUnauthorized)
		return
	}

	player := lobby.GetPlayerBySession(sessionCookie)
	if player == nil {
		log.Println("player for session not found", sessionCookie)
		http.Error(w, "you don't have access to this lobby;usersession invalid", http.StatusUnauthorized)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println(player.Name + " has connected")

	player.SetWebsocket(ws)
	lobby.Connect(player)

	ws.SetCloseHandler(func(code int, text string) error {
		lobby.Disconnect(player)
		return nil
	})

	go wsListen(lobby, player, ws)
}

func wsListen(l *game.Lobby, player *game.Player, socket *websocket.Conn) {
	//Workaround to prevent crash
	defer func() {
		err := recover()
		if err != nil {
			l.Disconnect(player)
			log.Println("Error occurred in wsListen: ", err)
		}
	}()

	defer socket.Close()

	for {
		_, bytes, err := socket.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err) ||
				websocket.IsUnexpectedCloseError(err) ||
				// This happens when the server closes the connection. It will cause 1000 retries followed by a panic.
				strings.Contains(err.Error(), "use of closed network connection") {
				// Make sure that the sockethandler is called
				l.Disconnect(player)
				log.Println(player.Name + " disconnected.")
				return
			}

			log.Printf("Error reading from socket: %s\n", err)
			err := WriteAsJSON(player, jsEvent{Type: "system-message", Data: fmt.Sprintf("An error occured trying to read your request, please report the error via GitHub: %s!", err)})
			if err != nil {
				log.Printf("Error sending errormessage: %s\n", err)
			}

			continue
		}

		err = l.HandlePacket(bytes, player)
		if err != nil {
			log.Printf("Error handling event: %s\n", err)
		}

	}
}

// TODO: correct this cross-package callback voodoo.
func SendDataToOtherPlayers(sender *game.Player, lobby *game.Lobby, data interface{}) {
	for _, player := range lobby.State.Players {
		if player != sender {
			WriteAsJSON(player, data)
		}
	}
}

func TriggerSimpleUpdateEvent(eventType string, lobby *game.Lobby) {
	event := &jsEvent{Type: eventType}
	for _, player := range lobby.State.Players {
		//FIXME Why did i use a goroutine here but not anywhere else?

		go func(player *game.Player) {
			WriteAsJSON(player, event)
		}(player)
	}
}

func TriggerComplexUpdateEvent(eventType string, data interface{}, lobby *game.Lobby) {
	event := &jsEvent{Type: eventType, Data: data}
	for _, player := range lobby.State.Players {
		WriteAsJSON(player, event)
	}
}

func TriggerComplexUpdatePerPlayerEvent(eventType string, data func(*game.Player) interface{}, lobby *game.Lobby) {
	for _, player := range lobby.State.Players {
		WriteAsJSON(player, &jsEvent{Type: eventType, Data: data(player)})
	}
}

// WriteAsJSON marshals the given input into a JSON string and sends it to the
// player using the currently established websocket connection.
func WriteAsJSON(player *game.Player, object interface{}) error {
	player.GetWebsocketMutex().Lock()
	defer player.GetWebsocketMutex().Unlock()

	socket := player.GetWebsocket()
	if socket == nil || !player.Connected {
		return errors.New("player not connected")
	}

	p, ok := object.(*jsEvent)
	if ok {
		fmt.Printf("sending packet type: %s to %s\n", p.Type, player.Name)
	} else {
		pc, ok := object.(*game.Packet)
		if ok {
			fmt.Printf("sending packet type: %s to %s\n", pc.Type, player.Name)
		} else {

		}
	}

	return socket.WriteJSON(object)
}

func WritePublicSystemMessage(lobby *game.Lobby, text string) {
	playerHasBeenKickedMsg := &jsEvent{Type: "system-message", Data: html.EscapeString(text)}
	for _, otherPlayer := range lobby.State.Players {

		WriteAsJSON(otherPlayer, playerHasBeenKickedMsg)
	}
}
