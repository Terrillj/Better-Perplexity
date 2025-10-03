/**
 * Parses Brave's age format to ISO date string
 * Examples: "2 days ago" → "2025-09-30", "January 11, 2024" → "2024-01-11"
 */
export function parseBraveAge(age: string | undefined): string | null {
  if (!age) return null;
  
  // Try direct ISO parse first (format: YYYY-MM-DD or ISO string)
  if (/^\d{4}-\d{2}-\d{2}/.test(age)) {
    return age.split('T')[0]; // Return just date part
  }
  
  // Try parsing "Month DD, YYYY" format (e.g., "January 11, 2024")
  // JavaScript's Date constructor handles this natively
  try {
    const parsedDate = new Date(age);
    if (!isNaN(parsedDate.getTime())) {
      // Check if it looks like a date string (has month name or comma)
      if (/[a-zA-Z]/.test(age) || age.includes(',')) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
  } catch {
    // Continue to relative date parsing
  }
  
  // Parse relative dates: "2 days ago", "1 week ago"
  const match = age.match(/(\d+)\s+(hour|day|week|month|year)s?\s+ago/i);
  if (!match) {
    console.warn(`Could not parse Brave age: "${age}"`);
    return null;
  }
  
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  const date = new Date();
  switch (unit) {
    case 'hour':
      date.setHours(date.getHours() - amount);
      break;
    case 'day':
      date.setDate(date.getDate() - amount);
      break;
    case 'week':
      date.setDate(date.getDate() - amount * 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - amount);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - amount);
      break;
  }
  
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

