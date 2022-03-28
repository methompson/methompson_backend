function getMsg(): string {
  const d = new Date();
  if (d.getTime() % 2 === 0) {
    return 'Hello, World!'
  } else {
    return 'Goodbye, World!';
  }
}

export {
  getMsg,
};