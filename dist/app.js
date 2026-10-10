const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const MODEL_LABEL = 'all-MiniLM-L6-v2';

const activities = [
  {icon:'🌿',title:'The noticing walk',description:'A slow sensory walk for calm, reflection, trees, tiny details, and clearing a busy mind. Stop often. Photograph nothing.',energy:1,durations:[30,60],weather:['sunny','cloudy','rain','hot'],company:['solo','date'],gear:['Water','Comfortable shoes'],safety:'Choose a familiar, well-lit route and let someone know where you are going.',steps:['Walk without a destination and settle your breath','Find five textures, four sounds, and three colors','Sit somewhere safe and write one sentence about what shifted']},
  {icon:'🥾',title:'A micro-hike with a summit',description:'A brisk local hike or hill walk with a viewpoint, movement, exploration, fresh air, and a satisfying destination.',energy:4,durations:[60,120],weather:['sunny','cloudy'],company:['solo','friends','date'],gear:['Water','Grippy shoes','Light layer'],safety:'Check the route and sunset time before leaving; turn around before you are tired.',steps:['Pick the nearest trail or hill you have not tried','Walk the first third gently, then find your rhythm','Pause at the high point, snack, and return by a different safe path']},
  {icon:'🐦',title:'A twenty-bird sit',description:'Quiet birdwatching for curious people who want wildlife, listening, patience, and a small nature challenge.',energy:1,durations:[30,60],weather:['sunny','cloudy'],company:['solo','family','date'],gear:['Water','Notebook','Optional binoculars'],safety:'Observe wildlife from a respectful distance and do not play calls near nesting birds.',steps:['Find a green edge and stay still for five minutes','Count every bird you see or hear—even repeats','Sketch or describe the strangest behavior you notice']},
  {icon:'📷',title:'Color-hunt photo safari',description:'A playful outdoor photography scavenger hunt for creativity, friends, family, noticing, color, and exploring nearby streets.',energy:2,durations:[30,60],weather:['sunny','cloudy','rain'],company:['friends','family','date','solo'],gear:['Phone camera','A color picked at random'],safety:'Stay aware near roads and ask permission before photographing people.',steps:['Choose one color and start a ten-minute timer','Collect seven surprising examples without zooming','Put the phone away and choose a favorite from memory']},
  {icon:'🍊',title:'A pocket picnic',description:'A relaxed social outing with food, conversation, shade, people you like, and almost no preparation.',energy:1,durations:[60,120],weather:['sunny','cloudy'],company:['friends','family','date'],gear:['Snack','Water','Something to sit on'],safety:'Pack out everything you bring and choose shade during hot weather.',steps:['Grab one easy snack and walk to nearby green space','Put every phone in the middle for twenty minutes','Take the long route home and each name one good thing']},
  {icon:'🧭',title:'The coin-flip expedition',description:'A spontaneous urban walk for novelty, hidden corners, architecture, movement, friends, and low-cost adventure.',energy:3,durations:[60,120],weather:['sunny','cloudy'],company:['friends','date','solo'],gear:['Water','A coin'],safety:'Keep to public paths, respect private property, and stop if the route feels unsafe.',steps:['At the first junction flip a coin: heads left, tails right','Repeat for five safe junctions while noticing landmarks','Choose your favorite discovery as the finish line']},
  {icon:'🌧️',title:'A rain-listening loop',description:'A cozy short walk in light rain for reflection, puddles, cool air, sound, and a change of atmosphere.',energy:2,durations:[30,60],weather:['rain','cloudy'],company:['solo','date'],gear:['Rain layer','Shoes that can get wet'],safety:'Avoid storms, flooding, slippery slopes, and low-visibility roads.',steps:['Choose a flat familiar loop','Listen for five different kinds of water sounds','Head home while you still feel warm and make a hot drink']},
  {icon:'🪴',title:'The tiny garden sprint',description:'Hands-on gardening for grounding, care, plants, home, sunshine, and a visible result in a small space.',energy:2,durations:[30,60],weather:['sunny','cloudy','hot'],company:['solo','family'],gear:['Gloves','Water','One container or garden patch'],safety:'Wear gloves, wash hands afterward, and identify plants before handling them.',steps:['Choose one neglected square meter or container','Clear, water, prune, or plant for twenty focused minutes','Leave one small improvement ready for tomorrow']},
  {icon:'🌅',title:'The sunset reset',description:'A gentle golden-hour outing for beauty, decompression, romance, journaling, and ending the day with perspective.',energy:1,durations:[30,60],weather:['sunny','cloudy'],company:['solo','date','friends'],gear:['Light layer','Water'],safety:'Know the route back after dark and stay in a public, familiar place.',steps:['Walk to a west-facing open spot before sunset','Sit through the full color change without multitasking','Walk home slowly and leave the headphones off']},
  {icon:'🤸',title:'A grown-up playground circuit',description:'A lively bodyweight session with play, strength, energy, friends, movement, and no gym required.',energy:5,durations:[30,60],weather:['sunny','cloudy'],company:['solo','friends'],gear:['Water','Flexible clothes'],safety:'Use only sturdy public equipment and stop before fatigue affects your grip.',steps:['Warm up with one easy lap around the park','Alternate benches, steps, hangs, and short runs','Cool down on the grass and notice your heartbeat settle']},
  {icon:'🗺️',title:'Make a neighborhood map',description:'A family-friendly exploration that turns an ordinary walk into mapping, storytelling, observation, and discovery.',energy:2,durations:[60,120],weather:['sunny','cloudy'],company:['family','friends'],gear:['Paper','Pencil','Water'],safety:'Set clear boundaries for children and use crossings.',steps:['Draw only your starting point, then head out','Add landmarks, friendly animals, trees, and secret shortcuts','Name the map together and mark the next place to explore']},
  {icon:'🌳',title:'A shade-to-shade loop',description:'A low-intensity hot-day route using trees and covered spaces for safe movement, calm, and fresh air.',energy:1,durations:[30,60],weather:['hot','sunny'],company:['solo','friends','family','date'],gear:['Cold water','Hat','Sunscreen'],safety:'Avoid the hottest hours, shorten the plan if needed, and stop for dizziness or headache.',steps:['Map three shaded landmarks close to home','Walk between them at an easy conversational pace','Rest at the final shade and finish your water']}
];

const form = document.querySelector('#planner-form');
const result = document.querySelector('#result');
const template = document.querySelector('#result-template');
const modelNote = document.querySelector('#model-note');
const energy = document.querySelector('#energy');
const energyOutput = document.querySelector('#energy-output');
const submitButton = form.querySelector('.plan-button');
let extractor = null;
let activityVectors = null;
let modelPromise = null;
let lastRanked = [];
let alternativeIndex = 0;
let lastParams = null;

const energyLabels = ['Very gentle','Easy','Steady','Active','Full power'];
energy.addEventListener('input', () => energyOutput.value = energyLabels[Number(energy.value)-1]);
document.querySelectorAll('.prompt-chip').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#intent').value = button.dataset.prompt;
  document.querySelector('#intent').focus();
}));

function setModelState(state, message){
  const dot = modelNote.querySelector('.status-dot');
  dot.className = `status-dot ${state}`;
  modelNote.lastElementChild.textContent = message;
}

async function loadModel(){
  if(extractor) return extractor;
  if(modelPromise) return modelPromise;
  modelPromise = (async()=>{
    setModelState('loading','Downloading the small open model for its first local run…');
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
    extractor = await pipeline('feature-extraction', MODEL_ID, {
      progress_callback: progress => {
        if(progress.status === 'progress' && Number.isFinite(progress.progress)){
          setModelState('loading',`Loading ${MODEL_LABEL} · ${Math.round(progress.progress)}%`);
        }
      }
    });
    const corpus = activities.map(activity => `${activity.title}. ${activity.description}`);
    const vectors = await extractor(corpus,{pooling:'mean',normalize:true});
    activityVectors = vectors.tolist();
    setModelState('ready',`${MODEL_LABEL} is ready · inference stays on this device.`);
    return extractor;
  })();
  try{return await modelPromise}catch(error){modelPromise=null;throw error}
}

function cosine(a,b){let sum=0;for(let i=0;i<a.length;i++)sum+=a[i]*b[i];return sum}
function tokens(value){return new Set(value.toLowerCase().match(/[a-z]{3,}/g)||[])}
function lexicalScore(query,activity){const queryTokens=tokens(query);const activityTokens=tokens(`${activity.title} ${activity.description}`);let hits=0;queryTokens.forEach(token=>{if(activityTokens.has(token))hits++});return queryTokens.size?hits/queryTokens.size:0}
function constraintScore(activity,params){
  const durationFit = activity.durations.includes(params.duration) ? .16 : -.18;
  const companyFit = activity.company.includes(params.company) ? .12 : -.12;
  const weatherFit = activity.weather.includes(params.weather) ? .16 : -.3;
  const energyFit = .16 - Math.abs(activity.energy-params.energy)*.055;
  return durationFit+companyFit+weatherFit+energyFit;
}
async function rankActivities(params){
  const query = `${params.intent}. I want an outdoor activity for ${params.company}, with ${params.energy}/5 energy, ${params.duration} minutes, in ${params.weather} weather.`;
  try{
    const pipe = await loadModel();
    const output = await pipe(query,{pooling:'mean',normalize:true});
    const queryVector = output.tolist()[0];
    return activities.map((activity,index)=>({activity,score:cosine(queryVector,activityVectors[index])*.62+constraintScore(activity,params),mode:'AI'})).sort((a,b)=>b.score-a.score);
  }catch(error){
    console.warn('Local model unavailable; using transparent lexical fallback.',error);
    setModelState('fallback','Model unavailable · using the built-in transparent matcher.');
    return activities.map(activity=>({activity,score:lexicalScore(query,activity)*.45+constraintScore(activity,params),mode:'Fallback'})).sort((a,b)=>b.score-a.score);
  }
}
function minutesFor(activity,requested){return Math.min(requested,Math.max(...activity.durations))}
function makeTimeline(activity,duration){
  const warm=Math.max(5,Math.round(duration*.18));
  const main=Math.max(15,Math.round(duration*.62));
  return [{time:`0–${warm}m`,text:activity.steps[0]},{time:`${warm}–${warm+main}m`,text:activity.steps[1]},{time:`${warm+main}–${duration}m`,text:activity.steps[2]}];
}
function explain(activity,params){
  const energyDelta=Math.abs(activity.energy-params.energy);
  const pace=energyDelta<=1?'matches your energy':'gently shifts your pace';
  const company=params.company==='solo'?'on your own':`with ${params.company}`;
  return `This ${pace}, fits a ${params.duration}-minute window, and works well ${company}. Most importantly, it answers “${params.intent.replace(/[.!?]+$/,'')}” without turning the outing into another screen session.`;
}
function renderResult(entry,params){
  const activity=entry.activity;
  const duration=minutesFor(activity,params.duration);
  const fragment=template.content.cloneNode(true);
  fragment.querySelector('.match-score').textContent=`${entry.mode} match`;
  fragment.querySelector('.activity-icon').textContent=activity.icon;
  fragment.querySelector('.activity-title').textContent=activity.title;
  fragment.querySelector('.activity-reason').textContent=explain(activity,params);
  fragment.querySelector('.plan-meta').innerHTML=`<span>◷ ${duration} minutes</span><span>↗ Energy ${activity.energy}/5</span><span>☁ ${params.weather}</span>`;
  fragment.querySelector('.timeline').innerHTML=makeTimeline(activity,duration).map(item=>`<div class="timeline-item"><strong>${item.time}</strong><span>${item.text}</span></div>`).join('');
  fragment.querySelector('.pack-list div').innerHTML=activity.gear.map(item=>`<span>${item}</span>`).join('');
  fragment.querySelector('.safety-note p').textContent=activity.safety;
  const textPlan=`${activity.title}\n\nWhy it fits: ${explain(activity,params)}\n\n${makeTimeline(activity,duration).map(item=>`${item.time}: ${item.text}`).join('\n')}\n\nBring: ${activity.gear.join(', ')}\nSafety: ${activity.safety}`;
  fragment.querySelector('.copy-button').addEventListener('click',async event=>{const button=event.currentTarget;try{await navigator.clipboard.writeText(textPlan);button.textContent='Copied ✓'}catch{button.textContent='Copy unavailable'}setTimeout(()=>button.textContent='Copy plan',1600)});
  fragment.querySelector('.again-button').addEventListener('click',()=>{alternativeIndex=(alternativeIndex+1)%Math.min(lastRanked.length,4);renderResult(lastRanked[alternativeIndex],params)});
  result.className='result-card';
  result.replaceChildren(fragment);
  if(innerWidth<900) result.scrollIntoView({behavior:'smooth',block:'start'});
}
function showLoading(){result.className='result-card loading-result';result.innerHTML='<div class="loader-wrap"><div class="loader-ring"></div><h3>Reading the trail signs…</h3><p>The first plan may take a moment while the open model downloads. Future plans are much faster.</p></div>'}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const data=new FormData(form);
  const params={intent:String(data.get('intent')).trim(),duration:Number(data.get('duration')),company:String(data.get('company')),weather:String(data.get('weather')),energy:Number(data.get('energy'))};
  if(!params.intent)return;
  lastParams=params;
  submitButton.disabled=true;
  showLoading();
  alternativeIndex=0;
  lastRanked=await rankActivities(params);
  renderResult(lastRanked[0],lastParams);
  submitButton.disabled=false;
});

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});

