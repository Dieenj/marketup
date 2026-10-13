import { escapeHtml } from './html';

describe('escapeHtml', () => {
  it('escapes markup so user input cannot inject tags or attributes', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
    expect(escapeHtml("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s');
  });

  it('keeps normal text (including Vietnamese) unchanged', () => {
    expect(escapeHtml('Nguyễn Văn A, 12 Lê Lợi')).toBe(
      'Nguyễn Văn A, 12 Lê Lợi',
    );
  });

  it('treats null/undefined as empty', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
