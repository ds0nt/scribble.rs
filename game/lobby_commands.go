package game

import (
	"encoding/json"
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

func (l *Lobby) JoinPlayer(playerName, session string) *Player {
	player := createPlayer(playerName, session)

	//FIXME Make a dedicated method that uses a mutex?

	l.State.Players[player.ID] = player
	l.triggerPlayersUpdate()

	err := Store.SaveState(l.ID, l.State)
	if err != nil {
		fmt.Println("store save error:", err)
	}

	return player
}

func (l *Lobby) Connect(player *Player) {
	player.Connected = true

	players := []*Player{}
	for _, p := range l.State.Players {
		players = append(players, p)
	}
	readyBytes, err := json.Marshal(&Ready{
		PlayerID: player.ID,
		Drawing:  player.State == PlayerStateDrawing,

		OwnerID:        l.State.Owner,
		Round:          l.State.Round,
		MaxRound:       l.Settings.Rounds,
		RoundEndTime:   l.State.RoundEndTime,
		WordHints:      l.GetAvailableWordHints(player),
		Players:        players,
		CurrentDrawing: l.CurrentDrawing.CurrentDrawing,
	})
	if err != nil {
		panic(err)
	}

	WriteAsJSON(player, Packet{Type: "ready", Data: readyBytes})

	if l.State.Drawer == player.ID {

	}

	//This state is reached when the player refreshes before having chosen a word.
	if l.State.Drawer == player.ID {
		l.sendWordChoice()
	}
	if l.State.Drawer != "" {
		l.triggerPlayersUpdate()
		return
	}

	l.State.Drawer = player.ID
	player.State = PlayerStateDrawing

	l.triggerPlayersUpdate()

	err = Store.SaveState(l.ID, l.State)
	if err != nil {
		fmt.Println("store save error:", err)
	}
	return
}

func (l *Lobby) Disconnect(player *Player) {
	//We want to avoid calling the handler twice.
	if player.ws == nil {
		return
	}

	player.Connected = false
	player.ws = nil

	err := Store.SaveState(l.ID, l.State)
	if err != nil {
		fmt.Println("store save error:", err)
	}

	if !l.HasConnectedPlayers() {
		RemoveLobby(l.ID)
		log.Printf("There are currently %d open lobbies.\n", len(lobbies))
	} else {
		l.triggerPlayersUpdate()

		if l.State.Drawer == player.ID {
			l.advanceLobby()
		}
	}
}

func (l *Lobby) ClearDrawing() {
	l.CurrentDrawing.CurrentDrawing = []*Packet{}

	err := Store.ClearDrawing(l.ID)
	if err != nil {
		fmt.Println("store clear drawing error:", err)
	}
}

func (l *Lobby) sendWordChoice() {
	choiceBytes, err := json.Marshal(l.State.WordChoice)
	if err != nil {
		panic(err)
	}
	player := l.State.Players[l.State.Drawer]
	WriteAsJSON(player, &Packet{Type: "your-turn", Data: choiceBytes})
}

// AppendLine adds a line direction to the current drawing. This exists in order
// to prevent adding arbitrary elements to the drawing, as the backing array is
// an empty interface type.
func (l *Lobby) AppendLine(line *Packet) {
	l.CurrentDrawing.CurrentDrawing = append(l.CurrentDrawing.CurrentDrawing, line)

	err := Store.SaveDrawOp(l.ID, line)
	if err != nil {
		fmt.Println("store SaveDrawOp error:", err)
	}
}

// AppendFill adds a fill direction to the current drawing. This exists in order
// to prevent adding arbitrary elements to the drawing, as the backing array is
// an empty interface type.
func (l *Lobby) AppendFill(fill *Packet) {
	l.CurrentDrawing.CurrentDrawing = append(l.CurrentDrawing.CurrentDrawing, fill)

	err := Store.SaveDrawOp(l.ID, fill)
	if err != nil {
		fmt.Println("store SaveDrawOp error:", err)
	}
}

func (l *Lobby) AppendUndo(undo *Packet) {
	l.CurrentDrawing.CurrentDrawing = l.CurrentDrawing.CurrentDrawing[:len(l.CurrentDrawing.CurrentDrawing)-1]

	err := Store.SaveDrawOp(l.ID, undo)
	if err != nil {
		fmt.Println("store SaveDrawOp error:", err)
	}
}

// NextTurn represents the data necessary for displaying the lobby state right
// after a new turn started. Meaning that no word has been chosen yet and
// therefore there are no wordhints and no current drawing instructions.
type NextTurn struct {
	Round        int                `json:"round"`
	Players      map[string]*Player `json:"players"`
	RoundEndTime int64              `json:"roundEndTime"`
}

func (l *Lobby) advanceLobby() {
	l.ClearDrawing()

	if l.turnDone != nil {
		// in case of a database loaded lobby the turnDone channel may be nil  on round 1
		l.endTurn()
	}

	l.turnDone = make(chan struct{})

	p := l.GetPlayerById(l.State.Drawer)
	if p != nil {
		p.Drawn = true
		p.State = PlayerStateGuessing
	}

	next := l.nextDrawer()
	if next == nil {
		l.endRound()
		next = l.nextDrawer()
		if next == nil {
			fmt.Println("No next player left.")
			return
		}
	}

	l.State.Drawer = next.ID
	next.State = PlayerStateDrawing
	l.triggerPlayersUpdate()

	turnTime := time.Second * time.Duration(l.Settings.DrawingTime)
	l.State.RoundEndTime = time.Now().Add(turnTime).Unix()

	TriggerComplexUpdateEvent("next-turn", &NextTurn{
		Round:        l.State.Round,
		Players:      l.State.Players,
		RoundEndTime: l.State.RoundEndTime,
	}, l)

	l.State.WordChoice = l.GetRandomWords()
	l.sendWordChoice()

	//We use milliseconds for higher accuracy (noob)

	err := Store.SaveState(l.ID, l.State)
	if err != nil {
		fmt.Println("store SaveState error:", err)
	}

	go func() {
		turnEnd := time.NewTimer(turnTime)
		hint1 := time.NewTimer(turnTime * 50 / 100)
		hint2 := time.NewTimer(turnTime * 75 / 100)
		for {
			select {
			case <-turnEnd.C:
				l.advanceLobby()
				return
			case <-hint1.C:
				l.nextHint()
			case <-hint2.C:
				l.nextHint()
			case <-l.turnDone:
				fmt.Printf("Finished turn in round %d at %s", l.State.Round, time.Now())
				return
			}
		}
	}()
}

func (l *Lobby) nextHint() {
	tries := 0
	hints := len(l.State.WordHints)
	if hints == 0 {
		return
	}
	for {
		randomIndex := rand.Intn(hints)
		if l.State.WordHints[randomIndex].Character == 0 {
			l.State.WordHints[randomIndex].Character = []rune(l.State.CurrentWord)[randomIndex]
			l.triggerWordHintUpdate()
			break
		}
		tries++
		if tries > 20 {
			return
		}
	}
	err := Store.SaveState(l.ID, l.State)
	if err != nil {
		fmt.Println("store SaveState error:", err)
	}

}

func (l *Lobby) endTurn() {
	var turnMsg string
	if l.State.CurrentWord == "" {
		turnMsg = "Turn over. No word was chosen."
	} else {
		turnMsg = fmt.Sprintf("Turn over. The word was '%s'", l.State.CurrentWord)
	}

	//The drawer can potentially be null if he's kicked, in that case we proceed with the round if anyone has already
	drawer, ok := l.State.Players[l.State.Drawer]
	if ok && l.scoreEarnedByGuessers > 0 {
		averageScore := float64(l.scoreEarnedByGuessers) / float64(len(l.State.Players)-1)
		if averageScore > 0 {
			drawer.LastScore = int(averageScore * 1.1)
			drawer.Score += drawer.LastScore
		}
	}

	l.scoreEarnedByGuessers = 0
	l.alreadyUsedWords = append(l.alreadyUsedWords, l.State.CurrentWord)
	l.State.CurrentWord = ""
	l.State.WordHints = nil

	close(l.turnDone)

	//If the round ends and people still have guessing, that means the "Last" value
	////for the next turn has to be "no score earned".
	for _, p := range l.State.Players {
		if p.State == PlayerStateGuessing {
			p.LastScore = 0
		}
	}

	WritePublicSystemMessage(l, turnMsg)
}

func (l *Lobby) endRound() {
	if l.State.Round == 0 {
		return
	}
	if l.State.Round > l.Settings.Rounds {
		// game over
		l.State.Drawer = ""
		l.State.Round = 1
		WritePublicSystemMessage(l, "Game over. Type !start again to start a new round.")
	}
	l.clearDrawn()

	err := Store.SaveState(l.ID, l.State)
	if err != nil {
		fmt.Println("store SaveState error:", err)
	}
}

func (l *Lobby) sendMessageToAll(message string, sender *Player) {
	escaped := html.EscapeString(discordemojimap.Replace(message))
	for _, target := range l.State.Players {
		data, err := json.Marshal(Message{
			Author:  html.EscapeString(sender.Name),
			Content: escaped,
		})
		if err != nil {
			panic(err)
		}
		WriteAsJSON(target, Packet{Type: "message", Data: data})
	}
}

func (l *Lobby) sendMessageToAllNonGuessing(message string, sender *Player) {
	escaped := html.EscapeString(discordemojimap.Replace(message))
	for _, target := range l.State.Players {
		if target.State != PlayerStateGuessing {
			data, err := json.Marshal(Message{
				Author:  html.EscapeString(sender.Name),
				Content: escaped,
			})
			if err != nil {
				panic(err)
			}
			WriteAsJSON(target, Packet{Type: "non-guessing-player-message", Data: data})
		}
	}
}

func (l *Lobby) kick(from *Player, toKickID string) {
	//Kicking yourself isn't allowed
	if toKickID == from.ID {
		return
	}

	//A player can't vote twice to kick someone
	if from.votedForKick[toKickID] {
		return
	}

	playerToKick, ok := l.State.Players[toKickID]
	//If we haven't found the player, we can't kick him/her.
	if !ok {
		return
	}
	from.votedForKick[toKickID] = true

	defer func() {
		err := Store.SaveState(l.ID, l.State)
		if err != nil {
			fmt.Println("store SaveState error:", err)
		}
	}()

	var voteKickCount int
	for _, p := range l.State.Players {
		if p.votedForKick[toKickID] == true {
			voteKickCount++
		}
	}

	votesNeeded := 1
	if len(l.State.Players)%2 == 0 {
		votesNeeded = len(l.State.Players) / 2
	} else {
		votesNeeded = (len(l.State.Players) / 2) + 1
	}

	WritePublicSystemMessage(l, fmt.Sprintf("(%d/%d) players voted to kick %s", voteKickCount, votesNeeded, playerToKick.Name))

	if voteKickCount < votesNeeded {
		return
	}

	// vote has passed.

	//Since the player is already kicked, we first clean up the kicking information related to that player
	for _, p := range l.State.Players {
		delete(p.votedForKick, toKickID)
	}

	WritePublicSystemMessage(l, fmt.Sprintf("%s has been kicked from the lobby", playerToKick.Name))

	if l.State.Drawer == toKickID {
		WritePublicSystemMessage(l, "Since the kicked player has been drawing, none of you will get any points this round.")
		//Since the drawing person has been kicked, that probably means that he/she was trolling, therefore
		//we redact everyones last earned score.
		for _, p := range l.State.Players {
			p.Score -= p.LastScore
			p.LastScore = 0
		}
		l.scoreEarnedByGuessers = 0
		//We must absolutely not set lobby.State.Drawer to nil, since this would cause the drawing order to be ruined.
	}

	delete(l.State.Players, toKickID)

	//If the owner is kicked, we choose the next best person as the owner.
	if l.State.Owner == toKickID {
		for _, p := range l.State.Players {
			if p.Connected {
				l.State.Owner = p.ID
				WritePublicSystemMessage(l, fmt.Sprintf("%s is the new lobby owner.", p.Name))
				break
			}
		}
	}

	// triggers Disconnect events to advance lobby.
	if playerToKick.ws != nil {
		playerToKick.ws.Close()
	}
}

func (l *Lobby) clearDrawn() {
	for _, p := range l.State.Players {
		p.Drawn = false
	}
}
