import { InitApp } from "@/firebase/InitApp";

export function Layout({ children }: { children: children }) {
  return <InitApp>{children}</InitApp>;
}
