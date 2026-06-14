import initYoga from 'yoga-wasm-web';

const yoga = await initYoga();
const node = yoga.Node.create();

console.log('=== Yoga Node API ===');
console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(node)).join('\n  - '));
console.log('');
console.log('=== Constants ===');
console.log('DIRECTION_LTR:', yoga.DIRECTION_LTR);
console.log('FLEX_DIRECTION_COLUMN:', yoga.FLEX_DIRECTION_COLUMN);
console.log('GUTTER_ALL:', yoga.GUTTER_ALL);
console.log('EDGE_ALL:', yoga.EDGE_ALL);
