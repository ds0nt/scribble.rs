package store

import (
	"fmt"

	"github.com/go-redis/redis"
	"github.com/scribble-rs/scribble.rs/game"
)

type Store interface {
	SaveSettings(id string, l *game.LobbySettings) error
	SaveState(id string, s *game.LobbyState) error
	SaveDrawOp(id string, l *game.LobbyDrawOp) error

	Load(id string) (*game.Lobby, error)
	Save(*game.Lobby) error
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

func (m *RedisStore) SaveSettings(id string, l *game.LobbySettings) error {
	cmd := m.client.Set(id+".settings", l, 0)
	text, err := cmd.Result()
	fmt.Println("redis-store SaveSettings save:", text)

	return err
}

func (m *RedisStore) SaveState(id string, l *game.LobbyState) error {
	cmd := m.client.Set(id+".state", l, 0)
	text, err := cmd.Result()
	fmt.Println("redis-store SaveState save:", text)

	return err
}

func (m *RedisStore) SaveDrawOp(id string, l ...game.LobbyDrawOp) error {
	args := make([]interface{}, len(l))
	for k, v := range l {
		args[k] = v
	}
	cmd := m.client.RPush(id+".draw-ops", args...)
	text, err := cmd.Result()
	fmt.Println("redis-store LobbyDrawOp save:", text)

	return err
}

//https://github.com/go-redis/redis/blob/master/example_test.go
func (m *RedisStore) Save(l *game.Lobby) (err error) {
	err = m.SaveState(l.ID, l.State)
	if err != nil {
		return err
	}
	err = m.SaveSettings(l.ID, l.Settings)
	if err != nil {
		return err
	}
	err = m.SaveDrawOp(l.ID, l.CurrentDrawing.CurrentDrawing...)
	if err != nil {
		return err
	}
	return
}

//https://github.com/go-redis/redis/blob/master/example_test.go
func (m *RedisStore) Load(id string) (l *game.Lobby, err error) {
	l = &game.Lobby{
		ID: id,
		CurrentDrawing: &game.LobbyDrawing{
			CurrentDrawing: []game.LobbyDrawOp{},
		},
		Settings: &game.LobbySettings{},
		State:    &game.LobbyState{},
	}

	cmd := m.client.Get(id + ".settings")
	err = cmd.Scan(l.Settings)
	if err != nil {
		return nil, err
	}

	cmd = m.client.Get(id + ".state")
	err = cmd.Scan(l.State)
	if err != nil {
		return nil, err
	}

	cmd = m.client.GetRange(id+".draw-ops", 0, -1)
	err = cmd.Scan(l.CurrentDrawing.CurrentDrawing)
	if err != nil {
		return nil, err
	}

	return
}

// type MemStore struct {
// 	lobbies map[string]*game.Lobby
// }

// func NewMemStore() *MemStore {
// 	return &MemStore{
// 		lobbies: make(map[string]*game.Lobby),
// 	}
// }

// func (m *MemStore) Save(l *game.Lobby) error {
// 	m.lobbies[l.ID] = l
// 	return nil
// }

// func (m *MemStore) FindByID(id string) (l *game.Lobby, err error) {

// 	l, ok := m.lobbies[id]
// 	if !ok {
// 		return nil, fmt.Errorf("lobby %s not found", l.ID)
// 	}

// 	return l, nil
// }
