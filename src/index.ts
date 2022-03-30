import 'dotenv/config';
import Koa from 'koa';

(async function startServer() {
  const app = new Koa();

  app.use(async (ctx) => {
    ctx.body = 'Hello, World!';
  });

  app.listen(3000);
})();