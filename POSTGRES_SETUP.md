# Local PostgreSQL setup

1. In DBeaver, connect to the local PostgreSQL server (`localhost:5432`).
2. Create an empty database named `taskflow`.
3. Provide the application connection string as `DATABASE_URL`:
   `postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskflow`
4. Install dependencies: `npm install`.
5. Generate the schema migration: `npm run db:generate`.
6. Apply it: `npm run db:migrate`.
7. Start the app: `npm run dev`.

DBeaver is the database client; PostgreSQL must also be installed and running locally.
