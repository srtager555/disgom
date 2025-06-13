import { Container, GridContainer } from "@/styles/index.styles";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Column, Input } from "../../Product";
import { useInvoice } from "@/contexts/InvoiceContext";
import { updateDoc } from "firebase/firestore";
import { isEqual, debounce } from "lodash";
import { numberParser } from "@/tools/numberPaser";
import { parseNumberInput } from "@/tools/parseNumericInput";

type props = {
  setMoneyAmount: Dispatch<SetStateAction<number>>;
  moneyAmount: number;
};

export type rawMoneyType = Record<
  string | number,
  { amount: number; total: number }
>;

const gridTemplateColumns = "100px repeat(2, 90px)";
const DEBOUNCE_SAVE_DELAY = 1000; // 1 segundo de espera

export function Money({ setMoneyAmount, moneyAmount }: props) {
  const { invoice } = useInvoice();
  const [money, setMoney] = useState<rawMoneyType>({
    deposits: {
      total: 0,
      amount: 0,
    },
  });
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const moneyList = [1, 2, 5, 10, 20, 50, 100, 200, 500];

  // --- Cargar datos iniciales desde invoice ---
  useEffect(() => {
    if (!invoice || initialLoadComplete) return;

    const savedMoney = invoice.data()?.money as rawMoneyType | undefined;

    // Asegura que 'deposits' exista, incluso si no hay datos guardados o están vacíos
    const initialMoneyState = {
      deposits: { amount: 0, total: 0 },
      ...(savedMoney ?? {}),
    };

    if (savedMoney) {
      console.log("Cargando 'money' guardado desde invoice:", savedMoney);
    }

    setMoney(initialMoneyState);
    setInitialLoadComplete(true);
  }, [initialLoadComplete, invoice]);

  // --- Función debounced para guardar en Firestore ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSaveMoney = useCallback(
    debounce(async (currentMoneyState: rawMoneyType) => {
      if (!invoice?.ref || !invoice.exists()) {
        console.warn(
          "Guardado debounced omitido: Referencia de factura no válida."
        );
        return;
      }

      const savedMoney = invoice.data()?.money ?? {};
      if (!isEqual(currentMoneyState, savedMoney)) {
        console.log(
          "Debounced save: El estado 'money' ha cambiado, actualizando Firestore..."
        );
        try {
          await updateDoc(invoice.ref, {
            money: currentMoneyState,
          });
          console.log("Debounced save: 'money' actualizado en Firestore.");
        } catch (error) {
          console.error(
            "Debounced save: Error al actualizar 'money' en Firestore:",
            error
          );
        }
      } else {
        console.log(
          "Debounced save: El estado 'money' es igual al guardado, omitiendo actualización."
        );
      }
    }, DEBOUNCE_SAVE_DELAY),
    [invoice]
  );

  // --- Efecto para calcular total y llamar al guardado debounced (sin cambios) ---
  useEffect(() => {
    if (!initialLoadComplete) return;

    const totalAmount = Object.values(money).reduce((acc, next) => {
      return acc + (next.total || 0);
    }, 0);
    setMoneyAmount(totalAmount);

    debouncedSaveMoney(money);

    return () => {
      debouncedSaveMoney.cancel();
    };
  }, [money, setMoneyAmount, initialLoadComplete, debouncedSaveMoney]);

  return (
    <Container>
      <MoneyInput
        moneyAmount={1}
        deposits
        setMoney={setMoney}
        initialAmount={money["deposits"]?.amount ?? 0}
        initialLoadComplete={initialLoadComplete}
      />

      {moneyList.map((item) => {
        return (
          <MoneyInput
            moneyAmount={item}
            setMoney={setMoney}
            key={item}
            initialAmount={money[item]?.amount ?? 0}
            initialLoadComplete={initialLoadComplete}
          />
        );
      })}

      {/* Total Display (sin cambios) */}
      <GridContainer $gridTemplateColumns={gridTemplateColumns}>
        <Column />
        <Column>Total</Column>
        <Column>{numberParser(moneyAmount)}</Column>
      </GridContainer>
    </Container>
  );
}

// --- Props de MoneyInput (sin itemKey) ---
type MoneyInputProps = {
  moneyAmount: number; // El valor numérico (ej: 50, 100)
  setMoney: Dispatch<SetStateAction<rawMoneyType>>;
  initialAmount: number;
  initialLoadComplete: boolean;
  deposits?: boolean;
};

// --- Componente MoneyInput (usa moneyAmount como clave) ---
const MoneyInput = ({
  setMoney,
  moneyAmount, // Este es el valor numérico que usaremos como clave
  initialAmount,
  initialLoadComplete,
  deposits,
}: MoneyInputProps) => {
  const [amount, setAmount] = useState("0");

  // --- Establecer el valor inicial (sin cambios) ---
  useEffect(() => {
    if (initialLoadComplete && Number(amount) !== initialAmount) {
      console.log(
        `MoneyInput (${moneyAmount}): Setting initial amount to ${initialAmount}`
      );
      setAmount(String(initialAmount));
    }
  }, [initialAmount, initialLoadComplete, amount, moneyAmount]); // Se mantiene amount aquí para re-evaluar si cambia externamente

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseNumberInput(() => {}, e, { returnRaw: true });
    if (newAmount === undefined) return;

    setAmount(newAmount); // Actualiza estado local
    const numericNewAmount = Number(newAmount);

    if (isNaN(numericNewAmount)) {
      return;
    }

    setMoney((prev) => ({
      ...prev,
      // Usa 'moneyAmount' (el número) como clave en el objeto 'money'
      [deposits ? "deposits" : moneyAmount]: {
        amount: numericNewAmount,
        total: numericNewAmount * moneyAmount,
      },
    }));
  };

  return (
    <GridContainer $gridTemplateColumns={gridTemplateColumns}>
      <Column>{deposits ? "Deposito" : moneyAmount}</Column>
      <Column>
        <Input
          type="text"
          value={String(amount)}
          onChange={handleInputChange}
        />
      </Column>
      <Column>{numberParser(Number(amount) * moneyAmount)}</Column>
    </GridContainer>
  );
};
