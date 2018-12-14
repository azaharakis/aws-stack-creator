import {
  describeUntilDone,
  getStatusUntilDone
} from "./displayStackInformation";
import { cloudFormation } from "../clients";

const Exceptions = {
  AlreadyExistsException: "AlreadyExistsException",
  ValidationError: "ValidationError"
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
  const List = async regions =>
    await Promise.all(regions.map(describeUntilDone(stackName)));
  const ListAllStacks = async regions =>
    await Promise.all(regions.map(getStatusUntilDone(stackName)));

  const Delete = async regions =>
    regions.map(async region => {
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

  const Create = regions =>
    regions.map(async region => {
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
          try {
            await cloudFormation(region)
              .updateStack(template)
              .promise();
          } catch (e) {
            if (e.code === Exceptions.ValidationError) {
              await cloudFormation(region)
                .deleteStack({
                  StackName: stackName
                })
                .promise();
            }
            throw e;
          }
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

  return {
    stackName,
    List,
    ListAllStacks,
    Create,
    Delete
  };
};
