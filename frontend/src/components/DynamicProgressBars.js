import React, { useState } from 'react';
import ProgressBar1 from './ProgressBar1';

function DynamicProgressBars() {
  const [bars, setBars] = useState([10, 75, 90]);

  const handleChange = (idx, e) => {
    const newBars = [...bars];
    newBars[idx] = Number(e.target.value);
    setBars(newBars);
  };

  return (
    <div>
      <ProgressBar1 values={bars} />
      {bars.map((value, idx) => (
        <div key={idx}>
          <label>Barra {idx + 1}: </label>
          <input type="range" min="0" max="100" value={value} onChange={e => handleChange(idx, e)} />
          {value}%
        </div>
      ))}
    </div>
  );
}

export default DynamicProgressBars;