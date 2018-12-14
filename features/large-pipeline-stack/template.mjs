import { getSubnetsForRegion } from "../../getSubnetsForRegion";
import { ec2 } from "../../clients";

export default async region => {
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
    Capabilities: ["CAPABILITY_IAM"],
    TemplateBody: JSON.stringify({
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        RootRole: {
          Type: "AWS::IAM::Role",
          Properties: {
            AssumeRolePolicyDocument: {
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Principal: {
                    Service: ["ec2.amazonaws.com"]
                  },
                  Action: ["sts:AssumeRole"]
                }
              ]
            },
            Path: "/",
            Policies: [
              {
                PolicyName: "root",
                PolicyDocument: {
                  Version: "2012-10-17",
                  Statement: [
                    {
                      Effect: "Allow",
                      Action: "*",
                      Resource: "*"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
      // AppPipeline: {
      //   Type: "AWS::CodePipeline::Pipeline",
      //   Properties: {
      //     RoleArn: { Ref: "CodePipelineServiceRole" },
      //     Stages: [
      //       {
      //         Name: "Source",
      //         Actions: [
      //           {
      //             Name: "SourceAction",
      //             ActionTypeId: {
      //               Category: "Source",
      //               Owner: "AWS",
      //               Version: "1",
      //               Provider: "S3"
      //             },
      //             OutputArtifacts: [
      //               {
      //                 Name: "SourceOutput"
      //               }
      //             ],
      //             Configuration: {
      //               S3Bucket: { Ref: "SourceS3Bucket" },
      //               S3ObjectKey: { Ref: "SourceS3ObjectKey" }
      //             },
      //             RunOrder: 1
      //           }
      //         ]
      //       }
      //     ]
      //   }
      // }
    })
  };
};
