/**
 * PromptPay QR payload (EMVCo / Thai QR Payment) — TypeScript ล้วน
 * ไม่พึ่ง Buffer หรือแพ็กเกจภายนอก จึงทำงานได้ทั้งเบราว์เซอร์และ worker
 */

const ID_PAYLOAD_FORMAT = "00";
const ID_POI_METHOD = "01";
const ID_MERCHANT_INFO = "29";
const ID_COUNTRY = "58";
const ID_CURRENCY = "53";
const ID_AMOUNT = "54";
const ID_CRC = "63";

const GUID_PROMPTPAY = "A000000677010111";
const TARGET_MOBILE = "01";
const TARGET_NATIONAL_ID = "02";
const TARGET_EWALLET_ID = "03";

function field(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

/** เบอร์มือถือ → 0066xxxxxxxxx (13 หลัก), เลขบัตร/นิติบุคคล 13 หลัก, e-Wallet 15 หลัก */
function formatTarget(id: string): { type: string; value: string } {
  const digits = id.replace(/\D/g, "");
  if (digits.length >= 15) return { type: TARGET_EWALLET_ID, value: digits };
  if (digits.length >= 13) return { type: TARGET_NATIONAL_ID, value: digits };
  const local = digits.replace(/^0/, "");
  return { type: TARGET_MOBILE, value: `0066${local}`.padStart(13, "0") };
}

/** CRC-16/CCITT-FALSE บนไบต์ ASCII ของ payload */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePromptPayPayload(
  promptPayId: string,
  options: { amount?: number } = {},
): string {
  const { amount } = options;
  const target = formatTarget(promptPayId);

  const merchant = field(ID_MERCHANT_INFO, field("00", GUID_PROMPTPAY) + field(target.type, target.value));

  let payload =
    field(ID_PAYLOAD_FORMAT, "01") +
    field(ID_POI_METHOD, amount ? "12" : "11") +
    merchant +
    field(ID_COUNTRY, "TH") +
    field(ID_CURRENCY, "764");

  if (amount) payload += field(ID_AMOUNT, amount.toFixed(2));

  payload += ID_CRC + "04";
  return payload + crc16(payload);
}

export default generatePromptPayPayload;
