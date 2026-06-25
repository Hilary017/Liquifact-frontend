import { copy } from '../app/copy/en';

/**
 * @typedef {Object} FooterLink
 * @property {string} label - Rendered link text.
 * @property {string} href - Destination URL.
 * @property {boolean} external - Whether the link opens in a new tab.
 */

export default function Footer() {
  /** @type {FooterLink[]} */
  const links = [
    {
      label: copy.footer.docs,
      href: copy.footer.docsUrl,
      external: true,
    },
    {
      label: copy.footer.status,
      href: copy.footer.statusUrl,
      external: true,
    },
    {
      label: copy.footer.contact,
      href: copy.footer.contactUrl,
      external: true,
    },
    {
      label: copy.footer.discord,
      href: copy.footer.discordUrl,
      external: true,
    },
  ];

  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-6 py-8">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-6 text-sm text-slate-300">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            className="inline-block py-3 hover:text-cyan-400 transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
