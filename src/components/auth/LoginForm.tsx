import { Button } from "@/styles/Form.styles";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/router";
import { useState, FormEvent } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/invoices"); // Redirige a la página que desees después del login
    } catch (err: any) {
      setError(err.message);
      console.error("Error al iniciar sesión:", err);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "300px",
        margin: "auto",
      }}
    >
      <h2>Iniciar Sesión</h2>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label htmlFor="password">Contraseña:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <Button type="submit">Entrar</Button>
    </form>
  );
}
