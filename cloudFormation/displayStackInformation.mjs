import { cloudFormationWithMultiRegionSupport } from "../clients";

const timeout = ms => new Promise(res => setTimeout(res, ms));

export const describeUntilDone = async stackName => {
  let breakLoop = false;
  const listenForCancel = function() {
    breakLoop = true;
    process.removeListener("SIGINT", listenForCancel);
  };

  process.on("SIGINT", listenForCancel);
  const tableData = await cloudFormationWithMultiRegionSupport.describeStackEvents(
    { StackName: stackName }
  );

  process.stdout.write("\x1B[2J");
  tableData.forEach(async ({ data: { StackEvents } = {}, error, metaData }) => {
    console.log(metaData.region);
    if (error) return console.log(error.message);
    console.table(
      StackEvents.sort((a, b) => a.Timestamp - b.Timestamp).map(
        ({
          LogicalResourceId,
          ResourceStatus,
          ResourceStatusReason,
          Timestamp
        }) => ({
          Time: new Date(Timestamp).toLocaleString(),
          LogicalResourceId,
          ResourceStatus,
          ResourceStatusReason:
            ResourceStatusReason &&
            ResourceStatusReason.replace(/(.80)/g, "$1\n")
        })
      )
    );
  });

  await timeout(1000);
  process.removeListener("SIGINT", listenForCancel);
  !breakLoop
    ? await describeUntilDone(stackName)
    : process.stdout.write("\x1B[2J");
};

export const getStatusUntilDone = async stackName => {
  let breakLoop = false;
  const listenForCancel = function() {
    breakLoop = true;
    process.removeListener("SIGINT", listenForCancel);
  };
  process.on("SIGINT", listenForCancel);
  const listedStacks = await cloudFormationWithMultiRegionSupport.listStacks();

  const foundStacks = listedStacks.map(
    ({ data: { StackSummaries }, metaData }) => ({
      metaData,
      data: StackSummaries.find(({ StackName }) => StackName === stackName)
    })
  );

  process.stdout.write("\x1B[2J");
  console.table(
    foundStacks.map(({ metaData, data = null }) => {
      if (!data)
        return {
          Region: metaData.region,
          CreationTime: null,
          StackStatus: null
        };
      const { CreationTime, StackStatus } = data;

      return {
        Region: metaData.region,
        CreationTime: new Date(CreationTime).toLocaleString(),
        StackStatus,
        Link: `https://${
          metaData.region
        }.console.aws.amazon.com/cloudformation/home?region=${metaData.region}`
      };
    })
  );
  await timeout(1000);
  process.removeListener("SIGINT", listenForCancel);
  !breakLoop
    ? await getStatusUntilDone(stackName)
    : process.stdout.write("\x1B[2J");
};
