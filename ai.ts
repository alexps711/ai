import * as fs from 'fs';

/**
 * This program creates the initialization of an AI domain problem.
 * It defines the measures (locations) a government can take (go to) in order to
 * stop a pandemic. Each measure has a 
 * @param payload which indicates the 
 * @param infections,
 * @param deaths and 
 * @param social impact it incurs.
 * These paramters are calculated based on the severety of the measures,
 * represented in 
 * @param segment.
 * 
 * To run it, run '$tsc ai.ts' and the '$node ai.js'.
 * 
 * @author Alejandro Perez Salas <k1891086@kcl.ac.uk>
 * @author Louis Chevrel <k1889081@kcl.ac.uk>
 * @author Ajay Dayalani <k1889578@kcl.ac.uk>
 * @author Thomas Yazitzoglou <k1891121@kcl.ac.uk>
 * 
 * @version 1.0.0
 */


interface Payload {
    infections: number;
    deaths: number;
    social: number;
}

interface Path {
    from: string,
    to: string,
    payload: Payload
}

interface Measure {
    name: string;
    segment: number;
    repeatImpact?: {
        infectionChange: number;
        deathChange: number;
        socialChange: number;
    }
}

// PARAMS
let infectionsToll = 460;
let deathToll = 8;
let socialToll = 0;
let infectionRate = 0; // between 1 and 10.
let deathRate = 0; // between 1 and 10.

const MAX_INFECTIONS = 15000000;
const MAX_SOCIAL = 100;


const measures: Measure[] = [
    { name: "School closure", segment: 1 },
    { name: "Ban events of more than 100 people", segment: 1 },
    { name: "Educate public on preventive measures", segment: 1 },
    { name: "Close Border", segment: 2 },
    { name: "Remote work", segment: 2 },
    { name: "Research", segment: 2 },
    {
        name: "Speech", segment: 2, repeatImpact: {
            infectionChange: 0,
            deathChange: 0,
            socialChange: -5
        }
    },
    {
        name: "Quarantine", segment: 3, repeatImpact: {
            infectionChange: -5,
            deathChange: -5,
            socialChange: 5
        }
    },
    { name: "Rationing supplies", segment: 3 },
    {
        name: "Lockdown", segment: 3, repeatImpact: {
            infectionChange: -10,
            deathChange: -10,
            socialChange: 10
        }
    },
    { name: "Official Speech", segment: 4 },
    { name: "Open Border", segment: 4 },
    { name: "Social Event", segment: 5 },
];

/**
 * Calculate the takeaway of moving from one measure to another.
 */
function calculatePayload(): Payload {
    let infections = Math.floor((MAX_INFECTIONS - infectionsToll) * (infectionRate / 100));
    // Deaths are always 3.4% of infections.
    let deaths = Math.floor(infections * 0.034);
    let social = (socialToll + 5 >= MAX_SOCIAL) ? (MAX_SOCIAL - socialToll) : (socialToll + 5);
    infectionsToll += infections;
    deathToll += deaths;
    socialToll += social;
    return {
        infections: infections,
        deaths: deaths,
        social: social
    }
}

/**
 * Calculate the infection rate based on the 'segments' of the measures.
 * The further apart, the biggest the increase rate.
 * @param fromMeasure the measure the government is at.
 * @param toMeasure the measure the government is going to take.
 */
function generatePayload(fromMeasure: Measure, toMeasure: Measure): Payload {
    if (toMeasure.segment > fromMeasure.segment) {
        infectionRate = (toMeasure.segment - fromMeasure.segment) + 1;
        deathRate = (toMeasure.segment - fromMeasure.segment) + 1
    }
    else {
        infectionRate = (fromMeasure.segment - toMeasure.segment) + 1;
        deathRate = (fromMeasure.segment - toMeasure.segment) + 1;
    }
    return calculatePayload();
}

/**
 * Generate paths for each measure.
 */
function run() {
    let solution: Path[] = [];
    measures.forEach(fromMeasure => {
        measures.forEach(toMeasure => {
            if (fromMeasure !== toMeasure) {
                solution.push({
                    from: fromMeasure.name,
                    to: toMeasure.name,
                    payload: generatePayload(fromMeasure, toMeasure)
                });
            }
        });
        // Remove current measure to avoid duplicated paths.
        measures.splice(measures.indexOf(fromMeasure), 1)
    });
    // Generate file.
    fs.writeFileSync('data.pddl', '(:init \n (at gov initState) \n (= (research) 0) \n (= (total_infections) 1000) \n (= (total_deaths) 0) \n (= (total_social_impact) 0) \n');

    solution.forEach(path => fs.appendFileSync('data.pddl', `(accessible_measure gov '${path.from})'
        (= (infection_rate_consequence ${path.to}) ${infectionRate})
        (= (death_required '${path.from}' '${path.to}') ${path.payload.deaths})
        (= (infections_required '${path.from}' '${path.to}') ${path.payload.infections})
        (= (social_required '${path.from}' '${path.to}') ${Math.floor(Math.random() * 10)})\n`)); // Social impact is randomly generated (between 1 and 10)
}

run();