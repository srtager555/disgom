import { Container } from "@/styles/index.styles";
import { Line } from "react-chartjs-2";
import type { NextPageWithLayout } from "../_app";
import SalesComparisonChart from "@/components/chart";

const Feed: NextPageWithLayout = () => {
  return (
    <Container styles={{ width: "60vw" }}>
      <h2>Venta de las ultimas 2 semanas</h2>
      <Container
        styles={{
          width: "100%",
          display: "grid",
          // gridTemplateAreas: `"sells sells sells sells sells sells sells stats stats stats"`,
          gridTemplateColumns: "repeat(10, 1fr)",
          gridAutoRows: "50px",
          gap: "20px",
        }}
      >
        <Container
          styles={{
            // backgroundColor: "#ccc",
            // gridArea: "sells",
            gridColumn: "1 / -1",
            gridRow: "1 / 8",
            borderRadius: "20px",
          }}
        >
          <SalesComparisonChart />
        </Container>
        {/* <Container
          styles={{
            backgroundColor: "#ccc",
            // gridArea: "stats",
            gridColumn: "9 / -1",
            gridRow: "1 / 4",
            borderRadius: "20px",
          }}
        /> */}
        <Container
          styles={{
            backgroundColor: "#ccc",
            gridArea: "stats",
            gridColumn: "1 / -1",
            gridRow: "8 / 10",
            borderRadius: "20px",
          }}
        />
        <Container
          styles={{
            backgroundColor: "#ccc",
            gridArea: "stats",
            gridColumn: "1 / -1",
            gridRow: "11 / 15",
            borderRadius: "20px",
          }}
        />

        {/* <Container
        styles={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gridAutoRows: "100px",
          backgroundColor: "#c1c",
        }}
      >
      </Container> */}
      </Container>
      <p>There is the Feed</p>
    </Container>
  );
};

export default Feed;
