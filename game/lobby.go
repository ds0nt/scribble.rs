package game

import (
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

type Rounds struct {
	Round     int `json:"round"`
	MaxRounds int `json:"maxRounds"`
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

type NewLobbyParams struct {
	DrawingTime       int
	Rounds            int
	MaxPlayers        int
	CustomWords       []string
	CustomWordsChance int
	ClientsPerIPLimit int
	EnableVotekick    bool
}

// NewLobby allows creating a lobby, optionally returning errors that
// occured during creation.
func NewLobby(ownerName, language string, params NewLobbyParams) (string, *Lobby, error) {

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
	lobbies = append(lobbies, lobby)
	lobbiesMu.Unlock()

	player := createPlayer(ownerName)

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
