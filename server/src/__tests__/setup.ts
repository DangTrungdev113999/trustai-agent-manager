import { beforeEach } from 'vitest';
import { reset } from '../services/agent-store.js';
import superagent from 'superagent';

// Register binary parser for application/zip so supertest returns Buffer
const binaryParser = superagent.parse['application/octet-stream'];
if (binaryParser) {
  superagent.parse['application/zip'] = binaryParser;
}

beforeEach(() => {
  reset();
});
