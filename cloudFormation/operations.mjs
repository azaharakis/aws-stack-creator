import {
  describeUntilDone,
  getStatusUntilDone
} from "./displayStackInformation";
import { cloudFormation } from "../clients";
import { getRegions } from "../renderMenu";

const Exceptions = {
  AlreadyExistsException: "AlreadyExistsException"
};

export const Operations = {
  ListAllStacks: `ListAllStacks`,
  List: "List",
  Create: `Create`,
  Delete: `Delete`,
  PickRegion: "PickRegion"
};

const callIfFunction = async (maybeFn, region) =>
  maybeFn && typeof maybeFn === "function" && (await maybeFn(region));

export default ({
  stackName,
  stackTemplate,
  afterCreate,
  beforeCreate,
  beforeDelete,
  afterDelete,
  regions
}) => {

  return {
    [Operations.List]: async () => await describeUntilDone(stackName),
    [Operations.ListAllStacks]: async () => await getStatusUntilDone(stackName),
    [Operations.Create]: async () => {
      global.SELECTED_REGIONS.forEach(async region => {
        const template = await stackTemplate(region);
        await callIfFunction(beforeCreate, region);
        try {
          await cloudFormation(region)
            .createStack(template)
            .promise();
        } catch (e) {
          if (e.code === Exceptions.AlreadyExistsException) {
            await cloudFormation(region)
              .updateStack(template)
              .promise();
          }
        }
        await cloudFormation(region)
          .waitFor("stackCreateComplete", { StackName: stackName }, () => {
            return callIfFunction(afterCreate, region);
          })
          .promise();
      });
      await describeUntilDone(stackName);
    },
    [Operations.Delete]: async () => {
      global.SELECTED_REGIONS.forEach(async region => {
        await callIfFunction(beforeDelete, region);
        await cloudFormation(region)
          .deleteStack({
            StackName: stackName
          })
          .promise();
        await cloudFormation(region)
          .waitFor("stackDeleteComplete", { StackName: stackName }, () =>
            callIfFunction(afterDelete, region)
          )
          .promise();
      });
      await getStatusUntilDone(stackName);
    },
    [Operations.PickRegion]: async () => {
      await getRegions(regions);
    }
  };
};
