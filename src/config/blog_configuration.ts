export function blogConfiguration() {
  if (process.env.BLOG_TYPE === 'mongo_db') {
    return {
      blogType: 'mongo_db',
    };
  }

  return {
    blogType: 'memory',
  };
}
