import { useCallback, useEffect, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';

import { ClockData, getCurrentClockData, setClockTo } from './clockUtils';

import './index.css';

const setClock = async (id: string, data: ClockData) => {
  if (!OBR.isReady) return;
  
  const items = await OBR.scene.items.getItems();
  const item = items.find(i => i.id === id);
  
  if (!item) return;
  
  setClockTo(item, items, data);
}

export const Configure = () => {
  const [clockData, setClockData] = useState<ClockData>();
  const [isReady, setReady] = useState(false);

  const clockId = document.location.hash.slice(11);

  const updateClock = useCallback(async (d: Partial<ClockData>) => {
    if (!isReady) {
      return;
    }
    setClockData(data => {
      setClock(clockId, { ...data!, ...d });
      return { ...data!, ...d };
    });
  }, [clockId, isReady]);
  
  useEffect(() => {
    OBR.onReady(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let stillGood = true;

    async function saveClock() {
      const items = await OBR.scene.items.getItems();

      const item = items.find(item => item.id === clockId);

      if (!item) return;

      const clock = getCurrentClockData(item, items);

      if (stillGood) {
        setClockData(clock);
      }
    }

    saveClock();

    return () => {
      stillGood = false;
    };
  }, [clockId, isReady]);

  if (!isReady || !clockData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="configure-grid">
      <div>
        <input
          type="text"
          value={clockData.title}
          onChange={e => updateClock({ title: e.currentTarget.value })}
        />
      </div>
      <div>
        <button onClick={() => updateClock({ current: clockData.current - 1 })}>-</button>
        <span>{clockData.current}</span>
        <button onClick={() => updateClock({ current: clockData.current + 1 })}>+</button>
      </div>
      <div>
        <button onClick={() => updateClock({ max: clockData.max - 1 })}>-</button>
        <span>{clockData.max}</span>
        <button onClick={() => updateClock({ max: clockData.max + 1 })}>+</button>
      </div>
    </div>
  );
};
