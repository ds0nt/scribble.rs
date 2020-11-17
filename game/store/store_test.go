package store_test

import (
	"fmt"
	"reflect"
	"testing"
	"time"

	"github.com/go-redis/redis"
	"github.com/kr/pretty"
	"github.com/scribble-rs/scribble.rs/game"
	"github.com/stretchr/testify/require"
	"github.com/vmihailenco/msgpack"
)

type LobbyEntity struct {
	Lobby game.Lobby
}

func (m *LobbyEntity) MarshalBinary() ([]byte, error) {
	return msgpack.Marshal(&m)
}

// https://github.com/go-redis/redis/issues/739
func (m *LobbyEntity) UnmarshalBinary(data []byte) error {
	return msgpack.Unmarshal(data, &m)
}

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

type Store interface {
	Save(l *LobbyEntity) error
	FindByID(id string) (*LobbyEntity, error)
}

type RedisStore struct {
	client *redis.Client
}

func NewRedisStore() *RedisStore {
	client := redis.NewClient(&redis.Options{
		Addr: "127.0.01:6379",
	})
	return &RedisStore{
		client: client,
	}
}

func (m *RedisStore) Save(l *LobbyEntity) error {
	cmd := m.client.Set(l.Lobby.ID, l, 0)
	text, err := cmd.Result()
	fmt.Println("redis-store save:", text)

	return err
}

func (m *RedisStore) FindByID(id string) (l *LobbyEntity, err error) {
	l = &LobbyEntity{}
	cmd := m.client.Get(id)
	err = cmd.Scan(l)
	pretty.Println("redis-store get:", id, l)
	return
}

type MemStore struct {
	lobbies map[string]*LobbyEntity
}

func NewMemStore() *MemStore {
	return &MemStore{
		lobbies: make(map[string]*LobbyEntity),
	}
}

func (m *MemStore) Save(l *LobbyEntity) error {
	m.lobbies[l.Lobby.ID] = l
	return nil
}

func (m *MemStore) FindByID(id string) (l *LobbyEntity, err error) {

	l, ok := m.lobbies[id]
	if !ok {
		return nil, fmt.Errorf("lobby %s not found", l.Lobby.ID)
	}

	return l, nil
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
