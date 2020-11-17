

build:
	rm -f pgked.go
	go build -o scribblers
	go run github.com/markbates/pkger/cmd/pkger -include /resources -include /templates; ./scribblers

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