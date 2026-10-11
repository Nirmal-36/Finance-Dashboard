package com.financelensmobile.capture

/** A payment extracted from a UPI-app notification. */
data class ParsedPayment(
  val amount: String, // plain decimal, e.g. "1250.50"
  val type: String, // "debit" | "credit"
  val merchant: String,
  val referenceId: String?,
)

/**
 * Turns the text of a PhonePe / Google Pay / Paytm style notification into a
 * payment. Deliberately conservative: anything that isn't clearly a completed
 * payment (failed, pending, reminders, offers, collect requests) returns null
 * so we never record money that didn't move.
 */
object NotificationParser {
  private const val FALLBACK_MERCHANT = "Bank transaction"

  private val AMOUNT = Regex("""(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)""", RegexOption.IGNORE_CASE)
  private val REFERENCE =
    Regex("""(?:UPI\s*Ref(?:erence)?(?:\s*(?:No|ID))?|UPI|Txn\s*ID|Transaction\s*ID|Ref(?:erence)?(?:\s*(?:No|ID))?)\.?\s*[:#]?\s*(\d{8,})""", RegexOption.IGNORE_CASE)

  private val IGNORE = Regex(
    """\b(fail(?:ed|ure)?|declined|unsuccessful|pending|reminder|request(?:ed)?|requests|offer|cashback offer|reward|scratch|due|expire[sd]?|autopay|mandate|otp|will be|scheduled|upcoming)\b""",
    RegexOption.IGNORE_CASE,
  )

  // "X paid you ₹100" / "X sent you ₹100"  — someone else paying the user
  private val PAID_YOU = Regex("""^(.+?)\s+(?:paid|sent)\s+you\b""", RegexOption.IGNORE_CASE)
  private val DEBIT_WORDS = Regex("""\b(paid|sent|debited|payment of|transferred|spent)\b""", RegexOption.IGNORE_CASE)
  private val CREDIT_WORDS = Regex("""\b(received|credited|refund(?:ed)?)\b""", RegexOption.IGNORE_CASE)
  private val TO_PARTY = Regex("""\b(?:to|at)\s+(.+?)(?=\s+(?:on|via|using|from|ref|upi|txn|transaction|successful(?:ly)?)\b|[.,;(|]|$)""", RegexOption.IGNORE_CASE)
  private val FROM_PARTY = Regex("""\bfrom\s+(.+?)(?=\s+(?:on|via|using|to|ref|upi|txn|transaction|successful(?:ly)?)\b|[.,;(|]|$)""", RegexOption.IGNORE_CASE)

  fun parse(title: String?, text: String?): ParsedPayment? {
    val full = listOfNotNull(title, text).joinToString(" ").replace(Regex("\\s+"), " ").trim()
    if (full.isEmpty() || IGNORE.containsMatchIn(full)) return null

    val amountMatch = AMOUNT.find(full) ?: return null
    val amount = amountMatch.groupValues[1].replace(",", "")
    val amountValue = amount.toDoubleOrNull() ?: return null
    if (amountValue <= 0.0) return null
    val normalizedAmount = if ('.' in amount) amount else "$amount.00"

    val paidYou = PAID_YOU.find(full)
    val type: String
    val merchant: String?
    when {
      paidYou != null -> {
        type = "credit"
        merchant = paidYou.groupValues[1]
      }
      CREDIT_WORDS.containsMatchIn(full) && !DEBIT_WORDS.containsMatchIn(full) -> {
        type = "credit"
        merchant = FROM_PARTY.find(full)?.groupValues?.get(1)
      }
      DEBIT_WORDS.containsMatchIn(full) -> {
        type = "debit"
        merchant = TO_PARTY.find(full)?.groupValues?.get(1)
      }
      CREDIT_WORDS.containsMatchIn(full) -> {
        type = "credit"
        merchant = FROM_PARTY.find(full)?.groupValues?.get(1)
      }
      else -> return null
    }

    // Bank SMS often omit or abbreviate the counterparty; "VPA x@bank" -> "x@bank".
    val cleaned = merchant?.trim()?.removePrefix("VPA ")?.removePrefix("vpa ")?.trim()?.trim('.', ',', '-', ':')
      ?.take(200)?.ifEmpty { null } ?: FALLBACK_MERCHANT
    return ParsedPayment(
      amount = normalizedAmount,
      type = type,
      merchant = cleaned,
      referenceId = REFERENCE.find(full)?.groupValues?.get(1),
    )
  }
}
