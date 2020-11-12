package game

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	uuid "github.com/satori/go.uuid"
)

// Lobby represents a game session.
type Lobby struct {
	// ID uniquely identified the Lobby.
	ID string

	// DrawingTime is the amount of seconds that each player has available to
	// finish their drawing.
	DrawingTime int
	// MaxRounds defines how many iterations a lobby does before the game ends.
	// One iteration means every participant does one drawing.
	MaxRounds int
	// MaxPlayers defines the maximum amount of players in a single lobby.
	MaxPlayers int
	// CustomWords are additional words that will be used in addition to the
	// predefined words.
	CustomWords []string
	Words       []string

	// Players references all participants of the Lobby.
	Players []*Player

	// Drawer references the Player that is currently drawing.
	Drawer *Player
	// Owner references the Player that created the lobby.
	Owner *Player
	// CurrentWord represents the word that was last selected. If no word has
	// been selected yet or the round is already over, this should be empty.
	CurrentWord string
	// WordHints for the current word.
	WordHints []*WordHint
	// WordHintsShown are the same as WordHints with characters visible.
	WordHintsShown []*WordHint
	// Round is the round that the Lobby is currently in. This is a number
	// between 0 and MaxRounds. 0 indicates that it hasn't started yet.
	Round int
	// WordChoice represents the current choice of words.
	WordChoice []string
	// RoundEndTime represents the time at which the current round will end.
	// This is a UTC unix-timestamp in milliseconds.
	RoundEndTime int64

	timeLeftTicker        *time.Ticker
	timeLeftTickerReset   chan struct{}
	scoreEarnedByGuessers int
	alreadyUsedWords      []string
	CustomWordsChance     int
	ClientsPerIPLimit     int
	// CurrentDrawing represents the state of the current canvas. The elements
	// consist of LineEvent and FillEvent. Please do not modify the contents
	// of this array an only move AppendLine and AppendFill on the respective
	// lobby object.
	CurrentDrawing []interface{}
	EnableVotekick bool
}

// WordHint describes a character of the word that is to be guessed, whether
// the character should be shown and whether it should be underlined on the
// UI.
type WordHint struct {
	Character rune `json:"character"`
	Underline bool `json:"underline"`
}

// Line is the struct that a client send when drawing
type Line struct {
	FromX     float32 `json:"fromX"`
	FromY     float32 `json:"fromY"`
	ToX       float32 `json:"toX"`
	ToY       float32 `json:"toY"`
	Color     string  `json:"color"`
	LineWidth float32 `json:"lineWidth"`
}

// Fill represents the usage of the fill bucket.
type Fill struct {
	X     float32 `json:"x"`
	Y     float32 `json:"y"`
	Color string  `json:"color"`
}

// GetLobby returns a Lobby that has a matching ID or no Lobby if none could
// be found.
func GetLobby(id string) *Lobby {
	for _, l := range lobbies {
		if l.ID == id {
			return l
		}
	}

	return nil
}

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

type CreateLobbyParams struct {
	DrawingTime       int
	Rounds            int
	MaxPlayers        int
	CustomWords       []string
	CustomWordsChance int
	ClientsPerIPLimit int
	EnableVotekick    bool
}

func createLobby(params CreateLobbyParams) *Lobby {
	lobby := &Lobby{
		ID:                  uuid.NewV4().String(),
		DrawingTime:         params.DrawingTime,
		MaxRounds:           params.Rounds,
		MaxPlayers:          params.MaxPlayers,
		CustomWords:         params.CustomWords,
		CustomWordsChance:   params.CustomWordsChance,
		timeLeftTickerReset: make(chan struct{}),
		ClientsPerIPLimit:   params.ClientsPerIPLimit,
		EnableVotekick:      params.EnableVotekick,
		CurrentDrawing:      make([]interface{}, 0, 0),
	}

	if len(params.CustomWords) > 1 {
		rand.Shuffle(len(lobby.CustomWords), func(i, j int) {
			lobby.CustomWords[i], lobby.CustomWords[j] = lobby.CustomWords[j], lobby.CustomWords[i]
		})
	}

	lobbiesMu.Lock()
	defer lobbiesMu.Unlock()
	lobbies = append(lobbies, lobby)

	return lobby
}

func (lobby *Lobby) HasConnectedPlayers() bool {
	for _, p := range lobby.Players {
		if p.Connected {
			return true
		}
	}

	return false
}

// NewLobby allows creating a lobby, optionally returning errors that
// occured during creation.
func NewLobby(playerName, language string, params CreateLobbyParams) (string, *Lobby, error) {
	lobby := createLobby(params)
	player := NewPlayer(playerName)

	lobby.Players = append(lobby.Players, player)
	lobby.Owner = player

	// Read wordlist according to the chosen language
	words, err := readWordList(language)
	if err != nil {
		//TODO Remove lobby, since we errored.
		return "", nil, err
	}

	lobby.Words = words

	return player.userSession, lobby, nil
}

// SettingBounds defines the lower and upper bounds for the user-specified
// lobby creation input.
type SettingBounds struct {
	MinDrawingTime       int64
	MaxDrawingTime       int64
	MinRounds            int64
	MaxRounds            int64
	MinMaxPlayers        int64
	MaxMaxPlayers        int64
	MinClientsPerIPLimit int64
	MaxClientsPerIPLimit int64
}

// LineEvent is basically the same as LobbyEvent, but with a specific Data type.
// We use this for reparsing as soon as we know that the type is right. It's
// a bit unperformant, but will do for now.
type LineEvent struct {
	Type string `json:"type"`
	Data *Line  `json:"data"`
}

// LineEvent is basically the same as LobbyEvent, but with a specific Data type.
// We use this for reparsing as soon as we know that the type is right. It's
// a bit unperformant, but will do for now.
type FillEvent struct {
	Type string `json:"type"`
	Data *Fill  `json:"data"`
}

// GetPlayer searches for a player, identifying them by usersession.
func (lobby *Lobby) GetPlayer(userSession string) *Player {
	for _, player := range lobby.Players {
		if player.userSession == userSession {
			return player
		}
	}

	return nil
}

func (lobby *Lobby) ClearDrawing() {
	lobby.CurrentDrawing = make([]interface{}, 0, 0)
}

// AppendLine adds a line direction to the current drawing. This exists in order
// to prevent adding arbitrary elements to the drawing, as the backing array is
// an empty interface type.
func (lobby *Lobby) AppendLine(line *LineEvent) {
	lobby.CurrentDrawing = append(lobby.CurrentDrawing, line)
}

// AppendFill adds a fill direction to the current drawing. This exists in order
// to prevent adding arbitrary elements to the drawing, as the backing array is
// an empty interface type.
func (lobby *Lobby) AppendFill(fill *FillEvent) {
	lobby.CurrentDrawing = append(lobby.CurrentDrawing, fill)
}

func endRound(lobby *Lobby) {
	if lobby.timeLeftTicker != nil {
		lobby.timeLeftTicker.Stop()
		lobby.timeLeftTicker = nil
		lobby.timeLeftTickerReset <- struct{}{}
	}

	var roundOverMessage string
	if lobby.CurrentWord == "" {
		roundOverMessage = "Round over. No word was chosen."
	} else {
		roundOverMessage = fmt.Sprintf("Round over. The word was '%s'", lobby.CurrentWord)
	}

	//The drawer can potentially be null if he's kicked, in that case we proceed with the round if anyone has already
	drawer := lobby.Drawer
	if drawer != nil && lobby.scoreEarnedByGuessers > 0 {
		averageScore := float64(lobby.scoreEarnedByGuessers) / float64(len(lobby.Players)-1)
		if averageScore > 0 {
			drawer.LastScore = int(averageScore * 1.1)
			drawer.Score += drawer.LastScore
		}
	}

	lobby.scoreEarnedByGuessers = 0
	lobby.alreadyUsedWords = append(lobby.alreadyUsedWords, lobby.CurrentWord)
	lobby.CurrentWord = ""
	lobby.WordHints = nil

	//If the round ends and people still have guessing, that means the "Last" value
	////for the next turn has to be "no score earned".
	for _, otherPlayer := range lobby.Players {
		if otherPlayer.State == PlayerStateGuessing {
			otherPlayer.LastScore = 0
		}
	}

	WritePublicSystemMessage(lobby, roundOverMessage)

	advanceLobby(lobby)
}

func advanceLobby(lobby *Lobby) {
	for _, otherPlayer := range lobby.Players {
		otherPlayer.State = PlayerStateGuessing
		otherPlayer.votedForKick = make(map[string]bool)
	}

	lobby.ClearDrawing()

	//If everyone has drawn once (e.g. a round has passed)
	if lobby.Drawer == lobby.Players[len(lobby.Players)-1] {
		if lobby.Round == lobby.MaxRounds {
			lobby.Drawer = nil
			lobby.Round = 0

			recalculateRanks(lobby)
			triggerPlayersUpdate(lobby)

			WritePublicSystemMessage(lobby, "Game over. Type !start again to start a new round.")

			return
		}

		lobby.Round++
	}
	selectNextDrawer(lobby)

	lobby.Drawer.State = PlayerStateDrawing
	lobby.WordChoice = GetRandomWords(lobby)

	recalculateRanks(lobby)

	//We use milliseconds for higher accuracy
	lobby.RoundEndTime = time.Now().UTC().UnixNano()/1000000 + int64(lobby.DrawingTime)*1000
	lobby.timeLeftTicker = time.NewTicker(1 * time.Second)
	go roundTimerTicker(lobby)

	TriggerComplexUpdateEvent("next-turn", &NextTurn{
		Round:        lobby.Round,
		Players:      lobby.Players,
		RoundEndTime: lobby.RoundEndTime,
	}, lobby)

	WriteAsJSON(lobby.Drawer, &LobbyEvent{Type: "your-turn", Data: lobby.WordChoice})
}

func selectNextDrawer(lobby *Lobby) {
	for index, otherPlayer := range lobby.Players {
		if otherPlayer == lobby.Drawer {
			//If we have someone that's drawing, take the next one
			for i := index + 1; i < len(lobby.Players); i++ {
				player := lobby.Players[i]
				if player.Connected {
					lobby.Drawer = player
					return
				}
			}
		}
	}

	lobby.Drawer = lobby.Players[0]
}

func roundTimerTicker(lobby *Lobby) {
	hintsLeft := 2
	revealHintAtMillisecondsLeft := lobby.DrawingTime * 1000 / 3

	for {
		select {
		case <-lobby.timeLeftTicker.C:
			currentTime := time.Now().UTC().UnixNano() / 1000000
			if currentTime >= lobby.RoundEndTime {
				go endRound(lobby)
			}

			if hintsLeft > 0 && lobby.WordHints != nil {
				timeLeft := lobby.RoundEndTime - currentTime
				if timeLeft <= int64(revealHintAtMillisecondsLeft*hintsLeft) {
					hintsLeft--

					for {
						randomIndex := rand.Int() % len(lobby.WordHints)
						if lobby.WordHints[randomIndex].Character == 0 {
							lobby.WordHints[randomIndex].Character = []rune(lobby.CurrentWord)[randomIndex]
							triggerWordHintUpdate(lobby)
							break
						}
					}
				}
			}
		case <-lobby.timeLeftTickerReset:
			return
		}
	}
}

// NextTurn represents the data necessary for displaying the lobby state right
// after a new turn started. Meaning that no word has been chosen yet and
// therefore there are no wordhints and no current drawing instructions.
type NextTurn struct {
	Round        int       `json:"round"`
	Players      []*Player `json:"players"`
	RoundEndTime int64     `json:"roundEndTime"`
}

func recalculateRanks(lobby *Lobby) {
	for _, a := range lobby.Players {
		if !a.Connected {
			continue
		}
		playersThatAreHigher := 0
		for _, b := range lobby.Players {
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

func OnDisconnected(lobby *Lobby, player *Player) {
	//We want to avoid calling the handler twice.
	if player.ws == nil {
		return
	}

	player.Connected = false
	player.ws = nil

	if !lobby.HasConnectedPlayers() {
		RemoveLobby(lobby.ID)
		log.Printf("There are currently %d open lobbies.\n", len(lobbies))
	} else {
		triggerPlayersUpdate(lobby)
	}
}

func (lobby *Lobby) GetAvailableWordHints(player *Player) []*WordHint {
	//The draw simple gets every character as a word-hint. We basically abuse
	//the hints for displaying the word, instead of having yet another GUI
	//element that wastes space.
	if player.State == PlayerStateDrawing || player.State == PlayerStateStandby {
		return lobby.WordHintsShown
	} else {
		return lobby.WordHints
	}
}

func (lobby *Lobby) JoinPlayer(playerName string) string {
	player := NewPlayer(playerName)

	//FIXME Make a dedicated method that uses a mutex?
	lobby.Players = append(lobby.Players, player)
	recalculateRanks(lobby)
	triggerPlayersUpdate(lobby)

	return player.userSession
}

func (lobby *Lobby) canDraw(player *Player) bool {
	return lobby.Drawer == player && lobby.CurrentWord != ""
}
