import { IconPencil, IconTrash, IconExternalLink, IconBookmark } from '@tabler/icons-react';

function getMicrolinkUrl(link) {
  return `https://api.microlink.io/?url=${encodeURIComponent(link)}&screenshot=true&meta=false&embed=screenshot.url`;
}

function ScreenshotPreview({ reference }) {
  const imgSrc = reference.screenshotUrl || (reference.link ? getMicrolinkUrl(reference.link) : null);
  if (imgSrc) {
    return (
      <div className="h-[120px] md:h-32 rounded-t-card overflow-hidden bg-cream relative">
        <img
          src={imgSrc}
          alt={reference.nome}
          className="w-full h-full object-cover"
          onError={e => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div
          className="absolute inset-0 items-center justify-center hidden"
          style={{ backgroundColor: reference.corFundo || '#EDE4D8' }}
        >
          <span className="text-sm font-medium px-3 text-center text-dark">{reference.nome}</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="h-[120px] md:h-32 rounded-t-card flex items-center justify-center"
      style={{ backgroundColor: reference.corFundo || '#EDE4D8' }}
    >
      <span className="text-sm font-medium px-3 text-center text-dark">{reference.nome}</span>
    </div>
  );
}

export default function ReferenceCard({ reference, onEdit, onDelete }) {
  const projectCount = reference.projects?.length || 0;

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden hover:shadow-sm transition-shadow group">
      <ScreenshotPreview reference={reference} />

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark truncate">{reference.nome}</p>
            {reference.link && (
              <a
                href={reference.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[11px] text-caramel hover:underline truncate block"
              >
                {(() => { try { return new URL(reference.link).hostname; } catch { return reference.link; } })()}
              </a>
            )}
          </div>
          {/* Sempre visível no mobile, hover no desktop */}
          <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            {reference.link && (
              <a href={reference.link} target="_blank" rel="noopener noreferrer" className="p-1 text-faint hover:text-caramel transition-colors">
                <IconExternalLink size={14} />
              </a>
            )}
            {onEdit && (
              <button onClick={() => onEdit(reference)} className="p-1 text-faint hover:text-terra transition-colors">
                <IconPencil size={14} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(reference.id)} className="p-1 text-faint hover:text-red-500 transition-colors">
                <IconTrash size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {reference.subcategoria && (
            <span className="text-[10px] px-2 py-0.5 bg-cream border border-border rounded-full text-faint">
              {reference.subcategoria}
            </span>
          )}
          {(reference.tags || []).map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 bg-[#F0E8DC] border border-[#E0D8CC] rounded-full text-muted">
              {tag}
            </span>
          ))}
          {projectCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-faint ml-auto">
              <IconBookmark size={10} className="text-caramel" />
              {projectCount}
            </span>
          )}
        </div>

        {reference.anotacoes && (
          <p className="text-[11px] text-faint mt-1.5 line-clamp-2">{reference.anotacoes}</p>
        )}
      </div>
    </div>
  );
}
