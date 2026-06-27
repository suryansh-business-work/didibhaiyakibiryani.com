import { useState } from "react";
import { useQuery } from "@apollo/client";
import { YStack, XStack, Text, Button } from "tamagui";
import { ORDER_TICKETS } from "../graphql";
import { useColors } from "../theme";
import { accent } from "../tokens";
import { DropIn } from "../animations";
import { SupportForm } from "./SupportForm";

interface TicketMessage {
  by: "CUSTOMER" | "ADMIN";
  text: string;
  at: string;
}

interface Ticket {
  id: string;
  subject: string;
  body: string;
  imageUrl?: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  messages: TicketMessage[];
}

const STATUS_COLOR: Record<Ticket["status"], string> = {
  OPEN: accent.gold,
  IN_PROGRESS: "#6aa3e0",
  RESOLVED: accent.green,
};

function TicketCard({ ticket }: Readonly<{ ticket: Ticket }>) {
  const brand = useColors();
  return (
    <YStack gap={6} backgroundColor={brand.bgSoft} borderRadius={12} padding={12}>
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontWeight="800" color={brand.text} fontSize={13} flex={1}>
          {ticket.subject}
        </Text>
        <Text fontSize={11} fontWeight="800" color={STATUS_COLOR[ticket.status]}>
          {ticket.status.replace("_", " ")}
        </Text>
      </XStack>
      <Text fontSize={12} color={brand.muted}>{ticket.body}</Text>
      {ticket.messages.map((m) => (
        <YStack key={`${m.at}-${m.by}`} paddingLeft={10} borderLeftWidth={2} borderLeftColor={m.by === "ADMIN" ? brand.gold : brand.border}>
          <Text fontSize={11} color={brand.faint}>
            {m.by === "ADMIN" ? "Support team" : "You"}
          </Text>
          <Text fontSize={12} color={brand.dim}>{m.text}</Text>
        </YStack>
      ))}
    </YStack>
  );
}

/** "Support" button + box on the order details page. */
export function SupportBox({ orderId }: Readonly<{ orderId: string }>) {
  const [open, setOpen] = useState(false);
  const brand = useColors();
  const { data, refetch } = useQuery<{ orderTickets: Ticket[] }>(ORDER_TICKETS, {
    variables: { orderId },
  });

  const tickets = data?.orderTickets ?? [];

  return (
    <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={16} gap={12}>
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontWeight="800" color={brand.text}>Need help with this order?</Text>
        <Button
          size="$3"
          backgroundColor={open ? brand.cardSoft : "rgba(228,182,92,0.12)"}
          borderColor={brand.gold}
          borderWidth={1}
          color={brand.gold}
          fontWeight="800"
          onPress={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "🎧 Support"}
        </Button>
      </XStack>

      {tickets.map((t) => (
        <TicketCard key={t.id} ticket={t} />
      ))}

      {open && (
        <DropIn>
          <SupportForm
            orderId={orderId}
            onCreated={() => {
              setOpen(false);
              refetch().catch(() => undefined);
            }}
          />
        </DropIn>
      )}
    </YStack>
  );
}
