import { describe, expect, it } from 'vitest'
import {
  normalizeMatchOpponentStudy,
  validateExternalStudyLink,
} from '../../src/modules/match/matchOpponentStudyModel.js'

describe('Opponent Study external links', () => {
  const validUrls = [
    'https://www.youtube.com/playlist?list=PL1234567890',
    'https://www.youtube.com/playlist?list=PLCnPPMYVe5sM',
    'https://www.youtube.com/watch?v=abc123&list=PL1234567890',
    'https://youtu.be/abc123?si=xyz',
    'https://drive.google.com/file/d/abc123/view?usp=sharing',
    'https://www.hudl.com/video/3/example',
    'https://example.com/path?one=1&two=2#section',
    'http://example.com/resource',
    'HTTPS://EXAMPLE.COM/Path',
  ]

  it.each(validUrls)('accetta URL http/https reali: %s', (url) => {
    const result = validateExternalStudyLink({
      url,
      label: 'Test',
      category: 'general',
    })
    expect(result.valid).toBe(true)
    expect(result.value.url).toMatch(/^https?:\/\//i)
  })

  it.each([
    '\u200Bhttps://www.youtube.com/playlist?list=PL1234567890\uFEFF',
    '\u200Ehttps://youtu.be/abc123\u200F',
    '\u2066https://drive.google.com/file/d/abc/view\u2069',
  ])('ripulisce caratteri Unicode invisibili da copia/incolla', (url) => {
    const result = validateExternalStudyLink({ url })
    expect(result.valid).toBe(true)
    expect(result.value.url).toMatch(/^https?:\/\//)
  })

  it.each([
    '',
    'youtube.com/watch?v=abc',
    'javascript:alert(1)',
    'data:text/html,hello',
    'ftp://example.com/file',
    'not a url',
  ])('rifiuta input non ammesso: %s', (url) => {
    const result = validateExternalStudyLink({ url })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toBe('Inserisci un link http o https valido.')
  })

  it('preserva query e fragment di una playlist', () => {
    const result = validateExternalStudyLink({
      url: 'https://www.youtube.com/playlist?list=PL123&si=ABC#top',
    })
    expect(result.valid).toBe(true)
    expect(result.value.url).toContain('list=PL123')
    expect(result.value.url).toContain('si=ABC')
    expect(result.value.url).toContain('#top')
  })

  it('normalizza e conserva i link validi nel modello canonico', () => {
    const study = normalizeMatchOpponentStudy({
      matchId: 'match-1',
      links: [
        { id: '1', url: 'https://youtu.be/abc123', label: 'Video', category: 'general' },
        { id: '2', url: 'javascript:alert(1)', label: 'No', category: 'general' },
      ],
    })
    expect(study.links).toHaveLength(1)
    expect(study.links[0].label).toBe('Video')
    expect(study.links[0].url).toBe('https://youtu.be/abc123')
  })
})