import OBR, { buildCurve, buildShape, buildText, Curve, Item, Shape, Text, Vector2 } from '@owlbear-rodeo/sdk';

const METADATA_PREFIX = 'jumpoy-extension-clocks';
const TAGGED_KEY = `${METADATA_PREFIX}/clock`;
const COUNT_TEXT_TAG = `${METADATA_PREFIX}/child`;
const MAX_TAG = `${METADATA_PREFIX}/max`;
const CURR_TAG = `${METADATA_PREFIX}/current`;
const LABEL_TAG = `${METADATA_PREFIX}/label`;
const SHAPE_TAG = `${METADATA_PREFIX}/shape`;

export interface ClockData {
  max: number;
  current: number;
  title: string;
}

export const getCurrentClockData = (item: Item, allItems: Item[]): ClockData => {
  const label = allItems.find(i => i.id === item.metadata[LABEL_TAG]);

  return {
    max: item.metadata[MAX_TAG] as number,
    current: item.metadata[CURR_TAG] as number,
    title: (label as Text).text.plainText,
  };
};

const shapePoints = (radius: number, current: number, max: number, parentPosition: Vector2): Vector2[] => {
  if (current === 0) {
    return [];
  }

  const points = [{ x: 0, y: 0 }, { x: 0, y: -radius }];

  for (let i = 0.125; i <= current; i += 0.125) {
    const angle = 2 * Math.PI * i / max;
    points.push({ x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius });
  }

  points.push({ x: 0, y: 0 });

  return points.map(({ x, y }) => ({ x: x + parentPosition.x, y: y + parentPosition.y }));
};

export const setClockTo = (item: Item, itemList: Item[], clock: ClockData) => {
  const child = itemList.find(i => i.id === item.metadata[COUNT_TEXT_TAG]);

  const nextNumerator = Math.min(Math.max(clock.current, 0), clock.max);

  if (!child) {
    return;
  }

  const text = child as Text;
  const title = itemList.find(i => i.id === item.metadata[LABEL_TAG]) as Text;

  const shapeId: string | undefined = item.metadata[SHAPE_TAG] as string;
  const shape = shapeId ? itemList.find(i => i.id === shapeId) : undefined;

  const radius = (item as Shape).width * 0.44;

  if (!shape) {
    const shape = buildCurve()
      .attachedTo(item.id)
      .points(shapePoints(radius, nextNumerator, clock.max, item.position))
      .fillColor('blue')
      .fillOpacity(1)
      .strokeOpacity(0)
      .tension(0)
      .locked(true)
      .disableHit(true)
      .build();
    
    item.metadata[SHAPE_TAG] = shape.id;

    OBR.scene.items.addItems([shape]);
  }

  const itemsToUpdate = [item, text, title];
  if (shape) itemsToUpdate.push(shape);

  return OBR.scene.items.updateItems(itemsToUpdate, nodes => {
    const [itemNode, textNode, titleNode, shapeNode] = nodes;

    itemNode.metadata[CURR_TAG] = nextNumerator;
    itemNode.metadata[MAX_TAG] = clock.max;
    (textNode as Text).text.plainText = `${nextNumerator} / ${clock.max}`;
    (titleNode as Text).text.plainText = clock.title;

    if (shapeNode) {
      (shapeNode as Curve).points = shapePoints(radius, nextNumerator, clock.max, item.position);
    }
  });
};

const makeTextNode = (text: string, parentId: string, width: number) => {
  return buildText()
    .attachedTo(parentId)
    .plainText(text)
    // .zIndex(newItem.zIndex + 1)
    .textAlign('CENTER')
    .textAlignVertical('MIDDLE')
    .strokeColor('black')
    .strokeWidth(2)
    .strokeOpacity(1)
    .fillColor('white')
    .fontWeight(1000)
    .textType('PLAIN')
    .fontSize(48)
    .locked(true)
    .disableHit(true)
    .width(width)
    .height(60)
    .position({ x: -width / 2, y: -30 })
};

export const createClock = (data: ClockData) => {
  const { current, max, title } = data;

  const newItem = buildShape()
        .width(300)
        .height(300)
        .shapeType('CIRCLE')
        .strokeColor('black')
        .strokeWidth(3)
        .fillColor('white')
        .build();

  newItem.metadata[TAGGED_KEY] = 'clock';
  newItem.metadata[CURR_TAG] = 0;
  newItem.metadata[MAX_TAG] = 6;

  const newText = makeTextNode(`${current} / ${max}`, newItem.id, 200)
    .fontSize(40)
    .position({ x: -100, y: 160 })
    .build();

  newItem.metadata[COUNT_TEXT_TAG] = newText.id;

  const headerText = makeTextNode(title, newItem.id, 600)
    .fontSize(40)
    .position({ x: -300, y: -220 })
    .build();

  console.log(headerText.text.style, headerText.position);

  newItem.metadata[LABEL_TAG] = headerText.id;

  return [newItem, newText, headerText];
}
