import { getSubnetsForRegion } from "../../getSubnetsForRegion";
import { ecs, ec2 } from "../../clients";

const serviceName = "service-for-my-stack";

export const afterCreate = async (region, getStackResources) => {
  const { Vpcs } = await ec2(region)
    .describeVpcs()
    .promise();
  const { VpcId } = Vpcs.find(v => v.IsDefault === true);
  const Subnets = await getSubnetsForRegion(VpcId, region);

  const [
    { PhysicalResourceId: targetGroupArn },
    { PhysicalResourceId: cluster },
    { PhysicalResourceId: taskDefinition }
  ] = await getStackResources(
    "TargetGroup1",
    "ECSCluster",
    "ECSTaskDefinition"
  );
  await ecs(region)
    .createService({
      taskDefinition,
      cluster,
      serviceName,
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

export const beforeDelete = async (region, getStackResources) => {
  const [{ PhysicalResourceId: cluster }] = await getStackResources(
    "ECSCluster"
  );
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
    .deleteService({ service: serviceName, cluster, force: true })
    .promise()
    .catch(e => e);
};
