package com.financelensmobile.capture

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NotificationParserTest {
  private fun p(title: String?, text: String?) = NotificationParser.parse(title, text)

  @Test fun phonepeSent() {
    val r = p("Sent ₹250.00", "Paid to Swiggy. UPI Ref: 123456789012")!!
    assertEquals(ParsedPayment("250.00", "debit", "Swiggy", "123456789012"), r)
  }

  @Test fun gpayPaid() {
    val r = p("Google Pay", "Paid ₹1,250 to Sri Lakshmi Kirana Store")!!
    assertEquals("1250.00", r.amount)
    assertEquals("debit", r.type)
    assertEquals("Sri Lakshmi Kirana Store", r.merchant)
    assertNull(r.referenceId)
  }

  @Test fun receivedFrom() {
    val r = p("Received ₹500", "from Rahul Sharma")!!
    assertEquals(ParsedPayment("500.00", "credit", "Rahul Sharma", null), r)
  }

  @Test fun somebodyPaidYou() {
    val r = p("Priya Nair paid you ₹300", null)!!
    assertEquals("credit", r.type)
    assertEquals("Priya Nair", r.merchant)
    assertEquals("300.00", r.amount)
  }

  @Test fun rupeeWordFormAndDecimals() {
    val r = p("Payment successful", "Rs. 89.5 paid to Chai Point")!!
    assertEquals("89.5", r.amount)
    assertEquals("Chai Point", r.merchant)
  }

  @Test fun ignoresNonPayments() {
    assertNull(p("Payment failed", "₹250 to Swiggy could not be completed"))
    assertNull(p("PhonePe", "Rahul requested ₹500 from you"))
    assertNull(p("Bill due", "Pay ₹999 to Airtel before Oct 20"))
    assertNull(p("Win cashback", "Scratch card offer: get ₹50"))
    assertNull(p("Hello", "No amount here"))
    assertNull(p("Sent ₹0", "to Nobody"))
  }

  @Test fun hdfcBankSmsSent() {
    // Real SMS text (newlines as delivered), shown via the messaging app's notification.
    val r = p("VM-HDFCBK-T", "Sent Rs.1.00\nFrom HDFC Bank A/C *3062\nTo SYEDA AAISHA TAHSEEN\nOn 11/10/26\nRef 365007756006")!!
    assertEquals(ParsedPayment("1.00", "debit", "SYEDA AAISHA TAHSEEN", "365007756006"), r)
  }

  @Test fun bankSmsCreditAlert() {
    val r = p("HDFCBK", "Credit Alert! Rs.500.00 credited to HDFC Bank A/C XX3062 on 11-10-26 from VPA rahul@okhdfc (UPI 365007756999)")!!
    assertEquals(ParsedPayment("500.00", "credit", "rahul@okhdfc", "365007756999"), r)
  }

  @Test fun bankSmsDebitToVpa() {
    val r = p("HDFCBK", "Rs.250.00 debited from A/C XX3062 on 11-10-26 to VPA swiggy@icici (UPI Ref No 365007750000)")!!
    assertEquals(ParsedPayment("250.00", "debit", "swiggy@icici", "365007750000"), r)
  }

  @Test fun ignoresFutureDebitAndOtp() {
    assertNull(p("HDFCBK", "Rs.999 will be debited from your A/C on 20-10-26 towards Netflix"))
    assertNull(p("HDFCBK", "123456 is your OTP for Rs.500 payment. Do not share."))
  }
}
