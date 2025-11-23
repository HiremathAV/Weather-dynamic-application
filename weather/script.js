// ----- CONFIG -----
// Replace with your key (for production, keep it server-side)
const WEATHER_API_KEY = "4572b8eb0f7743038c492319252311";
const BASE_URL = "https://api.weatherapi.com/v1/current.json";

// ----- ELEMENTS -----
const temperatureField = document.querySelector(".temp");
const locationField = document.querySelector(".time_location p");
const dateField = document.querySelector(".time_location span");
const weatherField = document.querySelector(".condition p");
const iconImg = document.querySelector(".weather_icon");
const searchField = document.querySelector(".search_area");
const form = document.querySelector("form");
const lastUpdated = document.querySelector(".last-updated");
const errorTpl = document.getElementById("errorTpl");

// default city
let currentTarget = "Mumbai";
let currentLocalDateObj = null; // will hold Date object derived from API localtime

// fetch and render
async function fetchResults(targetLocation){
  showLoading(true);
  clearError();

  const url = `${BASE_URL}?key=${WEATHER_API_KEY}&q=${encodeURIComponent(targetLocation)}&aqi=no`;

  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error("Network response not ok");

    const data = await res.json();

    if(data && data.location && data.current){
      renderWeather(data);
    } else {
      showError("No data returned");
    }
  }catch(err){
    console.error(err);
    showError("Could not fetch weather. Try different location or check network.");
  } finally {
    showLoading(false);
  }
}

// render
function renderWeather(data){
  // data.current and data.location are guaranteed here
  const tempC = data.current.temp_c;
  const name = data.location.name + (data.location.region ? ", " + data.location.region : "");
  const condition = data.current.condition.text;
  const iconUrl = data.current.condition.icon; // usually starts with //
  const localtime = data.location.localtime; // "2025-11-23 14:37"
  const isDay = data.current.is_day === 1;

  // create Date from the local date portion
  // split into [date, time]
  const [datePart, clockPart] = localtime.split(" ");
  // make a date object using yyyy-mm-dd format, safe for Date constructor:
  const dateObj = new Date(datePart + "T" + clockPart + ":00");
  currentLocalDateObj = dateObj;

  // format pieces
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayName = days[dateObj.getDay()];
  const monthName = months[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();

  // show values
  temperatureField.textContent = `${tempC.toFixed(1)} °C`;
  locationField.textContent = name;
  weatherField.textContent = condition;
  iconImg.src = iconUrl.startsWith("//") ? "https:" + iconUrl : iconUrl;
  iconImg.alt = condition + " icon";

  // show formatted date/time like: 2:37 PM – Sunday, 23 November 2025
  dateField.textContent = `${formatTimeFromDate(dateObj)} – ${dayName}, ${day} ${monthName} ${year}`;

  lastUpdated.textContent = `Local time source: ${localtime}`;

  // adjust background
  applyBackgroundClass(condition, isDay);

  // start live clock ticking every 30s (keeps in sync)
  startClockUpdater();
}

// format time like "2:37 PM"
function formatTimeFromDate(d){
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2,"0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if(hours === 0) hours = 12;
  return `${hours}:${minutes} ${ampm}`;
}

// adjust backgrounds based on text keywords & day/night
function applyBackgroundClass(conditionText, isDay){
  const c = conditionText.toLowerCase();

  // remove previous state classes
  document.body.classList.remove("sunny","cloudy","rainy","snowy","mist","night");

  if(!isDay){
    document.body.classList.add("night");
    return;
  }

  if(c.includes("sun") || c.includes("clear")){
    document.body.classList.add("sunny");
  } else if(c.includes("cloud") || c.includes("overcast")){
    document.body.classList.add("cloudy");
  } else if(c.includes("rain") || c.includes("drizzle") || c.includes("shower") || c.includes("thunder")){
    document.body.classList.add("rainy");
  } else if(c.includes("snow") || c.includes("sleet") || c.includes("blizzard")){
    document.body.classList.add("snowy");
  } else if(c.includes("mist") || c.includes("fog") || c.includes("haze") || c.includes("smoke")){
    document.body.classList.add("mist");
  } else {
    // fallback
    document.body.classList.add("cloudy");
  }
}

// show error
function showError(msg){
  clearError();
  const el = errorTpl.content.cloneNode(true);
  el.querySelector(".error").textContent = msg;
  document.querySelector(".left").appendChild(el);
}

// clear error
function clearError(){
  const existing = document.querySelector(".error");
  if(existing) existing.remove();
}

// loading state (subtle)
function showLoading(isLoading){
  if(isLoading){
    document.querySelector(".search_btn").textContent = "Loading...";
    document.querySelector(".search_btn").disabled = true;
  }else{
    document.querySelector(".search_btn").textContent = "Search";
    document.querySelector(".search_btn").disabled = false;
  }
}

// search handler
function searchForLocation(e){
  e.preventDefault();
  const v = searchField.value.trim();
  if(!v) return;
  currentTarget = v;
  fetchResults(currentTarget);
}

form.addEventListener("submit", searchForLocation);

// live clock ticking: increment the saved local Date object by seconds
let clockInterval = null;
function startClockUpdater(){
  if(clockInterval) clearInterval(clockInterval);

  // update once immediately (dateField already set)
  clockInterval = setInterval(()=>{
    if(!currentLocalDateObj) return;
    // add 60 seconds
    currentLocalDateObj = new Date(currentLocalDateObj.getTime() + 60 * 1000);
    // update the visible time portion (keep date text)
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dayName = days[currentLocalDateObj.getDay()];
    const monthName = months[currentLocalDateObj.getMonth()];
    const day = currentLocalDateObj.getDate();
    const year = currentLocalDateObj.getFullYear();

    dateField.textContent = `${formatTimeFromDate(currentLocalDateObj)} – ${dayName}, ${day} ${monthName} ${year}`;
  }, 60000); // every minute
}

// initial load
fetchResults(currentTarget);

/* optional: keyboard Enter in search field also works because form handles submit */
