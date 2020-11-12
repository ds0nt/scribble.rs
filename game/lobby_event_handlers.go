package game

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

// LobbyEvent contains an eventtype and optionally any data.
type LobbyEvent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

func (l *Lobby) HandleEvent(bytes []byte, player *Player) error {
	ev := &LobbyEvent{}
	err := json.Unmarshal(bytes, ev)
	if err != nil {
		log.Printf("json unmarshal error from websocket: %s\n", err)
		return err
	}

	if ev.Type == "message" {
		text, ok := (ev.Data).(string)
		if !ok {
			return fmt.Errorf("message event data required but not recieved: '%s'", ev.Data)
		}

		if strings.HasPrefix(text, "!") {
			handleCommand(text[1:], player, l)
		} else {
			handleMessage(text, player, l)
		}
	} else if ev.Type == "line" {
		if l.canDraw(player) {
			line := &Line{}
			err := json.Unmarshal(bytes, line)
			if err != nil {
				return fmt.Errorf("error decoding line data: %s", err)
			}
			l.AppendLine(&LineEvent{Type: ev.Type, Data: line})

			//We directly forward the event, as it seems to be valid.
			SendDataToConnectedPlayers(player, l, ev)
		}
	} else if ev.Type == "fill" {
		if l.canDraw(player) {
			fill := &Fill{}
			err := json.Unmarshal(bytes, fill)
			if err != nil {
				return fmt.Errorf("error decoding fill data: %s", err)
			}
			l.AppendFill(&FillEvent{Type: ev.Type, Data: fill})

			//We directly forward the event, as it seems to be valid.
			SendDataToConnectedPlayers(player, l, ev)
		}
	} else if ev.Type == "clear-drawing-board" {
		if l.canDraw(player) {
			l.ClearDrawing()
			SendDataToConnectedPlayers(player, l, ev)
		}
	} else if ev.Type == "choose-word" {
		chosenIndex, ok := (ev.Data).(int)
		if !ok {
			asFloat, isFloat32 := (ev.Data).(float64)
			if isFloat32 && asFloat < 4 {
				chosenIndex = int(asFloat)
			} else {
				fmt.Println("Invalid data")
				return nil
			}
		}

		drawer := l.Drawer
		if player == drawer && len(l.WordChoice) > 0 && chosenIndex >= 0 && chosenIndex <= 2 {
			l.CurrentWord = l.WordChoice[chosenIndex]
			l.WordChoice = nil
			l.WordHints = createWordHintFor(l.CurrentWord, false)
			l.WordHintsShown = createWordHintFor(l.CurrentWord, true)
			triggerWordHintUpdate(l)
		}
	} else if ev.Type == "kick-vote" {
		toKickID, ok := (ev.Data).(string)
		if !ok {
			fmt.Println("Invalid data")
			return nil
		}
		if !l.EnableVotekick {
			// Votekicking is disabled in the lobby
			// We tell the user and do not continue with the event
			WriteAsJSON(player, LobbyEvent{Type: "system-message", Data: "Votekick is disabled in this lobby!"})
		} else {
			handleKickEvent(l, player, toKickID)
		}
	} else if ev.Type == "start" {
		if l.Round == 0 && player == l.Owner {
			for _, otherPlayer := range l.Players {
				otherPlayer.Score = 0
				otherPlayer.LastScore = 0
			}

			l.Round = 1

			advanceLobby(l)
		}
	}

	return nil
}
