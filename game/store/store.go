package store

import (
	"fmt"
	"sync"

	"github.com/go-redis/redis"
	"github.com/scribble-rs/scribble.rs/game"
)

type RedisStore struct {
	client *redis.Client
}

func NewRedisStore(options *redis.Options) *RedisStore {
	client := redis.NewClient(options)
	return &RedisStore{
		client: client,
	}
}

func (m *RedisStore) SaveSettings(id string, l *game.LobbySettings) error {
	cmd := m.client.Set(id+".settings", l, 0)
	text, err := cmd.Result()
	fmt.Println("redis-store SaveSettings result:", text)

	return err
}

func (m *RedisStore) SaveState(id string, l *game.LobbyState) error {
	cmd := m.client.Set(id+".state", l, 0)
	text, err := cmd.Result()
	fmt.Println("redis-store SaveState result:", text)

	return err
}

func (m *RedisStore) SaveDrawOp(id string, l ...*game.Packet) error {
	args := make([]interface{}, len(l))
	for k, v := range l {
		args[k] = v
	}
	cmd := m.client.RPush(id+".draw-ops", args...)
	text, err := cmd.Result()
	fmt.Println("redis-store LobbyDrawOp result:", text)

	return err
}
func (m *RedisStore) UndoDrawOp(id string) error {
	cmd := m.client.RPop(id + ".draw-ops")
	text, err := cmd.Result()
	fmt.Println("redis-store UndoDrawOp result:", text)

	return err
}
func (m *RedisStore) ClearDrawing(id string) error {

	cmd := m.client.Del(id + ".draw-ops")
	text, err := cmd.Result()
	fmt.Println("redis-store ClearDrawing result:", text)

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
			CurrentDrawing: []*game.Packet{},
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

	for _, p := range l.State.Players {
		p.SetWebsocketMutex(&sync.Mutex{})
	}

	cmd2 := m.client.LRange(id+".draw-ops", 0, -1)
	err = cmd2.ScanSlice(&l.CurrentDrawing.CurrentDrawing)
	if err != nil {
		return nil, err
	}

	fmt.Println("redis-store Loaded Lobby:", id)

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
