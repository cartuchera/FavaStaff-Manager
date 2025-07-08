import React from 'react';

const ProgressBar1 = ({ values }) => {
  return (
    <div style={{ width: '300px', margin: '20px auto' }}>
      {values.map((value, idx) => (
        <div key={idx} style={{ background: '#eee', borderRadius: '8px', height: '20px', marginBottom: '10px' }}>
          <div
            style={{
              background: '#007bff',
              width: `${value}%`,
              height: '100%',
              borderRadius: '8px',
              transition: 'width 0.3s'
            }}
          ></div>
        </div>
      ))}
    </div>
  );
};

export default ProgressBar1;