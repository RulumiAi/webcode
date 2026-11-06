export const AGE_DEMO_KEY = 'rulumi-age-demo-v1';
export const AGE_DEMO_EVENT = 'rulumi-age-demo-change';
export const ADULT_AGE_BANDS = ['18-24', '25-34', '35-44', '45+'] as const;
export const AGE_DEMO_BANDS = ['under18', ...ADULT_AGE_BANDS] as const;
export type AgeDemoBand = (typeof AGE_DEMO_BANDS)[number];

export function isAgeDemoBand(value: string | null): value is AgeDemoBand {
  return !!value && (AGE_DEMO_BANDS as readonly string[]).includes(value);
}

export function isAdultAgeBand(value: string | null): value is (typeof ADULT_AGE_BANDS)[number] {
  return !!value && (ADULT_AGE_BANDS as readonly string[]).includes(value);
}

export function readAgeDemo(): AgeDemoBand | null {
  try {
    const value = localStorage.getItem(AGE_DEMO_KEY);
    return isAgeDemoBand(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveAgeDemo(value: AgeDemoBand) {
  localStorage.setItem(AGE_DEMO_KEY, value);
  window.dispatchEvent(new Event(AGE_DEMO_EVENT));
}
