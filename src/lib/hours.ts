const TIME_RE = /^([0-1]?\d|2[0-3]):([0-5]\d)$/;

export function parseTimeToMinutes(value: string): number {
  const match = TIME_RE.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid time value: ${value}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Overnight-safe shift length in hours. If end <= start, the shift is
 * assumed to cross midnight (24h is added to the end before subtracting).
 */
export function computeHours(startTime: string, endTime: string): number {
  const startMin = parseTimeToMinutes(startTime);
  let endMin = parseTimeToMinutes(endTime);
  if (endMin <= startMin) {
    endMin += 24 * 60;
  }
  const hours = (endMin - startMin) / 60;
  return Math.round(hours * 100) / 100;
}

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
