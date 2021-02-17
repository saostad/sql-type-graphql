import * as fs from "fs";
import yargs from "yargs";
import * as path from "path";
import * as Handlebars from "handlebars";

import { Config, toObject, Typings } from "./index";

const args = yargs(process.argv)
  .alias("c", "config")
  .describe("c", "Config file.")
  .demandOption(["c"]).argv;

const configPath = path.join(process.cwd(), args.config as string);

const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as Config;

let outDirPath = path.join(process.cwd(), "generated");
if (typeof config.folder === "string") {
  outDirPath = config.folder;
} else {
  config.folder = outDirPath;
}

let createIndexFile = true;
if (typeof config.createIndexFile === "boolean") {
  createIndexFile = config.createIndexFile;
}

/** Override default template */
const defaultTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "graphql-operations.handlebars",
);

if (typeof config.template !== "string") {
  config.template = defaultTemplatePath;
}

/** Create out directory if not exist */
try {
  fs.mkdirSync(outDirPath);
  console.log(`${outDirPath} folder has been created.`);
} catch (error) {
  if (error.code !== "EEXIST") {
    console.log(error);
  }
}

const template: string = fs.readFileSync(config.template!, {
  encoding: "utf-8",
});

(async () => {
  console.log(`Connecting to db...`);
  const decoratedDatabase = await toObject(config);

  const { tables, enums } = decoratedDatabase;

  console.log(`Analyzing table's schema...`);
  const eachTable = tables.map((table) => {
    Handlebars.registerHelper(
      "sqlTypeToGqlType",
      function (sqlType: string, isPrimaryKey: boolean): string {
        if (isPrimaryKey) {
          return "ID";
        }
        switch (sqlType) {
          case "datetime":
          case "date":
            return "Date";
          case "int":
          case "tinyint":
            return "Int";
          case "float":
          case "numeric":
            return "Float";
          default:
            return "String";
        }
      },
    );
    const tableCompiler = Handlebars.compile(template);

    const data = tableCompiler({ table });
    return data;
  });

  console.log(`Creating .ts files...`);
  eachTable.forEach((fileContent, index) => {
    const filePath = path.join(
      outDirPath,
      `${decoratedDatabase.tables[index].name}.ts`,
    );

    fs.writeFileSync(filePath, fileContent);
  });

  if (createIndexFile) {
    console.log(`Creating index file...`);
    const indexTsCompiler = Handlebars.compile<{
      tables: Typings.DecoratedTable[];
    }>(`{{#each tables as |table|}}
export * from "./{{table.name}}";
{{/each}}`);
    const indexContent = indexTsCompiler({ tables: decoratedDatabase.tables });
    const filePath = path.join(outDirPath, `index.ts`);

    fs.writeFileSync(filePath, indexContent);
  }
  console.log(`Files written in directory ${outDirPath}`);
  console.log(`You can use "import {} form 'index.ts'"`);
})();
