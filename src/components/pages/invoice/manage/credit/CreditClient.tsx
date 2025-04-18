import { useInvoice } from "@/contexts/InvoiceContext";
import { numberParser } from "@/tools/numberPaser";
import {
  credit,
  createCredit,
  clientCredit,
} from "@/tools/sellers/credits/create";
import { getClientCredits } from "@/tools/sellers/credits/get";
import { DocumentSnapshot, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Column, Input } from "../../Product";

export const CreditClient = ({
  clientCredit,
}: {
  clientCredit: DocumentSnapshot<clientCredit>;
}) => {
  const [currentCredit, setCurrentCredit] = useState<
    DocumentSnapshot<credit> | undefined
  >(undefined);
  const [clientLastCredit, setClientLastCredit] =
    useState<DocumentSnapshot<credit>>();
  const [amount, setAmount] = useState(0);
  const [diff, setDiff] = useState(0);
  const { invoice } = useInvoice();

  // effect to create the new credit
  useEffect(() => {
    const getCredit = async () => {
      const lastCredit = await getClientCredits(clientCredit.ref);
      setClientLastCredit(lastCredit);

      if (!invoice) return;
      // logic to search if the new creadit already created
      const newCreditsArray = invoice.data().newCredits || [];
      const isThere = newCreditsArray.find(
        (ref) => ref.parent.parent?.id === clientCredit.id
      );

      if (isThere) {
        const current = await getDoc(isThere);
        setCurrentCredit(current);
      }

      const newCurrentRef = await createCredit({
        amount,
        client_ref: clientCredit.ref,
        last_amount: lastCredit?.data().amount || null,
        last_credit: lastCredit?.ref || null,
        next_credit: null,
        invoice_ref: invoice.ref,
        seller_ref: invoice.data().seller_ref,
      });

      const newCurrent = await getDoc(newCurrentRef);

      setCurrentCredit(newCurrent);
    };
    getCredit();
  }, [clientCredit]);

  useEffect(() => {
    const last = clientLastCredit?.data()?.amount || 0;

    setDiff(last - amount);
  }, [clientLastCredit, amount]);

  // effect to save the new credits
  // useEffect(() => {
  //   const credits = invoice?.data().newCredits
  //   if (!credits) return;

  //   const creditsIDs = credits.map(el => el.parent.parent?.id)
  //   const currentCredit = creditsIDs.find((el) => )
  // }, [])

  // effect to save the new credit
  useEffect(() => {
    const saveCredit = async () => {
      if (!invoice || !clientLastCredit) return;
      const last_amount = clientLastCredit?.data()?.amount || 0;
      const last_ref = clientLastCredit?.ref;
      const invo_ref = invoice.ref;
      const seller_ref = invoice.data().seller_ref;

      await createCredit({
        amount,
        client_ref: clientCredit.ref,
        last_amount: last_amount,
        last_credit: last_ref,
        next_credit: null,
        invoice_ref: invo_ref,
        seller_ref: seller_ref,
      });
    };

    saveCredit();
  }, [amount]);

  return (
    <>
      <Column gridColumn="1 / 3">{clientCredit.data()?.name}</Column>
      <Column>{numberParser(clientLastCredit?.data()?.amount || 0)}</Column>
      <Column>
        <Input
          type="number"
          value={amount}
          name="amount"
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </Column>
      <Column>{numberParser(diff)}</Column>
    </>
  );
};
