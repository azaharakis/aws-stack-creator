import Operations from "./operations";
import Menu from "./menu";

export const cloudFormationMenu = ({ regions, ...rest }) => {
  const operations = Operations({ regions, ...rest });
  return Menu({ operations }, { regions });
};
