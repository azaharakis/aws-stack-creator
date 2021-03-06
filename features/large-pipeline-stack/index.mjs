import stackTemplate from "./template";
import { cloudFormationMenu } from "../../cloudFormation";

export default {
  ["Large pipeline stack"]: () => {
    return cloudFormationMenu({
      stackName: "large-pipeline",
      stackTemplate,
      supportedRegions: [
        "us-west-1",
        "us-east-1",
        "us-west-2",
        "eu-west-3",
        "eu-west-1",
        "ap-south-1",
        "us-east-2",
        "eu-central-1",
        "sa-east-1",
        "ap-northeast-2",
        "eu-west-2",
        "ap-northeast-1",
        "ap-southeast-1",
        "ap-southeast-2",
        "ca-central-1"
      ]
    });
  }
};
