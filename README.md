
# SQL-SIMPLIFIER

SQL-Simplifier is a tool designed to help users handle long SQL queries. The project uses the built-in Node.js package for SQLite, currently available in version 23.4.0, and it is still under active development. The database is stored in an SQLite file, and users must specify the path to the database file when creating a new instance of SQL-Simplifier.


## Installation

Install sql-simplifier with npm

```bash
npm install sql-simplifier
```
    
## List of data types and table options
**Data types:**
- Data type / shortcut
- Integer / INT
- Float / FLOAT
- Boolean / BOOL
- Text / TXT

**Table options:**
- table option / shortcut or method
- PRIMARY KEY / PK
- AUTOINCREMENT / AI
- NOT NULL / NN
- UNIQUE / UQ
- DEFAULT / setDefualt
- CHECK / setCheck
- FOREIGN KEY / setForeignKey

## Usage/Examples
**Create new instance:**
```typescript
const pathToDatabase = "./database.sqlite"
const db = new SqlSimplifier(pathToDatabase);
```
**Create model of table:**

```typescript
const db = new SqlSimplifier("./test.db");
db.createTable("people", {
  id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
  },
  name: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
  surname: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
  age: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
});
```
**show model of table:**
```typescript
db.showTableSchema("people");
```
**Insert one row:**
```typescript
db["people"].insertOne({ name: "John", surname: "Doe", age: 25 });
```
**Insert multiple rows:**
```typescript
db["people"].insertMany([
  { name: "John", surname: "Doe", age: 25 },
  { name: "Jane", surname: "Doe", age: 24 },
  { name: "Michał", surname: "Kowalski", age: 30 },
]);

```

## Authors

- [@slodkiadrianek](https://github.com/slodkiadrianek)


## License

[MIT](https://choosealicense.com/licenses/mit/)

