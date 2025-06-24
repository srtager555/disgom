// Ejemplo en un componente React/Next.js
export async function fetchUsersByUids(userUids: string[]) {
  //   const userUids = ["uid123", "uid456", "uid789"]; // Reemplaza con los UIDs reales

  try {
    const response = await fetch("/api/session/getUsersByIDs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uids: userUids }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch users");
    }

    const data = await response.json();
    console.log("Usuarios obtenidos:", data.users);
    // Aquí puedes actualizar el estado de tu componente con los usuarios
    return data.users;
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    // Manejar el error, mostrar un mensaje al usuario, etc.
    return null;
  }
}

// Llama a la función cuando necesites los usuarios
// fetchUsersByUids();
