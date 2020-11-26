package store

import (
	"fmt"

	"github.com/go-redis/redis"
	"github.com/kr/pretty"
	"github.com/scribble-rs/scribble.rs/game"
)

type Store interface {
	Save(l *game.Lobby) error
	FindByID(id string) (*game.Lobby, error)
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

func (m *RedisStore) Save(l *game.Lobby) error {
	cmd := m.client.Set(l.ID, l, 0)
	text, err := cmd.Result()
	fmt.Println("redis-store save:", text)

	return err
}

func (m *RedisStore) FindByID(id string) (l *game.Lobby, err error) {
	l = &game.Lobby{}
	cmd := m.client.Get(id)
	err = cmd.Scan(l)
	pretty.Println("redis-store get:", id, l)
	return
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
