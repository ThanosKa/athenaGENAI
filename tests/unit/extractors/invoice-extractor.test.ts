import { describe, it, expect, beforeEach, vi } from "vitest";
import { extractInvoiceData } from "@/lib/extractors/invoice-extractor";

vi.mock("cheerio", async () => {
  const actual = await vi.importActual("cheerio");
  return actual;
});

describe("extractInvoiceData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract invoice number TF-2024-XXX pattern", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-001<br>
        <strong>Ημερομηνία:</strong> 21/01/2024<br>
        <strong>Πελάτης:</strong> Office Solutions Ltd
      </div>
      <div class="summary">
        Καθαρή Αξία: €1,000.00
        ΦΠΑ 24%: €240.00
        ΣΥΝΟΛΟ: €1,240.00
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-001.html",
    });

    expect(result.success).toBe(true);
    expect(result.data?.invoiceNumber).toBe("TF-2024-001");
  });

  it("should extract financial data (amounts, VAT)", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-002<br>
        <strong>Ημερομηνία:</strong> 22/01/2024<br>
        <strong>Πελάτης:</strong> Test Company
      </div>
      <div class="summary">
        Καθαρή Αξία: €2,500.00
        ΦΠΑ 24%: €600.00
        ΣΥΝΟΛΟ: €3,100.00
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-002.html",
    });

    expect(result.success).toBe(true);
    expect(result.data?.netAmount).toBe(2500);
    expect(result.data?.vatRate).toBe(24);
    expect(result.data?.vatAmount).toBe(600);
    expect(result.data?.totalAmount).toBe(3100);
  });

  it("should extract invoice date", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-003<br>
        <strong>Ημερομηνία:</strong> 25/01/2024<br>
        <strong>Πελάτης:</strong> Test Company
      </div>
      <div class="summary">
        Καθαρή Αξία: €500.00
        ΦΠΑ 24%: €120.00
        ΣΥΝΟΛΟ: €620.00
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-003.html",
    });

    expect(result.success).toBe(true);
    expect(result.data?.date).toBe("25/01/2024");
  });

  it("should validate VAT calculation", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-004<br>
        <strong>Ημερομηνία:</strong> 26/01/2024<br>
        <strong>Πελάτης:</strong> Test Company
      </div>
      <div class="summary">
        Καθαρή Αξία: €1,000.00
        ΦΠΑ 24%: €250.00
        ΣΥΝΟΛΟ: €1,250.00
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-004.html",
    });

    expect(result.success).toBe(true);
    expect(result.warnings?.some((w) => w.includes("VAT calculation"))).toBe(
      true
    );
  });

  it("should extract customer information", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-005<br>
        <strong>Ημερομηνία:</strong> 27/01/2024<br>
        <div>
          <strong>Πελάτης:</strong>
          <div>Customer Name</div>
          <div>Address Line 1</div>
          <div>Address Line 2</div>
          <div>ΑΦΜ: 123456789</div>
        </div>
      </div>
      <div class="summary">
        Καθαρή Αξία: €500.00
        ΦΠΑ 24%: €120.00
        ΣΥΝΟΛΟ: €620.00
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-005.html",
    });

    expect(result.success).toBe(true);
    if (result.data?.customerName) {
      expect(result.data.customerName).toBe("Customer Name");
    }
    if (result.data?.customerTaxId) {
      expect(result.data.customerTaxId).toBe("123456789");
    }
  });

  it("should extract line items from invoice table", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-006<br>
        <strong>Ημερομηνία:</strong> 28/01/2024<br>
        <strong>Πελάτης:</strong> Test Company
      </div>
      <table class="invoice-table">
        <tbody>
          <tr>
            <td>Service 1</td>
            <td>2</td>
            <td>€100.00</td>
            <td>€200.00</td>
          </tr>
          <tr>
            <td>Service 2</td>
            <td>1</td>
            <td>€150.00</td>
            <td>€150.00</td>
          </tr>
        </tbody>
      </table>
      <div class="summary">
        Καθαρή Αξία: €350.00
        ΦΠΑ 24%: €84.00
        ΣΥΝΟΛΟ: €434.00
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-006.html",
    });

    expect(result.success).toBe(true);
    expect(result.data?.items.length).toBe(2);
    expect(result.data?.items[0].description).toBe("Service 1");
    expect(result.data?.items[0].quantity).toBe(2);
    expect(result.data?.items[0].unitPrice).toBe(100);
    expect(result.data?.items[0].total).toBe(200);
  });

  it("should handle missing financial data with warnings", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-007<br>
        <strong>Πελάτης:</strong> Test Company
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-007.html",
    });

    expect(result.success).toBe(true);
    expect(result.warnings?.some((w) => w.includes("date"))).toBe(true);
    expect(result.warnings?.some((w) => w.includes("items"))).toBe(true);
  });

  it("should handle invalid invoice structure", () => {
    const htmlContent = "<div>Not an invoice</div>";

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invalid_invoice.html",
    });

    expect(result.success).toBe(true);
    expect(result.warnings?.length).toBeGreaterThan(0);
  });

  it("should parse currency with different formats", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-008<br>
        <strong>Ημερομηνία:</strong> 29/01/2024<br>
        <strong>Πελάτης:</strong> Test Company
      </div>
      <div class="summary">
        Καθαρή Αξία: €1,054.50
        ΦΠΑ 24%: €253.08
        ΣΥΝΟΛΟ: €1,307.58
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-008.html",
    });

    expect(result.success).toBe(true);
    expect(result.data?.netAmount).toBe(1054.5);
    expect(result.data?.vatAmount).toBe(253.08);
    expect(result.data?.totalAmount).toBe(1307.58);
  });

  it("should extract payment method", () => {
    const htmlContent = `
      <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-009<br>
        <strong>Ημερομηνία:</strong> 30/01/2024<br>
        <strong>Τρόπος Πληρωμής:</strong> Μετρητά
        <strong>Πελάτης:</strong> Test Company
      </div>
      <div class="summary">
        Καθαρή Αξία: €500.00
        ΦΠΑ 24%: €120.00
        ΣΥΝΟΛΟ: €620.00
      </div>
    `;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "invoice_TF-2024-009.html",
    });

    expect(result.success).toBe(true);
    expect(result.data?.paymentMethod).toContain("Μετρητά");
  });

  it("should handle parsing errors gracefully", () => {
    const htmlContent = null as unknown as string;

    const result = extractInvoiceData({
      htmlContent,
      sourceFile: "error_invoice.html",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Failed to parse invoice");
  });
});
