import { ValidationCheck, ValidationResult } from './types';

// Lightweight endpoint validator using fetch
export const validateEndpoints = async (
  endpoints: string[],
  method: 'HEAD' | 'GET' = 'GET'
): Promise<ValidationResult[]> => {
  const results: ValidationResult[] = [];
  for (const url of endpoints) {
    const checkId = `endpoint:${url}`;
    try {
      const resp = await fetch(url, { method });
      const ok = resp.status >= 200 && resp.status < 400;
      results.push({
        checkId,
        passed: ok,
        detail: `HTTP ${resp.status} ${resp.statusText}`,
        severity: ok ? 'info' : 'error',
      });
    } catch (e: any) {
      results.push({
        checkId,
        passed: false,
        detail: `Network error: ${e?.message || e}`,
        severity: 'error',
      });
    }
  }
  return results;
};

// Validate Electron Builder config by reading a simple YAML text (when accessible via Puter fs)
// We look for asar and nsis target hints in the raw string
export const validateBuilderConfigText = (rawYaml: string): ValidationResult[] => {
  const lines = rawYaml.split(/\r?\n/);
  const asarLine = lines.find(l => l.trim().startsWith('asar:')) || '';
  const targetsSection = lines.find(l => /win:/.test(l) || /nsis/.test(l)) || '';

  const asarDisabled = /asar:\s*false/i.test(asarLine);
  const nsisMentioned = /nsis/i.test(rawYaml);

  const results: ValidationResult[] = [
    {
      checkId: 'builder:asar',
      passed: asarDisabled,
      detail: asarDisabled ? 'asar is disabled' : 'asar appears enabled or not specified',
      severity: asarDisabled ? 'info' : 'warning',
    },
    {
      checkId: 'builder:nsis',
      passed: nsisMentioned,
      detail: nsisMentioned ? 'NSIS target present' : 'NSIS target not found',
      severity: nsisMentioned ? 'info' : 'error',
    },
  ];

  return results;
};