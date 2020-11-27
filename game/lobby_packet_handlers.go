package game

import (
	"encoding/json"
	"errors"

	"fmt"
	"log"
	"strings"

	"github.com/kr/pretty"
)

// Packet contains an eventtype and optionally any data.
type Packet struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type packetHandler = func(p *Packet, bytes []byte, from *Player) error

// routes helper function
func (l *Lobby) routes() map[string]packetHandler {
	return map[string]packetHandler{
		"start":               l.start,
		"message":             l.message,
		"choose-word":         l.isStartedMiddleware(l.chooseWord),
		"kick-vote":           l.isStartedMiddleware(l.kickVote),
		"line":                l.isStartedMiddleware(l.canDrawMiddleware(l.line)),
		"fill":                l.isStartedMiddleware(l.canDrawMiddleware(l.fill)),
		"undo":                l.isStartedMiddleware(l.canDrawMiddleware(l.undo)),
		"clear-drawing-board": l.isStartedMiddleware(l.canDrawMiddleware(l.clearDrawingBoard)),
	}
}

// canDrawMiddleware accepts messages only from the current drawer
func (l *Lobby) isStartedMiddleware(handler packetHandler) packetHandler {
	return func(p *Packet, bytes []byte, from *Player) error {
		if l.State.Round == 0 {
			return errors.New("game not started")
		}
		return handler(p, bytes, from)
	}
}

// canDrawMiddleware accepts messages only from the current drawer
func (l *Lobby) canDrawMiddleware(handler packetHandler) packetHandler {
	return func(p *Packet, bytes []byte, from *Player) error {
		if !l.canDraw(from) {
			return errors.New("player cannot draw")
		}
		return handler(p, bytes, from)
	}
}

func (l *Lobby) HandlePacket(bytes []byte, from *Player) error {

	p := &Packet{}
	err := json.Unmarshal(bytes, p)
	if err != nil {
		log.Printf("json unmarshal error from websocket: %s\n", err)
		return err
	}

	pretty.Println(p)

	handler, ok := l.routes()[p.Type]
	if !ok {
		return fmt.Errorf("handler not found %s", p.Type)
	}

	return handler(p, bytes, from)
}

func (l *Lobby) message(p *Packet, bytes []byte, from *Player) error {
	text := ""
	err := json.Unmarshal(p.Data, &text)
	if err != nil {
		return fmt.Errorf("error decoding message data: %s", err)
	}

	if strings.HasPrefix(text, "!") {
		l.handleCommand(text[1:], from)
	} else {
		l.handleMessage(text, from)
	}
	return nil
}

func (l *Lobby) line(p *Packet, bytes []byte, from *Player) error {
	line := &Line{}
	err := json.Unmarshal(p.Data, &line)
	if err != nil {
		return fmt.Errorf("error decoding line data: %s", err)
	}
	l.AppendLine(&LineEvent{Type: p.Type, Data: line})

	//We directly forward the event, as it seems to be valid.
	SendDataToOtherPlayers(from, l, p)

	return nil
}

func (l *Lobby) fill(p *Packet, bytes []byte, from *Player) error {

	fill := &Fill{}
	err := json.Unmarshal(p.Data, &fill)
	if err != nil {
		return fmt.Errorf("error decoding fill data: %s", err)
	}
	l.AppendFill(&FillEvent{Type: p.Type, Data: fill})

	//We directly forward the event, as it seems to be valid.
	SendDataToOtherPlayers(from, l, p)
	return nil

}
func (l *Lobby) undo(p *Packet, bytes []byte, from *Player) error {

	l.Undo()
	SendDataToOtherPlayers(from, l, p)
	return nil

}

func (l *Lobby) clearDrawingBoard(p *Packet, bytes []byte, from *Player) error {
	l.ClearDrawing()
	SendDataToOtherPlayers(from, l, p)
	return nil
}

func (l *Lobby) chooseWord(p *Packet, bytes []byte, from *Player) error {
	chosenIndex := 0
	err := json.Unmarshal(p.Data, &chosenIndex)
	if err != nil {
		return fmt.Errorf("error decoding chosen word data: %s", err)
	}

	drawer := l.State.Drawer
	if from.ID == drawer && len(l.State.WordChoice) > 0 && chosenIndex >= 0 && chosenIndex <= 2 {
		l.State.CurrentWord = l.State.WordChoice[chosenIndex]
		l.State.WordChoice = nil
		l.State.WordHints = createWordHintFor(l.State.CurrentWord, false)
		l.State.WordHintsShown = createWordHintFor(l.State.CurrentWord, true)
		l.triggerWordHintUpdate()
	}
	return nil

}

func createWordHintFor(word string, showAll bool) []*WordHint {
	wordHints := make([]*WordHint, 0, len(word))
	for _, char := range word {
		irrelevantChar := char == ' ' || char == '_' || char == '-'
		if showAll {
			wordHints = append(wordHints, &WordHint{
				Character: char,
				Underline: !irrelevantChar,
			})
		} else {
			wordHints = append(wordHints, &WordHint{
				Underline: !irrelevantChar,
			})
		}
	}

	return wordHints
}

func (l *Lobby) kickVote(p *Packet, bytes []byte, from *Player) error {
	toKickID := ""
	err := json.Unmarshal(p.Data, &toKickID)
	if err != nil {
		return fmt.Errorf("error decoding kick-vote data: %s", err)
	}

	if !l.Settings.EnableVotekick {
		// Votekicking is disabled in the lobby
		// We tell the user and do not continue with the event
		WriteAsJSON(from, Packet{Type: "system-message", Data: []byte("Votekick is disabled in this lobby!")})
	} else {
		l.kick(from, toKickID)
	}

	return nil
}

func (l *Lobby) start(p *Packet, bytes []byte, from *Player) error {

	if l.State.Round == 0 && from.ID == l.State.Owner {
		for _, otherPlayer := range l.State.Players {
			otherPlayer.Score = 0
			otherPlayer.LastScore = 0
		}

		l.advanceLobby()
	}

	return nil
}
