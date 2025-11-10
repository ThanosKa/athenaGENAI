// Test fixtures for form extractor tests
export const sampleFormHTML = `
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <title>Contact Form</title>
</head>
<body>
    <form>
        <input name="full_name" value="Test User" />
        <input name="email" value="test@example.com" />
        <input name="phone" value="210-1234567" />
        <input name="company" value="Test Company" />
        <select name="service">
            <option value="web_development" selected>Web Development</option>
        </select>
        <textarea name="message">Test message</textarea>
        <input name="submission_date" value="2024-01-15T14:30" />
        <select name="priority">
            <option value="high" selected>High</option>
        </select>
    </form>
</body>
</html>
`;

export const sampleGreekFormHTML = `
<form>
    <input name="full_name" value="Γιάννης Κωνσταντίνου" />
    <input name="email" value="giannis@example.gr" />
    <input name="phone" value="210-9876543" />
    <input name="company" value="Ελληνική Εταιρεία ΑΕ" />
    <select name="service">
        <option value="crm" selected>Σύστημα CRM</option>
    </select>
</form>
`;

export const sampleIncompleteFormHTML = `
<form>
    <input name="full_name" value="" />
    <input name="email" value="invalid-email" />
</form>
`;

