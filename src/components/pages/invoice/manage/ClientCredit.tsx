import { useEffect, useState } from "react";
import { useInvoice } from "@/contexts/InvoiceContext";
import { Container } from "@/styles/index.styles";
import { Timestamp, updateDoc } from "firebase/firestore";
import { oneWeekAfter } from "@/tools/time/weeks";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { Button } from "@/styles/Form.styles";

export function ClientCredit() {
  const { invoice } = useInvoice();
  const [isCash, setIsCash] = useState<boolean>(false);
  const [creditData, setCreditData] = useState<invoiceType["credit"]>({
    paid: isCash,
    paid_at: isCash ? Timestamp.fromDate(new Date()) : null,
    due_date: Timestamp.fromDate(new Date()),
  });

  async function isAlreadyPaid() {
    setIsCash(true);
  }

  async function isNotPaidYet() {
    setIsCash(false);
  }

  useEffect(() => {
    if (!invoice) return;
    const credit = invoice.data().credit;
    if (!credit) return;

    setCreditData(credit);
    setIsCash(credit.paid);
  }, [invoice]);

  useEffect(() => {
    async function manageItCash() {
      if (!invoice) return;
      if (invoice.data().credit?.paid === isCash) return;

      if (!invoice?.data()?.client_ref) return;

      await updateDoc(invoice.ref, {
        credit: {
          paid: isCash,
          paid_at: isCash ? new Date() : null,
          due_date: Timestamp.fromDate(
            isCash
              ? new Date()
              : oneWeekAfter(invoice.data().created_at?.toDate())
          ),
        } as invoiceType["credit"],
      });
    }

    manageItCash();
  }, [invoice, isCash]);

  const handleCashChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsCash(event.target.checked);
  };

  return (
    <Container styles={{ width: "100%" }}>
      <h2>Credito</h2>

      <Container>
        {isCash ? (
          <p style={{ margin: "10px 0" }}>
            La factura fue pagada el{" "}
            {creditData?.paid_at?.toDate().toLocaleDateString()}
          </p>
        ) : (
          <p style={{ margin: "10px 0" }}>
            La factura se vencerá dentro de una semana:{" "}
            {creditData?.due_date.toDate().toLocaleDateString()}
          </p>
        )}
        {creditData?.paid ? (
          <Button $warn onClick={isNotPaidYet}>
            Marcar como <b>NO</b> pagada
          </Button>
        ) : (
          <Button $primary onClick={isAlreadyPaid}>
            Marcar como pagada
          </Button>
        )}
      </Container>
    </Container>
  );
}
