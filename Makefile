
resources/game.js: www/node_modules www/src/*
	cd www && yarn install && npx spack 
	cp -v www/dist/web.js resources/game.js

pkged.go: resources/game.js ./resources/* ./templates/*
	rm -f pgked.go
	go run github.com/markbates/pkger/cmd/pkger -include /resources -include /templates;

clean:
	rm -f pkged.go
	rm -f scribblers
	rm -f resources/game.js

build: pkged.go
	go build -o scribblers
	./scribblers

dockerize:
	docker-compose build

up:
	docker-compose up -d

down: 
	docker-compose down;

destroy: down
	docker-compose rm -f;

bounce-redis:
	docker-compose exec redis_test redis-cli flushall

start-redis:
	docker-compose up -d
	
stop-redis:
	docker-compose stop
	docker-compose rm -f

test: bounce-redis
	go test -v ./...

PHONY: test, stop-redis start-redis bounce-redis destroy down up dockerize build clean