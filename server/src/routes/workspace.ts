import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { parseMdWithWarnings } from '../services/workspace-parser.js';
import { generateMd } from '../services/workspace-generator.js';
import {
  WORKSPACE_FILENAMES,
  MAX_FILE_SIZE,
  type WorkspaceFilename,
  type WorkspaceFile,
} from '@shared/types/workspace.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const router = Router();

// POST /api/workspace/parse
router.post('/parse', upload.single('file'), (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'INVALID_FILE', message: 'No file uploaded' });
    return;
  }

  const filename = file.originalname;

  // Validate filename
  if (!WORKSPACE_FILENAMES.includes(filename as WorkspaceFilename)) {
    res.status(400).json({ error: 'INVALID_FILE', message: 'File must be SOUL.md, IDENTITY.md, or AGENTS.md' });
    return;
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    res.status(400).json({ error: 'INVALID_FILE', message: 'File must be .md and <= 10MB' });
    return;
  }

  // Validate no null bytes
  if (file.buffer.includes(0)) {
    res.status(400).json({ error: 'INVALID_FILE', message: 'File contains null bytes' });
    return;
  }

  const content = file.buffer.toString('utf-8');
  const { parsedData, warnings } = parseMdWithWarnings(content, filename as WorkspaceFilename);

  res.json({ filename, parsedData, warnings });
});

// Handle multer size limit errors
router.use('/parse', (err: Error & { code?: string }, _req: Request, res: Response, next: Function) => {
  if (err && (err as Record<string, unknown>).code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'INVALID_FILE', message: 'File must be .md and <= 10MB' });
    return;
  }
  next(err);
});

// POST /api/workspace/generate
router.post('/generate', (req: Request, res: Response) => {
  const { filename, parsedData } = req.body;

  if (!WORKSPACE_FILENAMES.includes(filename as WorkspaceFilename)) {
    res.status(400).json({ error: 'INVALID_FILE', message: 'Invalid filename' });
    return;
  }

  const content = generateMd(parsedData, filename as WorkspaceFilename);
  res.json({ filename, content });
});

// POST /api/workspace/export
router.post('/export', (req: Request, res: Response) => {
  const { files } = req.body as { files: WorkspaceFile[] };

  if (!files || files.length !== 3) {
    res.status(400).json({
      error: 'INVALID_FILE_COUNT',
      message: 'Must include all 3 workspace files',
    });
    return;
  }

  // Verify all 3 filenames present
  const filenames = files.map((f) => f.filename);
  for (const required of WORKSPACE_FILENAMES) {
    if (!filenames.includes(required)) {
      res.status(400).json({
        error: 'INVALID_FILE_COUNT',
        message: 'Must include all 3 workspace files',
      });
      return;
    }
  }

  const zip = new AdmZip();
  for (const file of files) {
    zip.addFile(file.filename, Buffer.from(file.content));
  }

  // Add manifest
  const manifest = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
  };
  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));

  const zipBuffer = zip.toBuffer();
  const dateStr = new Date().toISOString().split('T')[0];

  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', `attachment; filename="workspace-export-${dateStr}.zip"`);
  res.send(zipBuffer);
});

// POST /api/workspace/import
router.post('/import', upload.single('file'), (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'INVALID_FILE', message: 'No file uploaded' });
    return;
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    res.status(400).json({ error: 'INVALID_FILE', message: 'File must be <= 10MB' });
    return;
  }

  // Try to parse as zip
  let zip: AdmZip;
  try {
    zip = new AdmZip(file.buffer);
    // Verify it's actually a valid zip by trying to get entries
    zip.getEntries();
  } catch {
    res.status(400).json({ error: 'INVALID_ZIP', message: 'Invalid zip file' });
    return;
  }

  const entries = zip.getEntries();
  const warnings: string[] = [];
  const foundFiles: WorkspaceFile[] = [];
  const ALLOWED_FILENAMES = [...WORKSPACE_FILENAMES, 'manifest.json'];

  for (const entry of entries) {
    const name = entry.entryName;

    // Path traversal check
    if (name.includes('..') || name.startsWith('/')) {
      warnings.push(`Invalid filename: ${name}`);
      continue;
    }

    // Only process allowed filenames
    if (!ALLOWED_FILENAMES.includes(name)) {
      warnings.push(`Invalid filename: ${name}`);
      continue;
    }

    // Skip manifest
    if (name === 'manifest.json') continue;

    const content = entry.getData().toString('utf-8');
    const { parsedData } = parseMdWithWarnings(content, name as WorkspaceFilename);

    foundFiles.push({
      filename: name as WorkspaceFilename,
      content,
      parsedData,
    });
  }

  // Verify all 3 required files present
  const foundFilenames = foundFiles.map((f) => f.filename);
  for (const required of WORKSPACE_FILENAMES) {
    if (!foundFilenames.includes(required)) {
      res.status(400).json({
        error: 'INVALID_ZIP',
        message: `Missing required file: ${required}`,
      });
      return;
    }
  }

  res.json({ files: foundFiles, warnings });
});

// Handle multer size limit errors for import
router.use('/import', (err: Error & { code?: string }, _req: Request, res: Response, next: Function) => {
  if (err && (err as Record<string, unknown>).code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'INVALID_FILE', message: 'File must be <= 10MB' });
    return;
  }
  next(err);
});

export default router;
