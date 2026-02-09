# Mongo Data Init Script Test Cases

## Scope
Validate the western menu initialization script behavior for MongoDB on the remote server.

## Preconditions
- Remote server is reachable via SSH.
- Docker is running on the server.
- MongoDB container name is chat-mongodb.
- init-western-categories.js and init-western-dishes.js exist in /root/Ai-chat-Demo.

## Test Cases

### TC1 - Dry run validation
- Steps
  - Run: SERVER_PASSWORD=dummy DRY_RUN=1 ./scripts/init-western-menu.sh
- Expected
  - Outputs DRY_RUN banner and target host details.
  - Does not execute any remote commands.

### TC2 - Remote connectivity
- Steps
  - Run: SERVER_PASSWORD=*** ./scripts/init-western-menu.sh
- Expected
  - SSH session is created and remote commands execute without error.

### TC3 - Collections cleared
- Steps
  - After TC2, connect to Mongo and check counts.
- Expected
  - dishes and categories are cleared before re-seeding.

### TC4 - Categories seeded
- Steps
  - After TC2, run: db.categories.countDocuments() in restaurant DB.
- Expected
  - At least 10 categories inserted with western names.

### TC5 - Dishes seeded
- Steps
  - After TC2, run: db.dishes.countDocuments() in restaurant DB.
- Expected
  - Western dishes are inserted and associated with the seeded categories.

### TC6 - Script input files missing
- Steps
  - Temporarily rename init-western-categories.js and run the script.
- Expected
  - Script exits with non-zero status and reports missing file error.
