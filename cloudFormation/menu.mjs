import renderMenu, { getRegions } from "../renderMenu";

import { Operations } from "./operations";

const MenuItems = {
  [Operations.ListAllStacks]: `List stacks status`,
  [Operations.List]: "Display stacks Events",
  [Operations.Create]: `Create stacks`,
  [Operations.Delete]: `Delete stacks`,
  [Operations.PickRegion]: "Select Regions"
};

export default async ({ operations }, { regions }) => {
  if (!global.SELECTED_REGIONS) {
    await getRegions(regions);
  }

  const menu = Object.keys(MenuItems).reduce((prev, next) => {
    return {
      ...prev,
      [MenuItems[next]]: operations[next]
    };
  }, {});

  return renderMenu(menu, {
    heading: () =>
      `Operating in the following regions ${global.SELECTED_REGIONS.join(", ")}
      
      ------------------------
      `
  });
};
