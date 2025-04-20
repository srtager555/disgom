import { Select } from "@/components/Inputs/select";
import { useGetTags } from "@/hooks/products/getTags";
import { FlexContainer } from "@/styles/index.styles";
import { Dispatch, SetStateAction } from "react";

type props = {
  setTagSelected: Dispatch<SetStateAction<string>>;
};

export function SelectTag({ setTagSelected }: props) {
  const tags = useGetTags();

  if (!tags) return null;

  return (
    <FlexContainer styles={{ marginRight: "20px", alignItems: "center" }}>
      <span style={{ marginRight: "10px", display: "inline-block" }}>
        Filtrar por etiquetas
      </span>
      {tags && (
        <Select
          marginBottom="0px"
          onChange={(e) => {
            setTagSelected(e.target.value);
          }}
          options={[
            { name: "Sin filtro", value: "", selected: true },
            ...Object.values(tags).map((el) => ({
              name: el.name,
              value: el.name,
            })),
          ]}
        />
      )}
    </FlexContainer>
  );
}
