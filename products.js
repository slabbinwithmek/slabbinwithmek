const { getStore } = require('@netlify/blobs');

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

exports.handler = async (event) => {
  const store = getStore('slabbinwithmek-products');
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    const data = (await store.get('list', { type: 'json' })) || [];
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  // Everything below (add / remove) requires the admin secret
  const providedSecret = event.headers['x-admin-secret'] || '';
  if (!ADMIN_SECRET || providedSecret !== ADMIN_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (event.httpMethod === 'POST') {
    let newProduct;
    try {
      newProduct = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad request body' }) };
    }
    const data = (await store.get('list', { type: 'json' })) || [];
    newProduct.id = Date.now();
    data.unshift(newProduct);
    await store.setJSON('list', data);
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  if (event.httpMethod === 'DELETE') {
    let id;
    try {
      id = JSON.parse(event.body).id;
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad request body' }) };
    }
    let data = (await store.get('list', { type: 'json' })) || [];
    data = data.filter((p) => p.id !== id);
    await store.setJSON('list', data);
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
