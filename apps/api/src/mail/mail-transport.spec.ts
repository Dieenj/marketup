import { BrevoTransport, brevoPayload, parseAddress } from './mail-transport';

describe('parseAddress', () => {
  it('splits a display name from the address', () => {
    expect(parseAddress('MarketUp <hello@example.com>')).toEqual({
      name: 'MarketUp',
      email: 'hello@example.com',
    });
    expect(parseAddress('"Lumière Shop" <shop@example.com>')).toEqual({
      name: 'Lumière Shop',
      email: 'shop@example.com',
    });
  });

  it('accepts a bare address', () => {
    expect(parseAddress(' hello@example.com ')).toEqual({
      email: 'hello@example.com',
    });
    expect(parseAddress('<hello@example.com>')).toEqual({
      email: 'hello@example.com',
    });
  });
});

describe('BrevoTransport', () => {
  const mail = {
    from: 'MarketUp <hello@example.com>',
    to: 'buyer@example.com',
    subject: 'Hi',
    html: '<p>Hi</p>',
  };
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('builds the transactional email body', () => {
    expect(brevoPayload(mail)).toEqual({
      sender: { name: 'MarketUp', email: 'hello@example.com' },
      to: [{ email: 'buyer@example.com' }],
      subject: 'Hi',
      htmlContent: '<p>Hi</p>',
    });
  });

  it('posts with the API key header and returns the message id', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ messageId: '<abc@brevo>' }), {
        status: 201,
      }),
    );
    global.fetch = fetchMock;

    await expect(new BrevoTransport('key-1').send(mail)).resolves.toBe(
      '<abc@brevo>',
    );
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['api-key']).toBe('key-1');
    expect(JSON.parse(init.body as string)).toEqual(brevoPayload(mail));
  });

  it('throws with Brevo’s error message when the request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response('{"code":"unauthorized","message":"Key not found"}', {
        status: 401,
      }),
    );
    await expect(new BrevoTransport('bad').verify()).rejects.toThrow(
      /Brevo responded 401: .*Key not found/,
    );
  });
});
