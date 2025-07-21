import { LoginForm } from "@/components/auth/LoginForm";
import { LoginContext } from "@/components/layouts/login.layout";
import { FlexContainer } from "@/styles/index.styles";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

export default function Home() {
  const { currentUser } = useContext(LoginContext);
  const router = useRouter();

  useEffect(() => {
    if (currentUser) router.push("/invoices"); // Redirige si ya está logueado
  }, [currentUser, router]);

  return (
    <FlexContainer styles={{ minHeight: "100vh", alignItems: "center" }}>
      <LoginForm />
    </FlexContainer>
  );
}

export async function getStaticProps() {
  // No necesitas pasar props, solo asegurar que la página se genere estáticamente.
  return {
    props: {},
  };
}
