import { getSubnetsForRegion } from "../../getSubnetsForRegion";
import { cloudFormation, ecs, ec2 } from "../../clients";

const getStackResources = async (stackName, region) => {
  const [
    {
      StackResourceDetail: { PhysicalResourceId: targetGroupArn }
    },
    {
      StackResourceDetail: { PhysicalResourceId: cluster }
    },
    {
      StackResourceDetail: { PhysicalResourceId: taskDefinition }
    }
  ] = await Promise.all(
    ["TargetGroup1", "ECSCluster", "ECSTaskDefinition"].map(
      async LogicalResourceId => {
        return await cloudFormation(region)
          .describeStackResource({
            LogicalResourceId,
            StackName: stackName
          })
          .promise();
      }
    )
  );
  return {
    cluster,
    targetGroupArn,
    taskDefinition
  };
};

export const afterCreate = async (stackName, region) => {
  const { Vpcs } = await ec2(region)
    .describeVpcs()
    .promise();
  const { VpcId } = Vpcs.find(v => v.IsDefault === true);
  const Subnets = await getSubnetsForRegion(VpcId, region);
  const { cluster, targetGroupArn, taskDefinition } = await getStackResources(
    stackName,
    region
  );
  await ecs(region)
    .createService({
      taskDefinition,
      cluster,
      serviceName: stackName,
      loadBalancers: [
        {
          targetGroupArn,
          containerName: "sample-web-app",
          containerPort: 80
        }
      ],
      desiredCount: 1,
      launchType: "FARGATE",
      schedulingStrategy: "REPLICA",
      deploymentController: {
        type: "CODE_DEPLOY"
      },
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: Subnets,
          assignPublicIp: "ENABLED"
        }
      }
    })
    .promise();
  //   fs.writeFile(
  //     "../../artifacts/appspec.yaml",
  //     `version: 0.0
  // Resources:
  //   - TargetService:
  //       Type: AWS::ECS::Service
  //       Properties:
  //         TaskDefinition: ${taskDefinition}
  //         LoadBalancerInfo:
  //           ContainerName: "sample-web-app"
  //           ContainerPort: 80
  // `,
  //     "utf8",
  //     () => {}
  //   );
};

export const beforeDelete = async (stackName, region) => {
  const { cluster } = await getStackResources(stackName, region);
  const { taskArns } = await ecs(region)
    .listTasks({ cluster })
    .promise();
  await Promise.all(
    taskArns.map(async t => {
      await ecs(region)
        .stopTask({ cluster, task: t })
        .promise();
    })
  );
  await ecs(region)
    .deleteService({ service: stackName, cluster: stackName, force: true })
    .promise()
    .catch(e => e);
};
