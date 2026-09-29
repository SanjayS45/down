import { BaseError } from "viem";

const names: Record<string, string> = {
  EmptyTitle: "Give it a name.",
  TitleTooLong: "Keep the name under 80 characters.",
  BadAmount: "Amount has to be more than zero.",
  BadSeats: "Need between 2 and 30 people.",
  DeadlineInPast: "Pick a lock time in the future.",
  Closed: "This Down is already closed.",
  AlreadyIn: "You already chipped in.",
  WrongAmount: "Send the exact seat amount.",
  Full: "It's full.",
  Late: "The lock time already passed.",
  NotBooker: "Only the booker can take the pot.",
  NotFull: "Not full yet.",
  StillOpen: "Deadline hasn't hit.",
  NotIn: "You're not in this one.",
  Locked: "It's full, so you can't drop out.",
  TransferFailed: "The refund transfer failed.",
};

export function txMessage(error: unknown) {
  if (error instanceof BaseError) {
    const revert = error.walk((err) => {
      const name = (err as { name?: string }).name;
      return typeof name === "string" && name in names;
    });
    if (revert && typeof (revert as { name?: string }).name === "string") {
      const named = names[(revert as { name: string }).name];
      if (named) return named;
    }
    for (const [key, message] of Object.entries(names)) {
      if (error.shortMessage.includes(key) || error.message.includes(key)) {
        return message;
      }
    }
    return error.shortMessage;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
