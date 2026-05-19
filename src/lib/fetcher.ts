export const fetcher = (url: string) =>
  fetch(url, {
    // Prevent aggressive browser caching (especially Edge)
    // Forces browser to revalidate with server before using cached response
    cache: 'no-cache',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  }).then((res) => {
    if (!res.ok) throw new Error('An error occurred while fetching the data.');
    return res.json();
  });
