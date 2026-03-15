import { Router, type Request, type Response } from 'express';
import * as service from '../services/agent-service.js';

const router = Router();

// GET /api/agents
router.get('/', (_req: Request, res: Response) => {
  const agents = service.listAgents();
  res.json({ agents });
});

// GET /api/agents/:id
router.get('/:id', (req: Request, res: Response) => {
  const agent = service.getAgent(req.params.id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.json(agent);
});

// POST /api/agents
router.post('/', (req: Request, res: Response) => {
  const { agent, errors } = service.createAgent(req.body);
  if (errors) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }
  res.status(201).json(agent);
});

// PUT /api/agents/:id
router.put('/:id', (req: Request, res: Response) => {
  const { agent, errors, notFound, conflict } = service.updateAgent(req.params.id, req.body);
  if (notFound) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  if (conflict) {
    res.status(409).json({ error: 'Agent has been modified by another request' });
    return;
  }
  if (errors) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }
  res.json(agent);
});

// DELETE /api/agents/:id
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = service.deleteAgent(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.status(204).send();
});

// POST /api/agents/export
router.post('/export', (_req: Request, res: Response) => {
  const { data, error } = service.exportAgents();
  if (error) {
    res.status(400).json({ error });
    return;
  }
  res.json(data);
});

// POST /api/agents/import
router.post('/import', (req: Request, res: Response) => {
  const { result, error } = service.importAgents(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  res.json(result);
});

export default router;
