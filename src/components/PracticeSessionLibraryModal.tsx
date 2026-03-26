import React from 'react';

export interface PracticeSessionListItem {
  id: string;
  source: 'today' | 'saved';
  title: string;
  bpm?: number;
  numerator?: number;
  denominator?: number;
}

interface PracticeSessionLibraryModalProps {
  isOpen: boolean;
  anchorTop?: number;
  items: PracticeSessionListItem[];
  onClose: () => void;
  onSelect: (item: PracticeSessionListItem) => void;
  onDelete: (item: PracticeSessionListItem) => void;
}

const PracticeSessionLibraryModal: React.FC<PracticeSessionLibraryModalProps> = ({
  isOpen,
  anchorTop = 230,
  items,
  onClose,
  onSelect,
  onDelete
}) => {
  if (!isOpen) return null;

  const todayItems = items.filter((item) => item.source === 'today');
  const savedItems = items.filter((item) => item.source === 'saved');

  const renderItem = (item: PracticeSessionListItem) => {
    const tempoText = item.bpm ? String(item.bpm) : '미설정';
    const signatureText =
      item.numerator && item.denominator
        ? `${item.numerator}/${item.denominator}`
        : '미설정';

    return (
      <div
        key={`${item.source}:${item.id}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '0',
          borderRadius: '8px',
          background: 'transparent',
          color: 'var(--text-primary)',
          fontFamily: 'var(--FONT_FAMILY)'
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(item)}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            border: 'none',
            borderRadius: '8px',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontFamily: 'var(--FONT_FAMILY)',
            fontSize: '12px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{tempoText}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{signatureText}</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
          aria-label={`${item.title} 삭제`}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '6px 4px',
            whiteSpace: 'nowrap'
          }}
        >
          삭제
        </button>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'transparent',
          zIndex: 1700
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: `${anchorTop + 60}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          maxHeight: 'min(62vh, 520px)',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--DARK_GRAY)',
          zIndex: 1701,
          fontFamily: 'var(--FONT_FAMILY)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)', textAlign: 'center' }}>곡 목록</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          곡명 / 템포 / 박자
        </div>

        {todayItems.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 12px 4px' }}>Today</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {todayItems.map(renderItem)}
            </div>
          </div>
        )}

        {savedItems.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 12px 4px' }}>저장 항목</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {savedItems.map(renderItem)}
            </div>
          </div>
        )}

        {todayItems.length === 0 && savedItems.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px 12px' }}>표시할 항목이 없습니다.</div>
        )}
      </div>
    </>
  );
};

export default PracticeSessionLibraryModal;
