import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { entryDoc, addEntry } from "@/tools/products/addEntry";
import { productDoc } from "@/tools/products/create";
import { EditEntryFromManageEntryAndOutputs } from "@/tools/products/editEntry";
import {
  QueryDocumentSnapshot,
  collection,
  CollectionReference,
  query,
  limit,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { debounce } from "lodash";
import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { Column, Input } from "../../invoice/Product";

type InputToEntriesProps = {
  entriesForDay: QueryDocumentSnapshot<entryDoc>[];
  product: QueryDocumentSnapshot<productDoc>;
};

export const InputToEntries = ({
  product,
  entriesForDay,
}: InputToEntriesProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const isSavingRef = useRef(false); // True when this component is performing a Firestore write

  // Stores the latest known state of the entry from props.
  // Used by handleSave to make decisions based on up-to-date DB information.
  const latestEntryFromPropsRef =
    useRef<QueryDocumentSnapshot<entryDoc> | null>(null);

  useEffect(() => {
    const currentEntryFromProps =
      entriesForDay.length > 0 ? entriesForDay[0] : null;
    const amountFromProps = currentEntryFromProps
      ? currentEntryFromProps.data().amount
      : 0;

    latestEntryFromPropsRef.current = currentEntryFromProps;

    if (isSavingRef.current) {
      // If a save operation initiated by this component is in progress,
      // we don't want to overwrite `inputValue` if the user continued typing.
      // `handleSave` will use the most recent `inputValue`.
      // `isSavingRef` will be reset in `handleSave`'s finally block.
      return;
    }

    // If not saving, and the input's current numeric value is different from props, update.
    // This handles initial load and external changes.
    // Also, update if the input is empty and props has a value (e.g., initial "0").
    if (
      Number(inputValue) !== amountFromProps ||
      (inputValue === "" && amountFromProps.toString() !== inputValue)
    ) {
      setInputValue(amountFromProps.toString());
    }
  }, [entriesForDay]); // Only depends on entriesForDay for prop-driven updates

  const handleSave = useCallback(
    async (inputValue: string) => {
      console.log("trying to create or edit an entry");
      debugger;
      const numericValue = Number(inputValue);

      const dbEntry = latestEntryFromPropsRef.current;
      const dbAmount = dbEntry ? dbEntry.data().amount : 0;

      if (isNaN(numericValue)) {
        console.log("Input is not a numeric value");
        setInputValue(dbAmount.toString()); // Revert to last known DB amount
        return;
      }

      // Condition 1: Update existing entry
      if (dbEntry) {
        if (numericValue === dbAmount) {
          // console.log("Input value matches DB. No update needed.");
          return;
        }
        isSavingRef.current = true;
        try {
          // console.log(`Updating entry ${dbEntry.id} from ${dbAmount} to ${numericValue}`);
          await EditEntryFromManageEntryAndOutputs(
            numericValue,
            product,
            dbEntry
          );
        } catch (error) {
          console.error("Error updating entry:", error);
          setInputValue(dbAmount.toString()); // Revert on error
        } finally {
          isSavingRef.current = false;
        }
      }
      // Condition 2: Create new entry
      else if (!dbEntry && numericValue > 0) {
        isSavingRef.current = true;
        try {
          // console.log(`Creating new entry with value ${numericValue}`);
          const coll = collection(
            product.ref,
            ProductsCollection.entry
          ) as CollectionReference<entryDoc>;
          const q = query(coll, orderBy("created_at", "desc"), limit(1));
          const lastEntrySnapshot = (await getDocs(q)).docs[0];

          if (!lastEntrySnapshot) {
            console.warn(
              "No previous entry to derive prices for new entry. Using defaults or aborting."
            );
            // Decide: either use default prices or abort and revert inputValue
            // For now, let's assume we'd revert if no price reference.
            setInputValue("0"); // Revert
            isSavingRef.current = false;
            return;
          }
          const prices = lastEntrySnapshot.data();
          await addEntry(product.ref, {
            purchase_price: prices.purchase_price,
            sale_price: prices.sale_price,
            seller_commission: prices.seller_commission,
            amount: numericValue,
          });
        } catch (error) {
          console.error("Error creating entry:", error);
          setInputValue("0"); // Revert on error
        } finally {
          isSavingRef.current = false;
        }
      } else {
        // No entry exists, and value is 0 or less. Or input was cleared for a non-existent entry.
        // Ensure input shows "0" if it was cleared and no DB entry exists.
        if (inputValue === "" && !dbEntry) setInputValue("0");
      }
    },
    [product]
  ); // entriesForDay is implicitly handled via latestEntryFromPropsRef

  const debouncedSave = useCallback(debounce(handleSave, 500), [handleSave]);

  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;

    setInputValue(newValue);
    debouncedSave(newValue);
  };

  const handleBlur = (e: FormEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;

    debouncedSave.cancel();
    handleSave(newValue);
  };

  return (
    <Column>
      <Input
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        min={0} // Consider adding min="0" if negative values are not allowed
      />
    </Column>
  );
};
