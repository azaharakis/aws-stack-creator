import inquirer from "inquirer";
import fs from "fs";

const renderMenu = items =>
  inquirer.prompt([
    {
      name: "choice",
      type: "list",
      message: "Choose an option",
      choices: Object.values(items)
    }
  ]);

const CommonMenuItems = {
  GoBack: "Go back"
};

export default async (functions, { heading } = {}) => {
  while (true) {
    console.log(heading && heading());
    const { choice } = await renderMenu({
      ...Object.keys(functions),
      ...CommonMenuItems
    });
    if (choice === CommonMenuItems.GoBack) {
      return;
    }

    await functions[choice]();
  }
};

export const setRegions = async regionList => {
  const { selectedRegions } = await inquirer.prompt([
    {
      name: "selectedRegions",
      type: "checkbox",
      message: "Choose a region",
      choices: regionList
    }
  ]);

  fs.writeFile(
    "./cache.json",
    JSON.stringify({ regions: selectedRegions }),
    "utf8",
    () => {}
  );
  return selectedRegions;
};

const timeout = ms => new Promise(res => setTimeout(res, ms));

export const loopUntilFnReturnsTrue = async fn => {
  let breakLoop = false;
  const listenForCancel = function() {
    breakLoop = true;
    process.removeListener("SIGINT", listenForCancel);
  };
  process.on("SIGINT", listenForCancel);
  breakLoop = await fn();
  await timeout(1000);
  process.removeListener("SIGINT", listenForCancel);
  breakLoop !== true && (await loopUntilFnReturnsTrue(fn));
};

