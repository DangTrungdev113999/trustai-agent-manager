import express from 'express';
import agentRoutes from './routes/agents.js';

const app = express();
app.use(express.json());

app.use('/api/agents', agentRoutes);

export default app;
