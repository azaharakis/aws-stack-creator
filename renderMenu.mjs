import inquirer from "inquirer";

const renderMenu = async items =>
  await inquirer.prompt([
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
    process.stdout.write("\x1B[2J");
  }
};

export const getRegions = async regionList => {
  const { selectedRegions } = await inquirer.prompt([
    {
      name: "selectedRegions",
      type: "checkbox",
      message: "Choose a region",
      choices: regionList
    }
  ]);
  global.SELECTED_REGIONS = selectedRegions;
};
