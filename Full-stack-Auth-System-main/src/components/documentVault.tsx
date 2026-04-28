import React, { useEffect, useState, useRef } from 'react';
import { listDocuments, saveTextDocument, uploadFile, deleteDocument, getDocument } from '../services/documentService';

const CATEGORIES = ['identity','finance','medical','legal','personal','other'];

export default function DocumentVault() {
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState<'list' | 'new-text' | 'new-file'>('list');
  const [selected, setSelected] = useState<any>(null);

  // New text form
  const [form, setForm] = useState({ title: '', content: '', description: '', category: 'personal' });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDocs(); }, [search, category]);

  async function fetchDocs() {
    const data = await listDocuments({ search, category });
    setDocs(data.documents || []);
  }

  async function handleSaveText(e: React.FormEvent) {
    e.preventDefault();
    await saveTextDocument(form);
    setView('list');
    setForm({ title: '', content: '', description: '', category: 'personal' });
    fetchDocs();
  }

  async function handleUploadFile(e: React.FormEvent) {
    e.preventDefault();
    if (!fileRef.current?.files?.[0]) return;
    const fd = new FormData();
    fd.append('file', fileRef.current.files[0]);
    fd.append('category', category || 'other');
    await uploadFile(fd);
    setView('list');
    fetchDocs();
  }

  async function handleView(id: string) {
    const data = await getDocument(id);
    setSelected(data);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return;
    await deleteDocument(id);
    fetchDocs();
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Secure document vault</h2>

      {view === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input placeholder="Search..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }} />
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}>
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => setView('new-text')}
              style={{ padding: '6px 14px', borderRadius: 6, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>
              + Note
            </button>
            <button onClick={() => setView('new-file')}
              style={{ padding: '6px 14px', borderRadius: 6, background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer' }}>
              + File
            </button>
          </div>

          {docs.length === 0 && <p style={{ color: '#888' }}>No documents yet. Add your first note or file.</p>}
          {docs.map(doc => (
            <div key={doc._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', marginBottom: 8, borderRadius: 8,
              border: '1px solid #e5e7eb', background: '#fafafa'
            }}>
              <div>
                <strong style={{ fontSize: 15 }}>{doc.title}</strong>
                <span style={{ marginLeft: 10, fontSize: 12, color: '#6b7280',
                  background: '#f3f4f6', padding: '2px 8px', borderRadius: 10 }}>
                  {doc.category}
                </span>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {doc.contentType === 'file' ? `📄 ${doc.originalName} (${(doc.size/1024).toFixed(1)} KB)`
                    : `📝 ${(doc.size/1024).toFixed(1)} KB`}
                  {' · '}{new Date(doc.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleView(doc._id)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}>
                  View
                </button>
                <button onClick={() => handleDelete(doc._id)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5',
                    color: '#dc2626', background: 'transparent', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {view === 'new-text' && (
        <form onSubmit={handleSaveText} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3>New encrypted note</h3>
          <input required placeholder="Title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <textarea required rows={8} placeholder="Your sensitive information..."
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit"
              style={{ padding: '8px 20px', borderRadius: 6, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Save encrypted
            </button>
            <button type="button" onClick={() => setView('list')}
              style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {view === 'new-file' && (
        <form onSubmit={handleUploadFile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3>Upload encrypted file</h3>
          <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
            style={{ padding: '8px 10px' }} />
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            File is encrypted with AES-256 before storage. Max 5 MB. PDF, images, Word, plain text.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit"
              style={{ padding: '8px 20px', borderRadius: 6, background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Upload & encrypt
            </button>
            <button type="button" onClick={() => setView('list')}
              style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Document viewer modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 12, padding: 24,
            maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <h3>{selected.document?.title}</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 14,
              background: '#f9fafb', padding: 12, borderRadius: 6 }}>
              {selected.content}
            </pre>
            <button onClick={() => setSelected(null)}
              style={{ marginTop: 16, padding: '6px 16px', borderRadius: 6,
                border: '1px solid #ccc', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}