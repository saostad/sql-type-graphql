# A simple command line tool to generate Graphql schema from SQL database schemas.

A simple command line tool to generate Graphql Type-Graphql .ts files and Types, Query and Mutations from SQL database schemas.

Supports the following databases: MySQL, Microsoft SQL Server, SQLite and PostgreSQL.

## How to use

`npx sql-type-graphql -c ./config.json`

It will create a folder and generate a file for each table based on DB schema.

It respects nullable and required fields.

## Config file options

[sql-ts docs](https://github.com/rmp135/sql-ts#config)

### Credits:

- [sql-ts](https://github.com/rmp135/sql-ts)
