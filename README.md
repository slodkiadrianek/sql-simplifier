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
- DEFAULT / setDefualt
- CHECK / setCheck
- FOREIGN KEY / setForeignKey

## Usage/Examples

**Create new instance:**

```typescript
const pathToDatabase = "./database.sqlite";
const db = new SqlSimplifier(pathToDatabase);
```

**Create model of table:**

```typescript
db.createTable("people", {
  id: {
    type: dataTypes.INT,
    tableOptions: ` ${tableOptions.PK} ${tableOptions.AI}`,
  },
  name: {
    type: dataTypes.TXT,
    tableOptions: `${tableOptions.NN}`,
  },
  surname: {
    type: dataTypes.TXT,
    tableOptions: `${tableOptions.NN}`,
  },
  age: {
    type: dataTypes.INT,
    tableOptions: `${tableOptions.NN} ${tableOptions.setDefault(18)}`,
  },
});
```

**show model of table:**

```typescript
db.showTableSchema("people");
```

**Insert one row:**

```typescript
db["people"].insertData([
  {
    name: "Adrian",
    surname: "Nowak",
    age: 25,
  },
]);
```

**Insert multiple rows:**

```typescript
db["people"].insertData([
  {
    name: "Michał",
    surname: "Żuk",
    age: 21,
  },
  {
    name: "Marcin",
    surname: "Bombka",
    age: 29,
  },
]);
```

## Authors

- [@slodkiadrianek](https://github.com/slodkiadrianek)

## License

[MIT](https://choosealicense.com/licenses/mit/)
