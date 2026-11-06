export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET.' });
  }
  const query = typeof req.query?.q === 'string' ? req.query.q.trim().slice(0, 180) : '';
  if (query.length < 2) return res.status(400).json({ error: 'Give me something to search for.' });
  try {
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.search = new URLSearchParams({
      action: 'query', list: 'search', srsearch: query, srlimit: '5',
      format: 'json', origin: '*'
    }).toString();
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'CLIVE-CompanionOS/0.1 (personal assistant demo)' }
    });
    if (!response.ok) return res.status(502).json({ error: 'The search service is unavailable.' });
    const data = await response.json();
    const results = (data?.query?.search || []).map((item: any) => ({
      title: String(item.title || ''),
      snippet: String(item.snippet || '').replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
      url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(String(item.title || '').replace(/ /g, '_'))
    }));
    return res.status(200).json({ query, results, source: 'Wikipedia' });
  } catch {
    return res.status(500).json({ error: 'I could not search just now.' });
  }
}
