// Test fixtures for invoice extractor tests
export const sampleInvoiceHTML = `
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <title>Invoice TF-2024-001</title>
</head>
<body>
    <div class="invoice-details">
        <strong>Αριθμός:</strong> TF-2024-001<br>
        <strong>Ημερομηνία:</strong> 21/01/2024<br>
        <strong>Πελάτης:</strong><br>
        Customer Name<br>
        Address Line 1<br>
        ΑΦΜ: 123456789
    </div>
    <table class="invoice-table">
        <tbody>
            <tr>
                <td>Service 1</td>
                <td>2</td>
                <td>€100.00</td>
                <td>€200.00</td>
            </tr>
        </tbody>
    </table>
    <div class="summary">
        Καθαρή Αξία: €1,000.00
        ΦΠΑ 24%: €240.00
        ΣΥΝΟΛΟ: €1,240.00
    </div>
</body>
</html>
`;

export const sampleInvoiceWithPaymentMethod = `
<div class="invoice-details">
    <strong>Αριθμός:</strong> TF-2024-002<br>
    <strong>Ημερομηνία:</strong> 22/01/2024<br>
    <strong>Τρόπος Πληρωμής:</strong> Μετρητά<br>
    <strong>Πελάτης:</strong> Test Customer
</div>
<div class="summary">
    Καθαρή Αξία: €500.00
    ΦΠΑ 24%: €120.00
    ΣΥΝΟΛΟ: €620.00
</div>
`;

export const sampleInvalidInvoiceHTML = `
<div>Not an invoice</div>
`;

