import { Select } from "@/components/Inputs/select";
import { userLevels, userLevelsType } from "@/hooks/login/useCheckUserLevel";
import { Form, Button } from "@/styles/Form.styles";
import { FlexContainer } from "@/styles/index.styles";
import { Input } from "../invoice/Product";
import { InputContainer } from "@/pages/session";
import { createUserDoc } from "@/tools/session/createUserDoc";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";

export function CreateUserForm() {
  const handlerCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const password_again = formData.get("password_again");
    const username = formData.get("username");
    const level = formData.get("level");

    if (password !== password_again) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const auth = getAuth();

    await createUserWithEmailAndPassword(
      auth,
      email as string,
      password as string
    )
      .then(async (userCredential) => {
        const user = userCredential.user;

        await createUserDoc(
          user,
          username as string,
          level as userLevelsType,
          email as string
        );

        e.currentTarget.reset();
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
      });
  };

  return (
    <>
      <h2>Crear nuevo Usuario</h2>
      <FlexContainer>
        <Form autoComplete="off" onSubmit={handlerCreateUser}>
          <InputContainer>
            <h4>Correo e Identificador</h4>
            <FlexContainer styles={{ gap: "20px" }}>
              <Input
                placeholder="Identificador"
                autoComplete="off"
                type="text"
                name="username"
              />
              <Input
                type="email"
                autoComplete="off"
                placeholder="Correo"
                name="email"
              />
            </FlexContainer>
          </InputContainer>

          <InputContainer>
            <h4>Contraseña</h4>
            <FlexContainer styles={{ gap: "20px" }}>
              <Input
                type="password"
                autoComplete="off"
                placeholder="Contraseña"
                name="password"
              />
              <Input
                type="password"
                autoComplete="off"
                placeholder="Repetir Contraseña"
                name="password_again"
              />
            </FlexContainer>
          </InputContainer>
          <h3>Nivel de Acceso</h3>
          <Select
            name="level"
            options={Object.keys(userLevels).map((el) => {
              return {
                name: el,
                value: el,
              };
            })}
          />
          <Button>Crear</Button>
        </Form>
      </FlexContainer>
    </>
  );
}
