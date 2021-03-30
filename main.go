package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/go-redis/redis"
	"github.com/scribble-rs/scribble.rs/game"
	"github.com/scribble-rs/scribble.rs/game/store"
	"github.com/scribble-rs/scribble.rs/server"
)

var (
	portHTTP  *int
	redisHost = os.Getenv("REDIS_HOST")
	redisPort = os.Getenv("REDIS_PORT")
)

func main() {
	portHTTP = flag.Int("portHTTP", 8080, "defines the port to be used for http mode")
	flag.Parse()

	//Setting the seed in order for the petnames to be random.
	rand.Seed(time.Now().UnixNano())

	log.Println("Started on http://localhost:8080/")

	if redisHost == "" {
		redisHost = "127.0.0.1"
	}
	if redisPort == "" {
		redisPort = "6379"
	}

	game.Store = store.NewRedisStore(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", redisHost, redisPort),
	})

	//If this ever fails, it will return and print a fatal logger message
	log.Fatal(server.Serve(*portHTTP))
}
