import Koa from 'koa';

const app = new Koa();

app.use(async (ctx) => {
  ctx.body = 'Goodbye, World!';
});

app.listen(3000);