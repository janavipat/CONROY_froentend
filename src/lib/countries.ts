/** Minimal country dialing-code dataset for the phone-auth picker. */
export interface Country {
  name: string;
  iso2: string;
  dial: string; // includes leading "+"
  flag: string; // emoji
  /** Expected national number length (for light validation). */
  len: number;
}

export const COUNTRIES: Country[] = [
  { name: "India", iso2: "IN", dial: "+91", flag: "🇮🇳", len: 10 },
  { name: "United States", iso2: "US", dial: "+1", flag: "🇺🇸", len: 10 },
  { name: "United Kingdom", iso2: "GB", dial: "+44", flag: "🇬🇧", len: 10 },
  { name: "United Arab Emirates", iso2: "AE", dial: "+971", flag: "🇦🇪", len: 9 },
  { name: "Canada", iso2: "CA", dial: "+1", flag: "🇨🇦", len: 10 },
  { name: "Australia", iso2: "AU", dial: "+61", flag: "🇦🇺", len: 9 },
  { name: "Singapore", iso2: "SG", dial: "+65", flag: "🇸🇬", len: 8 },
  { name: "Germany", iso2: "DE", dial: "+49", flag: "🇩🇪", len: 11 },
  { name: "France", iso2: "FR", dial: "+33", flag: "🇫🇷", len: 9 },
  { name: "Netherlands", iso2: "NL", dial: "+31", flag: "🇳🇱", len: 9 },
  { name: "Spain", iso2: "ES", dial: "+34", flag: "🇪🇸", len: 9 },
  { name: "Italy", iso2: "IT", dial: "+39", flag: "🇮🇹", len: 10 },
  { name: "Saudi Arabia", iso2: "SA", dial: "+966", flag: "🇸🇦", len: 9 },
  { name: "Japan", iso2: "JP", dial: "+81", flag: "🇯🇵", len: 10 },
  { name: "Bangladesh", iso2: "BD", dial: "+880", flag: "🇧🇩", len: 10 },
  { name: "Pakistan", iso2: "PK", dial: "+92", flag: "🇵🇰", len: 10 },
  { name: "Sri Lanka", iso2: "LK", dial: "+94", flag: "🇱🇰", len: 9 },
  { name: "Nepal", iso2: "NP", dial: "+977", flag: "🇳🇵", len: 10 },
  { name: "Malaysia", iso2: "MY", dial: "+60", flag: "🇲🇾", len: 9 },
  { name: "South Africa", iso2: "ZA", dial: "+27", flag: "🇿🇦", len: 9 },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function findCountryByIso(iso2: string): Country {
  return COUNTRIES.find((c) => c.iso2 === iso2) ?? DEFAULT_COUNTRY;
}
