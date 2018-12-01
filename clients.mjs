import CloudFormation from "aws-sdk/clients/cloudformation";
import EC2 from "aws-sdk/clients/ec2";
import ECS from "aws-sdk/clients/ecs";
import { AVAILABLE_REGIONS, REGION } from "./CONSTANTS";

const CloudFormationWithMultiRegionSupport = (...regions) => {
  const clients = regions.reduce((prev, next) => {
    return {
      ...prev,
      [next]: new CloudFormation({ region: next })
    };
  }, {});

  const clientMethods = Object.getOwnPropertyNames(
    Object.getPrototypeOf(clients[Object.getOwnPropertyNames(clients)[0]])
  );

  return clientMethods.reduce((prev, method) => {
    return {
      ...prev,
      [method]: async (...args) => {
        return await Promise.all(
          global.SELECTED_REGIONS.map(async (region, index) => {
            let data;
            let error;
            await clients[region][method](...args)
              .promise()
              .then(d => (data = d))
              .catch(e => (error = e));
            return {
              metaData: {
                region: global.SELECTED_REGIONS[index]
              },
              data,
              error
            };
          })
        );
      }
    };
  }, {});
};

export const cloudFormationWithMultiRegionSupport = CloudFormationWithMultiRegionSupport(
  ...AVAILABLE_REGIONS
);

export const cloudFormation = (region = global.currentRegion) => new CloudFormation({ region });
export const ec2 = (region = global.currentRegion) => new EC2({ region });
export const ecs = (region = global.currentRegion) => new ECS({ region });
