import express from 'express';
import agentRoutes from './routes/agents.js';
import workspaceRoutes from './routes/workspace.js';

const app = express();
app.use(express.json());

app.use('/api/agents', agentRoutes);
app.use('/api/workspace', workspaceRoutes);

export default app;
