/** Client-safe helpers — do not import DB / Stripe here. */

export const DELETE_CONFIRM_PHRASE = "DELETE";

export type StripeCancelResult = {
  attempted: boolean;
  canceled: boolean;
  hadSubscription: boolean;
  error?: string;
};

/** Confirm typed email matches the account (case-insensitive). */
export function emailsMatchForDeletion(
  confirmEmail: string,
  accountEmail: string
): boolean {
  return (
    confirmEmail.trim().toLowerCase() === accountEmail.trim().toLowerCase()
  );
}

export function deleteConfirmPhraseMatches(phrase: string): boolean {
  return phrase.trim().toUpperCase() === DELETE_CONFIRM_PHRASE;
}

/** User-facing billing sentence for the account_deleted email. */
export function accountDeletedBillingNote(stripe: {
  hadSubscription: boolean;
  canceled: boolean;
}): string {
  if (!stripe.hadSubscription) {
    return "No active subscription was on file.";
  }
  if (stripe.canceled) {
    return "Your subscription was canceled.";
  }
  return "We could not cancel your subscription automatically. Contact support so you are not charged.";
}
