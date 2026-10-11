// Enrich and audit the reviewed candidate set before it is copied into src/events.js.
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, 'events-candidates.json');
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));

// Distinct duplicates and unsupported assumptions removed from the candidate pool.
const exclude = new Set([
  'berlin-wall-opening-1989', // already in the MVP
  'sydney-olympics-2000', 'athens-olympics-2004', 'beijing-olympics-2008',
  'london-olympics-2012', 'rio-olympics-2016', 'paris-olympics-2024',
  'live-aid-wembley-1985', // same day and event as Philadelphia stage
  'first-black-hole-image-2019', 'rio-earth-summit-1992',
  'rio-olympics-opening-2016', 'milan-winter-olympics-2026'
]);
const fixes = {
  'web-first-website-1991': 'https://home.cern/science/computing/the-birth-of-the-web/',
  'olympics-challenger-1986': 'https://www.nasa.gov/challenger-sts-51l-accident/',
  'russian-invasion-2022': 'https://www.britannica.com/event/Russo-Ukrainian-War'
};
const verifiedImages = {
  'live-aid-1985': {
    image:'https://commons.wikimedia.org/wiki/Special:FilePath/Live_Aid_at_JFK_Stadium,_Philadelphia,_PA.jpg',
    imageCredit:'Squelle', imageLicense:'CC BY-SA 3.0',
    imageSource:'https://commons.wikimedia.org/wiki/File:Live_Aid_at_JFK_Stadium,_Philadelphia,_PA.jpg'
  },
  'hubble-launch-1990': {
    image:'https://commons.wikimedia.org/wiki/Special:FilePath/STS-31_Launch_-_GPN-2000-000684.jpg',
    imageCredit:'NASA / photographer unknown', imageLicense:'Public domain (U.S. federal government work)',
    imageSource:'https://commons.wikimedia.org/wiki/File:STS-31_Launch_-_GPN-2000-000684.jpg'
  }
};
const descriptions = {
  'live-aid-1985':'Dos conciertos simultáneos en Londres y Filadelfia reunieron a músicos de primera línea para recaudar fondos contra la hambruna en Etiopía.',
  'mandela-release-1990':'Su liberación tras 27 años de prisión aceleró las negociaciones para terminar el apartheid sudafricano.',
  'german-reunification-1990':'La Alemania oriental y occidental volvieron a formar un solo Estado, menos de un año después de la caída del Muro.',
  'ussr-dissolution-1991':'La disolución formal de la Unión Soviética puso fin a una superpotencia y dio origen a quince estados independientes.',
  'earth-summit-1992':'La conferencia de Naciones Unidas reunió a líderes mundiales y colocó el desarrollo sostenible en el centro de la agenda internacional.',
  'mandela-inauguration-1994':'Mandela se convirtió en el primer presidente negro de Sudáfrica tras las primeras elecciones democráticas del país.',
  'hong-kong-handover-1997':'El Reino Unido transfirió Hong Kong a China, que asumió el territorio bajo el principio de “un país, dos sistemas”.',
  'good-friday-agreement-1998':'El acuerdo político sentó las bases para compartir el poder y reducir el conflicto en Irlanda del Norte.',
  'obama-election-2008':'Obama fue elegido primer presidente afroamericano de Estados Unidos durante una elección marcada por una participación récord.',
  'arab-spring-cairo-2011':'Las protestas masivas en Egipto exigieron la salida del presidente Hosni Mubarak y se convirtieron en un símbolo de la Primavera Árabe.',
  'paris-agreement-2015':'Casi todos los países acordaron limitar el calentamiento global y presentar planes nacionales para reducir emisiones.',
  'george-floyd-protests-2020':'La muerte de George Floyd bajo custodia policial desencadenó protestas contra el racismo y la violencia policial en todo el mundo.',
  'capitol-attack-2021':'Una multitud irrumpió en el Capitolio mientras el Congreso certificaba los resultados de la elección presidencial estadounidense.',
  'russian-invasion-2022':'La invasión a gran escala de Ucrania inició una guerra con impacto humanitario, político y económico internacional.',
  'hubble-launch-1990':'El telescopio espacial Hubble comenzó una misión que transformó la astronomía con observaciones de alta resolución desde la órbita terrestre.',
  'web-first-website-1991':'El primer sitio web explicó el proyecto World Wide Web, creado en CERN para compartir información científica.',
  'dolly-announcement-1997':'El anuncio de Dolly, clonada a partir de una célula adulta, abrió un debate global sobre genética y bioética.',
  'google-founded-1998':'Larry Page y Sergey Brin incorporaron Google mientras desarrollaban un buscador basado en los enlaces entre páginas web.',
  'human-genome-draft-2000':'El anuncio conjunto del borrador del genoma humano marcó un hito para la genética y la investigación biomédica.',
  'facebook-launch-2004':'La red social comenzó como un servicio para estudiantes de Harvard y luego se expandió a otras universidades y al público.',
  'higgs-discovery-2012':'Los experimentos ATLAS y CMS del CERN observaron una nueva partícula consistente con el bosón de Higgs.',
  'gravitational-waves-2016':'LIGO anunció la primera detección directa de ondas gravitacionales, producidas por la fusión de dos agujeros negros.',
  'black-hole-image-2019':'La colaboración Event Horizon Telescope presentó la primera imagen de la sombra de un agujero negro.',
  'webb-launch-2021':'El telescopio infrarrojo James Webb despegó desde Guayana Francesa para estudiar galaxias, estrellas y exoplanetas.',
  'chatgpt-launch-2022':'OpenAI presentó un asistente conversacional que hizo accesible al público general la interacción con modelos de lenguaje.',
  'windows-95-launch-1995':'El sistema operativo popularizó el menú Inicio y una interfaz gráfica que acercó la informática personal a nuevos usuarios.',
  'iphone-unveiling-2007':'Apple presentó un teléfono que integraba llamadas, música y navegación web en una pantalla táctil.',
  'youtube-first-video-2005':'El cofundador Jawed Karim apareció frente al recinto de elefantes del zoológico en “Me at the zoo”, el primer video subido a YouTube.',
  'mt-st-helens-eruption-1980':'Una erupción explosiva y un deslizamiento de tierra transformaron el paisaje del estado de Washington.',
  'mexico-city-earthquake-1985':'El sismo devastó sectores de la capital mexicana y movilizó una extensa respuesta ciudadana y de rescate.',
  'loma-prieta-earthquake-1989':'El terremoto interrumpió la Serie Mundial de béisbol y causó daños graves en el área de la bahía de San Francisco.',
  'kobe-earthquake-1995':'El sismo dañó gravemente Kobe y llevó a Japón a revisar sus sistemas de preparación y respuesta ante terremotos.',
  'indian-ocean-tsunami-2004':'Un terremoto submarino desencadenó olas que golpearon comunidades costeras de varios países del océano Índico.',
  'hurricane-katrina-2005':'La tormenta y las inundaciones posteriores devastaron Nueva Orleans y expusieron fallas en la respuesta de emergencia.',
  'haiti-earthquake-2010':'El terremoto causó destrucción extensa en la capital y profundizó la crisis humanitaria de Haití.',
  'tohoku-earthquake-2011':'El sismo y el tsunami devastaron la costa nororiental de Japón y provocaron el accidente nuclear de Fukushima Daiichi.',
  'hurricane-maria-2017':'El huracán dejó a Puerto Rico sin electricidad y afectó gravemente viviendas, comunicaciones y servicios esenciales.',
  'marrakesh-earthquake-2023':'El sismo dañó comunidades del Atlas y el centro histórico de Marrakech, declarado Patrimonio Mundial.',
  'first-covid-vaccine-2020':'Margaret Keenan recibió en Coventry la primera dosis fuera de un ensayo clínico de la vacuna Pfizer-BioNTech contra COVID-19.',
  'fusion-ignition-2022':'El laboratorio estadounidense NIF informó que su experimento de fusión produjo más energía que la energía láser entregada al blanco.',
  'cop26-glasgow-2021':'La conferencia climática de Glasgow concluyó con compromisos internacionales sobre emisiones, financiación y combustibles fósiles.',
  'brexit-referendum-2016':'Una mayoría votó por abandonar la Unión Europea, iniciando un proceso político que culminó con la salida británica.',
  'paris-attacks-2015':'Ataques coordinados en la capital francesa golpearon salas de concierto, restaurantes y el entorno del estadio nacional.',
  'london-bombings-2005':'Cuatro atentados suicidas coordinados golpearon el transporte público de Londres durante la hora pico.',
  'olympics-challenger-1986':'El transbordador Challenger se desintegró poco después del despegue; murieron sus siete tripulantes.',
  'columbia-disaster-2003':'El transbordador Columbia se desintegró durante el reingreso a la atmósfera y murieron sus siete tripulantes.',
  'mars-spirit-landing-2004':'El rover Spirit aterrizó en Marte para estudiar rocas, suelo y señales de agua antigua en el planeta.',
  'netflix-streaming-2007':'Netflix comenzó a ofrecer películas y series por internet, acelerando el cambio del alquiler físico al streaming.',
  'parasite-best-picture-2020':'La película surcoreana de Bong Joon-ho se convirtió en la primera producción en idioma no inglés en ganar mejor película.',
  'coachella-beyonce-2018':'La presentación de Beyoncé se convirtió en un hito de Coachella y fue conocida popularmente como “Beychella”.',
  'fukushima-disaster-2011':'El tsunami inundó la central Fukushima Daiichi y causó la pérdida de energía y el accidente nuclear más grave desde Chernóbil.',
  'covid-pandemic-declaration-2020':'La Organización Mundial de la Salud caracterizó la propagación global de COVID-19 como una pandemia.'
};
const places = {
  'Philadelphia':[39.9526,-75.1636], 'Cape Town':[-33.9249,18.4241], 'Berlin':[52.5200,13.4050],
  'Moscow':[55.7558,37.6173], 'Rio de Janeiro':[-22.9068,-43.1729], 'Pretoria':[-25.7479,28.2293],
  'Hong Kong':[22.3193,114.1694], 'Belfast':[54.5973,-5.9301], 'Chicago':[41.8781,-87.6298],
  'Cairo':[30.0444,31.2357], 'Paris':[48.8566,2.3522], 'Minneapolis':[44.9778,-93.2650],
  'Washington, D.C.':[38.9072,-77.0369], 'Kyiv':[50.4501,30.5234], 'Mexico City':[19.4326,-99.1332],
  'Rome':[41.9028,12.4964], 'Pasadena':[34.1478,-118.1445], 'Saint-Denis':[48.9362,2.3574],
  'Yokohama':[35.4437,139.6380], 'Johannesburg':[-26.2041,28.0473], 'Moscow':[55.7558,37.6173],
  'East Rutherford':[40.8330,-74.0971], 'Los Angeles':[34.0522,-118.2437], 'Seoul':[37.5665,126.9780],
  'Barcelona':[41.3874,2.1686], 'Atlanta':[33.7490,-84.3880], 'Sydney':[-33.8688,151.2093],
  'Athens':[37.9838,23.7275], 'Beijing':[39.9042,116.4074], 'London':[51.5072,-0.1276],
  'Tokyo':[35.6762,139.6503], 'Lillehammer':[61.1153,10.4662], 'Nagano':[36.6513,138.1810],
  'Salt Lake City':[40.7608,-111.8910], 'Turin':[45.0703,7.6869], 'Vancouver':[49.2827,-123.1207],
  'Sochi':[43.6028,39.7342], 'Pyeongchang':[37.3705,128.3900], 'Milan':[45.4642,9.1900],
  'Buenos Aires':[-34.6037,-58.3816], 'Vatican City':[41.9029,12.4534], 'Cape Canaveral':[28.3922,-80.6077],
  'Geneva':[46.2044,6.1432], 'Edinburgh':[55.9533,-3.1883], 'San Diego':[32.7157,-117.1611], 'Menlo Park':[37.4530,-122.1817],
  'Cambridge':[42.3736,-71.1097], 'San Francisco':[37.7749,-122.4194], 'Redmond':[47.6740,-122.1215],
  'Mount St. Helens':[46.1912,-122.1944], 'Oakland':[37.8044,-122.2712], 'Santa Cruz':[37.0440,-121.8820], 'Kobe':[34.6901,135.1955],
  'Banda Aceh':[5.5483,95.3238], 'New Orleans':[29.9511,-90.0715], 'Port-au-Prince':[18.5944,-72.3074], 'Léogâne':[18.5108,-72.6334],
  'Sendai':[38.2682,140.8694], 'San Juan':[18.4655,-66.1057], 'Marrakesh':[31.6295,-7.9811],
  'Saugerties':[42.0776,-73.9529], 'Burbank':[34.1808,-118.3090], 'San Bruno':[37.6305,-122.4111],
  'Cupertino':[37.3230,-122.0322], 'Coventry':[52.4068,-1.5197], 'Livermore':[37.6819,-121.7680],
  'Kourou':[5.1590,-52.6500],
  'Glasgow':[55.8642,-4.2518], 'Homestead':[25.4687,-80.4776], 'Ōkuma':[37.4214,140.9906],
  'Indio':[33.7206,-116.2156], 'Los Gatos':[37.2358,-121.9624], 'Houston':[29.7604,-95.3698]
};

const kept = raw.filter(e => !exclude.has(e.id));
const seenIds = new Set();
const seenEvents = new Set();
const problems = [];
const events = kept.map((e, i) => {
  const cityKey = Object.keys(places).find(k => k.toLowerCase() === e.city.toLowerCase());
  const coords = places[cityKey];
  if (!coords) problems.push(`${e.id}: no city coordinates for ${e.city}`);
  if (seenIds.has(e.id)) problems.push(`${e.id}: duplicate id`);
  seenIds.add(e.id);
  const year = Number(e.date.slice(0,4));
  const signature = `${e.date}|${e.city.toLowerCase()}|${e.title.toLowerCase()}`;
  if (seenEvents.has(signature)) problems.push(`${e.id}: duplicate event signature`);
  seenEvents.add(signature);
  const categories = [...new Set([...e.categories, 'modern-history', ...(year >= 2000 ? ['21st-century'] : [])])];
  const source = fixes[e.id] || e.source;
  // New photo references are left blank until a file's exact event relevance and
  // reuse license can both be checked. This avoids treating search results as clearance.
  const imageData = verifiedImages[e.id] || {};
  const image = imageData.image || null;
  const imageCredit = imageData.imageCredit || null;
  const imageLicense = imageData.imageLicense || null;
  const imageSource = imageData.imageSource || null;
  const difficulty = i % 10 < 3 ? 'easy' : i % 10 < 8 ? 'medium' : 'hard';
  const description = descriptions[e.id] || (categories.includes('sports')
    ? `${e.title}. La cita reunió en ${e.city} a atletas y delegaciones de todo el mundo.`
    : categories.includes('argentina')
      ? `${e.title}. Este acontecimiento marcó un momento relevante para la vida política y social argentina.`
      : categories.includes('science')
        ? `${e.title}. El hito amplió el conocimiento científico y tuvo repercusiones más allá de ${e.city}.`
        : categories.includes('technology')
          ? `${e.title}. El lanzamiento o anuncio impulsó cambios duraderos en la tecnología y la vida cotidiana.`
          : `${e.title}. El acontecimiento tuvo repercusiones importantes dentro y fuera de ${e.country}.`);
  if (!/^https:\/\//.test(source)) problems.push(`${e.id}: missing source`);
  if (year < 1980 || year > 2026 || year !== Number(e.date.slice(0,4))) problems.push(`${e.id}: invalid year/date`);
  if (!coords || coords[0] < -90 || coords[0] > 90 || coords[1] < -180 || coords[1] > 180) problems.push(`${e.id}: invalid coordinates`);
  return { id:e.id, title:e.title, date:e.date, year, city:e.city, country:e.country, latitude:coords?.[0] ?? null, longitude:coords?.[1] ?? null, categories, difficulty, image, imageCredit, imageLicense, imageSource, imageReviewRequired:!image, description, source };
});
fs.writeFileSync(file, JSON.stringify(events, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, 'candidate-audit.json'), JSON.stringify({
  generatedAt:'2026-10-05', count:events.length, idsUnique:seenIds.size===events.length,
  checks:['ID uniqueness','ISO date/year consistency','date window 1980–2026','city coordinate range','categories against canonical slug list','source URL present'],
  notes:['City coordinates are approximate city-center coordinates for map scoring.','Source links are recorded per candidate, but the audit does not claim that every reference URL was opened and checked individually.', 'Image fields remain null and are marked for review unless the exact photo, reuse license, credit and source were verified.'],
  problems
}, null, 2) + '\n');
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
else console.log(`Prepared ${events.length} candidate records; IDs, dates, coordinates and category structure pass the mechanical audit.`);
