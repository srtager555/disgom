import { InitApp } from "@/firebase/InitApp";
import { NavLayout } from "./nav.layout";

export function Layout({ children }: { children: children }) {
  return (
    <InitApp>
      <NavLayout>{children}</NavLayout>
    </InitApp>
  );
}
