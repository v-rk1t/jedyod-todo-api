# jedyod-todo-api

Todo API and DB

---

## Repository Structure

## Getting Started

### 1. Prerequisites

- Node.js (LTS version recommended)
- bun
- Docker (optional, for Docker-based test execution)
- Make (required for Docker commands)

---

### 2. Clone the repository

```sh
git clone https://github.com/v-rk1t/jedyod-todo-api
cd jedyod-todo-api
```

### 3. Start the DB and API server

For the initial setup, build the containers:

```sh
make build
```

Alternatively, use Docker Compose directly:

```sh
docker compose up --build -d
```

To remove containers and volumes:

```sh
make clear
```

Alternatively, use Docker Compose directly:

```sh
docker compose down -v
```
