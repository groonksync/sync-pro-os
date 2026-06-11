import axios from 'axios';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const TASKS_API_URL = 'https://tasks.googleapis.com/tasks/v1';
const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

export const getDriveFiles = async (accessToken, folderId = 'root') => {
  const response = await axios.get(`${DRIVE_API_URL}/files`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, thumbnailLink, iconLink, webViewLink, webContentLink, size, modifiedTime)',
      orderBy: 'folder,name',
    },
  });
  return response.data.files;
};

export const uploadFileToDrive = async (accessToken, file, parentId = 'root', onProgress) => {
  const metadata = { name: file.name, parents: [parentId] };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);
  const response = await axios.post(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    formData,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      onUploadProgress: (e) => { if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total)); },
    }
  );
  return response.data;
};

export const deleteDriveFile = async (accessToken, fileId) => {
  await axios.delete(`${DRIVE_API_URL}/files/${fileId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};

export const downloadDriveFile = async (accessToken, file) => {
  // Google Docs/Sheets/Slides need export; binary files need direct download
  const isGoogleDoc = file.mimeType.startsWith('application/vnd.google-apps');
  let url, filename;
  if (isGoogleDoc) {
    const mimeMap = {
      'application/vnd.google-apps.document': { mime: 'application/pdf', ext: 'pdf' },
      'application/vnd.google-apps.spreadsheet': { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
      'application/vnd.google-apps.presentation': { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx' },
    };
    const target = mimeMap[file.mimeType] || { mime: 'application/pdf', ext: 'pdf' };
    url = `${DRIVE_API_URL}/files/${file.id}/export?mimeType=${encodeURIComponent(target.mime)}`;
    filename = `${file.name}.${target.ext}`;
  } else {
    url = `${DRIVE_API_URL}/files/${file.id}?alt=media`;
    filename = file.name;
  }
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: 'blob',
  });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const getTaskLists = async (accessToken) => {
  const response = await axios.get(`${TASKS_API_URL}/users/@me/lists`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data.items;
};

export const getTasks = async (accessToken, listId) => {
  const response = await axios.get(`${TASKS_API_URL}/lists/${listId}/tasks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { showCompleted: true },
  });
  return response.data.items || [];
};

export const createDriveFolder = async (accessToken, name, parentId = 'root') => {
  const response = await axios.post(
    `${DRIVE_API_URL}/files`,
    {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return response.data;
};

// CALENDAR API
export const getCalendarList = async (token) => {
  try {
    const response = await axios.get(`${CALENDAR_API_URL}/users/me/calendarList`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    return [];
  }
};

export const getCalendarEvents = async (token, calendarId = 'primary', year, month) => {
  try {
    const timeMin = new Date(year, month, 1).toISOString();
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    
    const response = await axios.get(`${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        timeMin,
        timeMax,
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
      }
    });
    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching events for ${calendarId}:`, error);
    return [];
  }
};

export const createCalendarEvent = async (token, eventData, calendarId = 'primary') => {
  const response = await axios.post(`${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events`, eventData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createGoogleTask = async (token, title, notes = '') => {
  // Primero obtenemos la lista por defecto
  const lists = await getTaskLists(token);
  const defaultListId = lists[0].id;
  
  const response = await axios.post(`${TASKS_API_URL}/lists/${defaultListId}/tasks`, {
    title,
    notes,
    status: 'needsAction'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ─── AGENCIA ARX — INVOICE DRIVE HELPERS ─────────────────────────────────────

const ARX_FOLDER_NAME = 'Agencia Arx';
const ARX_INVOICES_SUBFOLDER = 'Facturas';

// Finds or creates a folder by name inside a parent
const findOrCreateFolder = async (token, name, parentId = 'root') => {
  const searchRes = await axios.get(`${DRIVE_API_URL}/files`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    },
  });
  if (searchRes.data.files.length > 0) return searchRes.data.files[0].id;
  const createRes = await axios.post(`${DRIVE_API_URL}/files`, {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  }, { headers: { Authorization: `Bearer ${token}` } });
  return createRes.data.id;
};

// Returns the ID of the Facturas folder (creates if needed)
export const getArxInvoicesFolder = async (token) => {
  const arxFolderId = await findOrCreateFolder(token, ARX_FOLDER_NAME, 'root');
  return await findOrCreateFolder(token, ARX_INVOICES_SUBFOLDER, arxFolderId);
};

// Saves an invoice object as JSON to Drive; returns the created file metadata
export const saveInvoiceToDrive = async (token, invoice) => {
  const folderId = await getArxInvoicesFolder(token);
  const fileName = `${invoice.numero}.json`;
  const content = JSON.stringify(invoice, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const metadata = { name: fileName, parents: [folderId], mimeType: 'application/json' };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', blob);
  const res = await axios.post(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    formData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Loads all invoices from the Facturas folder
export const loadInvoicesFromDrive = async (token) => {
  const folderId = await getArxInvoicesFolder(token);
  const res = await axios.get(`${DRIVE_API_URL}/files`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
    },
  });
  const files = res.data.files || [];
  const invoices = await Promise.all(files.map(async (f) => {
    try {
      const content = await axios.get(`${DRIVE_API_URL}/files/${f.id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { ...content.data, _driveFileId: f.id };
    } catch { return null; }
  }));
  return invoices.filter(Boolean);
};

// Deletes an invoice from Drive by Drive file ID
export const deleteInvoiceFromDrive = async (token, driveFileId) => {
  await axios.delete(`${DRIVE_API_URL}/files/${driveFileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Updates an existing invoice in Drive (delete + re-upload)
export const updateInvoiceInDrive = async (token, driveFileId, invoice) => {
  await deleteInvoiceFromDrive(token, driveFileId);
  return await saveInvoiceToDrive(token, invoice);
};

// ─── CONTROL PDF — DRIVE HIERARCHY HELPERS ───────────────────────────────────

export const getControlPdfSubfolder = async (token, subfolderName) => {
  const masterFolderId = await findOrCreateFolder(token, 'control PDF', 'root');
  return await findOrCreateFolder(token, subfolderName, masterFolderId);
};

// Uploads a PDF blob directly to Google Drive in the specified subfolder
export const uploadPdfToDrive = async (token, pdfBlob, fileName, subfolderName) => {
  const folderId = await getControlPdfSubfolder(token, subfolderName);
  const metadata = { name: fileName, parents: [folderId], mimeType: 'application/pdf' };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', pdfBlob);
  const res = await axios.post(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    formData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// ─── GOOGLE CALENDAR EXTRA CRUD HELPERS ──────────────────────────────────────

export const updateCalendarEvent = async (token, eventId, eventData, calendarId = 'primary') => {
  const response = await axios.patch(
    `${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    eventData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const deleteCalendarEvent = async (token, eventId, calendarId = 'primary') => {
  await axios.delete(
    `${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};


