import useSWR from "swr";

function UserList({ userUids }: { userUids: string[] }) {
  // La clave de SWR es un array que incluye la URL y las dependencias (uids)
  // `userUids` debe ser un array que contenga los UIDs que quieres buscar.
  // Si `userUids` está vacío o es null/undefined, SWR no hará la petición.
  const {
    data: users,
    error,
    isLoading,
  } = useSWR(
    userUids && userUids.length > 0
      ? ["/api/session/getUsersByIDs", userUids]
      : null,
    ([url, uids]) => fetcher(url, uids)
  );

  if (isLoading) return <div>Cargando usuarios...</div>;
  if (error) return <div>Error al cargar usuarios: {error.message}</div>;
  if (!users || users.length === 0)
    return <div>No se encontraron usuarios para los UIDs proporcionados.</div>;

  return (
    <div>
      <h1>Lista de Usuarios</h1>
      <ul>
        {users.map((user) => (
          <li key={user.uid}>
            <strong>{user.displayName || user.email}</strong> ({user.email})
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  marginLeft: "10px",
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
