import {
  appleSubscribeUrl,
  eventIcs,
  googleEventUrl,
  googleSubscribeUrl,
  outlookEventUrl,
  outlookSubscribeUrl,
} from '@/lib/calendarLinks';

const FEED = 'https://bcm.example/api/v1/calendar/fake-feed-token.ics';

describe('calendar links: subscribing to the feed', () => {
  it('Google takes the feed as webcal in cid', () => {
    expect(googleSubscribeUrl(FEED)).toBe(
      'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent('webcal://bcm.example/api/v1/calendar/fake-feed-token.ics'),
    );
  });

  it('Outlook, personal or work, adds it from the web with a name', () => {
    expect(outlookSubscribeUrl(FEED)).toMatch(/^https:\/\/outlook\.live\.com\/calendar\/0\/addfromweb\?url=https%3A%2F%2Fbcm\.example/);
    expect(outlookSubscribeUrl(FEED)).toContain('name=Scadenze%20BCM');
    expect(outlookSubscribeUrl(FEED, true)).toMatch(/^https:\/\/outlook\.office\.com\//);
  });

  it('Apple opens the webcal link', () => {
    expect(appleSubscribeUrl(FEED)).toBe('webcal://bcm.example/api/v1/calendar/fake-feed-token.ics');
  });
});

describe('calendar links: adding one date', () => {
  const event = { title: 'Disdici NRT-123 - Gestio Software', date: '2026-12-01', details: 'Ultimo giorno per disdire' };

  it('Google: an all-day event, the end the day after (exclusive)', () => {
    const url = new URL(googleEventUrl(event));
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toBe('20261201/20261202');
    expect(url.searchParams.get('text')).toBe(event.title);
  });

  it('Outlook: an all-day event on that date', () => {
    const url = new URL(outlookEventUrl(event));
    expect(url.searchParams.get('startdt')).toBe('2026-12-01');
    expect(url.searchParams.get('enddt')).toBe('2026-12-02');
    expect(url.searchParams.get('allday')).toBe('true');
  });

  it('crosses a month and a year end correctly', () => {
    expect(new URL(googleEventUrl({ title: 'x', date: '2026-12-31' })).searchParams.get('dates')).toBe('20261231/20270101');
  });

  it('.ics: one all-day event with reminders a week and a day before, text escaped', () => {
    const ics = eventIcs({ title: 'Disdici NRT-1, Rossi; Impianti', date: '2026-12-15' }, 'c1', new Date('2026-11-25T10:00:00Z'));

    expect(ics).toContain('DTSTART;VALUE=DATE:20261215');
    expect(ics).toContain('DTEND;VALUE=DATE:20261216');
    expect(ics).toContain('SUMMARY:Disdici NRT-1\\, Rossi\\; Impianti');
    expect(ics).toContain('TRIGGER:-P7D');
    expect(ics).toContain('TRIGGER:-P1D');
    expect(ics).toContain('UID:c1@bcm');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });
});
