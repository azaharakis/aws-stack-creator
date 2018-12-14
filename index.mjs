import ecsBlueGreenDeployments from "./features/ecs-blue-green";
import largePipeline from "./features/large-pipeline-stack";
import renderMenu from "./renderMenu";


renderMenu({
  ...ecsBlueGreenDeployments,
  ...largePipeline
}).catch(e => {
    console.log(e)
})
