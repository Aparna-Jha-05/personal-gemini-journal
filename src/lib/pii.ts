import type { DetectedPiiItem } from '../types';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
const IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

export function scanForPii(text: string): DetectedPiiItem[] {
  if (!text) return [];
  const findings: DetectedPiiItem[] = [];

  let match: RegExpExecArray | null;

  // Emails
  const emailRe = new RegExp(EMAIL_REGEX);
  while ((match = emailRe.exec(text)) !== null) {
    findings.push({ type: 'email', value: match[0], index: match.index });
  }

  // SSNs
  const ssnRe = new RegExp(SSN_REGEX);
  while ((match = ssnRe.exec(text)) !== null) {
    findings.push({ type: 'ssn', value: match[0], index: match.index });
  }

  // Credit Cards
  const ccRe = new RegExp(CREDIT_CARD_REGEX);
  while ((match = ccRe.exec(text)) !== null) {
    findings.push({ type: 'credit_card', value: match[0], index: match.index });
  }

  // Phone numbers (filter out small false positives like dates)
  const phoneRe = new RegExp(PHONE_REGEX);
  while ((match = phoneRe.exec(text)) !== null) {
    if (match[0].replace(/\D/g, '').length >= 10) {
      findings.push({ type: 'phone', value: match[0], index: match.index });
    }
  }

  // IPs
  const ipRe = new RegExp(IP_REGEX);
  while ((match = ipRe.exec(text)) !== null) {
    findings.push({ type: 'ip', value: match[0], index: match.index });
  }

  return findings;
}

export function redactPii(text: string): string {
  if (!text) return '';
  return text
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(SSN_REGEX, '[REDACTED_SSN]')
    .replace(CREDIT_CARD_REGEX, '[REDACTED_CARD]')
    .replace(PHONE_REGEX, (match) => {
      if (match.replace(/\D/g, '').length >= 10) {
        return '[REDACTED_PHONE]';
      }
      return match;
    })
    .replace(IP_REGEX, '[REDACTED_IP]');
}
