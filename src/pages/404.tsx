import Link from "next/link";
// import { useRouter } from "next/router";
// import { useEffect } from "react";

export default function Custom404() {
  // const router = useRouter();

  // useEffect(() => {
  //   router.push("/invoices");
  // }, [router]);

  return (
    <div>
      <h1>404 - Página no encontrada</h1>
      <p>Lo sentimos, la página que estás buscando no está disponible.</p>
      <Link href="/invoices">Volver a la página de facturas</Link>
    </div>
  );
}

export async function getStaticProps() {
  // No necesitas pasar props, solo asegurar que la página se genere estáticamente.
  return {
    props: {},
  };
}
