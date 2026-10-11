"""
AI-powered expense categorization using Google Gemini.

Takes raw merchant strings (e.g. "Paid to SWIGGY INDIA PVT LTD") and:
  1. Normalizes the merchant name ("Swiggy")
  2. Assigns it to one of the user's categories
  3. Returns a confidence score

Batches multiple transactions into a single Gemini call where possible
(much cheaper and faster than one call per transaction), with a strict
JSON-only response contract so parsing is reliable.
"""
import json
import logging
import re
from dataclasses import dataclass

from google import genai
from google.genai import types

from app.core.config import settings
from app.models.category import DEFAULT_CATEGORIES

logger = logging.getLogger(__name__)

_CATEGORY_NAMES = [name for name, _ in DEFAULT_CATEGORIES]

_SYSTEM_PROMPT = f"""You are a financial transaction categorization engine. You will be given a \
JSON array of raw merchant strings taken from UPI payment app transaction histories (PhonePe/GPay). \
For EACH entry, determine:
  - "merchant_normalized": a clean, human-readable merchant/payee name (e.g. "Paid to SWIGGY INDIA PVT LTD" -> "Swiggy"; "Received from JOHN DOE" -> "John Doe")
  - "category": exactly one of this fixed list: {_CATEGORY_NAMES}
  - "confidence": your confidence in the category assignment, 0.0 to 1.0

Rules:
- Money received from a person (not a business) is "Transfers" unless context clearly indicates salary/income, then "Income".
- If you cannot confidently categorize something, use "Other" with low confidence rather than guessing.
- Respond with ONLY a raw JSON array, no markdown fences, no commentary, no explanation.
- The output array must have exactly as many entries as the input array, in the same order.

Example input: ["Paid to SWIGGY INDIA PVT LTD", "Received from JOHN DOE"]
Example output: [{{"merchant_normalized": "Swiggy", "category": "Food & Dining", "confidence": 0.95}}, {{"merchant_normalized": "John Doe", "category": "Transfers", "confidence": 0.7}}]
"""


# Used only when Gemini is unavailable (no/invalid key, outage, bad response),
# so captured transactions still land in sensible categories and charts stay
# meaningful. Order matters: first match wins.
_KEYWORD_RULES: list[tuple[str, tuple[str, ...]]] = [
    # Legal/entity names that UPI shows instead of the brand: Bundl = Swiggy, ANI = Ola,
    # Eternal = Zomato/Blinkit, Innovative Retail = Blinkit-era Grofers, etc.
    ("Food & Dining", ("swiggy", "bundl", "zomato", "eternal", "starbucks", "chai", "restaurant", "cafe", "dominos",
                       "mcdonald", "kfc", "pizza", "biryani", "bakery", "hotel", "dhaba", "juice", "tea ")),
    ("Groceries", ("blinkit", "bigbasket", "innovative retail", "kirana", "general store", "vegetable", "fruits",
                   "grocery", "zepto", "kiranakart", "supermarket", "mart", "dmart", "avenue supermarts", "provision")),
    ("Transport", ("uber", "ola", "ani technologies", "rapido", "petrol", "irctc", "metro", "fuel", "redbus",
                   "fastag", "bpcl", "hpcl", "indian oil", "parking")),
    ("Shopping", ("amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "reliance retail", "trends", "lifestyle")),
    ("Health & Fitness", ("pharmacy", "apollo", "medplus", "hospital", "gym", "clinic", "diagnostic", "pharmeasy",
                          "1mg", "medical", "cult.fit")),
    ("Entertainment", ("netflix", "spotify", "bookmyshow", "hotstar", "prime video", "pvr", "inox", "youtube", "sony liv")),
    ("Education", ("school", "college", "university", "coursera", "udemy", "tuition", "byju", "unacademy")),
    ("Investments", ("zerodha", "groww", "upstox", "mutual fund", "sip ", "nps", "coin by")),
    ("Bills & Utilities", ("electricity", "bescom", "broadband", "airtel", "jio", "vodafone", "bsnl", "recharge",
                           "water bill", "gas", "insurance", "act fibernet", "tata power", "billdesk")),
    ("Rent & Housing", ("rent",)),
    ("Income", ("salary", "interest credit", "cashback", "refund")),
    ("Transfers", ("upi/",)),
]


_BUSINESS_HINTS = re.compile(
    r"\b(pvt|ltd|limited|llp|inc|corp|technologies|services|enterprises|traders|store|stores|shop|mart|foods|"
    r"solutions|systems|industries|bank|finance|hotel|restaurant|medical|agency|centre|center)\b|\d|@|\.",
    re.IGNORECASE,
)


def _looks_like_person(name: str) -> bool:
    """UPI payees that are people show up as 2-4 plain alphabetic words, e.g. 'SYEDA AAISHA TAHSEEN'."""
    words = name.strip().split()
    return 2 <= len(words) <= 4 and all(w.isalpha() for w in words) and not _BUSINESS_HINTS.search(name)


def _keyword_category(merchant_raw: str) -> str:
    text = merchant_raw.lower()
    for category, keywords in _KEYWORD_RULES:
        # Match at word starts only, so "ola" hits "Ola Cabs" but not "Coca Cola".
        if any(re.search(rf"(?<![a-z0-9]){re.escape(k.strip())}", text) for k in keywords):
            return category
    if _looks_like_person(merchant_raw):
        return "Transfers"
    return "Other"


@dataclass
class CategorizationResult:
    merchant_normalized: str
    category_name: str
    confidence: float


def _get_client() -> genai.Client:
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "placeholder-for-local-dev":
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. Set it in .env to enable AI categorization."
        )
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def categorize_batch(merchant_raws: list[str]) -> list[CategorizationResult]:
    """
    Categorizes a batch of raw merchant strings in a single Gemini call.
    On any failure (API error, malformed response, count mismatch), falls
    back to keyword-matched categories with 0 confidence for every item in the batch rather
    than raising — a categorization failure should never block a PDF
    import or device-capture ingestion from completing; transactions just
    stay PENDING and the user categorizes manually.
    """
    if not merchant_raws:
        return []

    fallback = [
        CategorizationResult(merchant_normalized=m, category_name=_keyword_category(m), confidence=0.0)
        for m in merchant_raws
    ]

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=json.dumps(merchant_raws),
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )

        raw_text = response.text.strip()
        parsed = json.loads(raw_text)

        if not isinstance(parsed, list) or len(parsed) != len(merchant_raws):
            logger.warning("Gemini categorization returned mismatched batch size; using fallback")
            return fallback

        results = []
        for item in parsed:
            category = item.get("category", "Other")
            if category not in _CATEGORY_NAMES:
                category = "Other"
            results.append(
                CategorizationResult(
                    merchant_normalized=item.get("merchant_normalized", "")[:255] or "Unknown",
                    category_name=category,
                    confidence=max(0.0, min(1.0, float(item.get("confidence", 0.0)))),
                )
            )
        return results

    except Exception as e:
        logger.warning(f"Gemini categorization failed, falling back to uncategorized: {e}")
        return fallback
