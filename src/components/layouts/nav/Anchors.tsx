import { Icon } from "@/components/Icons";
import {
  AnchorContainer,
  SimpleAnchor,
  AnchorPlus,
  Anchor,
  AnchorList,
} from "@/styles/Nav.module";
import { NavElement } from ".";

type anchorProps = NavElement & {
  child: boolean;
};

export const Anchors = ({
  href,
  name,
  icon,
  children,
  child,
  mustBeAnchor,
}: anchorProps) => {
  // Verifica si hay hijos usando Object.keys y su longitud
  const hasChildren = children && Object.keys(children).length > 0;

  return (
    <AnchorContainer>
      {mustBeAnchor ? (
        <SimpleAnchor
          href={!hasChildren ? href : ""}
          onClick={hasChildren ? (e) => e.preventDefault() : undefined}
        >
          {icon && <Icon iconType={icon} />}
          {name}
          {hasChildren && <AnchorPlus />}
        </SimpleAnchor>
      ) : (
        <Anchor
          href={!hasChildren ? href : ""} // El enlace principal no es navegable si tiene hijos
          onClick={hasChildren ? (e) => e.preventDefault() : undefined} // Previene navegación si hay hijos
        >
          {icon && <Icon iconType={icon} />}
          {name}
          {hasChildren && <AnchorPlus />}
        </Anchor>
      )}

      {hasChildren && (
        <AnchorList className={child ? "list child" : "list"}>
          {Object.values(children).map((el, i) => (
            <Anchors key={i} {...el} child />
          ))}
        </AnchorList>
      )}
    </AnchorContainer>
  );
};
