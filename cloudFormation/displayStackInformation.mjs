import { cloudFormation } from "../clients";

const Exceptions = {
  ValidationError: "ValidationError"
};

export const describeUntilDone = stackName => async region => {
  try {
    const { StackEvents } = await cloudFormation(region)
      .describeStackEvents({
        StackName: stackName
      })
      .promise();
    return StackEvents.sort((a, b) => a.Timestamp - b.Timestamp).map(
      ({
        LogicalResourceId,
        ResourceStatus,
        ResourceStatusReason,
        Timestamp
      }) => ({
        Region: region,
        Time: new Date(Timestamp).toLocaleString(),
        LogicalResourceId,
        ResourceStatus,
        ResourceStatusReason:
          ResourceStatusReason && ResourceStatusReason.replace(/(.80)/g, "$1\n")
      })
    );
  } catch (e) {
    switch (e.code) {
      case Exceptions.ValidationError:
        return `no stack exists for ${region}`;
    }
  }
};

export const getStatusUntilDone = stackName => async region => {
  const { StackSummaries } = await cloudFormation(region)
    .listStacks()
    .promise();

  const { CreationTime, StackStatus } = StackSummaries.find(
    ({ StackName }) => StackName === stackName
  );

  return {
    Region: region,
    CreationTime: new Date(CreationTime).toLocaleString(),
    StackStatus,
    Link: `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}`
  };
};
