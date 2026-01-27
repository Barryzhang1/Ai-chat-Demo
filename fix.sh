#!/bin/bash

docker-compose -f docker-compose.game.yml down --remove-orphans
docker-compose -f docker-compose.yml down --remove-orphans
docker-compose -f docker-compose.db.yml down
docker network rm ai-chat-network
./start-separated.sh