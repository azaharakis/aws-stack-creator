import Operations from "./operations";
import Menu from "./menu";

export const cloudFormationMenu = ({ supportedRegions, ...operationProps }) => {
  const operations = Operations({
    ...operationProps
  });
  return Menu(operations, { supportedRegions });
};
