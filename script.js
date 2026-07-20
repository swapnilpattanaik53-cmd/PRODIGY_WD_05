(function(){
  "use strict";

  var FALLBACK = { lat:20.2961, lon:85.8245, name:"Bhubaneswar", country:"India" };
  var unit = "C"; 
  var lastData = null;
  var lastPlace = "";
  var svgCounter = 0;

  var WMO = {
    0:["clear","Clear sky"],1:["clear","Mainly clear"],2:["partly","Partly cloudy"],3:["cloudy","Overcast"],
    45:["fog","Fog"],48:["fog","Rime fog"],
    51:["drizzle","Light drizzle"],53:["drizzle","Drizzle"],55:["drizzle","Dense drizzle"],
    56:["drizzle","Freezing drizzle"],57:["drizzle","Dense freezing drizzle"],
    61:["rain","Slight rain"],63:["rain","Rain"],65:["rain","Heavy rain"],
    66:["rain","Freezing rain"],67:["rain","Heavy freezing rain"],
    71:["snow","Slight snow"],73:["snow","Snow"],75:["snow","Heavy snow"],77:["snow","Snow grains"],
    80:["rain","Rain showers"],81:["rain","Rain showers"],82:["rain","Violent showers"],
    85:["snow","Snow showers"],86:["snow","Heavy snow showers"],
    95:["thunder","Thunderstorm"],96:["thunder","Thunderstorm, hail"],99:["thunder","Severe thunderstorm"]
  };

  var THEME = {
    clear:   { a:"#2E86DE", b:"#54A0FF", c:"#74C0FC", d:"#FFE8A3", e:"#FFB86B", accent:"#FFB86B" },
    partly:  { a:"#3A7BD5", b:"#6FA8DC", c:"#A9C9E8", d:"#D9E8F5", e:"#EAF2FA", accent:"#FFD37A" },
    cloudy:  { a:"#54627A", b:"#78899C", c:"#98A5B3", d:"#B9C2CB", e:"#CBD2D9", accent:"#D7DEE6" },
    fog:     { a:"#7C8996", b:"#96A3AF", c:"#B4BFC8", d:"#CDD5DB", e:"#E1E7EB", accent:"#D7DEE5" },
    drizzle: { a:"#3E5166", b:"#526B87", c:"#7189A3", d:"#8FA3BA", e:"#A7B9CC", accent:"#9FD3F0" },
    rain:    { a:"#1B2532", b:"#2E3E52", c:"#43566E", d:"#587089", e:"#6C87A0", accent:"#7EC8F5" },
    snow:    { a:"#6F87A3", b:"#9AB3CC", c:"#C4D7E7", d:"#E1ECF4", e:"#F2F7FA", accent:"#EAF4FC" },
    thunder: { a:"#0D0F1C", b:"#1B1E38", c:"#2C2850", d:"#3D3560", e:"#4E3F6E", accent:"#FFD93D" }
  };

  var el = function(id){ return document.getElementById(id); };

  function uid(){ svgCounter++; return "sg"+svgCounter; }

  var CLOUD_PATH = "M20,63 C9,63 3,54 4,45 C5,35 15,28 24,30 C27,16 40,7 54,9 C68,11 78,23 77,36 C88,36 95,45 94,54 C93,63 84,69 74,69 L26,69 C23,69 21,66 20,63 Z";

  function sunGlyph(cx,cy,r,id){
    return '<defs><radialGradient id="'+id+'" cx="50%" cy="50%" r="50%">'+
      '<stop offset="0%" stop-color="#FFF3CE"/><stop offset="55%" stop-color="#FFD76B"/><stop offset="100%" stop-color="#FF9F45"/>'+
      '</radialGradient></defs>'+
      '<g class="rays" style="transform-origin:'+cx+'px '+cy+'px;">'+
        rays(cx,cy,r+6,r+16)+
      '</g>'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="url(#'+id+')"/>';
  }
  function rays(cx,cy,r1,r2){
    var s="";
    for(var i=0;i<8;i++){
      var ang = i*45*Math.PI/180;
      var x1 = cx+r1*Math.cos(ang), y1 = cy+r1*Math.sin(ang);
      var x2 = cx+r2*Math.cos(ang), y2 = cy+r2*Math.sin(ang);
      s += '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#FFD76B" stroke-width="4" stroke-linecap="round" opacity="0.85"/>';
    }
    return s;
  }
  function moonGlyph(cx,cy,r,id){
    return '<defs><radialGradient id="'+id+'" cx="40%" cy="40%" r="65%">'+
      '<stop offset="0%" stop-color="#FFFBEA"/><stop offset="100%" stop-color="#DCC98B"/>'+
      '</radialGradient></defs>'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="url(#'+id+')"/>'+
      '<circle cx="'+(cx+r*0.42)+'" cy="'+(cy-r*0.28)+'" r="'+(r*0.86)+'" fill="'+ 'var(--sky-shadow,#3A5C7A)' +'" opacity="0.001"/>'+
      '<circle cx="'+(cx+r*0.46)+'" cy="'+(cy-r*0.3)+'" r="'+(r*0.88)+'" fill="#0D2A45" opacity="0.001"/>';
  }
  
  function moonCrescent(cx,cy,r,id){
    var maskId = id+"m";
    return '<defs>'+
      '<radialGradient id="'+id+'" cx="40%" cy="40%" r="70%">'+
        '<stop offset="0%" stop-color="#FFFBEA"/><stop offset="100%" stop-color="#E4D49B"/>'+
      '</radialGradient>'+
      '<mask id="'+maskId+'"><rect x="0" y="0" width="120" height="120" fill="white"/>'+
      '<circle cx="'+(cx+r*0.55)+'" cy="'+(cy-r*0.35)+'" r="'+(r*0.92)+'" fill="black"/></mask>'+
      '</defs>'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="url(#'+id+')" mask="url(#'+maskId+')"/>';
  }
  function cloudGlyph(x,y,scale,fill,opacity){
    return '<g transform="translate('+x+','+y+') scale('+scale+')" opacity="'+(opacity==null?1:opacity)+'">'+
      '<path d="'+CLOUD_PATH+'" fill="'+fill+'"/></g>';
  }
  function rainGlyph(x,y,color){
    var s='<g stroke="'+(color||"#BFE3FF")+'" stroke-width="3.4" stroke-linecap="round">';
    var offs=[0,14,28,42];
    for(var i=0;i<offs.length;i++){
      s+='<line class="drop" x1="'+(x+offs[i])+'" y1="'+y+'" x2="'+(x+offs[i]-6)+'" y2="'+(y+14)+'" opacity="'+(0.55+0.15*(i%2))+'"/>';
    }
    s+='</g>';
    return s;
  }
  function snowGlyph(x,y,color){
    var s='<g fill="'+(color||"#FFFFFF")+'">';
    var offs=[0,16,32,48];
    for(var i=0;i<offs.length;i++){ s+='<circle cx="'+(x+offs[i])+'" cy="'+(y+ (i%2? 8:0)) +'" r="3.2" opacity="0.9"/>'; }
    s+='</g>';
    return s;
  }
  function fogGlyph(x,y,color){
    var s='<g stroke="'+(color||"#EDF2F6")+'" stroke-width="3.4" stroke-linecap="round" opacity="0.85">';
    s+='<path d="M'+x+','+y+' q10,-5 20,0 t20,0 t20,0" fill="none"/>';
    s+='<path d="M'+(x+4)+','+(y+11)+' q10,-5 20,0 t20,0" fill="none"/>';
    s+='</g>';
    return s;
  }
  function boltGlyph(x,y,color){
    return '<polygon points="'+(x+8)+','+y+' '+(x-4)+','+(y+18)+' '+(x+4)+','+(y+18)+' '+(x-6)+','+(y+38)+' '+(x+16)+','+(y+15)+' '+(x+5)+','+(y+15)+'" fill="'+(color||"#FFD93D")+'"/>';
  }

  function buildIcon(category, isDay){
    var id1=uid(), inner="", cx=60,cy=52;
    if(category==="clear"){
      inner = isDay ? sunGlyph(60,58,24,id1) : moonCrescent(60,58,22,id1);
    } else if(category==="partly"){
      inner = (isDay ? sunGlyph(74,36,15,id1) : moonCrescent(74,36,14,id1)) + cloudGlyph(6,38,0.62,"#EAF1F8",0.97) + cloudGlyph(2,44,0.5,"#FFFFFF",0.5);
    } else if(category==="cloudy"){
      inner = cloudGlyph(-4,30,0.5,"#B9C4D0",0.85) + cloudGlyph(14,40,0.68,"#E8EEF3",1);
    } else if(category==="fog"){
      inner = cloudGlyph(10,26,0.55,"#D8E0E6",0.9) + fogGlyph(14,74,"#EFF4F7") + fogGlyph(10,86,"#EFF4F7");
    } else if(category==="drizzle"){
      inner = cloudGlyph(10,26,0.6,"#CBD8E4",0.95) + rainGlyph(24,74,"#BFE3FF");
    } else if(category==="rain"){
      inner = cloudGlyph(8,22,0.66,"#9FB2C4",1) + rainGlyph(16,76,"#8FD0FF") + rainGlyph(46,80,"#8FD0FF");
    } else if(category==="snow"){
      inner = cloudGlyph(8,24,0.64,"#D9E4EE",1) + snowGlyph(18,78,"#FFFFFF");
    } else if(category==="thunder"){
      inner = cloudGlyph(6,20,0.66,"#5B6580",1) + boltGlyph(44,66,"#FFD93D");
    }
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">'+inner+'</svg>';
  }

  var starsPopulated=false;
  function populateStars(){
    if(starsPopulated) return; starsPopulated=true;
    var wrap = el("stars"); var html="";
    for(var i=0;i<70;i++){
      var top=Math.random()*70, left=Math.random()*100, delay=(Math.random()*3).toFixed(2), size=(Math.random()<0.15)?3:2;
      html += '<div class="star" style="top:'+top+'%; left:'+left+'%; width:'+size+'px; height:'+size+'px; animation-delay:'+delay+'s;"></div>';
    }
    wrap.innerHTML = html;
  }

  function populateClouds(category){
    var wrap = el("cloudsBg");
    var counts = {clear:0, partly:3, cloudy:6, fog:4, drizzle:5, rain:6, snow:5, thunder:6};
    var n = counts[category] || 0;
    var html="";
    for(var i=0;i<n;i++){
      var top = 4 + Math.random()*40;
      var scale = 0.7 + Math.random()*1.6;
      var dur = 40 + Math.random()*50;
      var delay = -Math.random()*dur;
      var opacity = 0.25 + Math.random()*0.35;
      html += '<svg class="cloud-shape" viewBox="0 0 100 80" style="top:'+top+'%; width:'+(120*scale)+'px; height:'+(96*scale)+'px; opacity:'+opacity+'; animation-duration:'+dur+'s; animation-delay:'+delay+'s;">'+
        '<path d="M20,63 C9,63 3,54 4,45 C5,35 15,28 24,30 C27,16 40,7 54,9 C68,11 78,23 77,36 C88,36 95,45 94,54 C93,63 84,69 74,69 L26,69 C23,69 21,66 20,63 Z" fill="#fff"/></svg>';
    }
    wrap.innerHTML = html;
  }

  function populateSnow(active){
    var wrap = el("snowLayer");
    if(!active){ wrap.innerHTML=""; return; }
    var html="";
    for(var i=0;i<55;i++){
      var left = Math.random()*100, size = 3+Math.random()*5;
      var fallDur = 7+Math.random()*10, swayDur = 3+Math.random()*3, delay=-Math.random()*10;
      html += '<div class="flake" style="left:'+left+'%; width:'+size+'px; height:'+size+'px; animation-duration:'+fallDur+'s,'+swayDur+'s; animation-delay:'+delay+'s,'+delay+'s;"></div>';
    }
    wrap.innerHTML = html;
  }

  function populateFog(active){
    var wrap = el("fogLayer");
    if(!active){ wrap.style.opacity=0; wrap.innerHTML=""; return; }
    wrap.style.opacity=1;
    var html="";
    for(var i=0;i<5;i++){
      var top = 15+i*16, dur = 16+Math.random()*10;
      html += '<div class="fog-band" style="top:'+top+'%; animation-duration:'+dur+'s;"></div>';
    }
    wrap.innerHTML = html;
  }

  var lightningTimer=null;
  function setLightning(active){
    if(lightningTimer){ clearInterval(lightningTimer); lightningTimer=null; }
    if(!active) return;
    var box = el("lightning");
    function strike(){
      box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash");
    }
    lightningTimer = setInterval(function(){
      if(Math.random()<0.55) strike();
    }, 3200);
  }

  function applyTheme(category, isDay){
    var t = THEME[category] || THEME.clear;
    document.documentElement.style.setProperty("--sky-a", t.a);
    document.documentElement.style.setProperty("--sky-b", t.b);
    document.documentElement.style.setProperty("--sky-c", t.c);
    document.documentElement.style.setProperty("--sky-d", t.d);
    document.documentElement.style.setProperty("--sky-e", t.e);
    document.documentElement.style.setProperty("--accent", t.accent);
    document.body.setAttribute("data-theme", category);

    var sky = el("sky");
    if(isDay){ sky.classList.remove("night"); } else { sky.classList.add("night"); }

    var showSun = isDay && (category==="clear" || category==="partly");
    var showMoon = (!isDay) && (category==="clear" || category==="partly");
    el("sunGlow").style.opacity = showSun ? 1 : 0;
    el("moonGlow").style.opacity = showMoon ? 1 : 0;

    populateStars();
    el("stars").style.opacity = (!isDay) ? 1 : 0;

    populateClouds(category);
    el("rainLayer").style.opacity = (category==="rain"||category==="drizzle"||category==="thunder") ? 1 : 0;
    populateSnow(category==="snow");
    populateFog(category==="fog");
    setLightning(category==="thunder");
  }

  function toDisplayTemp(c){
    var v = unit==="C" ? c : (c*9/5+32);
    return Math.round(v) + "°" + unit;
  }
  function toDisplaySpeed(kmh){
    var v = unit==="C" ? kmh : (kmh*0.621371);
    return Math.round(v) + (unit==="C" ? " km/h" : " mph");
  }
  function toDisplayVis(km){
    var v = unit==="C" ? km : (km*0.621371);
    return v.toFixed(1) + (unit==="C" ? " km" : " mi");
  }
  function compass(deg){
    var dirs=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return dirs[Math.round(deg/22.5)%16];
  }
  function fmtTime(iso){
    if(!iso) return "--:--";
    var t = iso.split("T")[1] || iso;
    return t.slice(0,5);
  }
  function fmtDayName(dateStr, idx){
    if(idx===0) return "Today";
    var d = new Date(dateStr+"T12:00:00");
    return d.toLocaleDateString(undefined,{weekday:"short"});
  }
  function fmtHour(iso, idx){
    var d = new Date(iso);
    if(idx===0) return "Now";
    return d.toLocaleTimeString(undefined,{hour:"numeric"});
  }

  function render(data, placeName){
    lastData = data; lastPlace = placeName;
    var cur = data.current;
    var wc = WMO[cur.weather_code] || ["clear","Clear"];
    var category = wc[0], desc = wc[1];
    var isDay = cur.is_day === 1;

    applyTheme(category, isDay);

    el("heroIcon").innerHTML = buildIcon(category, isDay);
    el("tempVal").textContent = toDisplayTemp(cur.temperature_2m);
    el("conditionText").textContent = desc;
    el("placeText").textContent = placeName;
    var now = new Date();
    el("metaText").textContent = now.toLocaleDateString(undefined,{weekday:"long", month:"short", day:"numeric"}) + "  ·  Feels like " + toDisplayTemp(cur.apparent_temperature);

    
    var visKm = (data.hourly.visibility && data.hourly.visibility[0]!=null) ? data.hourly.visibility[0]/1000 : null;
    var todayIdx = 0;
    var stats = [
      { label:"Humidity", value: Math.round(cur.relative_humidity_2m)+"%", sub:"Relative" },
      { label:"Wind", value: toDisplaySpeed(cur.wind_speed_10m), sub: compass(cur.wind_direction_10m)+" · gusts "+toDisplaySpeed(cur.wind_gusts_10m) },
      { label:"Pressure", value: Math.round(cur.pressure_msl)+" hPa", sub:"Sea level" },
      { label:"UV Index", value: (data.daily.uv_index_max[todayIdx]!=null? Math.round(data.daily.uv_index_max[todayIdx]*10)/10 : "--"), sub: uvLabel(data.daily.uv_index_max[todayIdx]) },
      { label:"Visibility", value: visKm!=null ? toDisplayVis(visKm) : "--", sub:"Current" },
      { label:"Sunrise / Sunset", value: fmtTime(data.daily.sunrise[todayIdx]), sub: "Sets " + fmtTime(data.daily.sunset[todayIdx]) }
    ];
    el("statsGrid").innerHTML = stats.map(function(s){
      return '<div class="stat-card"><div class="stat-label">'+s.label+'</div><div class="stat-value">'+s.value+'</div><div class="stat-sub">'+s.sub+'</div></div>';
    }).join("");

    var hourly = data.hourly;
    var nowISO = data.current.time;
    var startIdx = hourly.time.indexOf(nowISO);
    if(startIdx<0) startIdx=0;
    var hHtml="";
    for(var i=startIdx; i<Math.min(startIdx+12, hourly.time.length); i++){
      var hwc = WMO[hourly.weather_code[i]] || ["clear",""];
      var hIsDay = 1; 
      hHtml += '<div class="hour-item">'+
        '<div class="h-time">'+fmtHour(hourly.time[i], i-startIdx)+'</div>'+
        buildIcon(hwc[0], hIsDay)+
        '<div class="h-temp">'+toDisplayTemp(hourly.temperature_2m[i])+'</div>'+
        '<div class="h-pop">'+ (hourly.precipitation_probability? hourly.precipitation_probability[i]+"% ":"") +'</div>'+
        '</div>';
    }
    el("hourlyScroll").innerHTML = hHtml;

    var daily = data.daily;
    var allTemps = daily.temperature_2m_max.concat(daily.temperature_2m_min);
    var gMin = Math.min.apply(null, allTemps), gMax = Math.max.apply(null, allTemps);
    var dHtml="";
    for(var d=0; d<Math.min(7,daily.time.length); d++){
      var dwc = WMO[daily.weather_code[d]] || ["clear",""];
      var lo = daily.temperature_2m_min[d], hi = daily.temperature_2m_max[d];
      var leftPct = ((lo-gMin)/(gMax-gMin||1))*100;
      var widthPct = ((hi-lo)/(gMax-gMin||1))*100;
      dHtml += '<div class="day-row">'+
        '<div class="day-name">'+fmtDayName(daily.time[d], d)+'</div>'+
        buildIcon(dwc[0], 1)+
        '<div class="bar-track"><div class="bar-fill" style="left:'+leftPct+'%; width:'+Math.max(widthPct,6)+'%;"></div></div>'+
        '<div class="day-range"><span class="hi">'+toDisplayTemp(hi)+'</span> <span class="lo">'+toDisplayTemp(lo)+'</span></div>'+
        '</div>';
    }
    el("dailyList").innerHTML = dHtml;
  }

  function uvLabel(v){
    if(v==null) return "";
    if(v<3) return "Low"; if(v<6) return "Moderate"; if(v<8) return "High"; if(v<11) return "Very high"; return "Extreme";
  }

  function fetchWeather(lat, lon, placeName){
    el("conditionText").textContent = "Fetching the sky…";
    el("noteText").textContent = "";
    var url = "https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m"+
      "&hourly=temperature_2m,weather_code,precipitation_probability,visibility"+
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max"+
      "&timezone=auto&forecast_days=8";
    fetch(url).then(function(r){
      if(!r.ok) throw new Error("Weather service error");
      return r.json();
    }).then(function(json){
      render(json, placeName);
    }).catch(function(err){
      el("conditionText").textContent = "Could not load weather.";
      el("noteText").textContent = "Please check your connection and try again.";
      console.error(err);
    });
  }

  function reverseGeocode(lat, lon, cb){
    fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude="+lat+"&longitude="+lon+"&localityLanguage=en")
      .then(function(r){ return r.json(); })
      .then(function(j){
        var name = j.city || j.locality || j.principalSubdivision || "Your location";
        var country = j.countryName ? ", "+j.countryName : "";
        cb(name+country);
      }).catch(function(){ cb("Your location"); });
  }

  function useGeolocation(){
    if(!navigator.geolocation){ useFallback("Location not supported — showing "+FALLBACK.name); return; }
    el("placeText").textContent = "Locating you…";
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude, lon=pos.coords.longitude;
      reverseGeocode(lat, lon, function(name){
        fetchWeather(lat, lon, name);
      });
    }, function(){
      useFallback("Location access denied — showing "+FALLBACK.name);
    }, { timeout:8000, maximumAge:600000 });
  }

  function useFallback(note){
    fetchWeather(FALLBACK.lat, FALLBACK.lon, FALLBACK.name+", "+FALLBACK.country);
    el("noteText").textContent = note || "";
  }

  var searchTimer=null;
  var currentResults=[];

  el("searchInput").addEventListener("input", function(){
    var q = this.value.trim();
    if(searchTimer) clearTimeout(searchTimer);
    if(q.length<2){ el("suggestions").classList.remove("show"); currentResults=[]; return; }
    searchTimer = setTimeout(function(){ runSearch(q, false); }, 300);
  });


  el("searchForm").addEventListener("submit", function(e){
    e.preventDefault();
    if(searchTimer) clearTimeout(searchTimer);
    var q = el("searchInput").value.trim();
    if(q.length<2) return;
    if(currentResults.length>0 && el("suggestions").classList.contains("show")){
      pickResult(currentResults[0]);
    } else {
      runSearch(q, true);
    }
  });

  function pickResult(r){
    el("searchInput").value = r.name;
    el("suggestions").classList.remove("show");
    var sub = [r.admin1, r.country].filter(Boolean).join(", ");
    var place = r.name + (sub ? ", "+sub : "");
    fetchWeather(r.latitude, r.longitude, place);
  }

  function runSearch(q, autoPick){
    fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(q)+"&count=6&language=en&format=json")
      .then(function(r){ return r.json(); })
      .then(function(j){
        var results = j.results || [];
        currentResults = results;
        var list = el("suggestionList");
        if(results.length===0){
          list.innerHTML = '<li class="muted">No matches found</li>';
          el("suggestions").classList.add("show");
          return;
        }
        if(autoPick){
          pickResult(results[0]);
          return;
        }
        list.innerHTML = results.map(function(r,i){
          var sub = [r.admin1, r.country].filter(Boolean).join(", ");
          return '<li data-i="'+i+'"><div>'+r.name+'</div><div class="muted">'+sub+'</div></li>';
        }).join("");
        list.querySelectorAll("li[data-i]").forEach(function(li){
          li.addEventListener("click", function(){
            pickResult(results[+li.getAttribute("data-i")]);
          });
        });
        el("suggestions").classList.add("show");
      }).catch(function(){
        el("suggestions").classList.remove("show");
        el("noteText").textContent = "Couldn't reach the search service — check your connection and try again.";
      });
  }

  document.addEventListener("click", function(e){
    if(!el("suggestions").contains(e.target) && e.target!==el("searchInput")){
      el("suggestions").classList.remove("show");
    }
  });

  el("locateBtn").addEventListener("click", useGeolocation);

  el("unitToggle").addEventListener("click", function(){
    unit = unit==="C" ? "F" : "C";
    this.textContent = "°"+unit;
    if(lastData) render(lastData, lastPlace);
  });

  (function init(){
    applyTheme("clear", true);
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(function(pos){
        var lat=pos.coords.latitude, lon=pos.coords.longitude;
        reverseGeocode(lat, lon, function(name){ fetchWeather(lat, lon, name); });
      }, function(){ useFallback("Showing "+FALLBACK.name+" — enable location or search a city"); }, { timeout:7000 });
    } else {
      useFallback("Showing "+FALLBACK.name+" — search for a city");
    }
  })();

})();