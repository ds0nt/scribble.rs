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
	"github.com/agnivade/levenshtein"
)

func (l *Lobby) handleMessage(input string, from *Player) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return
	}

	if l.State.CurrentWord == "" {
		l.sendMessageToAll(trimmed, from)
		return
	}

	switch from.State {
	case PlayerStateDrawing, PlayerStateStandby:
		l.sendMessageToAllNonGuessing(trimmed, from)
	case PlayerStateGuessing:
		lowerCasedInput := strings.ToLower(trimmed)
		lowerCasedSearched := strings.ToLower(l.State.CurrentWord)
		if lowerCasedSearched == lowerCasedInput {
			secondsLeft := l.State.RoundEndTime/1000 - time.Now().UTC().UnixNano()/1000000000
			from.LastScore = int(math.Ceil(math.Pow(math.Max(float64(secondsLeft), 1), 1.3) * 2))
			from.Score += from.LastScore
			l.scoreEarnedByGuessers += from.LastScore
			from.State = PlayerStateStandby
			WriteAsJSON(from, Packet{Type: "system-message", Data: []byte("You have correctly guessed the word.")})

			if !l.isAnyoneStillGuessing() {
				l.advanceLobby()
			} else {
				bytes, err := json.Marshal(l.State.WordHintsShown)
				if err != nil {
					panic(err)
				}

				//Since the word has been guessed correctly, we reveal it.
				WriteAsJSON(from, Packet{Type: "update-wordhint", Data: bytes})
				l.triggerCorrectGuessEvent()
				l.triggerPlayersUpdate()
			}

			return
		} else if levenshtein.ComputeDistance(lowerCasedInput, lowerCasedSearched) == 1 {
			WriteAsJSON(from, Packet{Type: "system-message", Data: []byte(fmt.Sprintf("'%s' is very close.", trimmed))})
		}

		l.sendMessageToAll(trimmed, from)
	}
}

func (l *Lobby) handleCommand(commandString string, caller *Player) {
	command := commands.ParseCommand(commandString)
	if len(command) >= 1 {
		switch strings.ToLower(command[0]) {
		case "setmp":
			l.commandSetMP(caller, command)
		case "help":
			//TODO
		case "nick", "name", "username", "nickname", "playername", "alias":
			l.commandNick(caller, command)
		}
	}
}

func (l *Lobby) commandNick(from *Player, args []string) {
	if len(args) == 1 {
		from.Name = GeneratePlayerName()
		WriteAsJSON(from, Packet{Type: "reset-username"})
		l.triggerPlayersUpdate()
	} else {
		//We join all arguments, since people won't sue quotes either way.
		//The input is trimmed and sanitized.
		newName := html.EscapeString(strings.TrimSpace(strings.Join(args[1:], " ")))
		if len(newName) == 0 {
			from.Name = GeneratePlayerName()
			WriteAsJSON(from, Packet{Type: "reset-username"})
		} else {
			fmt.Printf("%s is now %s\n", from.Name, newName)
			//We don't want super-long names
			if len(newName) > 30 {
				newName = newName[:31]
			}
			from.Name = newName
			WriteAsJSON(from, Packet{Type: "persist-username", Data: []byte(newName)})
		}
		l.triggerPlayersUpdate()
	}
}

func (l *Lobby) commandSetMP(from *Player, args []string) {
	if l.State.Owner == from.ID {
		if len(args) < 2 {
			return
		}

		newMaxPlayersValue := strings.TrimSpace(args[1])
		newMaxPlayersValueInt, err := strconv.ParseInt(newMaxPlayersValue, 10, 64)
		if err == nil {
			if int(newMaxPlayersValueInt) >= len(l.State.Players) && newMaxPlayersValueInt <= LobbySettingBounds.MaxMaxPlayers && newMaxPlayersValueInt >= LobbySettingBounds.MinMaxPlayers {
				l.Settings.MaxPlayers = int(newMaxPlayersValueInt)

				WritePublicSystemMessage(l, fmt.Sprintf("MaxPlayers value has been changed to %d", l.Settings.MaxPlayers))
			} else {
				if len(l.State.Players) > int(LobbySettingBounds.MinMaxPlayers) {
					WriteAsJSON(from, Packet{Type: "system-message", Data: []byte(fmt.Sprintf("MaxPlayers value should be between %d and %d.", len(l.State.Players), LobbySettingBounds.MaxMaxPlayers))})
				} else {
					WriteAsJSON(from, Packet{Type: "system-message", Data: []byte(fmt.Sprintf("MaxPlayers value should be between %d and %d.", LobbySettingBounds.MinMaxPlayers, LobbySettingBounds.MaxMaxPlayers))})
				}
			}
		} else {
			WriteAsJSON(from, Packet{Type: "system-message", Data: []byte(fmt.Sprintf("MaxPlayers value must be numeric."))})
		}
	} else {
		WriteAsJSON(from, Packet{Type: "system-message", Data: []byte(fmt.Sprintf("Only the lobby owner can change MaxPlayers setting."))})
	}
}
