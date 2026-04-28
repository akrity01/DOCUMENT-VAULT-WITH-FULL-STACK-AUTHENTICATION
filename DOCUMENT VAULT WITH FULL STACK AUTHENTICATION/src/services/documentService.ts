const API = '/api/documents';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export async function listDocuments(params?: { category?: string; search?: string; page?: number }) {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API}?${query}`, { headers: authHeaders() });
  return res.json();
}

export async function getDocument(id: string) {
  const res = await fetch(`${API}/${id}`, { headers: authHeaders() });
  return res.json();
}

export async function saveTextDocument(data: {
  title: string; content: string; description?: string;
  category?: string; tags?: string[];
}) {
  const res = await fetch(`${API}/text`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function uploadFile(formData: FormData) {
  const res = await fetch(`${API}/file`, {
    method: 'POST',
    headers: authHeaders(), // NO Content-Type — browser sets multipart boundary
    body: formData,
  });
  return res.json();
}

export async function updateDocument(id: string, data: object) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteDocument(id: string) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
}