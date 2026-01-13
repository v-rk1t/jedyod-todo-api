build:
	docker compose up --build -d

up:
	docker compose up -d

stop:
	docker compose stop

down:
	docker compose down

clear:
	docker compose down -v

status:
	docker ps