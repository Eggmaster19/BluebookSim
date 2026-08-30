import React from 'react';

export const ExitExamModal: React.FC<{ onContinue: () => void; onExit: () => void }> = ({ onContinue, onExit }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px 36px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', maxWidth: '560px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#000000' }}>Are You Sure You Want to Exit this Exam?</h2>
          <button onClick={onContinue} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#333333', marginTop: '16px', marginBottom: '32px' }}>
          Tests are automatically saved and viewable in the previous tests section as incomplete. You can restart it any time. Don't actually click this on the real exam.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onContinue} style={{ background: 'none', border: 'none', color: '#1a5fb4', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginRight: '20px' }}>Continue Exam</button>
          <button onClick={onExit} style={{ background: '#ffd100', color: '#000000', fontWeight: '700', fontSize: '15px', border: 'none', borderRadius: '24px', padding: '10px 28px', cursor: 'pointer' }}>Exit</button>
        </div>
      </div>
    </div>
  );
};

export default ExitExamModal;