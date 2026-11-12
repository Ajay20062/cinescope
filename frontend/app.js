const sampleMovies = [
  {title:"The Shawshank Redemption",rating:9.3,genres:"Drama"},
  {title:"The Godfather",rating:9.2,genres:"Crime|Drama"},
  {title:"The Dark Knight",rating:9.0,genres:"Action|Crime|Drama"},
  {title:"Pulp Fiction",rating:8.9,genres:"Crime|Drama"},
  {title:"The Lord of the Rings",rating:8.9,genres:"Adventure|Fantasy"},
  {title:"Forrest Gump",rating:8.8,genres:"Drama|Romance"},
  {title:"Inception",rating:8.8,genres:"Action|Sci-Fi"},
  {title:"Fight Club",rating:8.8,genres:"Drama"},
  {title:"Interstellar",rating:8.7,genres:"Adventure|Drama|Sci-Fi"},
  {title:"The Matrix",rating:8.7,genres:"Action|Sci-Fi"},
  {title:"Goodfellas",rating:8.7,genres:"Biography|Crime|Drama"},
  {title:"Spirited Away",rating:8.6,genres:"Animation|Adventure|Fantasy"},
  {title:"Parasite",rating:8.5,genres:"Drama|Thriller"},
  {title:"Whiplash",rating:8.5,genres:"Drama|Music"},
  {title:"The Grand Budapest Hotel",rating:8.1,genres:"Comedy|Drama"}
];
let movies = [...sampleMovies];
const $ = id => document.getElementById(id);
const palette = ["#a99bff","#f5d47d","#f1a0d2","#83c7ff","#78d9b1","#f2a783","#b3a8ff","#8ad5dd"];
let toastTimer;
function notify(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2800)}
function splitGenres(value){return String(value ?? "").split(/[|,;]/).map(g=>g.trim()).filter(Boolean)}
function cleanMovieRows(rows){
  return rows.map(row=>{
    const normalized={}; Object.keys(row).forEach(k=>normalized[String(k).trim().toLowerCase()]=row[k]);
    const title=String(normalized.title??normalized.movie??normalized.name??"").trim();
    const rating=Number(normalized.rating??normalized.score);
    const genres=splitGenres(normalized.genres??normalized.genre).join("|") || "Unknown";
    return {title,rating,genres};
  }).filter(m=>m.title && Number.isFinite(m.rating) && m.rating>=0 && m.rating<=10);
}
function parseCSV(text){
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],next=text[i+1];
    if(c==='"'&&quoted&&next==='"'){field+='"';i++}
    else if(c==='"'){quoted=!quoted}
    else if(c===","&&!quoted){row.push(field);field=""}
    else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&next==="\n")i++;row.push(field);if(row.some(v=>v.trim()!==""))rows.push(row);row=[];field=""}
    else field+=c;
  }
  row.push(field);if(row.some(v=>v.trim()!==""))rows.push(row);
  if(rows.length<2) return [];
  const headers=rows.shift().map(v=>v.trim().toLowerCase());
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??"").trim()])));
}
function genresList(){
  const counts={};
  movies.forEach(m=>splitGenres(m.genres||"Unknown").forEach(g=>counts[g]=(counts[g]||0)+1));
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
}
function updateMetrics(){
  const total=movies.length,avg=total?movies.reduce((s,m)=>s+m.rating,0)/total:0;
  const top=[...movies].sort((a,b)=>b.rating-a.rating)[0];
  $("totalMovies").textContent=total;
  $("averageRating").textContent=total?avg.toFixed(2):"—";
  $("highestRating").textContent=top?top.rating.toFixed(2):"—";
  $("topMovieName").textContent=top?top.title:"No movie data";
  $("genreCount").textContent=genresList().length;
}
function drawRatingChart(){
  const canvas=$("ratingChart"),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(1,rect.width*dpr);canvas.height=Math.max(1,rect.height*dpr);
  const ctx=canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=rect.width,h=rect.height,p={l:28,r:10,t:12,b:28},cw=w-p.l-p.r,ch=h-p.t-p.b;
  ctx.clearRect(0,0,w,h);
  const bins=Array(10).fill(0);movies.forEach(m=>{const idx=Math.min(9,Math.floor(m.rating));if(idx>=0)bins[idx]++});
  const max=Math.max(1,...bins);
  ctx.font='10px "DM Sans", sans-serif';ctx.textAlign="right";ctx.textBaseline="middle";
  for(let i=0;i<=4;i++){const y=p.t+ch*i/4;ctx.strokeStyle="#293146";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillStyle="#738099";ctx.fillText(String(Math.round(max*(1-i/4))),p.l-8,y)}
  const gap=7,bw=(cw-gap*9)/10;
  bins.forEach((n,i)=>{const bh=ch*n/max,x=p.l+i*(bw+gap),y=p.t+ch-bh;const grad=ctx.createLinearGradient(0,y,0,p.t+ch);grad.addColorStop(0,"#b4a7ff");grad.addColorStop(1,"#7565dc");ctx.fillStyle=grad;roundRect(ctx,x,y,bw,Math.max(0,bh),4);ctx.fillStyle="#77839b";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText(String(i),x+bw/2,p.t+ch+8)});
}
function getGenreBreadth(movie){return new Set(splitGenres(movie.genres||"Unknown")).size}
function clusterMovies(items,k=3){
  if(!items.length)return [];
  const points=items.map(m=>({movie:m,x:m.rating,y:getGenreBreadth(m)}));
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
  const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  points.forEach(p=>{p.fx=(p.x-minX)/(maxX-minX||1);p.fy=(p.y-minY)/(maxY-minY||1)});
  const count=Math.min(k,points.length),centers=Array.from({length:count},(_,i)=>({...points[Math.round(i*(points.length-1)/Math.max(1,count-1))],cx:points[Math.round(i*(points.length-1)/Math.max(1,count-1))].fx,cy:points[Math.round(i*(points.length-1)/Math.max(1,count-1))].fy}));
  for(let iter=0;iter<12;iter++){
    points.forEach(p=>{p.cluster=centers.reduce((best,c,i)=>{const d=(p.fx-c.cx)**2+(p.fy-c.cy)**2;return d<best.d?{i,d}:best},{i:0,d:Infinity}).i});
    centers.forEach((c,i)=>{const group=points.filter(p=>p.cluster===i);if(group.length){c.cx=group.reduce((s,p)=>s+p.fx,0)/group.length;c.cy=group.reduce((s,p)=>s+p.fy,0)/group.length}});
  }
  return points;
}
function drawClusterChart(){
  const canvas=$("clusterChart");if(!canvas)return;const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(1,rect.width*dpr);canvas.height=Math.max(1,rect.height*dpr);const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=rect.width,h=rect.height,p={l:37,r:14,t:15,b:31},cw=w-p.l-p.r,ch=h-p.t-p.b;ctx.clearRect(0,0,w,h);
  const points=clusterMovies(movies),colors=["#a99bff","#f5d47d","#83c7ff"];
  const maxGenreCount=Math.max(1, ...points.map(p=>p.y));
  for(let i=0;i<=4;i++){const y=p.t+ch*i/4;ctx.strokeStyle="#293146";ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillStyle="#738099";ctx.font='10px "DM Sans", sans-serif';ctx.textAlign="right";ctx.fillText(String(Math.round(maxGenreCount*(1-i/4))),p.l-8,y+3)}
  for(let i=0;i<=5;i++){const x=p.l+cw*i/5;ctx.fillStyle="#738099";ctx.textAlign="center";ctx.fillText((i*2).toFixed(0),x,h-9)}
  points.forEach(pnt=>{const x=p.l+(pnt.x/10)*cw,y=p.t+ch-(pnt.y/maxGenreCount)*ch;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle=colors[pnt.cluster%colors.length];ctx.globalAlpha=.88;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle="#101522";ctx.lineWidth=1;ctx.stroke()});
  ctx.fillStyle="#8d97ad";ctx.textAlign="center";ctx.fillText("Rating (0–10)",p.l+cw/2,h-1);
  const counts=[0,1,2].map(i=>points.filter(pnt=>pnt.cluster===i).length).filter(n=>n>0);
  $("clusterInsight").textContent=points.length?`K-means found ${counts.length} preference groups across ${points.length} movies. Higher genre breadth means a title spans more listed genres.`:"Import valid movie ratings to view clusters.";
}
function roundRect(ctx,x,y,w,h,r){if(h<=0)return;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill()}
function renderGenres(){
  const entries=genresList().slice(0,6),max=entries.length?entries[0][1]:1;
  $("genreBars").innerHTML=entries.length?entries.map(([name,count],i)=>`<div class="genre-row"><span class="genre-name" title="${escapeHTML(name)}">${escapeHTML(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${count/max*100}%;background:${palette[i%palette.length]}"></div></div><span class="genre-count">${count}</span></div>`).join(""):'<p class="subtitle">No genre data available.</p>';
  $("genreInsight").textContent=entries.length?`“${entries[0][0]}” appears most often in this dataset, with ${entries[0][1]} listing${entries[0][1]===1?"":"s"}.`:"Add a genres column to explore genre patterns.";
}
function refreshGenreOptions(){
  const select=$("genreFilter"),current=select.value,all=genresList().map(x=>x[0]).sort((a,b)=>a.localeCompare(b));
  select.innerHTML='<option value="">All genres</option>'+all.map(g=>`<option value="${escapeHTML(g)}">${escapeHTML(g)}</option>`).join("");
  if(all.includes(current))select.value=current;
}
function getFilteredMovies(){
  const query=$("searchInput").value.trim().toLowerCase(),genre=$("genreFilter").value,sort=$("sortFilter").value;
  return movies.filter(m=>(m.title.toLowerCase().includes(query)||m.genres.toLowerCase().includes(query))&&(!genre||m.genres.split(/[|,;]/).map(g=>g.trim()).includes(genre))).sort((a,b)=>{
    if(sort==="rating-asc")return a.rating-b.rating;
    if(sort==="title-asc")return a.title.localeCompare(b.title);
    if(sort==="title-desc")return b.title.localeCompare(a.title);
    return b.rating-a.rating;
  });
}
function renderTable(){
  const filtered=getFilteredMovies();
  $("movieTable").innerHTML=filtered.map((m,i)=>{const first=m.genres.split(/[|,;]/)[0].trim()||"Unknown";return `<tr><td><div class="movie-title-cell"><span class="movie-poster">${["◈","✦","▶","✧"][i%4]}</span>${escapeHTML(m.title)}</div></td><td><span class="genre-pill">${escapeHTML(first)}</span></td><td><span class="rating-pill"><span>★</span>${m.rating.toFixed(1)}</span></td><td><div class="rating-meter"><span style="width:${m.rating*10}%"></span></div></td></tr>`}).join("");
  $("visibleCount").textContent=filtered.length;
  $("tableSummary").textContent=`Showing ${filtered.length} of ${movies.length} movies`;
  $("emptyState").hidden=filtered.length!==0;
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderAll(){updateMetrics();refreshGenreOptions();renderGenres();renderTable();drawRatingChart();drawClusterChart()}
$("searchInput").addEventListener("input",renderTable);
$("genreFilter").addEventListener("change",renderTable);
$("sortFilter").addEventListener("change",renderTable);
$("resetFilters").addEventListener("click",()=>{$("searchInput").value="";$("genreFilter").value="";$("sortFilter").value="rating-desc";renderTable();notify("Filters reset")});
$("csvInput").addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    const parsed=cleanMovieRows(parseCSV(await file.text()));
    if(!parsed.length)throw new Error("No valid rows found. Include title and rating columns (ratings from 0 to 10).");
    movies=parsed;
    $("datasetStatus").textContent=file.name;
    renderAll();notify(`Imported ${movies.length} movies successfully.`);
  }catch(err){notify(err.message||"Could not read that CSV file.")}
  e.target.value="";
});
window.addEventListener("resize",()=>{drawRatingChart();drawClusterChart()});
renderAll();
