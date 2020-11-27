package game

import (
	"strings"
	"sync"

	petname "github.com/dustinkirkland/golang-petname"
	"github.com/gorilla/websocket"
	uuid "github.com/satori/go.uuid"
)

// PlayerState is the game state for the player
type PlayerState int

// PlayerStates
const (
	PlayerStateGuessing PlayerState = iota
	PlayerStateDrawing
	PlayerStateStandby
)

// Player represents a participant in a Lobby.
type Player struct {
	// userSession uniquely identifies the player.
	userSession string
	ws          *websocket.Conn
	wsMu        *sync.Mutex

	votedForKick map[string]bool

	// ID uniquely identified the Player.
	ID string `json:"id"`
	// Name is the players displayed name
	Name string `json:"name"`
	// Score is the points that the player got in the current Lobby.
	Score int `json:"score"`

	// Connected defines whether the players websocket connection is currently
	// established. This has previously been in state but has been moved out
	// in order to avoid losing the state on refreshing the page.
	// While checking the websocket against nil would be enough, we still need
	// this field for sending it via the APIs.
	Connected bool `json:"connected"`
	Drawn     bool `json:"drawn"`

	// Rank is the current ranking of the player in his Lobby
	LastScore int         `json:"lastScore"`
	Rank      int         `json:"rank"`
	State     PlayerState `json:"state"`
}

func createPlayer(name string) *Player {
	return &Player{
		userSession:  uuid.NewV4().String(),
		wsMu:         &sync.Mutex{},
		votedForKick: make(map[string]bool),
		ID:           uuid.NewV4().String(),
		Name:         name,
		Rank:         1,
		State:        PlayerStateGuessing,
	}
}

// GetWebsocket simply returns the players websocket connection. This method
// exists to encapsulate the websocket field and prevent accidental sending
// the websocket data via the network.
func (player *Player) GetWebsocket() *websocket.Conn {
	return player.ws
}

// SetWebsocket sets the given connection as the players websocket connection.
func (player *Player) SetWebsocket(socket *websocket.Conn) {
	player.ws = socket
}

// GetWebsocketMutex returns a mutex for locking the websocket connection.
// Since gorilla websockets shits it self when two calls happen at
// the same time, we need a mutex per player, since each player has their
// own socket. This getter extends to prevent accidentally sending the mutex
// via the network.
func (player *Player) GetWebsocketMutex() *sync.Mutex {
	return player.wsMu
}

// GeneratePlayerName creates a new playername. A so called petname. It consists
// of an adverb, an adjective and a animal name. The result can generally be
// trusted to be sane.
func GeneratePlayerName() string {
	adjective := strings.Title(petname.Adjective())
	adverb := strings.Title(petname.Adverb())
	name := strings.Title(petname.Name())
	return adverb + adjective + name
}
