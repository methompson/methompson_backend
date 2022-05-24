import { readFile } from 'fs/promises';

import ejs from 'ejs';

(async function test() {
  const buffer = await readFile('./tools/templates/test.ejs', {});

  const template = buffer.toString();

  console.log(template);

  const output = ejs.render(template)

  console.log(output);
})();