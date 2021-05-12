const https = require('https');
const say = require('say');
const { exec } = require("child_process");
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

const makeHitEveryXSecs = 10;

function makeApiHit(pincode, age) {
    let date = GetTomorrowDate();
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
        let slotsForEnteredAge = availableSlots.filter(s => s.age == age);
        console.log(slotsForEnteredAge)

        if(slotsForEnteredAge.length > 0) {
           notify(slotsForEnteredAge, age);
           setInterval(()=> {
              notify(slotsForEnteredAge, age);
           }, 6000);
        }
        else {
           console.log('Hitting again');
           setTimeout(() => {
              makeApiHit(pincode, age);
           }, makeHitEveryXSecs*1000);
        }
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
}

function notify(slotsForEnteredAge, age) {
    if(slotsForEnteredAge.length > 0) {
        let message = `Found ${slotsForEnteredAge.length} slots for ${age} years old, please check`;
        say.speak(message);
    } 
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
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const day = tomorrow.getDate();
  const month = tomorrow.getMonth() + 1;
  const year = tomorrow.getFullYear();
  console.log(day + "-" + month + "-" + year);
  return day + "-" + month + "-" + year;
}

readline.question(`Enter PinCode:`, pin => {
  readline.question(`Enter Age:`, age => {
    readline.close()
    // Start
    makeApiHit(pin, age);
  });
});