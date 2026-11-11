import { buildApp } from './app.js';
import { devSeed } from './seed.js';
import { MemoryStore } from './store.js';

const port = Number(process.env.PORT ?? 3000);
const app = buildApp({ store: new MemoryStore(devSeed()), logger: true });

app.listen({ port, host: '0.0.0.0' }).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
