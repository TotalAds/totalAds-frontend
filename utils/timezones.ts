/**
 * Comprehensive IANA Timezone List
 * Organized by region for better UX
 */

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const TIMEZONES: TimezoneOption[] = [
  // Americas
  { value: "America/New_York", label: "America/New York (EST/EDT)", offset: "UTC-5/-4" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)", offset: "UTC-6/-5" },
  { value: "America/Denver", label: "America/Denver (MST/MDT)", offset: "UTC-7/-6" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST/PDT)", offset: "UTC-8/-7" },
  { value: "America/Phoenix", label: "America/Phoenix (MST)", offset: "UTC-7" },
  { value: "America/Anchorage", label: "America/Anchorage (AKST/AKDT)", offset: "UTC-9/-8" },
  { value: "America/Honolulu", label: "America/Honolulu (HST)", offset: "UTC-10" },
  { value: "America/Toronto", label: "America/Toronto (EST/EDT)", offset: "UTC-5/-4" },
  { value: "America/Vancouver", label: "America/Vancouver (PST/PDT)", offset: "UTC-8/-7" },
  { value: "America/Mexico_City", label: "America/Mexico City (CST/CDT)", offset: "UTC-6/-5" },
  { value: "America/Sao_Paulo", label: "America/São Paulo (BRT/BRST)", offset: "UTC-3/-2" },
  { value: "America/Buenos_Aires", label: "America/Buenos Aires (ART)", offset: "UTC-3" },
  { value: "America/Lima", label: "America/Lima (PET)", offset: "UTC-5" },
  { value: "America/Bogota", label: "America/Bogotá (COT)", offset: "UTC-5" },
  { value: "America/Santiago", label: "America/Santiago (CLT/CLST)", offset: "UTC-4/-3" },

  // Europe
  { value: "Europe/London", label: "Europe/London (GMT/BST)", offset: "UTC+0/+1" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Rome", label: "Europe/Rome (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Madrid", label: "Europe/Madrid (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Brussels", label: "Europe/Brussels (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Vienna", label: "Europe/Vienna (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Zurich", label: "Europe/Zurich (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Stockholm", label: "Europe/Stockholm (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Copenhagen", label: "Europe/Copenhagen (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Oslo", label: "Europe/Oslo (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Helsinki", label: "Europe/Helsinki (EET/EEST)", offset: "UTC+2/+3" },
  { value: "Europe/Athens", label: "Europe/Athens (EET/EEST)", offset: "UTC+2/+3" },
  { value: "Europe/Istanbul", label: "Europe/Istanbul (TRT)", offset: "UTC+3" },
  { value: "Europe/Moscow", label: "Europe/Moscow (MSK)", offset: "UTC+3" },
  { value: "Europe/Dublin", label: "Europe/Dublin (GMT/IST)", offset: "UTC+0/+1" },
  { value: "Europe/Lisbon", label: "Europe/Lisbon (WET/WEST)", offset: "UTC+0/+1" },
  { value: "Europe/Warsaw", label: "Europe/Warsaw (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Prague", label: "Europe/Prague (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Budapest", label: "Europe/Budapest (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Bucharest", label: "Europe/Bucharest (EET/EEST)", offset: "UTC+2/+3" },

  // Asia
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)", offset: "UTC+4" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)", offset: "UTC+5:30" },
  { value: "Asia/Mumbai", label: "Asia/Mumbai (IST)", offset: "UTC+5:30" },
  { value: "Asia/Delhi", label: "Asia/Delhi (IST)", offset: "UTC+5:30" },
  { value: "Asia/Karachi", label: "Asia/Karachi (PKT)", offset: "UTC+5" },
  { value: "Asia/Dhaka", label: "Asia/Dhaka (BST)", offset: "UTC+6" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (ICT)", offset: "UTC+7" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)", offset: "UTC+8" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong Kong (HKT)", offset: "UTC+8" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)", offset: "UTC+8" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)", offset: "UTC+9" },
  { value: "Asia/Seoul", label: "Asia/Seoul (KST)", offset: "UTC+9" },
  { value: "Asia/Taipei", label: "Asia/Taipei (CST)", offset: "UTC+8" },
  { value: "Asia/Manila", label: "Asia/Manila (PHT)", offset: "UTC+8" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB)", offset: "UTC+7" },
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala Lumpur (MYT)", offset: "UTC+8" },
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho Chi Minh (ICT)", offset: "UTC+7" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (AST)", offset: "UTC+3" },
  { value: "Asia/Jerusalem", label: "Asia/Jerusalem (IST/IDT)", offset: "UTC+2/+3" },
  { value: "Asia/Beirut", label: "Asia/Beirut (EET/EEST)", offset: "UTC+2/+3" },
  { value: "Asia/Tehran", label: "Asia/Tehran (IRST/IRDT)", offset: "UTC+3:30/+4:30" },
  { value: "Asia/Kabul", label: "Asia/Kabul (AFT)", offset: "UTC+4:30" },
  { value: "Asia/Tashkent", label: "Asia/Tashkent (UZT)", offset: "UTC+5" },
  { value: "Asia/Almaty", label: "Asia/Almaty (ALMT)", offset: "UTC+6" },

  // Australia & Pacific
  { value: "Australia/Sydney", label: "Australia/Sydney (AEDT/AEST)", offset: "UTC+11/+10" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne (AEDT/AEST)", offset: "UTC+11/+10" },
  { value: "Australia/Brisbane", label: "Australia/Brisbane (AEST)", offset: "UTC+10" },
  { value: "Australia/Perth", label: "Australia/Perth (AWST)", offset: "UTC+8" },
  { value: "Australia/Adelaide", label: "Australia/Adelaide (ACDT/ACST)", offset: "UTC+10:30/+9:30" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZDT/NZST)", offset: "UTC+13/+12" },
  { value: "Pacific/Fiji", label: "Pacific/Fiji (FJT/FJST)", offset: "UTC+12/+13" },
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu (HST)", offset: "UTC-10" },
  { value: "Pacific/Guam", label: "Pacific/Guam (ChST)", offset: "UTC+10" },

  // Africa
  { value: "Africa/Cairo", label: "Africa/Cairo (EET)", offset: "UTC+2" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)", offset: "UTC+2" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)", offset: "UTC+1" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)", offset: "UTC+3" },
  { value: "Africa/Casablanca", label: "Africa/Casablanca (WET/WEST)", offset: "UTC+0/+1" },
  { value: "Africa/Algiers", label: "Africa/Algiers (CET)", offset: "UTC+1" },
  { value: "Africa/Tunis", label: "Africa/Tunis (CET)", offset: "UTC+1" },

  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "UTC+0" },
];

/**
 * Get browser's detected timezone
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Find timezone option by value
 */
export function findTimezoneOption(value: string): TimezoneOption | undefined {
  return TIMEZONES.find((tz) => tz.value === value);
}

/**
 * Get timezone label for display
 */
export function getTimezoneLabel(value: string): string {
  const option = findTimezoneOption(value);
  return option ? option.label : value;
}

