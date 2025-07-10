import { CreateUserForm } from "@/components/pages/session/createUserForm";
import { UpdateUserForm } from "@/components/pages/session/UpdateUserForm";
import { useGetAllAvailablesUsers } from "@/hooks/login/useGetAllAvailableUsers";
import { globalCSSVars } from "@/styles/colors";
import { Button as B } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { userDoc } from "@/tools/session/createUserDoc";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useState } from "react";
import styled, { css } from "styled-components";

export const InputContainer = styled(Container)`
  margin-bottom: 20px;
`;

export const Button = styled(B)<{ selected?: boolean }>`
  border-radius: 0px;
  border: 1px solid ${globalCSSVars["--detail"]};

  ${(props) => {
    if (props.selected) {
      return css`
        background-color: ${globalCSSVars["--background-highlight"]};
      `;
    }
  }}
`;

export default function Page() {
  const [selectedUser, setSelectedUser] =
    useState<QueryDocumentSnapshot<userDoc>>();
  const usersList = useGetAllAvailablesUsers();

  const handlerSelectUser = (u: QueryDocumentSnapshot<userDoc>) => {
    if (selectedUser?.id === u.id) {
      setSelectedUser(undefined);
    } else {
      setSelectedUser(u);
    }
  };

  return (
    <Container>
      <h1>Cuentas</h1>
      <FlexContainer>
        <Container styles={{ flex: 1 }}>
          <h2>Lista de Usuarios</h2>
          <FlexContainer>
            {usersList.map((el, i) => {
              return (
                <Button
                  selected={selectedUser?.id === el.id}
                  key={i}
                  onClick={() => handlerSelectUser(el)}
                >
                  {el.data().username} - {el.data().mail}
                </Button>
              );
            })}
          </FlexContainer>
        </Container>
        <Container styles={{ flex: 1 }}>
          {selectedUser ? (
            <UpdateUserForm selectedUser={selectedUser} />
          ) : (
            <CreateUserForm />
          )}
        </Container>
      </FlexContainer>
    </Container>
  );
}
