import { useCallback, useState } from 'react';

import OBR from '@owlbear-rodeo/sdk';

import './App.css';
import { createClock, getCurrentClockData, setClockTo } from './clockUtils';

const METADATA_PREFIX = 'jumpoy-extension-clocks';
const TAGGED_KEY = `${METADATA_PREFIX}/clock`;

OBR.onReady(() => {
  if (document.location.hash) {
    return;
  }

  OBR.contextMenu.create({
    id: `${METADATA_PREFIX}/context-menu/plus`,
    icons: [
      {
        icon: '/owlbear-clocks/plus.svg',
        label: 'Increment',
        filter: {
          every: [{ key: `metadata.${TAGGED_KEY}`, value: 'clock' }],
        },
      }
    ],
    onClick: async (context) => {
      const allItems = await OBR.scene.items.getItems();

      await Promise.all(context.items.map(async item => {
        const clockData = getCurrentClockData(item, allItems);
        return setClockTo(item, allItems, { ...clockData, current: clockData.current + 1 });
      }));
    },
  });

  OBR.contextMenu.create({
    id: `${METADATA_PREFIX}/context-menu/minus`,
    icons: [
      {
        icon: '/owlbear-clocks/minus.svg',
        label: 'Decrement',
        filter: {
          every: [{ key: `metadata.${TAGGED_KEY}`, value: 'clock' }],
        },
      }
    ],
    onClick: async (context) => {
      const allItems = await OBR.scene.items.getItems();

      await Promise.all(context.items.map(async item => {
        const clockData = getCurrentClockData(item, allItems);
        return setClockTo(item, allItems, { ...clockData, current: clockData.current - 1 });
      }));
    },
  });

  OBR.contextMenu.create({
    id: `${METADATA_PREFIX}/context-menu/configure`,
    icons: [
      {
        icon: '/owlbear-clocks/meatball.svg',
        label: 'Configure',
        filter: {
          every: [{ key: `metadata.${TAGGED_KEY}`, value: 'clock' }],
        },
      }
    ],
    onClick: async (context, elementId) => {
      const element = context.items[0].id;

      OBR.popover.open({
        id: `${METADATA_PREFIX}/popover/configure/${Math.random().toString().slice(2)}`,
        url: `/owlbear-clocks/#configure-${element}`,
        height: 250,
        width: 400,
        anchorElementId: elementId,
      });
    },
  })
});

function App() {
  const [text, setText] = useState('');

  const addItem = useCallback(async () => {
    if (OBR.isReady) {
      const clockItems = createClock({ title: text || 'Clock', current: 0, max: 6 });
      
      OBR.scene.items.addItems(clockItems);

      if (OBR.isReady) {
        OBR.notification.show(`${await OBR.player.getName()} just added a clock.`, 'INFO');
      }

      // OBR.scene.items.deleteItems((await OBR.scene.items.getItems()).map(i => i.id))
    }
  }, [text]);

  return (
    <div className="App">
      <header className="App-header">
        <input type="text" onChange={e => setText(e.currentTarget.value)}></input>
        <button className="rollButton" onClick={addItem}>Make item</button>
      </header>
    </div>
  );
}

export default App;
