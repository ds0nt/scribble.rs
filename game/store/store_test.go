package store

import (
	"reflect"
	"testing"
	"time"

	"github.com/scribble-rs/scribble.rs/game"
	"github.com/stretchr/testify/require"
)

func NewTestLobby() *game.Lobby {
	return &game.Lobby{
		ID: "test-id",
		CurrentDrawing: &game.LobbyDrawing{
			CurrentDrawing: []game.LobbyDrawOp{},
		},
		Settings: &game.LobbySettings{},

		State: &game.LobbyState{
			Players:        map[string]*game.Player{},
			Drawer:         "",
			Owner:          "",
			CurrentWord:    "cyborg",
			WordHints:      []*game.WordHint{&game.WordHint{}},
			WordHintsShown: []*game.WordHint{&game.WordHint{}},
			Round:          0,
			WordChoice:     []string{"cyborg", "bruce lee", "big mac"},
			RoundEndTime:   time.Now().Add(time.Second * 120).Unix(),
		},
	}
}

func requireLobbiesEqual(t *testing.T, expected, actual *game.Lobby) {
	require.NotNil(t, expected)
	require.NotNil(t, actual)
	require.NotEmpty(t, expected.ID)
	require.Equal(t, expected.ID, actual.ID)
	require.True(t, reflect.DeepEqual(expected, actual))

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

		lobby, err := st.Load(l.ID)
		require.Nil(t, err)

		requireLobbiesEqual(t, l, lobby)
	}
}
