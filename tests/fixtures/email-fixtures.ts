// Test fixtures for email extractor tests
export const sampleEmailContent = `From: Test User <test@example.com>
To: info@techflow-solutions.gr
Subject: Test Inquiry
Date: Mon, 20 Jan 2024 10:30:00 +0200
Content-Type: text/plain; charset=UTF-8

Hello,

I am interested in your services.

Name: Test User
Email: test@example.com
Phone: 210-1234567
Company: Test Company
`;

export const sampleInvoiceEmailContent = `From: billing@techflow-solutions.gr
To: client@example.com
Subject: Νέο Τιμολόγιο TF-2024-001
Date: Mon, 21 Jan 2024 12:00:00 +0200
Content-Type: text/plain; charset=UTF-8

Σας ενημερώνουμε ότι έχει εκδοθεί το τιμολόγιο TF-2024-001.
`;

export const sampleGreekEmailContent = `From: Γιάννης Παπαδόπουλος <giannis@example.gr>
To: info@techflow-solutions.gr
Subject: Ερώτημα για υπηρεσίες
Date: Mon, 20 Jan 2024 10:30:00 +0200
Content-Type: text/plain; charset=UTF-8

Καλησπέρα,

Όνομα: Γιάννης Παπαδόπουλος
Email: giannis@example.gr
Τηλέφωνο: 210-1234567
Εταιρεία: Ελληνική Εταιρεία ΑΕ
`;
