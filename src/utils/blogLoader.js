export async function fetchManifest() {
  const res = await fetch('/blog/manifest.json');
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPost(slug) {
  const res = await fetch(`/blog/${slug}/index.json`);
  if (!res.ok) {
    const err = new Error(`Post not found: ${slug}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
