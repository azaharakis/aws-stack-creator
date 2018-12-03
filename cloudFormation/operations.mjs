import {
  describeUntilDone,
  getStatusUntilDone
} from "./displayStackInformation";
import { cloudFormation } from "../clients";

const Exceptions = {
  AlreadyExistsException: "AlreadyExistsException"
};

const callIfFunction = async (maybeFn, ...args) =>
  maybeFn && typeof maybeFn === "function" && (await maybeFn(...args));

const getStackResources = (stackName, region) => async (...resources) => {
  const result = await Promise.all(
    resources.map(async LogicalResourceId => {
      return await cloudFormation(region)
        .describeStackResource({
          LogicalResourceId,
          StackName: stackName
        })
        .promise();
    })
  );
  return result.map(({ StackResourceDetail }) => StackResourceDetail);
};

export default ({
  stackName,
  stackTemplate,
  afterCreate,
  beforeCreate,
  beforeDelete,
  afterDelete
}) => {
  return {
    List: async regions =>
      await Promise.all(regions.map(describeUntilDone(stackName))),
    ListAllStacks: async regions =>
      await Promise.all(regions.map(getStatusUntilDone(stackName))),
    Create: async regions => {
      regions.forEach(async region => {
        const template = {
          StackName: stackName,
          ...(await stackTemplate(region))
        };
        await callIfFunction(
          beforeCreate,
          region,
          getStackResources(stackName, region)
        );
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
            return callIfFunction(
              afterCreate,
              region,
              getStackResources(stackName, region)
            );
          })
          .promise();
      });
    },
    Delete: async regions => {
      regions.forEach(async region => {
        await callIfFunction(
          beforeDelete,
          region,
          getStackResources(stackName, region)
        );
        await cloudFormation(region)
          .deleteStack({
            StackName: stackName
          })
          .promise();
        await cloudFormation(region)
          .waitFor("stackDeleteComplete", { StackName: stackName }, () =>
            callIfFunction(
              afterDelete,
              region,
              getStackResources(stackName, region)
            )
          )
          .promise();
      });
    }
  };
};
