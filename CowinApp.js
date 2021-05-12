const https = require('https');
const { exec } = require("child_process");

let date = '12-05-2021';//GetTomorrowDate();
let pincode = '132103';
let makeHitEveryXSecs = 30;

function makeApiHit() {
    console.log('Hitting the API');
    console.log(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${date}`)
    https.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${date}`, (resp) => {
      let data = '';

      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        let availableSlots = GetAvailableSlots(data);
        let slotsFor18 = availableSlots.filter(s => s.age == 18);
        let slotsFor45 = availableSlots.filter(s => s.age == 45);
        console.log(availableSlots)

        if(slotsFor18.length > 0) {
           setInterval(()=> {
              notify(slotsFor18, slotsFor45);
           }, 6000);
        }
        else {
           console.log('Hitting again');
           setTimeout(makeApiHit, makeHitEveryXSecs*1000);
        }
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
}

function notify(slotsFor18, slotsFor45) {
    if(slotsFor18.length > 0) {
        let message = `Found ${slotsFor18.length} slots for 18 years old, please check`;
        speakUp(message);
    }

    // if(slotsFor45.length > 0) {
    //     let message = `Found ${slotsFor45.length} slots for 45 years old, please check`;
    //     speakUp(message);
    // }    
}

function speakUp(message) {
    exec(`say ${message}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

function GetAvailableSlots(data) {
  let availableSlots = [];
  let cowinData = JSON.parse(data);
  let centers = cowinData.centers;
  let sessionCount = 0;

  for(let i = 0; i < centers.length; i++) {
    let center = centers[i];
    if(center.sessions != undefined && center.sessions != null) {
        for(let j = 0; j < center.sessions.length; j++) {
            let session = center.sessions[j];
            if(session.available_capacity > 0) {
                availableSlots.push({
                    centerName: center.name,
                    address: center.address,
                    capacity: session.available_capacity,
                    age: session.min_age_limit,
                    vaccine: session.vaccine,
                    slots: session.slots
                });
            }
            sessionCount++;
        }
    }
  }

  console.log(`Centers processed : ${centers.length}, sessions processed: ${sessionCount}`)
  //availableSlots = [{age: 18}, {age: 18}, {age: 45}]
  return availableSlots;
}

function GetTomorrowDate() {
  let d = new Date()
  let day = d.getDate();
  let month = d.getMonth() + 1;
  let year = d.getFullYear();
  console.log(day + "-" + month + "-" + year);
  return day + "-" + month + "-" + year;
}

// Start
makeApiHit();