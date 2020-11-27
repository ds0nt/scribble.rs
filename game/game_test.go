package game

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGame(t *testing.T) {
	TriggerSimpleUpdateEvent = func(eventType string, lobby *Lobby) {
		fmt.Println("TriggerSimpleUpdateEvent", eventType)
	}
	TriggerComplexUpdatePerPlayerEvent = func(eventType string, data func(*Player) interface{}, lobby *Lobby) {
		fmt.Println("TriggerComplexUpdatePerPlayerEvent", eventType)
	}
	TriggerComplexUpdateEvent = func(eventType string, data interface{}, lobby *Lobby) {
		fmt.Println("TriggerComplexUpdateEvent", eventType)
	}
	SendDataToOtherPlayers = func(sender *Player, lobby *Lobby, data interface{}) {
		fmt.Println("SendDataToOtherPlayers")
	}
	WriteAsJSON = func(player *Player, object interface{}) error {
		fmt.Println("WriteAsJSON")
		return nil
	}
	WritePublicSystemMessage = func(lobby *Lobby, text string) {
		fmt.Println("WritePublicSystemMessage")
	}

	player, lobby, err := NewLobby("test-bro", "english", LobbySettings{
		ClientsPerIPLimit: 5,
		CustomWords:       []string{},
		CustomWordsChance: 100,
		DrawingTime:       120,
		EnableVotekick:    true,
		MaxPlayers:        12,
		Rounds:            5,
	})

	require.Nil(t, err)
	require.NotNil(t, lobby)
	require.NotNil(t, player)

	// no players connected
	require.Len(t, lobby.State.Players, 1)
	require.NotEmpty(t, player.ID)
	require.NotEmpty(t, player.GetSession())
	require.Equal(t, lobby.State.Owner, player.ID)

	require.Contains(t, lobby.State.Players, player.ID)
	require.Equal(t, lobby.State.Round, 0)
	require.Equal(t, lobby.State.RoundEndTime, int64(0))
	require.Equal(t, lobby.State.Drawer, "")
	require.Equal(t, lobby.State.CurrentWord, "")
	require.Empty(t, lobby.State.WordChoice)
	require.Empty(t, lobby.State.WordHints)
	require.Empty(t, lobby.State.WordHintsShown)

	// connect player
	lobby.Connect(player)

	require.Equal(t, player.State, PlayerStateDrawing)
	require.Equal(t, lobby.State.Round, 1)
	require.True(t, lobby.State.RoundEndTime > 0)
	require.Equal(t, lobby.State.Drawer, player.ID)
	require.Equal(t, lobby.State.CurrentWord, "")
	require.NotEmpty(t, lobby.State.WordChoice)
	require.Empty(t, lobby.State.WordHints)
	require.Empty(t, lobby.State.WordHintsShown)

	err = lobby.HandlePacket([]byte(`{"type":"choose-word", "data":0}`), player)
	require.Nil(t, err)

	require.Equal(t, player.State, PlayerStateDrawing)
	require.Equal(t, lobby.State.Round, 1)
	require.True(t, lobby.State.RoundEndTime > 0)
	require.Equal(t, lobby.State.Drawer, player.ID)
	require.NotEmpty(t, lobby.State.CurrentWord)
	require.Empty(t, lobby.State.WordChoice)
	require.NotEmpty(t, lobby.State.WordHints)
	require.NotEmpty(t, lobby.State.WordHintsShown)

}
