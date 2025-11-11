import { describe, it, expect, beforeEach, vi } from "vitest";
import { extractEmailData } from "@/lib/extractors/email-extractor";

vi.mock("mailparser", () => ({
  simpleParser: vi.fn(),
}));

import { simpleParser } from "mailparser";

describe("extractEmailData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract contact info from valid client inquiry email", async () => {
    // Arrange
    const mockParsedEmail = {
      from: {
        text: "Σπύρος Μιχαήλ <spyros.michail@techcorp.gr>",
        value: [
          { address: "spyros.michail@techcorp.gr", name: "Σπύρος Μιχαήλ" },
        ],
        html: "",
      },
      to: {
        text: "info@techflow-solutions.gr",
        value: [{ address: "info@techflow-solutions.gr", name: "" }],
        html: "",
      },
      subject: "Αίτημα για Σύστημα CRM",
      date: new Date("2024-01-20T10:30:00+02:00"),
      text: `Καλησπέρα,

Στοιχεία Επικοινωνίας:
- Όνομα: Σπύρος Μιχαήλ
- Email: spyros.michail@techcorp.gr
- Τηλέφωνο: 210-3344556
- Εταιρεία: TechCorp AE
- Θέση: Διευθυντής Πωλήσεων`,
      attachments: [],
      headers: new Map(),
      headerLines: [],
      html: false as const,
    };

    vi.mocked(simpleParser).mockResolvedValue(mockParsedEmail);

    const emlContent = "From: Σπύρος Μιχαήλ <spyros.michail@techcorp.gr>";
    // Act
    const result = await extractEmailData({
      emlContent,
      sourceFile: "email_01.eml",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.fullName).toBe("Σπύρος Μιχαήλ");
    expect(result.data?.email).toBe("spyros.michail@techcorp.gr");
    expect(result.data?.phone).toContain("210-3344556");
    expect(result.data?.company).toBe("TechCorp AE");
    expect(result.data?.emailType).toBe("client_inquiry");
  });

  it("should detect invoice notification email", async () => {
    // Arrange
    const mockParsedEmail = {
      from: {
        text: "billing@techflow-solutions.gr",
        value: [{ address: "billing@techflow-solutions.gr", name: "" }],
        html: "",
      },
      to: {
        text: "client@example.com",
        value: [{ address: "client@example.com", name: "" }],
        html: "",
      },
      subject: "Νέο Τιμολόγιο TF-2024-001",
      date: new Date("2024-01-21T12:00:00+02:00"),
      text: "Σας ενημερώνουμε ότι έχει εκδοθεί το τιμολόγιο TF-2024-001.",
      attachments: [],
      headers: new Map(),
      headerLines: [],
      html: false as const,
    };

    vi.mocked(simpleParser).mockResolvedValue(mockParsedEmail);

    const emlContent = "Subject: Νέο Τιμολόγιο TF-2024-001";
    // Act
    const result = await extractEmailData({
      emlContent,
      sourceFile: "invoice_notification.eml",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.emailType).toBe("invoice_notification");
    expect(result.data?.invoiceReference).toBe("TF-2024-001");
  });

  it("should extract invoice reference from email body", async () => {
    // Arrange
    const mockParsedEmail = {
      from: {
        text: "billing@techflow-solutions.gr",
        value: [{ address: "billing@techflow-solutions.gr", name: "" }],
        html: "",
      },
      to: {
        text: "client@example.com",
        value: [{ address: "client@example.com", name: "" }],
        html: "",
      },
      subject: "Invoice Notification",
      date: new Date("2024-01-21T12:00:00+02:00"),
      text: "Your invoice TF-2024-002 has been generated.",
      attachments: [],
      headers: new Map(),
      headerLines: [],
      html: false as const,
    };

    vi.mocked(simpleParser).mockResolvedValue(mockParsedEmail);

    // Act
    const result = await extractEmailData({
      emlContent: "Invoice notification",
      sourceFile: "invoice.eml",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.invoiceReference).toBe("TF-2024-002");
  });

  it("should handle missing contact info with warnings", async () => {
    // Arrange
    const mockParsedEmail = {
      from: {
        text: "sender@example.com",
        value: [{ address: "sender@example.com", name: "" }],
        html: "",
      },
      to: {
        text: "recipient@example.com",
        value: [{ address: "recipient@example.com", name: "" }],
        html: "",
      },
      subject: "Inquiry",
      date: new Date("2024-01-20T10:30:00+02:00"),
      text: "Hello, I am interested in your services.",
      attachments: [],
      headers: new Map(),
      headerLines: [],
      html: false as const,
    };

    vi.mocked(simpleParser).mockResolvedValue(mockParsedEmail);

    // Act
    const result = await extractEmailData({
      emlContent: "Minimal email",
      sourceFile: "minimal.eml",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings?.length).toBeGreaterThan(0);
    expect(result.warnings?.some((w) => w.includes("name"))).toBe(true);
  });

  it("should handle malformed email parsing errors", async () => {
    // Arrange
    vi.mocked(simpleParser).mockRejectedValue(
      new Error("Invalid email format")
    );

    // Act
    const result = await extractEmailData({
      emlContent: "Invalid email content",
      sourceFile: "invalid.eml",
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Failed to parse email");
  });

  it("should handle empty email content", async () => {
    // Arrange
    const mockParsedEmail = {
      from: { text: "", value: [], html: "" },
      to: {
        text: "",
        value: [],
        html: "",
      },
      subject: "",
      date: new Date(),
      text: "",
      attachments: [],
      headers: new Map(),
      headerLines: [],
      html: false as const,
    };

    vi.mocked(simpleParser).mockResolvedValue(mockParsedEmail);

    // Act
    const result = await extractEmailData({
      emlContent: "",
      sourceFile: "empty.eml",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.warnings?.length).toBeGreaterThan(0);
  });

  it("should support Greek characters in email content", async () => {
    // Arrange
    const mockParsedEmail = {
      from: {
        text: "Γιάννης Παπαδόπουλος <giannis@example.gr>",
        value: [
          { address: "giannis@example.gr", name: "Γιάννης Παπαδόπουλος" },
        ],
        html: "",
      },
      to: {
        text: "info@techflow-solutions.gr",
        value: [{ address: "info@techflow-solutions.gr", name: "" }],
        html: "",
      },
      subject: "Ερώτημα για υπηρεσίες",
      date: new Date("2024-01-20T10:30:00+02:00"),
      text: `Όνομα: Γιάννης Παπαδόπουλος
Email: giannis@example.gr
Τηλέφωνο: 210-1234567
Εταιρεία: Ελληνική Εταιρεία ΑΕ`,
      attachments: [],
      headers: new Map(),
      headerLines: [],
      html: false as const,
    };

    vi.mocked(simpleParser).mockResolvedValue(mockParsedEmail);

    // Act
    const result = await extractEmailData({
      emlContent: "Greek email",
      sourceFile: "greek.eml",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.fullName).toBe("Γιάννης Παπαδόπουλος");
    expect(result.data?.company).toBe("Ελληνική Εταιρεία ΑΕ");
  });

  it("should fallback to from name when name not found in body", async () => {
    // Arrange
    const mockParsedEmail = {
      from: {
        text: "John Doe <john@example.com>",
        value: [{ address: "john@example.com", name: "John Doe" }],
        html: "",
      },
      to: {
        text: "info@techflow-solutions.gr",
        value: [{ address: "info@techflow-solutions.gr", name: "" }],
        html: "",
      },
      subject: "Inquiry",
      date: new Date("2024-01-20T10:30:00+02:00"),
      text: "Hello, I need help.",
      attachments: [],
      headers: new Map(),
      headerLines: [],
      html: false as const,
    };

    vi.mocked(simpleParser).mockResolvedValue(mockParsedEmail);

    // Act
    const result = await extractEmailData({
      emlContent: "Email without name",
      sourceFile: "no_name.eml",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.fullName).toBe("John Doe");
  });
});
