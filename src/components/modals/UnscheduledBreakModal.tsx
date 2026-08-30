import React, { useState } from 'react';

export const UnscheduledBreakModal: React.FC<{ onCancel: () => void; onConfirm: () => void }> = ({ onCancel, onConfirm }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#fff', maxWidth: '560px', borderRadius: '8px', padding: '32px 36px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>You'll Lose Testing Time During This Break</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }} onClick={onCancel}>✕</button>
        </div>
        <p style={{ color: '#333', fontSize: '15px', lineHeight: '1.5', margin: '16px 0 24px 0' }}>
          Taking an unscheduled break does not pause the clock. Use the break rules you received before testing began.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <input type="checkbox" checked={acknowledged} onChange={() => setAcknowledged(!acknowledged)} style={{ marginRight: '8px' }} />
          <label style={{ fontSize: '15px', cursor: 'pointer' }}>I need to take a break, and I understand that I'll lose testing time.</label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ color: '#1a5fb4', fontWeight: '600', fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer', marginRight: '20px' }} onClick={onCancel}>Cancel</button>
          <button
            style={{
              backgroundColor: acknowledged ? '#ffd100' : '#ffd10080',
              color: '#000',
              fontWeight: '700',
              borderRadius: '24px',
              padding: '10px 24px',
              border: 'none',
              cursor: acknowledged ? 'pointer' : 'not-allowed',
              opacity: acknowledged ? 1 : 0.5,
            }}
            onClick={acknowledged ? onConfirm : undefined}
            disabled={!acknowledged}
          >
            Take Unscheduled Break
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnscheduledBreakModal;