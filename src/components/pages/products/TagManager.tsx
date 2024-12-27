import { InputText } from "@/components/Inputs/text";
import { Form, Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { getRandomColorContrastWhite } from "@/tools/generateColor";
import {
  createTag,
  deleteTag,
  getTags,
  TagComponent,
  TagType,
} from "@/tools/products/tags";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

interface props {
  state: TagType[];
  setState: Dispatch<SetStateAction<TagType[]>>;
}

export function TagManager({
  state: tagsAdded,
  setState: setTagsAdded,
}: props) {
  const [tags, setTags] = useState<Array<TagType>>([]);
  // const [tagsAdded, setTagsAdded] = useState<Array<TagType>>([]);
  const [refreshTags, setRefreshTags] = useState(true);
  const [timeoutSaved, setTimeoutSaved] = useState<NodeJS.Timeout>();
  const tagsFormRef = useRef<HTMLFormElement>(null);

  function handlerAddTag(tag: TagType) {
    const haveTheTag = tagsAdded.find((el) => el.name === tag.name);
    if (!haveTheTag) setTagsAdded([...tagsAdded, tag]);
  }

  function handlerRemoveTag(tagName: string) {
    const list = [...tagsAdded];
    const theRealList = list.filter((el) => el.name !== tagName);

    setTagsAdded(theRealList);
  }

  async function handlerCreateTag(e: FormEvent) {
    if (!tagsFormRef) return;
    e.preventDefault();
    const { tagName, tagColor } = e.target as EventTarget & {
      tagName: HTMLInputElement;
      tagColor: HTMLInputElement;
    };

    await createTag(tagName.value, tagColor.value);
    setRefreshTags(true);

    tagsFormRef.current?.reset();
  }

  async function onPointerDownDeleteTag(name: string) {
    const timeout = setTimeout(async () => {
      await deleteTag(name);
      handlerRemoveTag(name);
      setRefreshTags(true);
    }, 3000);

    setTimeoutSaved(timeout);
  }

  // this effect is to get the tags
  useEffect(() => {
    (async () => {
      if (!refreshTags) return;
      const tags = await getTags();
      const t = tags.data();
      if (t) setTags(Object.values(t.tags));
      setRefreshTags(false);
    })();
  }, [refreshTags]);

  return (
    <Container>
      <h2>Etiquetas</h2>
      <p>Las etiquetas sirven para facilitar la busqueda de productos</p>
      <Container styles={{ marginBottom: "20px" }}>
        {tagsAdded.length === 0 ? (
          <p>
            <b>¡El producto no tiene etiquetas!</b>
          </p>
        ) : (
          <Container>
            {tagsAdded.map((el, i) => {
              return (
                <TagComponent
                  onClick={() => handlerRemoveTag(el.name)}
                  $bg={el.color}
                  key={i}
                >
                  {el.name}
                </TagComponent>
              );
            })}
          </Container>
        )}
      </Container>
      <p>Crear una nueva etiquetas</p>
      <Form ref={tagsFormRef} onSubmit={handlerCreateTag}>
        <FlexContainer
          styles={{
            width: "auto",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <Container styles={{ display: "inline-block", marginRight: "10px" }}>
            <InputText name="tagName" required>
              Nombre de la etiqueta
            </InputText>
          </Container>
          <Container styles={{ cursor: "pointer", marginRight: "10px" }}>
            <label>
              <p>Color</p>
              <input
                name="tagColor"
                type="color"
                defaultValue={(() => getRandomColorContrastWhite())()}
              />
            </label>
          </Container>
          <Button $primary>Agregar</Button>
        </FlexContainer>
      </Form>
      {tags.length > 0 ? (
        tags.map((el, i) => (
          <TagComponent
            $bg={el.color}
            key={i}
            onClick={() => handlerAddTag(el)}
            $hold
            onPointerDown={() => onPointerDownDeleteTag(el.name)}
            onPointerUp={() => {
              clearInterval(timeoutSaved);
            }}
          >
            {el.name}
          </TagComponent>
        ))
      ) : (
        <p>
          <i>No hay etiquetas, puedes crear ahí arriba</i>
        </p>
      )}
    </Container>
  );
}
