import userStore from '../../store/user.js';
import earthquakeApis from '../../apis/earthquake-apis.js';
import { date2Str, time2Str } from './utils/utils.js';

if (userStore.userGetters.isLogin) {
  document.querySelector('#join-community-button').style.display = 'none';
  document.querySelector('#welcome-message').innerText = `Welcome, ${
    userStore.userGetters.user().username
  }!`;
}

mapboxgl.accessToken =
  'pk.eyJ1IjoiY2FueCIsImEiOiJjazJzbTZ2eGMwbXMyM2JsN3VwZzlpOTIyIn0.M0NE8kywhhrC1pDQ9j_kww';

let reportMap = new mapboxgl.Map({
  container: 'report-map',
  style: 'mapbox://styles/mapbox/streets-v11',
});

let updateMap = new mapboxgl.Map({
  container: 'update-map',
  style: 'mapbox://styles/mapbox/streets-v11',
});

let locationDict = {};
let markerDict = {};

// Set current datetime to input
const currentDate = new Date();
document.querySelector('#date-input').value = date2Str(currentDate);
document.querySelector('#time-input').value = time2Str(currentDate);

// Display earthquake prediction menu when the user is coordinator
if (userStore.userGetters.user().role === 'coordinator') {
  document.querySelector(
    '#menu-prediction'
  ).parentElement.parentElement.hidden = false;
}

// Get all reports
let reports;
let reportDict = {};
receiveEarthquakeReports();

// Event Listener
async function updateBtnClickListener(event) {
  const updateReportBtn = event.srcElement;
  const reportId = updateReportBtn.parentElement.parentElement.id;
  const report = reportDict[reportId];
  fillUpdateForm(report);
  console.log(report);
  $('#myModal').modal('show');
}

document.querySelector('#earthquake-report-form').addEventListener(
  'submit',
  async (e) => {
    let report = assemble_report_payload(false);
    if (report.description.split(' ').length > 25) {
      alert('Description max 25 words!');
      return;
    }
    await earthquakeApis.postEarthquakeReport(report);
    location.reload();
  },
  true
);

document.querySelector('#update-report-form').addEventListener(
  'submit',
  async (e) => {
    let updatedReport = assemble_report_payload(true);
    if (updatedReport.description.split(' ').length > 25) {
      alert('Description max 25 words!');
      return;
    }
    await earthquakeApis.patchEarthquakeReport({
      report_id: document.querySelector('#update-report-form')['report-id'],
      report: updatedReport,
    });
    location.reload();
  },
  true
);

const get_date_selector = (isUpdate) =>
  isUpdate ? '#update-date-input' : '#date-input';
const get_time_selector = (isUpdate) =>
  isUpdate ? '#update-time-input' : '#time-input';
const get_description_selector = (isUpdate) =>
  isUpdate ? '#update-description-input' : '#description-input';
const get_magnitude_selector = (isUpdate) =>
  isUpdate ? '#update-magnitude-input' : '#magnitude-input';
const get_location_key = (isUpdate) => (isUpdate ? 'update-map' : 'report-map');
const get_killed_selector = (isUpdate) =>
  isUpdate ? '#update-killed-input' : '#killed-input';
const get_injured_selector = (isUpdate) =>
  isUpdate ? '#update-injured-input' : '#injured-input';
const get_missing_selector = (isUpdate) =>
  isUpdate ? '#update-missing-input' : '#missing-input';

const assemble_report_payload = (isUpdate) => {
  const date_selector = get_date_selector(isUpdate);
  const time_selector = get_time_selector(isUpdate);
  const description_selector = get_description_selector(isUpdate);
  const magnitude_selector = get_magnitude_selector(isUpdate);
  const location_key = get_location_key(isUpdate);
  const killed_selector = get_killed_selector(isUpdate);
  const injured_selector = get_injured_selector(isUpdate);
  const missing_selector = get_missing_selector(isUpdate);
  return {
    occurred_datetime: new Date(
      document.querySelector(date_selector).value +
        'T' +
        document.querySelector(time_selector).value
    ),
    description: document.querySelector(description_selector).value,
    magnitude: Number(document.querySelector(magnitude_selector).value),
    location: locationDict[location_key],
    killed: Number(document.querySelector(killed_selector).value),
    injured: Number(document.querySelector(injured_selector).value),
    missing: Number(document.querySelector(missing_selector).value),
  };
};

function mapLoadedListener(event) {
  let map = event.target;
  let coordinates = map._container.firstElementChild;
  navigator.geolocation.getCurrentPosition((position) => {
    const userCoordinates = [
      position.coords.longitude,
      position.coords.latitude,
    ];
    locationDict[map._container.id] = {
      longitude: userCoordinates[0],
      latitude: userCoordinates[1],
    };
    map.addSource(coordinates.id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: userCoordinates,
        },
      },
    });
    map.addLayer({
      id: coordinates.id,
      source: coordinates.id,
      type: 'circle',
    });

    map.jumpTo({
      center: userCoordinates,
      zoom: 14,
    });
    let marker = new mapboxgl.Marker({
      draggable: true,
    });
    markerDict[map._container.id] = marker;
    marker.setLngLat(userCoordinates).addTo(map);
    coordinates.innerHTML =
      'Longitude: ' +
      userCoordinates[0] +
      '<br />Latitude: ' +
      userCoordinates[1];
    function onDragEnd(event) {
      let lngLat = event.target.getLngLat();
      locationDict[map._container.id] = {
        longitude: lngLat.lng,
        latitude: lngLat.lat,
      };
      coordinates.innerHTML =
        'Longitude: ' + lngLat.lng + '<br />Latitude: ' + lngLat.lat;
    }
    marker.on('dragend', onDragEnd);
  });
}

reportMap.on('load', mapLoadedListener);
updateMap.on('load', mapLoadedListener);

// functions

async function receiveEarthquakeReports() {
  const resp = await earthquakeApis.getEarthquakeReport();
  reports = resp['data']['reports'];
  reports.forEach((report) => {
    reportDict[report['_id']] = report;
  });
  updateReportTable(reports);
  document.querySelectorAll('.update-report-btn').forEach((updateReportBtn) => {
    updateReportBtn.addEventListener('click', updateBtnClickListener);
  });
}

function updateReportTable(reports) {
  const reportTable = document.querySelector('#report-table');
  let i = 1;
  let me = userStore.userGetters.user();
  reports.forEach((report) => {
    const row = document.createElement('tr');
    row.id = report['_id'];
    const numCol = document.createElement('td');
    numCol.innerText = i;
    const datetimeCol = document.createElement('td');
    let datetime = new Date(report['occurred_datetime']);
    datetimeCol.innerText = datetime.toLocaleString();
    const desCol = document.createElement('td');
    desCol.innerText = report['description'];
    let updateCol = document.createElement('td');
    if (report['reporterName'] === me.username) {
      let updateBtn = document.createElement('button');
      updateBtn.className = 'btn btn-sm btn-primary update-report-btn';
      updateBtn.innerText = 'Update';
      updateCol.appendChild(updateBtn);
    }
    row.appendChild(numCol);
    row.appendChild(datetimeCol);
    row.appendChild(desCol);
    row.appendChild(updateCol);
    reportTable.appendChild(row);
    ++i;
  });
}

function fillUpdateForm(report) {
  document.querySelector('#update-report-form')['report-id'] = report['_id'];
  const occurredDatetime = new Date(report['occurred_datetime']);
  document.querySelector('#update-date-input').value = date2Str(
    occurredDatetime
  );
  document.querySelector('#update-time-input').value = time2Str(
    occurredDatetime
  );
  document.querySelector('#update-description-input').value =
    report['description'];
  document.querySelector('#update-magnitude-input').value = report['magnitude'];
  document.querySelector('#update-killed-input').value = report['killed'];
  document.querySelector('#update-injured-input').value = report['injured'];
  document.querySelector('#update-missing-input').value = report['missing'];
  const updateMarker = markerDict['update-map'];
  const lngLat = [
    report['location']['longitude'],
    report['location']['latitude'],
  ];
  updateMarker.setLngLat(lngLat);
  locationDict['update-map'] = report['location'];
  document.querySelector('#update-coordinates').innerHTML =
    'Longitude: ' + lngLat[0] + '<br />Latitude: ' + lngLat[1];
  console.log(locationDict);
  updateMap.jumpTo({
    center: lngLat,
    zoom: 14,
  });
}
