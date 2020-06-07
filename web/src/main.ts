import { DefinitionLoader, HowlerPlayer, SenseTrack, TrackContext } from '../../src/index';
import { Howl } from 'howler';
import { Trainer } from 'synaptic';
import * as testDefs from './testdefs.json';
import * as EventEmitter from "eventemitter3";

let done = false;


function status(stat: string) {
    console.log('-- ' + stat)
    document.querySelector('#status-msg').textContent = stat;
}

function ready(ctx: TrackContext) {
    status('Ready!');

    let toggleButton = document.createElement('button');
    let playing = false;

    toggleButton.innerText = "Start";

    toggleButton.onclick = function () {
        playing = !playing;
        toggleButton.innerText = playing ? "Pause" : "Start";

        if (playing) {
            status(`Playing - Mood: ${ctx.genre}`);
            ctx.start();
        }

        else {
            status(`Paused`);
            ctx.stop();
        }
    };

    document.querySelector('#button-target').appendChild(toggleButton);

    done = true;
}

export var note: Howl = null;

export function load() {
    if (done) return;

    status('Loading note audio...');
    note = new Howl({
        src: ["./note.ogg"]
    });

    status('Loading training definitions...');
    let testLoader = new DefinitionLoader();
    testLoader.add(testDefs);

    status('Training track...');
    let prom = testLoader.buildAsync({
        iterations: 150,
        error: 0.03,
        cost: Trainer.cost.MSE,
        log: 2,
        rate: 0.008
    });

    prom.then(({ track, training }) => {
        console.log('Training results: ', training);

        status('Adding player...');
        track.addPlayer(new HowlerPlayer(note, {
            attack: 0.2,
            decay: 0.4,
            sustain: 5.0,
            release: 0.35,
            sustainLevel: 0.7
        }));

        status('Initializing context...');
        let i = 0;
        let genre = 'happy';

        let ee = new EventEmitter();
        let instrs: string[] = [];

        ee.on('update', (ctx: TrackContext) => {
            i++;

            if (i % 30 == 0) {
                genre = ['happy', 'sad'][+(genre == 'happy')];
                console.log(instrs.join(' ') + '...');
                instrs = [];
                console.log(`We are now ${genre}.`);

                ctx.genre = genre;
                status(`Playing - Mood: ${ctx.genre}`);
            }
        });

        ee.on('post-step', (ctx: TrackContext, instr: number) => {
            if (instr == null)
                instrs.push('::')
            
            else if (instr == 0)
                instrs.push('..')
                
            else
                instrs.push('' + instr);
        });

        let ctx = new TrackContext(track, genre, 130);
        ctx.addEmitter(ee);

        ready(ctx);

        status('Done!');
    });
}