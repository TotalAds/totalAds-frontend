/**
 * GoDaddy, Namecheap, and many DNS UIs ask for a *relative* host (they append your domain).
 * Showing the full FQDN in that field causes double domains (e.g. _dmarc.example.com.example.com).
 */

export function dnsRegistrarHost(
  fqdn: string,
  zoneApex: string
): { host: string; fqdn: string } {
  const fq = fqdn.replace(/\.$/, "").trim();
  const z = zoneApex.replace(/\.$/, "").trim().toLowerCase();
  const f = fq.toLowerCase();
  if (!fq) return { host: "", fqdn: fq };
  if (!z) return { host: fq, fqdn: fq };

  if (f === z) return { host: "@", fqdn: fq };
  if (f.endsWith(`.${z}`)) {
    const rel = fq.slice(0, fq.length - z.length - 1);
    return { host: rel || "@", fqdn: fq };
  }

  // If MAIL FROM / record sits on a sibling zone (e.g. email.brand.com while apex is brand.com)
  const labels = fq.split(".").filter(Boolean);
  if (labels.length >= 2) {
    const root = labels.slice(-2).join(".");
    if (f === root) return { host: "@", fqdn: fq };
    if (f.endsWith(`.${root}`)) {
      const rel = fq.slice(0, fq.length - root.length - 1);
      return { host: rel || "@", fqdn: fq };
    }
  }

  return { host: fq, fqdn: fq };
}
