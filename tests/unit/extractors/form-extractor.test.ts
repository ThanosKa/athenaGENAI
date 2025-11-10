import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractFormData } from '@/lib/extractors/form-extractor';

// Mock cheerio BEFORE importing
vi.mock('cheerio', async () => {
  const actual = await vi.importActual('cheerio');
  return actual;
});

describe('extractFormData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract all form fields from valid HTML form', () => {
    const htmlContent = `
      <form>
        <input name="full_name" value="Νίκος Παπαδόπουλος" />
        <input name="email" value="nikos.papadopoulos@example.gr" />
        <input name="phone" value="210-1234567" />
        <input name="company" value="Digital Marketing Pro" />
        <select name="service">
          <option value="web_development" selected>Ανάπτυξη Website</option>
        </select>
        <textarea name="message">Need a new website</textarea>
        <input name="submission_date" value="2024-01-15T14:30" />
        <select name="priority">
          <option value="high" selected>High</option>
        </select>
      </form>
    `;

    const result = extractFormData({
      htmlContent,
      sourceFile: 'contact_form_1.html',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.fullName).toBe('Νίκος Παπαδόπουλος');
    expect(result.data?.email).toBe('nikos.papadopoulos@example.gr');
    expect(result.data?.phone).toBe('210-1234567');
    expect(result.data?.company).toBe('Digital Marketing Pro');
    expect(result.data?.service).toBe('Ανάπτυξη Website');
    expect(result.data?.message).toBe('Need a new website');
  });

  it('should handle missing required fields with warnings', () => {
    const htmlContent = `
      <form>
        <input name="full_name" value="" />
        <input name="email" value="invalid-email" />
      </form>
    `;

    const result = extractFormData({
      htmlContent,
      sourceFile: 'incomplete_form.html',
    });

    expect(result.success).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings?.length).toBeGreaterThan(0);
    expect(result.warnings?.some(w => w.includes('name'))).toBe(true);
    expect(result.warnings?.some(w => w.includes('email'))).toBe(true);
  });

  it('should validate email format', () => {
    const htmlContent = `
      <form>
        <input name="full_name" value="John Doe" />
        <input name="email" value="invalid-email-format" />
        <input name="phone" value="1234567890" />
        <input name="company" value="Company" />
        <select name="service">
          <option value="service1" selected>Service 1</option>
        </select>
      </form>
    `;

    const result = extractFormData({
      htmlContent,
      sourceFile: 'invalid_email.html',
    });

    expect(result.success).toBe(true);
    expect(result.warnings?.some(w => w.includes('Email format'))).toBe(true);
  });

  it('should handle malformed HTML gracefully', () => {
    const htmlContent = '<div>Not a form</div>';

    const result = extractFormData({
      htmlContent,
      sourceFile: 'no_form.html',
    });

    expect(result.success).toBe(true);
    expect(result.warnings?.length).toBeGreaterThan(0);
  });

  it('should support Greek characters in form values', () => {
    const htmlContent = `
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

    const result = extractFormData({
      htmlContent,
      sourceFile: 'greek_form.html',
    });

    expect(result.success).toBe(true);
    expect(result.data?.fullName).toBe('Γιάννης Κωνσταντίνου');
    expect(result.data?.company).toBe('Ελληνική Εταιρεία ΑΕ');
    expect(result.data?.service).toBe('Σύστημα CRM');
  });

  it('should handle select elements with selected option', () => {
    const htmlContent = `
      <form>
        <input name="full_name" value="Test User" />
        <input name="email" value="test@example.com" />
        <input name="phone" value="1234567890" />
        <input name="company" value="Test Company" />
        <select name="service">
          <option value="option1">Option 1</option>
          <option value="option2" selected>Option 2</option>
        </select>
      </form>
    `;

    const result = extractFormData({
      htmlContent,
      sourceFile: 'select_form.html',
    });

    expect(result.success).toBe(true);
    expect(result.data?.service).toBe('Option 2');
  });

  it('should handle empty form fields', () => {
    const htmlContent = `
      <form>
        <input name="full_name" value="" />
        <input name="email" value="" />
        <input name="phone" value="" />
        <input name="company" value="" />
        <select name="service"></select>
      </form>
    `;

    const result = extractFormData({
      htmlContent,
      sourceFile: 'empty_form.html',
    });

    expect(result.success).toBe(true);
    expect(result.warnings?.length).toBeGreaterThan(0);
    expect(result.data?.fullName).toBe('');
    expect(result.data?.email).toBe('');
  });

  it('should validate name and company length', () => {
    const htmlContent = `
      <form>
        <input name="full_name" value="A" />
        <input name="email" value="test@example.com" />
        <input name="phone" value="1234567890" />
        <input name="company" value="B" />
        <select name="service">
          <option value="service1" selected>Service</option>
        </select>
      </form>
    `;

    const result = extractFormData({
      htmlContent,
      sourceFile: 'short_fields.html',
    });

    expect(result.success).toBe(true);
    expect(result.warnings?.some(w => w.includes('too short'))).toBe(true);
  });

  it('should handle parsing errors', () => {
    // Pass invalid HTML that might cause cheerio to fail
    const htmlContent = null as unknown as string;

    const result = extractFormData({
      htmlContent,
      sourceFile: 'error_form.html',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('Failed to parse form');
  });
});

