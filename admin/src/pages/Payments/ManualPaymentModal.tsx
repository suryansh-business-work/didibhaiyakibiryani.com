import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { Autocomplete, TextField, Typography } from "@mui/material";
import { ORDERS } from "../../graphql/queries";
import { CREATE_MANUAL_PAYMENT } from "../../graphql/mutations";
import { Modal, FormActions, inr } from "../../components/ui";
import { RHFField, RHFSelect, paymentSchema, type PaymentForm } from "../../form";

interface OrderOpt {
  id: string;
  orderNumber: string;
  total: number;
  user?: { name?: string } | null;
}

const METHOD_OPTIONS = ["Cash", "UPI", "Card", "Bank transfer", "Other"].map((m) => ({ value: m, label: m }));
const STATUS_OPTIONS = [
  { value: "CAPTURED", label: "Captured (paid)" },
  { value: "CREATED", label: "Created (pending)" },
  { value: "FAILED", label: "Failed" },
];

const BLANK: PaymentForm = { orderId: "", amount: 0, method: "Cash", status: "CAPTURED", reference: "", note: "" };

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

/** Record an offline / manual payment against an order. */
export default function ManualPaymentModal({ onClose, onCreated }: Readonly<Props>) {
  const { data } = useQuery<{ orders: OrderOpt[] }>(ORDERS, { variables: { status: null } });
  const [create] = useMutation(CREATE_MANUAL_PAYMENT);
  const {
    control, handleSubmit, setValue, setError,
    formState: { errors, isSubmitting },
  } = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema), defaultValues: BLANK });

  const orders = data?.orders ?? [];

  async function onSave(form: PaymentForm) {
    try {
      await create({
        variables: {
          orderId: form.orderId,
          amount: Number(form.amount),
          method: form.method?.trim() || null,
          status: form.status,
          reference: form.reference?.trim() || null,
          note: form.note?.trim() || null,
        },
      });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not record the payment." });
    }
  }

  return (
    <Modal
      title="Record payment"
      onClose={onClose}
      footer={<FormActions onCancel={onClose} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
    >
      <Autocomplete
        options={orders}
        getOptionLabel={(o) => `${o.orderNumber} · ${inr(o.total)}${o.user?.name ? ` · ${o.user.name}` : ""}`}
        isOptionEqualToValue={(o, val) => o.id === val.id}
        onChange={(_, val) => {
          setValue("orderId", val?.id ?? "", { shouldValidate: true });
          if (val) setValue("amount", val.total);
        }}
        renderInput={(params) => (
          <TextField {...params} label="Order" size="small" margin="dense" error={Boolean(errors.orderId)} helperText={errors.orderId?.message} />
        )}
      />
      <RHFField control={control} name="amount" label="Amount (₹)" type="number" error={errors.amount?.message} />
      <RHFSelect control={control} name="method" label="Method" options={METHOD_OPTIONS} error={errors.method?.message} />
      <RHFSelect control={control} name="status" label="Status" options={STATUS_OPTIONS} error={errors.status?.message} />
      <RHFField control={control} name="reference" label="Reference / receipt no. (optional)" error={errors.reference?.message} />
      <RHFField control={control} name="note" label="Note (optional)" error={errors.note?.message} />
      {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
    </Modal>
  );
}
