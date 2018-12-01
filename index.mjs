import ecsBlueGreenDeployments from "./features/ecs-blue-green";
import renderMenu from "./renderMenu";

global.SELECTED_REGIONS = ["ap-northeast-2"];

(async () => {
  return renderMenu({
    ...ecsBlueGreenDeployments
  });
})();
