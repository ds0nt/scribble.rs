package game

import (
	"fmt"
	"html"
	"log"
	"math/rand"
	"time"

	"github.com/Bios-Marcel/discordemojimap"
)

// RemoveLobby deletes a lobby, not allowing anyone to connect to it again.
func RemoveLobby(id string) {
	indexToDelete := -1
	for index, l := range lobbies {
		if l.ID == id {
			indexToDelete = index
		}
	}

	if indexToDelete != -1 {
		lobbies = append(lobbies[:indexToDelete], lobbies[indexToDelete+1:]...)
	}
}

func (l *Lobby) JoinPlayer(playerName string) string {
	player := createPlayer(playerName)

	//FIXME Make a dedicated method that uses a mutex?
	l.Players = append(l.Players, player)
	l.recalculateRanks()
	l.triggerPlayersUpdate()

	return player.userSession
}

func (l *Lobby) Connect(player *Player) {
	player.Connected = true
	WriteAsJSON(player, Packet{Type: "ready", Data: &Ready{
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
		WriteAsJSON(l.Drawer, &Packet{Type: "your-turn", Data: l.WordChoice})
	}

	//TODO Only send to everyone except for the new player, since it's part of the ready event.
	l.triggerPlayersUpdate()
}

func (l *Lobby) Disconnect(player *Player) {
	//We want to avoid calling the handler twice.
	if player.ws == nil {
		return
	}

	player.Connected = false
	player.ws = nil

	if !l.HasConnectedPlayers() {
		RemoveLobby(l.ID)
		log.Printf("There are currently %d open lobbies.\n", len(lobbies))
	} else {
		l.triggerPlayersUpdate()
	}
}

func (l *Lobby) ClearDrawing() {
	l.CurrentDrawing = make([]interface{}, 0, 0)
}

// LineEvent is basically the same as LobbyEvent, but with a specific Data type.
// We use this for reparsing as soon as we know that the type is right. It's
// a bit unperformant, but will do for now.
type LineEvent struct {
	Type string `json:"type"`
	Data *Line  `json:"data"`
}

// AppendLine adds a line direction to the current drawing. This exists in order
// to prevent adding arbitrary elements to the drawing, as the backing array is
// an empty interface type.
func (l *Lobby) AppendLine(line *LineEvent) {
	l.CurrentDrawing = append(l.CurrentDrawing, line)
}

// LineEvent is basically the same as LobbyEvent, but with a specific Data type.
// We use this for reparsing as soon as we know that the type is right. It's
// a bit unperformant, but will do for now.
type FillEvent struct {
	Type string `json:"type"`
	Data *Fill  `json:"data"`
}

// AppendFill adds a fill direction to the current drawing. This exists in order
// to prevent adding arbitrary elements to the drawing, as the backing array is
// an empty interface type.
func (l *Lobby) AppendFill(fill *FillEvent) {
	l.CurrentDrawing = append(l.CurrentDrawing, fill)
}

func (l *Lobby) endRound() {
	if l.timeLeftTicker != nil {
		l.timeLeftTicker.Stop()
		l.timeLeftTicker = nil
		l.timeLeftTickerReset <- struct{}{}
	}

	var roundOverMessage string
	if l.CurrentWord == "" {
		roundOverMessage = "Round over. No word was chosen."
	} else {
		roundOverMessage = fmt.Sprintf("Round over. The word was '%s'", l.CurrentWord)
	}

	//The drawer can potentially be null if he's kicked, in that case we proceed with the round if anyone has already
	drawer := l.Drawer
	if drawer != nil && l.scoreEarnedByGuessers > 0 {
		averageScore := float64(l.scoreEarnedByGuessers) / float64(len(l.Players)-1)
		if averageScore > 0 {
			drawer.LastScore = int(averageScore * 1.1)
			drawer.Score += drawer.LastScore
		}
	}

	l.scoreEarnedByGuessers = 0
	l.alreadyUsedWords = append(l.alreadyUsedWords, l.CurrentWord)
	l.CurrentWord = ""
	l.WordHints = nil

	//If the round ends and people still have guessing, that means the "Last" value
	////for the next turn has to be "no score earned".
	for _, otherPlayer := range l.Players {
		if otherPlayer.State == PlayerStateGuessing {
			otherPlayer.LastScore = 0
		}
	}

	WritePublicSystemMessage(l, roundOverMessage)

	l.advanceLobby()
}

// NextTurn represents the data necessary for displaying the lobby state right
// after a new turn started. Meaning that no word has been chosen yet and
// therefore there are no wordhints and no current drawing instructions.
type NextTurn struct {
	Round        int       `json:"round"`
	Players      []*Player `json:"players"`
	RoundEndTime int64     `json:"roundEndTime"`
}

func (l *Lobby) advanceLobby() {
	for _, otherPlayer := range l.Players {
		otherPlayer.State = PlayerStateGuessing
		otherPlayer.votedForKick = make(map[string]bool)
	}

	l.ClearDrawing()

	//If everyone has drawn once (e.g. a round has passed)
	if l.Drawer == l.Players[len(l.Players)-1] {
		if l.Round == l.MaxRounds {
			l.Drawer = nil
			l.Round = 0

			l.recalculateRanks()
			l.triggerPlayersUpdate()

			WritePublicSystemMessage(l, "Game over. Type !start again to start a new round.")

			return
		}

		l.Round++
	}
	l.selectNextDrawer()

	l.Drawer.State = PlayerStateDrawing
	l.WordChoice = l.GetRandomWords()

	l.recalculateRanks()

	//We use milliseconds for higher accuracy
	l.RoundEndTime = time.Now().UTC().UnixNano()/1000000 + int64(l.DrawingTime)*1000
	l.timeLeftTicker = time.NewTicker(1 * time.Second)
	go l.roundTimerTicker()

	TriggerComplexUpdateEvent("next-turn", &NextTurn{
		Round:        l.Round,
		Players:      l.Players,
		RoundEndTime: l.RoundEndTime,
	}, l)

	WriteAsJSON(l.Drawer, &Packet{Type: "your-turn", Data: l.WordChoice})
}

func (l *Lobby) selectNextDrawer() {
	for index, otherPlayer := range l.Players {
		if otherPlayer == l.Drawer {
			//If we have someone that's drawing, take the next one
			for i := index + 1; i < len(l.Players); i++ {
				player := l.Players[i]
				if player.Connected {
					l.Drawer = player
					return
				}
			}
		}
	}

	l.Drawer = l.Players[0]
}

func (l *Lobby) roundTimerTicker() {
	hintsLeft := 2
	revealHintAtMillisecondsLeft := l.DrawingTime * 1000 / 3

	for {
		select {
		case <-l.timeLeftTicker.C:
			currentTime := time.Now().UTC().UnixNano() / 1000000
			if currentTime >= l.RoundEndTime {
				go l.endRound()
			}

			if hintsLeft > 0 && l.WordHints != nil {
				timeLeft := l.RoundEndTime - currentTime
				if timeLeft <= int64(revealHintAtMillisecondsLeft*hintsLeft) {
					hintsLeft--

					for {
						randomIndex := rand.Int() % len(l.WordHints)
						if l.WordHints[randomIndex].Character == 0 {
							l.WordHints[randomIndex].Character = []rune(l.CurrentWord)[randomIndex]
							l.triggerWordHintUpdate()
							break
						}
					}
				}
			}
		case <-l.timeLeftTickerReset:
			return
		}
	}
}

func (l *Lobby) recalculateRanks() {
	for _, a := range l.Players {
		if !a.Connected {
			continue
		}
		playersThatAreHigher := 0
		for _, b := range l.Players {
			if !b.Connected {
				continue
			}
			if b.Score > a.Score {
				playersThatAreHigher++
			}
		}

		a.Rank = playersThatAreHigher + 1
	}
}

func (l *Lobby) sendMessageToAll(message string, sender *Player) {
	escaped := html.EscapeString(discordemojimap.Replace(message))
	for _, target := range l.Players {
		WriteAsJSON(target, Packet{Type: "message", Data: Message{
			Author:  html.EscapeString(sender.Name),
			Content: escaped,
		}})
	}
}

func (l *Lobby) sendMessageToAllNonGuessing(message string, sender *Player) {
	escaped := html.EscapeString(discordemojimap.Replace(message))
	for _, target := range l.Players {
		if target.State != PlayerStateGuessing {
			WriteAsJSON(target, Packet{Type: "non-guessing-player-message", Data: Message{
				Author:  html.EscapeString(sender.Name),
				Content: escaped,
			}})
		}
	}
}

func (l *Lobby) kick(player *Player, toKickID string) {
	//Kicking yourself isn't allowed
	if toKickID == player.ID {
		return
	}

	//A player can't vote twice to kick someone
	if player.votedForKick[toKickID] {
		return
	}

	toKick := -1
	for index, otherPlayer := range l.Players {
		if otherPlayer.ID == toKickID {
			toKick = index
			break
		}
	}

	//If we haven't found the player, we can't kick him/her.
	if toKick != -1 {
		player.votedForKick[toKickID] = true
		playerToKick := l.Players[toKick]

		var voteKickCount int
		for _, otherPlayer := range l.Players {
			if otherPlayer.votedForKick[toKickID] == true {
				voteKickCount++
			}
		}

		votesNeeded := 1
		if len(l.Players)%2 == 0 {
			votesNeeded = len(l.Players) / 2
		} else {
			votesNeeded = (len(l.Players) / 2) + 1
		}

		WritePublicSystemMessage(l, fmt.Sprintf("(%d/%d) players voted to kick %s", voteKickCount, votesNeeded, playerToKick.Name))

		if voteKickCount >= votesNeeded {
			//Since the player is already kicked, we first clean up the kicking information related to that player
			for _, otherPlayer := range l.Players {
				if otherPlayer.votedForKick[toKickID] == true {
					delete(player.votedForKick, toKickID)
					break
				}
			}

			WritePublicSystemMessage(l, fmt.Sprintf("%s has been kicked from the lobby", playerToKick.Name))

			if l.Drawer == playerToKick {
				WritePublicSystemMessage(l, "Since the kicked player has been drawing, none of you will get any points this round.")
				//Since the drawing person has been kicked, that probably means that he/she was trolling, therefore
				//we redact everyones last earned score.
				for _, otherPlayer := range l.Players {
					otherPlayer.Score -= otherPlayer.LastScore
					otherPlayer.LastScore = 0
				}
				l.scoreEarnedByGuessers = 0
				//We must absolutely not set lobby.Drawer to nil, since this would cause the drawing order to be ruined.
			}

			if playerToKick.ws != nil {
				playerToKick.ws.Close()
			}
			l.Players = append(l.Players[:toKick], l.Players[toKick+1:]...)

			l.recalculateRanks()

			//If the owner is kicked, we choose the next best person as the owner.
			if l.Owner == playerToKick {
				for _, otherPlayer := range l.Players {
					potentialOwner := otherPlayer
					if potentialOwner.Connected {
						l.Owner = potentialOwner
						WritePublicSystemMessage(l, fmt.Sprintf("%s is the new lobby owner.", potentialOwner.Name))
						break
					}
				}
			}

			l.triggerPlayersUpdate()

			if l.Drawer == playerToKick || !l.isAnyoneStillGuessing() {
				l.endRound()
			}
		}
	}
}
