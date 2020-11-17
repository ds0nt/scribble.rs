package store

import (
	"reflect"
	"testing"
	"time"

	"github.com/scribble-rs/scribble.rs/game"
	"github.com/stretchr/testify/require"
)

func NewTestLobby() *LobbyEntity {
	return &LobbyEntity{
		Lobby: game.Lobby{
			ID:                "test-id",
			DrawingTime:       120,
			MaxRounds:         3,
			MaxPlayers:        6,
			CustomWords:       []string{},
			Words:             []string{},
			Players:           []*game.Player{&game.Player{}},
			Drawer:            &game.Player{},
			Owner:             &game.Player{},
			CurrentWord:       "cyborg",
			WordHints:         []*game.WordHint{&game.WordHint{}},
			WordHintsShown:    []*game.WordHint{&game.WordHint{}},
			Round:             0,
			WordChoice:        []string{"cyborg", "bruce lee", "big mac"},
			RoundEndTime:      time.Now().Add(time.Second * 120).Unix(),
			CustomWordsChance: 0,
			ClientsPerIPLimit: 2,
			CurrentDrawing:    []interface{}{},
			EnableVotekick:    true,

			// timeLeftTicker:        time.NewTicker(),
			// timeLeftTickerReset:   make(chan struct{}),
			// scoreEarnedByGuessers: 0,
			// alreadyUsedWords:      []string{},
		},
	}
}

func requireLobbiesEqual(t *testing.T, expected, actual *LobbyEntity) {
	require.NotNil(t, expected)
	require.NotNil(t, actual)
	require.NotEmpty(t, expected.Lobby.ID)
	require.Equal(t, expected.Lobby.ID, actual.Lobby.ID)
	require.True(t, reflect.DeepEqual(expected.Lobby, actual.Lobby))

}

func TestSaveLobby(t *testing.T) {
	stores := []Store{
		// NewMemStore(),
		NewRedisStore(),
	}

	for _, st := range stores {
		require.NotNil(t, st)

		l := NewTestLobby()
		err := st.Save(l)
		require.Nil(t, err)

		lobby, err := st.FindByID(l.Lobby.ID)
		require.Nil(t, err)

		requireLobbiesEqual(t, l, lobby)
	}
}
