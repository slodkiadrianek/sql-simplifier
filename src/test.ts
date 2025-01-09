import { SqlSimplifier } from "./app";
import { DatabaseSync } from "node:sqlite";
import { typesAndOptions } from "./typesAndOptions";
export const pathToDatabase: string = './test.db';
export const database = new DatabaseSync(pathToDatabase)
const db = new SqlSimplifier(pathToDatabase);
const users = db.createTable("users", {
  id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI} `
  },
  name:{
    type: typesAndOptions.types.TEXT,
    tableOptions: typesAndOptions.options.NN
  },
  email: {
    type: typesAndOptions.types.TEXT,
    tableOptions: typesAndOptions.options.NN
  }
})
const posts = db.createTable("posts", {
  id:{
    type: typesAndOptions.types.INT,
    tableOptions: ` ${typesAndOptions.options.PK} ${typesAndOptions.options.AI} `
  },
  user_id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey('user_id', 'users', 'id', 'cascade')}`
  },
  title:{
    type: typesAndOptions.types.TEXT,
    tableOptions: typesAndOptions.options.NN
  },
  category_id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey('category_id', 'categories', 'id', 'cascade')}`
  },
  tag_id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey('tag_id','tags', 'id', 'cascade')}`
  },
  content:{
    type:typesAndOptions.types.TEXT,
    tableOptions: typesAndOptions.options.NN
  }
})

const comments = db.createTable('comments',{
  id:{
    type: typesAndOptions.types.INT,
    tableOptions: ` ${typesAndOptions.options.PK} ${typesAndOptions.options.AI} `
  },
  post_id:{
    type:typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey('post_id', 'posts', 'id', 'cascade')}`
  },
  user_id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey('user_id', 'users', 'id', 'cascade')}`
  }
}) 

const categories = db.createTable('categories', {
  id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI} `
  },
  name:{
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.UQ}`
  }
})

const tags = db.createTable('tags', {
  id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI} `
  },
  name:{
    type: typesAndOptions.types.TEXT,
    tableOptions: typesAndOptions.options.NN
  }
})

const likes = db.createTable('likes', {
  id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI} `
  },
  user_id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey('user_id', 'users', 'id', 'cascade')}`
  },
  post_id:{
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey('post_id', 'posts', 'id', 'cascade')}`
  }
})

console.time("timeApp");
console.log(`USERS`);
console.table(users.columns)
console.log(`POSTS`);
console.table(posts.columns)
console.log('COMMENTS')
console.table(comments.columns)
console.log(`Categories`);
console.table(categories.columns)
console.log(`TAGS`)
console.table(tags.columns)
console.log('LIKES')
console.table(likes.columns)
console.log(`--------------------------------------------------------------------------------------------------------------------`);

// const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
// const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

// const generateRandomName = () => {
//   const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
//   const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
//   return `${firstName} ${lastName}`;
// };

// const generateEmail = (name:any) => {
//   return `${name.toLowerCase().replace(' ', '.')}@example.com`;
// };

// const dataToInsert:any = []
// const mockUsers = Array.from({ length: 10000 }, () => {
//   const name = generateRandomName();
//  dataToInsert.push({
//     name: name,
//     email: generateEmail(name)
//   });
// });
// console.log(dataToInsert);
// users.insertMany(dataToInsert)
// const generateCategories = () => {
//   const domains = [
//     'Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Food', 'Health', 'Auto', 'Garden', 'Books',
//     'Toys', 'Art', 'Music', 'Tools', 'Office', 'Pets', 'Travel', 'Fitness', 'Baby', 'Jewelry'
//   ];

//   const modifiers = [
//     'Professional', 'Premium', 'Basic', 'Luxury', 'Essential', 'Classic', 'Modern', 'Vintage', 'Smart', 'Eco',
//     'Digital', 'Organic', 'Custom', 'Designer', 'Handmade', 'Natural', 'Tech', 'Traditional', 'Portable', 'Deluxe'
//   ];

//   const types = [
//     'Accessories', 'Equipment', 'Supplies', 'Solutions', 'Products', 'Sets', 'Systems', 'Essentials', 'Collections', 'Kits',
//     'Tools', 'Gear', 'Items', 'Packages', 'Components', 'Bundles', 'Materials', 'Resources', 'Units', 'Elements'
//   ];

//   const categories = [];
  
//   for (let i = 0; i < domains.length; i++) {
//     for (let j = 0; j < modifiers.length; j++) {
//       for (let k = 0; k < Math.ceil(500 / (domains.length * modifiers.length)); k++) {
//         const type = types[k % types.length];
//         categories.push({
//           name: `${modifiers[j]} ${domains[i]} ${type}`
//         });
//       }
//     }
//   }

//   return categories.slice(0, 500);
// };

// const mockCategories = generateCategories();
// console.log(mockCategories);
// categories.insertMany(mockCategories)
console.table(users.findMany({
  select:{
    name:true
  },
  where:{
    name: 'James Smith'
  }
}))
console.table(categories.findMany({
  where:{
    name: 'Deluxe Art Accessories'
  }
}));
console.timeEnd("timeApp");
