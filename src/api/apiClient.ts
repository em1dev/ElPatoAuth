export interface RequestOptions {
  url: string,
  query?: Record<string, string | number>,
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: object | null,
  headers?: Record<string, string>,
}

export const apiClient = ({ url, body = null, method = 'GET', query = {}, headers = {}}: RequestOptions) => {
  const urlObject = new URL(url);
  Object.keys(query).forEach((key) => {
    urlObject.searchParams.set(key, query[key].toString());
  });

  return fetch(urlObject, {
    method,
    body: body ? JSON.stringify(body) : null,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  });
};

