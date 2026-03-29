/**
 * Email validation utilities
 * Provides comprehensive email validation and uniqueness checking
 */

/**
 * Regex pattern for email validation
 * Matches most common email formats
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Strict email validation regex (RFC 5322 simplified)
 */
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate email format using regex
 * @param email - Email address to validate
 * @param strict - Use strict validation (default: true)
 * @returns true if email is valid, false otherwise
 */
export const isValidEmail = (
  email: string,
  strict: boolean = true
): boolean => {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Check length
  if (trimmedEmail.length > 254) {
    return false;
  }

  // Check for spaces
  if (trimmedEmail.includes(" ")) {
    return false;
  }

  // Use appropriate regex
  const regex = strict ? STRICT_EMAIL_REGEX : EMAIL_REGEX;
  return regex.test(trimmedEmail);
};

/**
 * Check if email is unique within a list of emails
 * @param email - Email to check
 * @param existingEmails - Array of existing emails
 * @returns true if email is unique, false if duplicate
 */
export const isEmailUnique = (
  email: string,
  existingEmails: string[]
): boolean => {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  return !existingEmails.some(
    (existingEmail) => existingEmail.trim().toLowerCase() === normalizedEmail
  );
};

/**
 * Validate and normalize email
 * @param email - Email to validate and normalize
 * @returns Normalized email or null if invalid
 */
export const normalizeEmail = (email: string): string | null => {
  if (!isValidEmail(email)) {
    return null;
  }
  return email.trim().toLowerCase();
};

/**
 * Get email validation error message
 * @param email - Email to validate
 * @returns Error message or null if valid
 */
export const getEmailValidationError = (email: string): string | null => {
  if (!email) {
    return "Email is required";
  }

  if (email.includes(" ")) {
    return "Email cannot contain spaces";
  }

  if (email.length > 254) {
    return "Email is too long (max 254 characters)";
  }

  if (!email.includes("@")) {
    return "Email must contain @ symbol";
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || localPart.length === 0) {
    return "Email local part is empty";
  }

  if (!domain || domain.length === 0) {
    return "Email domain is empty";
  }

  if (!domain.includes(".")) {
    return "Email domain must contain a dot";
  }

  if (!isValidEmail(email)) {
    return "Email format is invalid";
  }

  return null;
};

/**
 * Validate multiple emails and return errors
 * @param emails - Array of emails to validate
 * @returns Object with valid emails and errors
 */
export const validateEmails = (
  emails: string[]
): {
  valid: string[];
  errors: Array<{ email: string; error: string; index: number }>;
} => {
  const valid: string[] = [];
  const errors: Array<{ email: string; error: string; index: number }> = [];
  const seenEmails = new Set<string>();

  emails.forEach((email, index) => {
    const error = getEmailValidationError(email);

    if (error) {
      errors.push({ email, error, index });
      return;
    }

    const normalized = normalizeEmail(email);
    if (!normalized) {
      errors.push({ email, error: "Failed to normalize email", index });
      return;
    }

    // Check for duplicates within the same batch
    if (seenEmails.has(normalized)) {
      errors.push({
        email,
        error: "Duplicate email in this batch",
        index,
      });
      return;
    }

    seenEmails.add(normalized);
    valid.push(normalized);
  });

  return { valid, errors };
};

/**
 * Check for duplicate emails in CSV data
 * @param csvData - Array of CSV row objects
 * @param emailField - Field name containing email
 * @returns Object with duplicates and unique emails
 */
export const findDuplicateEmails = (
  csvData: Array<Record<string, any>> | string[],
  emailField: string = "email"
): {
  unique: string[];
  duplicates: Array<{ email: string; count: number; indices: number[] }>;
} => {
  const emailMap = new Map<string, number[]>();
  const unique: string[] = [];

  const pushIndex = (normalized: string, index: number) => {
    if (!emailMap.has(normalized)) {
      emailMap.set(normalized, []);
      unique.push(normalized);
    }
    emailMap.get(normalized)!.push(index);
  };

  // Plain string list (e.g. pre-extracted emails) — same dedupe semantics as row objects
  if (Array.isArray(csvData) && csvData.length > 0 && typeof csvData[0] === "string") {
    (csvData as string[]).forEach((raw, index) => {
      const normalized = normalizeEmail(raw);
      if (!normalized) return;
      pushIndex(normalized, index);
    });
  } else {
    (csvData as Array<Record<string, any>>).forEach((row: Record<string, any>, index: number) => {
      const email = row[emailField];
      if (!email) return;

      const normalized = normalizeEmail(email);
      if (!normalized) return;

      pushIndex(normalized, index);
    });
  }

  const duplicates = Array.from(emailMap.entries())
    .filter(([_, indices]) => indices.length > 1)
    .map(([email, indices]) => ({
      email,
      count: indices.length,
      indices,
    }));

  return { unique, duplicates };
};
