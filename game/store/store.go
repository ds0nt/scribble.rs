package store

import (
	"fmt"

	"github.com/go-redis/redis"
	"github.com/kr/pretty"
	"github.com/scribble-rs/scribble.rs/game"
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
