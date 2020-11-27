package main

import (
	"flag"
	"log"
	"math/rand"
	"time"

	"github.com/go-redis/redis"
	"github.com/scribble-rs/scribble.rs/communication"
	"github.com/scribble-rs/scribble.rs/game"
	"github.com/scribble-rs/scribble.rs/game/store"
)

var (
	portHTTP *int
)

func main() {
	portHTTP = flag.Int("portHTTP", 8080, "defines the port to be used for http mode")
	flag.Parse()

	//Setting the seed in order for the petnames to be random.
	rand.Seed(time.Now().UnixNano())

	log.Println("Started on http://localhost:8080/")

	game.Store = store.NewRedisStore(&redis.Options{
		Addr: "127.0.01:6379",
	})

	//If this ever fails, it will return and print a fatal logger message
	log.Fatal(communication.Serve(*portHTTP))
}
