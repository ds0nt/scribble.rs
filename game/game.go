package game

import (
	"sync"
)

var (
	lobbies            []*Lobby
	lobbiesMu          = &sync.Mutex{}
	LobbySettingBounds = &SettingBounds{
		MinDrawingTime:       60,
		MaxDrawingTime:       300,
		MinRounds:            1,
		MaxRounds:            20,
		MinMaxPlayers:        2,
		MaxMaxPlayers:        24,
		MinClientsPerIPLimit: 1,
		MaxClientsPerIPLimit: 24,
	}
	SupportedLanguages = map[string]string{
		"english": "English",
		"french":  "French",
	}
)

var TriggerSimpleUpdateEvent func(eventType string, lobby *Lobby)
var TriggerComplexUpdatePerPlayerEvent func(eventType string, data func(*Player) interface{}, lobby *Lobby)
var TriggerComplexUpdateEvent func(eventType string, data interface{}, lobby *Lobby)
var SendDataToOtherPlayers func(sender *Player, lobby *Lobby, data interface{})
var WriteAsJSON func(player *Player, object interface{}) error
var WritePublicSystemMessage func(lobby *Lobby, text string)

func (l *Lobby) triggerPlayersUpdate() {
	TriggerComplexUpdateEvent("update-players", l.State.Players, l)
}

func (l *Lobby) triggerCorrectGuessEvent() {
	TriggerSimpleUpdateEvent("correct-guess", l)
}

func (l *Lobby) triggerWordHintUpdate() {
	if l.State.CurrentWord == "" {
		return
	}

	TriggerComplexUpdatePerPlayerEvent("update-wordhint", func(player *Player) interface{} {
		return l.GetAvailableWordHints(player)
	}, l)
}

// Message represents a message in the chatroom.
type Message struct {
	// Author is the player / thing that wrote the message
	Author string `json:"author"`
	// Content is the actual message text.
	Content string `json:"content"`
}

// Ready represents the initial state that a user needs upon connection.
// This includes all the necessary things for properly running a client
// without receiving any more data.
type Ready struct {
	PlayerID string `json:"playerId"`
	Drawing  bool   `json:"drawing"`

	OwnerID        string        `json:"ownerId"`
	Round          int           `json:"round"`
	MaxRound       int           `json:"maxRounds"`
	RoundEndTime   int64         `json:"roundEndTime"`
	WordHints      []*WordHint   `json:"wordHints"`
	Players        []*Player     `json:"players"`
	CurrentDrawing []LobbyDrawOp `json:"currentDrawing"`
}
