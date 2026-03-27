import { Sequelize, DataTypes } from "sequelize";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";  // 👈 add pathToFileURL
import { dirname, join, basename } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.json")[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const files = fs.readdirSync(__dirname).filter(file =>
  !file.startsWith(".") &&
  file !== basename(__filename) &&
  file.endsWith(".js") &&
  !file.endsWith(".test.js")
);

for (const file of files) {
  const fileUrl = pathToFileURL(join(__dirname, file)).href;  // 👈 convert to file:// URL
  const { default: modelDef } = await import(fileUrl);
  const model = modelDef(sequelize, DataTypes);
  db[model.name] = model;
}

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;