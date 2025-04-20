import { Container } from "@/styles/index.styles";

type props = {
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  diff: number;
};

export function Missing({ isPaid, setIsPaid, diff }: props) {
  return (
    <Container styles={{ margin: "20px 0px" }}>
      <label
        style={{
          cursor: diff > 0 ? "not-allowed" : "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={isPaid}
          onChange={(e) => setIsPaid(e.target.checked)}
          disabled={diff > 0}
        />{" "}
        Marcar faltante como pagado
      </label>
    </Container>
  );
}
