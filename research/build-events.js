const fs = require('node:fs');
const vm = require('node:vm');
const candidates = require('./events-candidates.json');
const raw = fs.readFileSync('src/events.js', 'utf8');
const sandbox = { window:{} };
vm.runInNewContext(raw, sandbox);
const originalIds = new Set(['falklands-1982','chernobyl-1986','berlin-wall-1989','juntas-trial-1985','september-11-2001','argentine-crisis-2001','mtv-launch-1981','world-cup-2014','beirut-explosion-2020','argentina-world-cup-2022']);
const previous = sandbox.window.EntreFechasData.events.filter(event => originalIds.has(event.id));
const mapCategory = {
  Argentina:'argentina', 'World Events':'world-events', Sports:'sports',
  'Music & Pop Culture':'music-pop-culture', Technology:'technology', Science:'science'
};
const labels = {
  'modern-history':'HISTORIA MODERNA', '21st-century':'SIGLO XXI', argentina:'ARGENTINA',
  'world-events':'ACONTECIMIENTOS MUNDIALES', sports:'DEPORTES',
  'music-pop-culture':'MÚSICA Y CULTURA POP', technology:'TECNOLOGÍA', science:'CIENCIA'
};
const oldEvents = previous.map(event => {
  const categories = new Set(['modern-history']);
  if (event.year >= 2000) categories.add('21st-century');
  if (mapCategory[event.category]) categories.add(mapCategory[event.category]);
  for (const mode of event.modes || []) if (mapCategory[mode]) categories.add(mapCategory[mode]);
  if (event.id === 'chernobyl-1986') categories.add('technology');
  const {category, modes, ...clean} = event;
  const difficulty = ({'fácil':'easy','media':'medium','difícil':'hard'})[event.difficulty] || event.difficulty;
  return {...clean, categories:[...categories], difficulty, imageReviewRequired:!event.image || !event.imageCredit || !event.imageLicense || !event.imageSource};
});
const all = [...oldEvents, ...candidates];
const ids = new Set();
const issues = [];
for (const e of all) {
  if (ids.has(e.id)) issues.push(`duplicate id ${e.id}`);
  ids.add(e.id);
  const required = ['id','title','date','year','city','country','latitude','longitude','categories','difficulty','image','imageCredit','imageLicense','imageSource','description','source'];
  for (const key of required) if (!(key in e)) issues.push(`${e.id}: missing ${key}`);
  if (!Array.isArray(e.categories) || e.categories.some(c=>!labels[c])) issues.push(`${e.id}: bad categories`);
  if (!Number.isFinite(e.latitude) || !Number.isFinite(e.longitude)) issues.push(`${e.id}: bad map point`);
}
if (issues.length) throw new Error(issues.join('\n'));
const modeDefs = [
  ['modern-history','Modern History',e=>e.year>=1980&&e.year<=2026],
  ['21st-century','21st Century',e=>e.year>=2000&&e.year<=2026],
  ['argentina','Argentina',e=>e.categories.includes('argentina')],
  ['world-events','World Events',e=>e.categories.includes('world-events')],
  ['sports','Sports',e=>e.categories.includes('sports')],
  ['music-pop-culture','Music & Pop Culture',e=>e.categories.includes('music-pop-culture')],
  ['technology','Technology',e=>e.categories.includes('technology')],
  ['science','Science',e=>e.categories.includes('science')]
];
const modes = modeDefs.map(([id,title,filter])=>({id,title,years:id==='21st-century'?'2000 — 2026':'1980 — 2026',description:{'modern-history':'Los momentos que definieron nuestro tiempo','21st-century':'Un siglo joven, lleno de giros',argentina:'Momentos decisivos de la historia argentina','world-events':'Acontecimientos que cruzaron fronteras',sports:'El deporte también hace historia','music-pop-culture':'La cultura popular en movimiento',technology:'Ideas y tecnologías que cambiaron todo',science:'Descubrimientos y desafíos científicos'}[id],filter}));
const counts = Object.fromEntries(modes.map(m=>[m.id,all.filter(m.filter).length]));
if (Object.values(counts).some(n=>n<5)) throw new Error(`mode underfilled: ${JSON.stringify(counts)}`);
const difficultyCounts = Object.fromEntries(['easy','medium','hard'].map(d=>[d,all.filter(e=>e.difficulty===d).length]));
const source = `// Verified/attributed event records. Candidate photo fields remain null until cleared.\n(function () {\nconst events = ${JSON.stringify(all, null, 2)};\nconst categoryLabels = ${JSON.stringify(labels, null, 2)};\nconst modes = ${JSON.stringify(modes.map(({filter,...m})=>m), null, 2)}.map(mode => ({ ...mode, filter: event => {\n  if (mode.id === 'modern-history') return event.year >= 1980 && event.year <= 2026;\n  if (mode.id === '21st-century') return event.year >= 2000 && event.year <= 2026;\n  return event.categories.includes(mode.id);\n} }));\nwindow.EntreFechasData = { events, modes, categoryLabels };\n})();\n`;
fs.writeFileSync('src/events.js', source);
console.log(JSON.stringify({total:all.length, counts, difficultyCounts, idsUnique:ids.size===all.length, withImages:all.filter(e=>e.image).length, needingImageReview:all.filter(e=>e.imageReviewRequired).length}, null, 2));
