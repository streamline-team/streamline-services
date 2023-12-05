#!/bin/bash
docker compose -f test/docker-compose.yml up -d mysql

printf "\nWaiting for database connection...\n"

counter=0
timeout=20
until docker compose -f test/docker-compose.yml exec mysql mysqladmin --user=root --password=streamline --host "mysql" ping --silent &> /dev/null ; do
    let "counter += 1"
     if [[ $counter -gt timeout ]]; then
      echo "Timeout ($timeout seconds) reached. Unable to connect to database."
      exit 1
    fi
    sleep 1
done

pnpm run jest
TEST_EXIT_CODE=$?

docker compose -f test/docker-compose.yml down

exit $TEST_EXIT_CODE