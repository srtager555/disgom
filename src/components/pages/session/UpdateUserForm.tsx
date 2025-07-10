import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { userDoc } from "@/tools/session/createUserDoc";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Input } from "../invoice/Product";
import { Select } from "@/components/Inputs/select";
import { userLevels, userLevelsType } from "@/hooks/login/useCheckUserLevel";
import { updateUserBasicData } from "@/tools/session/updateUserBasicData";

export function UpdateUserForm({
  selectedUser,
}: {
  selectedUser: QueryDocumentSnapshot<userDoc>;
}) {
  const [username, setUsername] = useState(selectedUser.data().username);
  const data = useMemo(() => selectedUser.data(), [selectedUser]);

  const handlerUpdateBasicData = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const level = formData.get("level");
    const username = formData.get("username");

    if (!username) {
      alert("Debe ingresar un nombre de usuario");
      return;
    }

    await updateUserBasicData(
      selectedUser.id,
      username as string,
      level as userLevelsType
    );
  };

  const handlerUpatedPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password");
    const password_again = formData.get("password_again");

    alert("la contraseña es: " + password);

    if (password !== password_again) {
      alert("Las contraseñas no coinciden");
      return;
    }

    await fetch("/api/session/updatePassword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: selectedUser.id,
        newPassword: password,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        alert(data.message);

        if (res.status === 200) {
          e.currentTarget.reset();
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Hubo un error al actualizar la contraseña");
      });
  };

  return (
    <Container>
      <h1>Actualizar Usuario</h1>
      <FlexContainer styles={{ gap: "20px", flexDirection: "column" }}>
        <Container>
          <Form onSubmit={handlerUpdateBasicData}>
            <FlexContainer styles={{ gap: "20px", marginBottom: "20px" }}>
              <Container>
                <h3>Identificador</h3>
                <FlexContainer
                  styles={{ flexDirection: "column", alignItems: "flex-start" }}
                >
                  <Input
                    placeholder="Identificador"
                    type="text"
                    name="username"
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}
                  />
                </FlexContainer>
              </Container>
              <Container>
                <h3>Nivel de Acceso</h3>
                <Select
                  marginBottom="0px"
                  name="level"
                  options={Object.keys(userLevels).map((el) => {
                    return {
                      name: el,
                      value: el,
                      selected: data.level === el,
                    };
                  })}
                />
              </Container>
            </FlexContainer>

            <Button>Actualizar datos</Button>
          </Form>
        </Container>
        <Container>
          <h3>Cambio de Contraseña</h3>
          <Form onSubmit={handlerUpatedPassword}>
            <FlexContainer styles={{ gap: "20px", marginBottom: "20px" }}>
              <Input
                placeholder="Nueva contraseña"
                type="password"
                name="password"
              />
              <Input
                placeholder="Repita la contraseña"
                type="password"
                name="password_again"
              />
            </FlexContainer>
            <Button>Actualizar contraseña</Button>
          </Form>
        </Container>
      </FlexContainer>
    </Container>
  );
}
