package store_test

import (
	"fmt"
	"testing"
	"time"

	"github.com/scribble-rs/scribble.rs/game"
	"github.com/stretchr/testify/require"
)

var testLobby = &game.Lobby{
	ID: "test-id",
	DrawingTime: 120,
	MaxRounds: 3,
	MaxPlayers: 6,
	CustomWords: []string{},
	Words:       []string{},

	Players: []*Player{
		&Player{},
	},
	Drawer: &Player{},
	Owner: &Player{},

	CurrentWord: "cyborg",
	WordHints: []*WordHint{"not totally human"},
	WordHintsShown: []*WordHint{"not totally human"},
	// Round is the round that the Lobby is currently in. This is a number
	// between 0 and MaxRounds. 0 indicates that it hasn't started yet.
	Round: 0,
	// WordChoice represents the current choice of words.
	WordChoice: []string{
		"cyborg", "bruce lee", "big mac",
	},
	// RoundEndTime represents the time at which the current round will end.
	// This is a UTC unix-timestamp in milliseconds.
	RoundEndTime: time.Now().Add(time.Second * 120).Unix(),

	timeLeftTicker:        time.NewTicker(),
	timeLeftTickerReset:   make(chan struct{}),
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

func requireLobbiesEqual(t *testing.T, expected, actual *game.Lobby) {
	require.NotNil(t, expected)
	require.NotNil(t, actual)
	require.NotEmpty(t, expected.ID)
	require.Equal(t, expected.ID, actual.ID)
}

func TestSaveLobby(t *testing.T) {
	var st Store

	st = NewMemStore()
	require.NotNil(t, st)

	err := st.Save(testLobby)
	require.Nil(t, err)

	l, err := st.FindByID(testLobby.ID)
	require.Nil(t, err)

	requireLobbiesEqual(t, l, testLobby)
}

type Store interface {
	Save(l *game.Lobby) error
	FindByID(id string) (*game.Lobby, error)
}

type MemStore struct {
	lobbies map[string]*game.Lobby
}

func NewMemStore() *MemStore {
	return &MemStore{
		lobbies: make(map[string]*game.Lobby),
	}
}

func (m *MemStore) Save(l *game.Lobby) error {
	m.lobbies[l.ID] = l
	return nil
}

func (m *MemStore) FindByID(id string) (l *game.Lobby, err error) {

	l, ok := m.lobbies[id]
	if !ok {
		return nil, fmt.Errorf("lobby %s not found", l.ID)
	}

	return l, nil
}
