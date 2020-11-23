package game

import (
	"encoding/json"
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
		"message":             l.message,
		"line":                l.line,
		"fill":                l.fill,
		"clear-drawing-board": l.clearDrawingBoard,
		"choose-word":         l.chooseWord,
		"kick-vote":           l.kickVote,
		"start":               l.start,
	}
}

func (l *Lobby) HandlePacket(bytes []byte, from *Player) error {
	pretty.Println(string(bytes))

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
	if !l.canDraw(from) {
		return nil
	}
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

	if l.canDraw(from) {
		fill := &Fill{}
		err := json.Unmarshal(p.Data, &fill)
		if err != nil {
			return fmt.Errorf("error decoding fill data: %s", err)
		}
		l.AppendFill(&FillEvent{Type: p.Type, Data: fill})

		//We directly forward the event, as it seems to be valid.
		SendDataToOtherPlayers(from, l, p)
	}
	return nil

}

func (l *Lobby) clearDrawingBoard(p *Packet, bytes []byte, from *Player) error {
	if l.canDraw(from) {
		l.ClearDrawing()
		SendDataToOtherPlayers(from, l, p)
	}
	return nil
}

func (l *Lobby) chooseWord(p *Packet, bytes []byte, from *Player) error {

	chosenIndex := 0
	err := json.Unmarshal(p.Data, &chosenIndex)
	if err != nil {
		return fmt.Errorf("error decoding chosen word data: %s", err)
	}

	drawer := l.Drawer
	if from == drawer && len(l.WordChoice) > 0 && chosenIndex >= 0 && chosenIndex <= 2 {
		l.CurrentWord = l.WordChoice[chosenIndex]
		l.WordChoice = nil
		l.WordHints = createWordHintFor(l.CurrentWord, false)
		l.WordHintsShown = createWordHintFor(l.CurrentWord, true)
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

	if !l.EnableVotekick {
		// Votekicking is disabled in the lobby
		// We tell the user and do not continue with the event
		WriteAsJSON(from, Packet{Type: "system-message", Data: []byte("Votekick is disabled in this lobby!")})
	} else {
		l.kick(from, toKickID)
	}

	return nil
}

func (l *Lobby) start(p *Packet, bytes []byte, from *Player) error {

	if l.Round == 0 && from == l.Owner {
		for _, otherPlayer := range l.Players {
			otherPlayer.Score = 0
			otherPlayer.LastScore = 0
		}

		l.Round = 1

		l.advanceLobby()
	}

	return nil
}
