import { IconPencil, IconTrash } from '@tabler/icons-react';

const SAMPLE_FONTS = ['DM Sans', 'Inter', 'Poppins', 'Playfair Display', 'Space Grotesk'];

function TypographyPreview({ nome }) {
  const fontName = SAMPLE_FONTS.find((f) => nome.toLowerCase().includes(f.toLowerCase())) || 'DM Sans';
  return (
    <div
      className="p-4 rounded-t-card border-b border-border bg-cream flex flex-col items-center justify-center h-32"
      style={{ fontFamily: fontName }}
    >
      <span className="text-5xl text-dark font-medium">Aa</span>
      <span className="text-xs text-muted mt-1 tracking-wider">
        ABCDEFGHIJKLMNOPQRSTUVWXYZ
      </span>
    </div>
  );
}

function ColorPreview({ corFundo, nome }) {
  const bg = corFundo || '#EDE4D8';
  return (
    <div
      className="h-32 rounded-t-card flex items-center justify-center"
      style={{ backgroundColor: bg }}
    >
      <span
        className="text-sm font-medium px-3 text-center"
        style={{ color: isLight(bg) ? '#2C1810' : '#FDFAF5' }}
      >
        {nome}
      </span>
    </div>
  );
}

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function WireframePreview() {
  return (
    <div className="h-32 rounded-t-card bg-cream p-3 flex flex-col gap-1.5">
      <div className="h-3 bg-border rounded w-3/4" />
      <div className="flex gap-1.5 flex-1">
        <div className="w-16 bg-border rounded" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-4 bg-border rounded" />
          <div className="h-4 bg-border rounded w-5/6" />
          <div className="h-4 bg-border rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

function ToolPreview({ corFundo, nome }) {
  const bg = corFundo || '#2C1810';
  return (
    <div
      className="h-32 rounded-t-card flex items-center justify-center"
      style={{ backgroundColor: bg }}
    >
      <span
        className="text-lg font-medium tracking-tight"
        style={{ color: isLight(bg) ? '#2C1810' : '#FDFAF5' }}
      >
        {nome}
      </span>
    </div>
  );
}

function Preview({ reference }) {
  const cat = reference.subcategoria || reference.categoria;
  if (cat === 'tipografia') return <TypographyPreview nome={reference.nome} />;
  if (cat === 'layout') return <WireframePreview />;
  if (cat === 'ferramentas' || cat === 'sites' || reference.categoria === 'infraestrutura') {
    return <ToolPreview corFundo={reference.corFundo} nome={reference.nome} />;
  }
  return <ColorPreview corFundo={reference.corFundo} nome={reference.nome} />;
}

export default function ReferenceCard({ reference, onEdit, onDelete }) {
  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden hover:shadow-sm transition-shadow group">
      <Preview reference={reference} />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark truncate">{reference.nome}</p>
            {reference.link && (
              <a
                href={reference.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-caramel hover:underline truncate block"
              >
                {new URL(reference.link).hostname}
              </a>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(reference)}
                className="p-1 text-faint hover:text-terra transition-colors"
              >
                <IconPencil size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(reference.id)}
                className="p-1 text-faint hover:text-red-500 transition-colors"
              >
                <IconTrash size={16} />
              </button>
            )}
          </div>
        </div>
        {reference.anotacoes && (
          <p className="text-[11px] text-faint mt-1.5 line-clamp-2">{reference.anotacoes}</p>
        )}
      </div>
    </div>
  );
}
