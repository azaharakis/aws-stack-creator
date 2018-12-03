import { getSubnetsForRegion } from "../../getSubnetsForRegion";
import { ec2 } from "../../clients";

export default async (region) => {
  const { Vpcs } = await ec2(region)
    .describeVpcs()
    .promise();
  const { VpcId } = Vpcs.find(v => v.IsDefault === true);
  const Subnets = await getSubnetsForRegion(VpcId, region);

  const config = {
    Port: 80,
    Protocol: "HTTP",
    TargetType: "ip",
    VpcId
  };

  return {
    TemplateBody: JSON.stringify({
      AWSTemplateFormatVersion: "2010-09-09",
      Parameters: {
        EcsContainerPort: {
          Type: "Number",
          Default: 80,
          Description: "Enter A Port for your container"
        }
      },
      Resources: {
        LoadBalancer: {
          Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
          Properties: {
            Subnets
          }
        },
        TargetGroup1: {
          Type: "AWS::ElasticLoadBalancingV2::TargetGroup",
          Properties: {
            ...config
          }
        },
        ProductionListener: {
          Type: "AWS::ElasticLoadBalancingV2::Listener",
          Properties: {
            DefaultActions: [
              {
                Type: "forward",
                TargetGroupArn: { Ref: "TargetGroup1" }
              }
            ],
            LoadBalancerArn: { Ref: "LoadBalancer" },
            Port: 80,
            Protocol: "HTTP"
          },
          DependsOn: ["LoadBalancer"]
        },
        TargetGroup2: {
          Type: "AWS::ElasticLoadBalancingV2::TargetGroup",
          Properties: {
            ...config
          }
        },
        TestListener: {
          Type: "AWS::ElasticLoadBalancingV2::Listener",
          Properties: {
            DefaultActions: [
              {
                Type: "forward",
                TargetGroupArn: { Ref: "TargetGroup2" }
              }
            ],
            LoadBalancerArn: { Ref: "LoadBalancer" },
            Port: 8080,
            Protocol: "HTTP"
          },
          DependsOn: ["LoadBalancer"]
        },
        ECSCluster: {
          Type: "AWS::ECS::Cluster",
          Properties: {
            ClusterName: 'ecs-cluster'
          }
        },
        ECSTaskDefinition: {
          Type: "AWS::ECS::TaskDefinition",
          Properties: {
            ContainerDefinitions: [
              {
                Command: [
                  "/bin/sh -c \"echo '<html> <head> <title>Amazon ECS Sample App</title> <style>body {margin-top: 40px; background-color: #333;} </style> </head><body> <div style=color:white;text-align:center> <h1>Amazon ECS Sample App</h1> <h2>Congratulations!</h2> <p>Your application is now running on a container in Amazon ECS.</p> </div></body></html>' >  /usr/local/apache2/htdocs/index.html && httpd-foreground\""
                ],
                EntryPoint: ["sh", "-c"],
                Essential: true,
                Image: "httpd:2.4",
                Name: "sample-web-app",
                PortMappings: [
                  {
                    ContainerPort: { Ref: "EcsContainerPort" },
                    HostPort: 80,
                    Protocol: "tcp"
                  }
                ]
              }
            ],
            Cpu: "256",
            ExecutionRoleArn: "ecsTaskExecutionRole",
            Family: 'ecs-cluster',
            Memory: "512",
            NetworkMode: "awsvpc",
            RequiresCompatibilities: ["FARGATE"]
          },
          DependsOn: ["ECSCluster"]
        }
      }
    })
  };
};
