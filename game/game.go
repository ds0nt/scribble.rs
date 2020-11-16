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
var SendDataToConnectedPlayers func(sender *Player, lobby *Lobby, data interface{})
var WriteAsJSON func(player *Player, object interface{}) error
var WritePublicSystemMessage func(lobby *Lobby, text string)

func (l *Lobby) triggerPlayersUpdate() {
	TriggerComplexUpdateEvent("update-players", l.Players, l)
}

func (l *Lobby) triggerCorrectGuessEvent() {
	TriggerSimpleUpdateEvent("correct-guess", l)
}

func (l *Lobby) triggerWordHintUpdate() {
	if l.CurrentWord == "" {
		return
	}

	TriggerComplexUpdatePerPlayerEvent("update-wordhint", func(player *Player) interface{} {
		return l.GetAvailableWordHints(player)
	}, l)
}
