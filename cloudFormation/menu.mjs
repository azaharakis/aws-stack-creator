import _ from "lodash";
import renderMenu, { loopUntilFnReturnsTrue, setRegions } from "../renderMenu";
import regionsFromCache from "../cache.json";
export let { regions: selectedRegions } = regionsFromCache;

export default async (
  { stackName, ListAllStacks, List, Create, Delete, PickRegion },
  { supportedRegions }
) => {
  if (!selectedRegions) {
    selectedRegions = await setRegions(supportedRegions);
  }

  const list = () =>
    loopUntilFnReturnsTrue(async () => {
      const results = await ListAllStacks(selectedRegions);
      process.stdout.write("\x1B[2J");
      console.table(_.flatten(results));

      return !results.some(
        ({ StackStatus }) => StackStatus.indexOf("PROGRESS") !== -1
      );
    });

  const describe = async () => {
    return loopUntilFnReturnsTrue(async () => {
      const results = await List(selectedRegions);
      process.stdout.write("\x1B[2J");
      console.table(_.flatten(results));

      return results.every(r => {
        const { LogicalResourceId = "", ResourceStatus = "" } = _.last(r);
        return (
          LogicalResourceId === stackName &&
          ResourceStatus.indexOf("COMPLETE") !== -1
        );
      });
    });
  };

  try {
    return renderMenu(
      {
        [`List stacks status`]: list,
        [`Display stacks Events`]: describe,
        [`Create stacks`]: async () => {
          await Promise.all([...Create(selectedRegions), describe()]).catch(
            e => {
              throw e;
            }
          );
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
  } catch (e) {
    throw e;
  }
};
