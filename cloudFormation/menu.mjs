import _ from "lodash";
import renderMenu, { clearAndCallAgain, setRegions } from "../renderMenu";
import regionsFromCache from "../cache.json";
export let { regions: selectedRegions } = regionsFromCache;

export default async (
  { ListAllStacks, List, Create, Delete, PickRegion },
  { supportedRegions }
) => {
  if (!selectedRegions) {
    selectedRegions = await setRegions(supportedRegions);
  }

  const list = () => clearAndCallAgain(() => ListAllStacks(selectedRegions));
  const describe = () =>
    clearAndCallAgain(() => List(selectedRegions), _.flatten);

  return renderMenu(
    {
      [`List stacks status`]: list,
      [`Display stacks Events`]: describe,
      [`Create stacks`]: async () => {
        await Create(selectedRegions);
        await describe();
      },
      [`Delete stacks`]: async () => {
        await Delete(selectedRegions);
        await list();
      },
      [`Select Regions`]: async () => {
        selectedRegions = await setRegions(supportedRegions);
      }
    },
    {
      heading: () =>
        `Operating in the following regions ${selectedRegions.join(", ")}
      
      ------------------------
      `
    }
  );
};
