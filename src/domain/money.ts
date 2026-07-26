/**
 * Money and GST rules. All monetary values are handled in paise (integers)
 * to avoid floating point drift. GST rate and place of supply come from
 * admin-editable settings, never hardcoded at the call site.
 */

export type GstBreakup = {
  baseAmountPaise: number;
  discountAmountPaise: number;
  taxableAmountPaise: number;
  gstRatePercent: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  totalAmountPaise: number;
};

export type DiscountInput = {
  percentOff?: number | null;
  amountOffPaise?: number | null;
};

export function computeDiscountPaise(
  baseAmountPaise: number,
  discount: DiscountInput | null | undefined,
): number {
  if (!discount) return 0;
  let value = 0;
  if (discount.percentOff) {
    value = Math.round((baseAmountPaise * discount.percentOff) / 100);
  } else if (discount.amountOffPaise) {
    value = discount.amountOffPaise;
  }
  return Math.max(0, Math.min(value, baseAmountPaise));
}

/**
 * Intra-state supply is split into CGST + SGST; inter-state is IGST.
 * `sellerState` and `buyerState` are compared case-insensitively.
 */
export function computeGst(params: {
  baseAmountPaise: number;
  discountAmountPaise?: number;
  gstRatePercent: number;
  sellerState?: string | null;
  buyerState?: string | null;
}): GstBreakup {
  const discountAmountPaise = Math.max(0, Math.round(params.discountAmountPaise ?? 0));
  const taxableAmountPaise = Math.max(0, params.baseAmountPaise - discountAmountPaise);
  const totalTaxPaise = Math.round((taxableAmountPaise * params.gstRatePercent) / 100);

  const seller = (params.sellerState ?? "").trim().toLowerCase();
  const buyer = (params.buyerState ?? "").trim().toLowerCase();
  const isIntraState = seller.length > 0 && seller === buyer;

  const cgstPaise = isIntraState ? Math.floor(totalTaxPaise / 2) : 0;
  const sgstPaise = isIntraState ? totalTaxPaise - cgstPaise : 0;
  const igstPaise = isIntraState ? 0 : totalTaxPaise;

  return {
    baseAmountPaise: params.baseAmountPaise,
    discountAmountPaise,
    taxableAmountPaise,
    gstRatePercent: params.gstRatePercent,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalTaxPaise,
    totalAmountPaise: taxableAmountPaise + totalTaxPaise,
  };
}

export function formatPaise(paise: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatPaiseExact(paise: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
