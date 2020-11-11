package game

import (
	"encoding/json"
	"fmt"
	"html"
	"math"
	"strconv"
	"strings"
	"time"

	commands "github.com/Bios-Marcel/cmdp"
	"github.com/Bios-Marcel/discordemojimap"
	"github.com/agnivade/levenshtein"
	petname "github.com/dustinkirkland/golang-petname"
)

// LobbyEvent contains an eventtype and optionally any data.
type LobbyEvent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

func (l *Lobby) HandleEvent(ev *LobbyEvent, player *Player) error {
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
			err := json.Unmarshal(ev.Data, line)
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
			err := json.Unmarshal(ev.Data, fill)
			if err != nil {
				return fmt.Errorf("error decoding fill data: %s", err)
			}
			l.AppendFill(&LineEvent{Type: ev.Type, Data: line})
			l.AppendFill(fill)

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

func handleMessage(input string, sender *Player, lobby *Lobby) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return
	}

	if lobby.CurrentWord == "" {
		sendMessageToAll(trimmed, sender, lobby)
		return
	}

	if sender.State == PlayerStateDrawing || sender.State == PlayerStateStandby {
		sendMessageToAllNonGuessing(trimmed, sender, lobby)
	} else if sender.State == PlayerStateGuessing {
		lowerCasedInput := strings.ToLower(trimmed)
		lowerCasedSearched := strings.ToLower(lobby.CurrentWord)
		if lowerCasedSearched == lowerCasedInput {
			secondsLeft := lobby.RoundEndTime/1000 - time.Now().UTC().UnixNano()/1000000000
			sender.LastScore = int(math.Ceil(math.Pow(math.Max(float64(secondsLeft), 1), 1.3) * 2))
			sender.Score += sender.LastScore
			lobby.scoreEarnedByGuessers += sender.LastScore
			sender.State = PlayerStateStandby
			WriteAsJSON(sender, LobbyEvent{Type: "system-message", Data: "You have correctly guessed the word."})

			if !lobby.isAnyoneStillGuessing() {
				endRound(lobby)
			} else {
				//Since the word has been guessed correctly, we reveal it.
				WriteAsJSON(sender, LobbyEvent{Type: "update-wordhint", Data: lobby.WordHintsShown})
				recalculateRanks(lobby)
				triggerCorrectGuessEvent(lobby)
				triggerPlayersUpdate(lobby)
			}

			return
		} else if levenshtein.ComputeDistance(lowerCasedInput, lowerCasedSearched) == 1 {
			WriteAsJSON(sender, LobbyEvent{Type: "system-message", Data: fmt.Sprintf("'%s' is very close.", trimmed)})
		}

		sendMessageToAll(trimmed, sender, lobby)
	}
}

func (lobby *Lobby) isAnyoneStillGuessing() bool {
	for _, otherPlayer := range lobby.Players {
		if otherPlayer.State == PlayerStateGuessing && otherPlayer.Connected {
			return true
		}
	}

	return false
}

func sendMessageToAll(message string, sender *Player, lobby *Lobby) {
	escaped := html.EscapeString(discordemojimap.Replace(message))
	for _, target := range lobby.Players {
		WriteAsJSON(target, LobbyEvent{Type: "message", Data: Message{
			Author:  html.EscapeString(sender.Name),
			Content: escaped,
		}})
	}
}

func sendMessageToAllNonGuessing(message string, sender *Player, lobby *Lobby) {
	escaped := html.EscapeString(discordemojimap.Replace(message))
	for _, target := range lobby.Players {
		if target.State != PlayerStateGuessing {
			WriteAsJSON(target, LobbyEvent{Type: "non-guessing-player-message", Data: Message{
				Author:  html.EscapeString(sender.Name),
				Content: escaped,
			}})
		}
	}
}

func handleKickEvent(lobby *Lobby, player *Player, toKickID string) {
	//Kicking yourself isn't allowed
	if toKickID == player.ID {
		return
	}

	//A player can't vote twice to kick someone
	if player.votedForKick[toKickID] {
		return
	}

	toKick := -1
	for index, otherPlayer := range lobby.Players {
		if otherPlayer.ID == toKickID {
			toKick = index
			break
		}
	}

	//If we haven't found the player, we can't kick him/her.
	if toKick != -1 {
		player.votedForKick[toKickID] = true
		playerToKick := lobby.Players[toKick]

		var voteKickCount int
		for _, otherPlayer := range lobby.Players {
			if otherPlayer.votedForKick[toKickID] == true {
				voteKickCount++
			}
		}

		votesNeeded := 1
		if len(lobby.Players)%2 == 0 {
			votesNeeded = len(lobby.Players) / 2
		} else {
			votesNeeded = (len(lobby.Players) / 2) + 1
		}

		WritePublicSystemMessage(lobby, fmt.Sprintf("(%d/%d) players voted to kick %s", voteKickCount, votesNeeded, playerToKick.Name))

		if voteKickCount >= votesNeeded {
			//Since the player is already kicked, we first clean up the kicking information related to that player
			for _, otherPlayer := range lobby.Players {
				if otherPlayer.votedForKick[toKickID] == true {
					delete(player.votedForKick, toKickID)
					break
				}
			}

			WritePublicSystemMessage(lobby, fmt.Sprintf("%s has been kicked from the lobby", playerToKick.Name))

			if lobby.Drawer == playerToKick {
				WritePublicSystemMessage(lobby, "Since the kicked player has been drawing, none of you will get any points this round.")
				//Since the drawing person has been kicked, that probably means that he/she was trolling, therefore
				//we redact everyones last earned score.
				for _, otherPlayer := range lobby.Players {
					otherPlayer.Score -= otherPlayer.LastScore
					otherPlayer.LastScore = 0
				}
				lobby.scoreEarnedByGuessers = 0
				//We must absolutely not set lobby.Drawer to nil, since this would cause the drawing order to be ruined.
			}

			if playerToKick.ws != nil {
				playerToKick.ws.Close()
			}
			lobby.Players = append(lobby.Players[:toKick], lobby.Players[toKick+1:]...)

			recalculateRanks(lobby)

			//If the owner is kicked, we choose the next best person as the owner.
			if lobby.Owner == playerToKick {
				for _, otherPlayer := range lobby.Players {
					potentialOwner := otherPlayer
					if potentialOwner.Connected {
						lobby.Owner = potentialOwner
						WritePublicSystemMessage(lobby, fmt.Sprintf("%s is the new lobby owner.", potentialOwner.Name))
						break
					}
				}
			}

			triggerPlayersUpdate(lobby)

			if lobby.Drawer == playerToKick || !lobby.isAnyoneStillGuessing() {
				endRound(lobby)
			}
		}
	}
}

func handleCommand(commandString string, caller *Player, lobby *Lobby) {
	command := commands.ParseCommand(commandString)
	if len(command) >= 1 {
		switch strings.ToLower(command[0]) {
		case "setmp":
			commandSetMP(caller, lobby, command)
		case "help":
			//TODO
		case "nick", "name", "username", "nickname", "playername", "alias":
			commandNick(caller, lobby, command)
		}
	}
}

func commandNick(caller *Player, lobby *Lobby, args []string) {
	if len(args) == 1 {
		caller.Name = GeneratePlayerName()
		WriteAsJSON(caller, LobbyEvent{Type: "reset-username"})
		triggerPlayersUpdate(lobby)
	} else {
		//We join all arguments, since people won't sue quotes either way.
		//The input is trimmed and sanitized.
		newName := html.EscapeString(strings.TrimSpace(strings.Join(args[1:], " ")))
		if len(newName) == 0 {
			caller.Name = GeneratePlayerName()
			WriteAsJSON(caller, LobbyEvent{Type: "reset-username"})
		} else {
			fmt.Printf("%s is now %s\n", caller.Name, newName)
			//We don't want super-long names
			if len(newName) > 30 {
				newName = newName[:31]
			}
			caller.Name = newName
			WriteAsJSON(caller, LobbyEvent{Type: "persist-username", Data: newName})
		}
		triggerPlayersUpdate(lobby)
	}
}

func commandSetMP(caller *Player, lobby *Lobby, args []string) {
	if caller == lobby.Owner {
		if len(args) < 2 {
			return
		}

		newMaxPlayersValue := strings.TrimSpace(args[1])
		newMaxPlayersValueInt, err := strconv.ParseInt(newMaxPlayersValue, 10, 64)
		if err == nil {
			if int(newMaxPlayersValueInt) >= len(lobby.Players) && newMaxPlayersValueInt <= LobbySettingBounds.MaxMaxPlayers && newMaxPlayersValueInt >= LobbySettingBounds.MinMaxPlayers {
				lobby.MaxPlayers = int(newMaxPlayersValueInt)

				WritePublicSystemMessage(lobby, fmt.Sprintf("MaxPlayers value has been changed to %d", lobby.MaxPlayers))
			} else {
				if len(lobby.Players) > int(LobbySettingBounds.MinMaxPlayers) {
					WriteAsJSON(caller, LobbyEvent{Type: "system-message", Data: fmt.Sprintf("MaxPlayers value should be between %d and %d.", len(lobby.Players), LobbySettingBounds.MaxMaxPlayers)})
				} else {
					WriteAsJSON(caller, LobbyEvent{Type: "system-message", Data: fmt.Sprintf("MaxPlayers value should be between %d and %d.", LobbySettingBounds.MinMaxPlayers, LobbySettingBounds.MaxMaxPlayers)})
				}
			}
		} else {
			WriteAsJSON(caller, LobbyEvent{Type: "system-message", Data: fmt.Sprintf("MaxPlayers value must be numeric.")})
		}
	} else {
		WriteAsJSON(caller, LobbyEvent{Type: "system-message", Data: fmt.Sprintf("Only the lobby owner can change MaxPlayers setting.")})
	}
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

var TriggerSimpleUpdateEvent func(eventType string, lobby *Lobby)
var TriggerComplexUpdatePerPlayerEvent func(eventType string, data func(*Player) interface{}, lobby *Lobby)
var TriggerComplexUpdateEvent func(eventType string, data interface{}, lobby *Lobby)
var SendDataToConnectedPlayers func(sender *Player, lobby *Lobby, data interface{})
var WriteAsJSON func(player *Player, object interface{}) error
var WritePublicSystemMessage func(lobby *Lobby, text string)

func triggerPlayersUpdate(lobby *Lobby) {
	TriggerComplexUpdateEvent("update-players", lobby.Players, lobby)
}

func triggerCorrectGuessEvent(lobby *Lobby) {
	TriggerSimpleUpdateEvent("correct-guess", lobby)
}

func triggerWordHintUpdate(lobby *Lobby) {
	if lobby.CurrentWord == "" {
		return
	}

	TriggerComplexUpdatePerPlayerEvent("update-wordhint", func(player *Player) interface{} {
		return lobby.GetAvailableWordHints(player)
	}, lobby)
}

type Rounds struct {
	Round     int `json:"round"`
	MaxRounds int `json:"maxRounds"`
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
	CurrentDrawing []interface{} `json:"currentDrawing"`
}

func (l *Lobby) OnConnected(player *Player) {
	player.Connected = true
	WriteAsJSON(player, LobbyEvent{Type: "ready", Data: &Ready{
		PlayerID: player.ID,
		Drawing:  player.State == PlayerStateDrawing,

		OwnerID:        l.Owner.ID,
		Round:          l.Round,
		MaxRound:       l.MaxRounds,
		RoundEndTime:   l.RoundEndTime,
		WordHints:      l.GetAvailableWordHints(player),
		Players:        l.Players,
		CurrentDrawing: l.CurrentDrawing,
	}})

	//This state is reached when the player refreshes before having chosen a word.
	if l.Drawer == player && l.CurrentWord == "" {
		WriteAsJSON(l.Drawer, &LobbyEvent{Type: "your-turn", Data: l.WordChoice})
	}

	//TODO Only send to everyone except for the new player, since it's part of the ready event.
	triggerPlayersUpdate(l)
}
