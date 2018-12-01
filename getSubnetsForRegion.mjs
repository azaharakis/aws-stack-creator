import _ from "lodash";
import { ec2 } from "./clients";

export const getSubnetsForRegion = async (vpcId, region) => {
  const { Subnets } = await ec2(region)
    .describeSubnets({
      Filters: [
        {
          Name: "vpc-id",
          Values: [vpcId]
        }
      ]
    })
    .promise();
  return _.uniqBy(Subnets, s => s.AvailabilityZone).map(
    ({ SubnetId }) => SubnetId
  );
};
