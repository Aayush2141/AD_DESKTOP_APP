const fs = require('fs');
const path = require('path');
const { shell } = require('electron');
const { getDb } = require('../db');

function getUploadsDir() {
  let basePath;
  try {
    const { app } = require('electron');
    if (app && typeof app.getPath === 'function') {
      basePath = app.getPath('userData');
    }
  } catch (err) {}

  if (!basePath) {
    basePath = path.resolve(__dirname, '../../data');
  }

  const uploadsPath = path.join(basePath, 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  return uploadsPath;
}

function saveFileLocally(buffer, originalName, docType, dissertationId, user) {
  const uploadsDir = getUploadsDir();
  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const savedFileName = `${dissertationId || 'doc'}_${docType}_${timestamp}_${safeName}`;
  const targetPath = path.join(uploadsDir, savedFileName);

  fs.writeFileSync(targetPath, Buffer.from(buffer));

  const stats = fs.statSync(targetPath);
  const mimeType = originalName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

  const db = getDb();
  if (dissertationId) {
    db.prepare(`
      INSERT INTO documents (
        dissertation_id, uploaded_by, doc_type, original_name,
        file_path, file_size, mime_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      dissertationId,
      user.id,
      docType || 'other',
      originalName,
      targetPath,
      stats.size,
      mimeType
    );
  }

  return {
    filePath: targetPath,
    fileName: originalName,
    fileSize: stats.size,
    mimeType
  };
}

async function openFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('File does not exist or has been moved');
  }
  await shell.openPath(filePath);
  return { success: true };
}

function readFileBase64(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('File not found at specified path');
  }
  const data = fs.readFileSync(filePath);
  const mime = filePath.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
  return `data:${mime};base64,${data.toString('base64')}`;
}

module.exports = {
  saveFileLocally,
  openFile,
  readFileBase64,
  getUploadsDir,
};
