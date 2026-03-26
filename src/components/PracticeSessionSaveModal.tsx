import React, { useEffect, useState } from 'react';

interface PracticeSessionSaveModalProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
  onSkipSave?: () => void;
}

const PracticeSessionSaveModal: React.FC<PracticeSessionSaveModalProps> = ({
  isOpen,
  initialName,
  onClose,
  onConfirm,
  onSkipSave
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-backdrop-home)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1750,
        padding: '0 16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--DARK_GRAY)',
          boxShadow: 'var(--shadow-medium)',
          padding: '16px',
          boxSizing: 'border-box',
          fontFamily: 'var(--FONT_FAMILY)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          이 설정을 저장할까요?
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          이름을 입력하면 저장 항목으로 추가됩니다.
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="저장 이름"
          style={{
            width: '100%',
            height: '34px',
            border: '1px solid var(--DARK_GRAY)',
            borderRadius: '8px',
            padding: '0 10px',
            boxSizing: 'border-box',
            fontSize: '12px',
            color: 'var(--text-primary)',
            background: 'var(--bg-primary)',
            marginBottom: '14px'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '32px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid var(--DARK_GRAY)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          {onSkipSave && (
            <button
              type="button"
              onClick={onSkipSave}
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--DARK_GRAY)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              저장 안함
            </button>
          )}
          <button
            type="button"
            onClick={() => onConfirm(name)}
            style={{
              height: '32px',
              padding: '0 14px',
              borderRadius: '8px',
              border: '1px solid var(--LIVING_CORAL)',
              background: 'var(--LIVING_CORAL)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSessionSaveModal;
