export interface LoginResponse {
  d: {
    Lifnr: string;
    Password?: string;
  }
}

export interface VendorProfile {
  d: {
    WfVendorId: string;
    WfVendorName: string;
    WfCompanyName: string;
    WfAddress: string;
    WfCity: string;
    WfPostalCode: string;
    WfRegion: string;
    WfCountry: string;
    WfContact: string;
    WfEmail: string;
    WfTaxNo: string;
  }
}

export interface DashboardResponse {
  d: {
    WfVendorId: string;
    WfTotalPo: number;
    WfTotalDelivery: number;
    WfTotalInvoice: number;
    WfTotalPayment: number;
    WfPendingPayment: string;
    WfOpenDelivery: number;
  }
}

export interface RFQ {
  WfRfqNo: string;
  WfVendorId: string;
  WfRfqDate: string;
  WfMaterial: string;
  WfUom: string;
  WfNetPrice: string;
  WfCurrency: string;
  WfDeliveryDate: string;
  WfPlant: { Werks: string };
  WfQuantity: { Matnr: string };
}

export interface PurchaseOrder {
  WfVendorId: string;
  WfPoNumber: string;
  WfPoItem: string;
  WfMaterial: string;
  WfQty: string;
  WfUom: string;
  WfNetPrice: string;
  WfCurrency: string;
  WfDelivDate: string;
  WfPoDate: string;
}

export interface Delivery {
  WfVendorId: string;
  WfPoNumber: string;
  WfPoItem: string;
  WfMatDoc: string;
  WfMatYear: string;
  WfMaterial: string;
  WfQty: string;
  WfUom: string;
  WfMoveType: string;
  WfPostDate: string;
}

export interface InvoiceHeader {
  WfVendorId: string;
  WfInvDoc: string;
  WfFiscYear: string;
  WfInvDate: string;
  WfPostDate: string;
  WfAmount: string;
  WfCurrency: string;
  WfReference: string;
}

export interface Memo {
  WfVendorId: string;
  WfMemoDoc: string;
  WfFiscYear: string;
  WfDocDate: string;
  WfPostDate: string;
  WfDocType: string;
  WfAmount: string;
  WfCurrency: string;
  WfReference: string;
  WfStatus: string;
}

export interface InvoiceDetail {
  WfInvDoc: string;
  WfFiscYear: string;
  WfItemNo: string;
  WfMaterial: string;
  WfDescription: string;
  WfQuantity: string;
  WfUom: string;
  WfAmount: string;
  WfTaxAmount: string;
}

export interface InvoicePdfResponse {
  d: {
    WfInvDoc: string;
    WfFiscYear: string;
    InvoicePdfBase64: string;
  }
}

export interface ODataResponse<T> {
  d: {
    results: T[];
  }
}
