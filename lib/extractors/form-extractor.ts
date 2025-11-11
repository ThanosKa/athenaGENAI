import * as cheerio from 'cheerio';
import { ExtractionResult, ExtractedFormData } from '@/types/data';

/**
 * Extracts customer data from HTML contact forms
 * Handles Greek characters (UTF-8) and various HTML structures
 */
export function extractFormData({
  htmlContent,
  sourceFile,
}: {
  htmlContent: string;
  sourceFile: string;
}): ExtractionResult<ExtractedFormData> {
  const warnings: string[] = [];

  try {
    const $ = cheerio.load(htmlContent);

    const fullName = $('input[name="full_name"]').val()?.toString() || '';
    const email = $('input[name="email"]').val()?.toString() || '';
    const phone = $('input[name="phone"]').val()?.toString() || '';
    const company = $('input[name="company"]').val()?.toString() || '';
    const message = $('textarea[name="message"]').val()?.toString() || '';
    const submissionDate = $('input[name="submission_date"]').val()?.toString() || '';
    
    const service = $('select[name="service"] option[selected]').text().trim() ||
                    $('select[name="service"]').val()?.toString() || '';
    
    const priority = $('select[name="priority"] option[selected]').text().trim() ||
                     $('select[name="priority"]').val()?.toString() || '';

    if (!fullName) {
      warnings.push('Full name is missing or empty');
    }
    if (!email) {
      warnings.push('Email is missing or empty');
    } else if (!isValidEmail(email)) {
      warnings.push(`Email format appears invalid: ${email}`);
    }
    if (!phone) {
      warnings.push('Phone number is missing or empty');
    }
    if (!company) {
      warnings.push('Company name is missing or empty');
    }
    if (!service) {
      warnings.push('Service interest is missing or empty');
    }

    if (fullName && fullName.trim().length < 2) {
      warnings.push('Full name appears too short');
    }
    if (company && company.trim().length < 2) {
      warnings.push('Company name appears too short');
    }

    const data: ExtractedFormData = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      service: service.trim(),
      message: message.trim(),
      submissionDate: submissionDate.trim(),
      priority: priority.trim(),
    };

    return {
      success: true,
      data,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse form from ${sourceFile}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

