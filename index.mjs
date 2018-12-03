import ecsBlueGreenDeployments from "./features/ecs-blue-green";
import renderMenu from "./renderMenu";

(async () => {
  return renderMenu({
    ...ecsBlueGreenDeployments
  });
})();
