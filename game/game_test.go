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

	bro, lobby, err := NewLobby("test-bro", "test-bro-session", "english", LobbySettings{
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
	require.NotNil(t, bro)

	// no players connected
	require.Len(t, lobby.State.Players, 1)
	require.NotEmpty(t, bro.ID)
	require.NotEmpty(t, bro.GetSession())
	require.Equal(t, lobby.State.Owner, bro.ID)

	require.Contains(t, lobby.State.Players, bro.ID)
	require.Equal(t, lobby.State.Round, 0)
	require.Equal(t, lobby.State.RoundEndTime, int64(0))
	require.Equal(t, lobby.State.Drawer, "")
	require.Equal(t, lobby.State.CurrentWord, "")
	require.Empty(t, lobby.State.WordChoice)
	require.Empty(t, lobby.State.WordHints)
	require.Empty(t, lobby.State.WordHintsShown)

	// connect player
	lobby.Connect(bro)

	require.Equal(t, bro.State, PlayerStateDrawing)
	require.Equal(t, lobby.State.Round, 0)
	require.False(t, lobby.State.RoundEndTime > 0)
	require.Equal(t, lobby.State.Drawer, bro.ID)
	require.Equal(t, lobby.State.CurrentWord, "")
	require.Empty(t, lobby.State.WordChoice)
	require.Empty(t, lobby.State.WordHints)
	require.Empty(t, lobby.State.WordHintsShown)

	// choose word before game started
	err = lobby.HandlePacket([]byte(`{"type":"choose-word", "data":0}`), bro)
	require.NotNil(t, err)
	fmt.Println(err)

	// choose word before game started
	err = lobby.HandlePacket([]byte(`{"type":"start"}`), bro)
	require.Nil(t, err)

	require.Equal(t, bro.State, PlayerStateDrawing)
	require.Equal(t, lobby.State.Round, 1)
	require.True(t, lobby.State.RoundEndTime > 0)
	require.Equal(t, lobby.State.Drawer, bro.ID)
	require.Equal(t, lobby.State.CurrentWord, "")
	require.NotEmpty(t, lobby.State.WordChoice)
	require.Empty(t, lobby.State.WordHints)
	require.Empty(t, lobby.State.WordHintsShown)

	// choose word
	err = lobby.HandlePacket([]byte(`{"type":"choose-word", "data":0}`), bro)
	require.Nil(t, err)

	require.Equal(t, bro.State, PlayerStateDrawing)
	require.Equal(t, lobby.State.Round, 1)
	require.True(t, lobby.State.RoundEndTime > 0)
	require.Equal(t, lobby.State.Drawer, bro.ID)
	require.NotEmpty(t, lobby.State.CurrentWord)
	require.Empty(t, lobby.State.WordChoice)
	require.NotEmpty(t, lobby.State.WordHints)
	require.NotEmpty(t, lobby.State.WordHintsShown)

	require.Len(t, lobby.State.Players, 1)

	bro2Session := lobby.JoinPlayer("test-bro2", "test-bro2-session")
	require.Len(t, lobby.State.Players, 2)
	bro2 := lobby.GetPlayerBySession(bro2Session)
	require.Equal(t, bro2.State, PlayerStateGuessing)
	require.Equal(t, bro2.Drawn, false)
	lobby.Connect(bro2)

	sisSession := lobby.JoinPlayer("test-sis", "test-sis-session")
	require.Len(t, lobby.State.Players, 3)
	sis := lobby.GetPlayerBySession(sisSession)
	require.Equal(t, sis.State, PlayerStateGuessing)
	require.Equal(t, sis.Drawn, false)
	lobby.Connect(sis)

	sis2Session := lobby.JoinPlayer("test-sis2", "test-sis2-session")
	require.Len(t, lobby.State.Players, 4)
	sis2 := lobby.GetPlayerBySession(sis2Session)
	require.Equal(t, sis2.State, PlayerStateGuessing)
	require.Equal(t, sis2.Drawn, false)
	lobby.Connect(sis2)

	lobby.advanceLobby() // 3 players left
	require.Equal(t, lobby.State.Round, 1)
	require.Equal(t, bro.State, PlayerStateGuessing)
	require.Equal(t, bro.Drawn, true)

	lobby.advanceLobby() // 2 players left
	require.Equal(t, lobby.State.Round, 1)

	lobby.advanceLobby() // last player
	require.Equal(t, lobby.State.Round, 1)

	lobby.advanceLobby() // next round
	require.Equal(t, lobby.State.Round, 2)
}
