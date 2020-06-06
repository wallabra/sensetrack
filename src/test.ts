import { DefinitionLoader, TonejsPlayer, SenseTrack, TrackContext } from './index';
import * as testDefs from './testdefs.json';


let testLoader = new DefinitionLoader();
testLoader.add(testDefs);

let track = testLoader.build().track;
track.addPlayer(new TonejsPlayer());

let i = 0;
let genre = 'happy';

function myLoop(ctx: TrackContext) {
    console.log(i);

    if (i % 10 == 0) {
        genre = ['happy', 'sad'][+(genre == 'happy')];
        console.log(`We are now ${genre}.`);

        
    }
    
    i++;
}
