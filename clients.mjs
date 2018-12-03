import CloudFormation from "aws-sdk/clients/cloudformation";
import EC2 from "aws-sdk/clients/ec2";
import ECS from "aws-sdk/clients/ecs";

export const cloudFormation = region => new CloudFormation({ region });
export const ec2 = region => new EC2({ region });
export const ecs = region => new ECS({ region });
