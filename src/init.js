const { Role, DB } = require("./database/database.js");

if (process.argv.length < 5) {
  console.log("Usage: node init.js <name> <email> <password>");
  process.exit(1);
}

const name = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const user = { name, email, password, roles: [{ role: Role.Admin }] };
async function main() {
  await DB.addUser(user).then((r) => console.log("created user: ", r));
  await DB.addMenuItem({ "title": "Crusty CI", "description": "A CI favorite", "image": "pizza1.png", "price": 0.028 });
}
main().catch((err) => console.error(err));
