/**
 * SenseTrack.
 * 
 * A simple, but powerful, proof-of-concept model for dynamically
 * generating real-time music notes from a few training sets, with
 * the ability to set 'genre vectors' (like mood, or biome, or events,
 * etc.), and more!
 * 
 * Perhaps a leitmotif merger. Or maybe just a monkey in a typewriter
 * tasked to do so. Only the future may tell!...
 * 
 * @remarks
 * 
 * This is mostly a sketch project, a proof-of-concept for a larger
 * project. This is why this is such a simple sketch, so as to only
 * support one 'instrument', and no actual oscillator.
 * 
 * This larger project in Haxe (codename Mundis) will include
 * a dynamic music engine.
 * 
 * @author Gustavo Ramos Rehermann (Gustavo6046) <rehermann6046@gmail.com>
 * @license MIT
 * @since 6th of June 2020
 */


import * as EventEmitter from "eventemitter3";
import { Architect, Trainer } from "synaptic";



/**
 * An object that can play generated
 * notes (and note stops).
 * @see SenseTrack.addPlayer
 */
export interface TrackPlayer {
    /**
     * Plays a new note. Should stop any other notes playing.
     */
    on: (pitch: number) => void,

    /**
     * Stops any notes playing.
     */
    off: () => void,
    
    /**
     * Sets the BPM.
     */
    setBpm: (bpm: number) => void,
}

/**
 * An ADSR envelope, with the size (length) of each state in seconds,
 * and the sustain level. It always peaks at 1.0 after attack and before
 * decay.
 */
export interface AdsrEnvelope {
    attack: number,
    decay: number,
    sustain: number,
    release: number,

    /**
     * The gain level in sustain.
     */
    sustainLevel: number
}

/**
 * The current state of a {@link HowlerNote | note}, in terms of the
 * {@link AdsrEnvelope | ADSR envelope}.
 */
export interface AdsrState {
    /**
     * The current state of this ADSR envelope instance.
     */
    state: 'attack' | 'decay' | 'sustain' | 'release',

    /**
     * The phase of the current state, between 0.0 and 1.0.
     */
    phase: number,

    /**
     * The gain level at the last state switch. Used in
     * interpolation.
     */
    prevLevel: number,
}

/**
 * An instance of a playing note in a {@link HowlerPlayer}.
 */
export class HowlerNote {
    /**
     * Current state of this ADSR instance.
     */
    private adsr: AdsrState = {
        state: 'attack',
        phase: 0.0,
        prevLevel: 0.0,
    };

    private adsrInterval: NodeJS.Timeout;

    public level: number = 0.0;

    adsrLoop(deltaTime: number) {
        if (this.adsr.state != 'sustain')
            this.adsr.phase += deltaTime / this.envelope[this.adsr.state];

        while (this.adsr.phase > 1.0) {
            this.adsr.phase -= 1.0;

            switch (this.adsr.state) {
                case 'attack':
                    this.adsr.prevLevel = 1.0;
                    this.adsr.state = 'decay';
                    break;
                
                case 'decay':
                    this.adsr.prevLevel = this.envelope.sustainLevel;
                    this.adsr.state = 'sustain';
                    break;
                
                case 'sustain':
                    this.adsr.prevLevel = this.envelope.sustainLevel;
                    this.adsr.state = 'release';
                    break;
                
                case 'release':
                    clearInterval(this.adsrInterval);
                    this.howl.fade(this.level, 0.0, 0.08, this.soundID);

                    if (this.done) this.done(this);
                    return;
            }
        }

        // Now, compute current level using interpolation.
        let nextLevel: number;

        switch (this.adsr.state) {
            case 'attack':
                nextLevel = 1.0;
                break;
            
            case 'decay':
                nextLevel = this.envelope.sustainLevel;
                break;
            
            case 'sustain':
                nextLevel = this.envelope.sustainLevel;
                break;
            
            case 'release':
                nextLevel = 0.0;
                break;
        }

        this.level = this.adsr.prevLevel + (nextLevel - this.adsr.prevLevel) * this.adsr.phase;

        // Set the note volume accordingly.
        this.howl.volume(this.level, this.soundID);
    }

    constructor(private howl: Howl, private soundID: number, private envelope: AdsrEnvelope, resolution: number = 50, private done?: (note: HowlerNote) => void) {
        this.adsrInterval = setInterval(this.adsrLoop.bind(this, resolution / 1000), resolution);
    }

    noteOff() {
        if (this.adsr.state != 'release') {
            this.adsr.state = 'release';
            this.adsr.phase = 0;
            this.adsr.prevLevel = this.level;
        }
    }

    noteStop() {
        if (this.adsrInterval) {
            clearInterval(this.adsrInterval);
            this.howl.fade(this.level, 0, 0.15, this.soundID);

            if (this.done) this.done(this);
        }
    }
}

/**
 * A {@linkcode TrackPlayer} implementation that
 * uses {@link Howler | Howler.js} as its backend.
 */
export class HowlerPlayer {
    private playing: Set<HowlerNote> = new Set();

    constructor(protected howl: Howl, protected envelope: AdsrEnvelope, private resolution: number = 50) { }
    
    /**
     * Stops all playing {@linkcode HowlerNote | notes}.
     */
    allStop() {
        this.playing.forEach((note) => {
            note.noteStop();
        })
    }

    /**
     * Finishes all playing {@linkcode HowlerNote | notes}.
     */
    allOff() {
        this.playing.forEach((note) => {
            note.noteOff();
        })
    }

    // TrackPlayer implementors

    on(pitch: number) {
        this.allOff(); // stop any playing notes first

        let sndId = this.howl.play();

        this.howl.rate(Math.pow(2, pitch / 12), sndId); // yay for the semitone formula!
        this.howl.loop(true, sndId);

        this.playing.add(new HowlerNote(this.howl, sndId, this.envelope, this.resolution, (note) => {
            this.playing.delete(note);
        }));
    }

    off() {
        this.allStop();
    }

    setBpm(bpm: number) {
        // not needed in this implementation
        return;
    }
}

/**
 * Current state of the SenseTrack note generator.
 */
class NotePen {
    public on: boolean = false;         // whether pen is on
    public bounds: [number, number];    // max pen position

    constructor(private events: EventEmitter, public position: number, params: SenseParams) {
        this.bounds = [-30, 30];
    }

    /**
     * Sets the minimum position of the pen, in the absolute semiton scale.
     * @param min The minimum position of the pen.
     * @see setMax
     * @see setBounds
     */
    setMin(min: number) {
        this.bounds[0] = min;
    }

    /**
     * Sets the maximum position of the pen, in the absolute semiton scale.
     * @param min The maximum position of the pen.
     * @see setMin
     * @see setBounds
     */
    setMax(max: number) {
        this.bounds[0] = max;
    }

    /**
     * Sets both the minimum and maximum boundaries for the position of the
     * pen, in the absolute semiton scale.
     * @param min The minimum position of the pen.
     * @param max The maximum position of the pen.
     * @see setMin
     * @see setMax
     */
    setBounds(min: number, max: number) {
        this.bounds = [min, max];
    }

    /**
     * Naively moves the note pen's position in semitons,
     * honouring any bounds set.
     * 
     * @param offsetSemitons Relative, signed move amount, in semitons.
     */
    move(offsetSemitons: number) {
        let newPos = this.position + offsetSemitons;
        let bMin = null;
        let bMax = null;

        bMin = this.bounds[0];
        bMax = this.bounds[1];

        if (bMin) while (newPos < bMin) newPos += 12; //    move by an octave...
        if (bMax) while (newPos > bMax) newPos -= 12; // ...until the note is pleasant!

        console.log(`Pen moved${this.on ? ' from ' + this.position : ''} to ${newPos}`);
        this.position = newPos;
        this.on = true;

        this.events.emit('on', this.position);

        return this;
    }

    /** 
     * Sets the pen to OFF ('up', in Turtle terminology).
     */
    up() {
        this.on = false;
            
        this.events.emit('off');
        
        return this;
    }
}


/**
 * Parameters using when building a SenseTrack, particularly
 * those related to the neural network.
 */
export interface SenseParams {
    maxMove: number,        // max move instruction width in semitons, defaults to 7
    genres: string[],       // 'genre' names
    maxMemory: number,      // max output instructions in memory
    allowRandom: boolean,   // whether to honor randomization adjustment
}


/**
 * Options to chnage defaults in above parameters.
 * @see SenseTrack
 */
export interface SenseParamOptions {
    maxMove?: number,
    genres?: string[],
    maxMemory?: number,
    allowRandom?: boolean,
    initPos?: number,
    initBounds?: { min?: number, max?: number },
}

/**
 * A single note; an intermediary format internally used by
 * SenseTrack to make life easier when converting to a training
 * set that can be read by Synaptic.
 * 
 * @see DefinitionLoader A more high-level interface to SenseTrack's training facilities.
 */
export interface TrainingNote {
    instr: number,
    genreStrength: GenreValue,
    randomStrength?: number
}

/**
 * A genre distribution map, used to specify a custom
 * distribution of genre values, rather than a simple,
 * boring one-hot.
 */
export interface GenreMap {
    values: { [name: string]: number }
}

/**
 * Checks whether the genre value passed is specifically
 * a custom distribution, aka a GenreMap.
 * @param value The value to be checked.
 * @see GenreMap
 */
export function isGenreMap(value: GenreValue): value is GenreMap {
    return (value as GenreMap).values !== undefined;
}

/**
 * Any value that can be parsed as a genre value distribution.
 */
export type GenreValue = (string | number | GenreMap);

/**
 * An intermediary training track.
 */
export type TrainingTrack = TrainingNote[];

/**
 * A list of intermediary training tracks. This is what
 * SenseTrack ultimately reads into the Synaptic-compatible
 * training set.
 * 
 * @see DefinitionLoader A more high-level interface to SenseTrack's training facilities.
 */
export type TrainingTrackSet = TrainingTrack[];


/**
 * The context under the which a {@linkcode SenseTrack}
 * is played. Use this to play it!
 */
export class TrackContext {
    protected playing: boolean = false;
    protected emitters: Set<EventEmitter> = new Set();

    private _intv: NodeJS.Timeout = null;

    constructor(protected track: SenseTrack, public genre: GenreValue, public randomization: number = 0.4, protected bpm: number = 130) {
        track.setBpm(bpm);
    }

    /**
     * Emits an event to all registered {@linkcode EventEmitter}s.
     * @param event Event name.
     * @param args Event arguments.
     * @see addEmitter
     */
    emit(event: string, ...args: any[]) {
        this.emitters.forEach((e) => {
            e.emit(event, ...args);
        });
    }

    /**
     * Registers an {@linkcode EventEmitter} to this context.
     * @param ee The event emitter to add.
     */
    addEmitter(ee: EventEmitter) {
        this.emitters.add(ee);
    }

    /**
     * Unregisters an {@linkcode EventEmitter} from this context.
     * @param ee The event emitter to remove.
     */
    removeEmitter(ee: EventEmitter) {
        this.emitters.delete(ee);
    }

    /**
     * Single iteration of the context's music loop.
     */
    doLoop() {
        this.emit('update', this);
        let instr = this.track.step(this.track.makeGenreVector(this.genre));
        this.emit('post-step', this, instr);
    }

    /**
     * Stops the context's loop.
     */
    stop() {
        this.playing = false;
        this.track.penOff();
    }
    
    /**
     * Starts the context's music loop.
     */
    start() {
        this.playing = true;

        if (!this._intv) {
            this.doLoop();

            this._intv = setTimeout(() => {
                this._intv = null;

                if (this.playing)
                    this.start();
            }, 30000 / this.bpm); // eighth note
        }
    }
}

/**
 * The spotlit class, responsible for driving
 * the pen responsibly.
 */
export class SenseTrack {
    public params: SenseParams;
    public pen: NotePen;
    
    protected memory: number[]; // last moves (null for stay put and stop, 0 for stay put and continue, else semiton change)

    private inputSize: number;
    private net: Architect.Perceptron;
    private trainer: Trainer;
    private players: Set<TrackPlayer> = new Set();

    public events = new EventEmitter();

    constructor(params?: SenseParamOptions) {
        this.params = {
            // default params
            maxMove: 8,
            genres: ['A', 'B', 'C'],
            maxMemory: 6,
            allowRandom: true,
        };

        // Creating a new object also helps prevent
        // mutability, which could cause nasty bugs which
        // would totally not be our fault anyways.

        Object.assign(this.params, params);

        let initBounds = params.initBounds || { min: -15, max: 15 };

        this.pen = new NotePen(this.events, params.initPos || 0, this.params);

        if (params.initBounds)
            this.pen.setBounds(initBounds.min || null, initBounds.max || null);
        
        this.events.on('on', (note) => {
            this.players.forEach((player) => {
                player.on(note);
            });
        });

        this.events.on('off', () => {
            this.players.forEach((player) => {
                player.off();
            });
        });

        let numMoves = 2 + this.params.maxMove * 2;

        this.inputSize = numMoves * this.params.maxMemory + this.params.genres.length + (this.params.allowRandom ? 1 : 0);

        this.memory = new Array(this.params.maxMemory).fill('empty');

        this.net = new Architect.Perceptron(
            this.inputSize,

            // Some hidden layer size determination behaviour is hard-coded for now.
            Math.max(Math.ceil(numMoves * this.params.maxMemory * this.params.genres.length / 1.25), 30),
            
            numMoves
        );
    }

    /**
     * Do one step (usually a 8th note), which involves
     * activating the neural network and updating the pen
     * appropriately.
     * 
     * All note event handlers (aka {@linkcode TrackPlayer})
     * registered will automatically be called as a result.
     * 
     * @note It is recommended to use a {@linkcode TrackContext},
     * instead of using this function directly.
     * 
     * @param genreStrength     The weight of each genre defined in the params.
     * @param randomStrength    The weight of randomization.
     * 
     * @see net
     * @see params
     * @see players
     */
    step(genreStrength: number[] = [1, 0, 0], randomStrength: number = 0.2) {
        let activation = this.makeInputVector(this.memory, genreStrength, randomStrength);

        if (activation.length !== this.inputSize) {
            console.error(`Bad input sizes! (${activation.length} != ${this.inputSize})`);
            return null;
        }

        let output = this.net.activate(activation);
        let instr = this.parseActivation(output);
        
        console.log(output, '->', instr);

        this.execute(instr);
        
        return instr;
    }

    /**
     * Executes an instruction.
     * @param instr Instruction to execute.
     * @param memoryCtx Optionally, activation memory buffer to use in place of SenseTrack.memory.
     */
    execute(instr: number, memoryCtx: number[] = this.memory) {
        if (instr === null)
            this.penOff(memoryCtx);
        
        else if (instr == 0)
            this.penStay(memoryCtx);
    
        else
            this.penMove(instr, memoryCtx);
    }

    /**
     * Make a genre vector from a genre name, index, distribution, or vector.
     * @see GenreValue
     */
    makeGenreVector(genreStrength: GenreValue | number[]): number[] {
        if (Array.isArray(genreStrength))
            return genreStrength;
        
        else if (isGenreMap(genreStrength)) {
            return this.params.genres.map((g) => genreStrength.values[g] || 0);
        }

        let ind = 0;

        if (typeof genreStrength === 'string') {
            ind = this.params.genres.indexOf(genreStrength)
        }

        else if (typeof genreStrength === 'number')
            ind = genreStrength;
            
        return this.params.genres.map((_, i) => i === ind ? 1 : 0);
    }

    /**
     * Creates an input activation vector, into a format that
     * can be used by the underlying Synaptic network.
     * @param memoryCtx The memory context array to be used.
     * @param genreStrength The genre vector being used.
     * @param randomStrength The randomization strength.
     * @see makeGenreVector
     */
    makeInputVector(memoryCtx: number[], genreStrength: number[], randomStrength: number): number[] {
        let res: number[] = [];

        memoryCtx.forEach((m) => {
            res = res.concat(this.makeActivation(m));
        });
        
        res = res.concat(genreStrength, this.params.allowRandom ? [Math.random() * randomStrength] : []);
        
        return res;
    }

    /**
     * Prepares a track training set into a format that can be 
     * used by the underlying Synpatic network.
     * @param tracks The list of training tracks to parse into a
     * Synpatic-compaible training set.
     * @see train
     */
    prepareTrainingSet(tracks: TrainingTrackSet): Trainer.TrainingSet {
        let trainingSet: Trainer.TrainingSet = [];

        tracks.forEach((instructions) => {
            let fakeMemory = new Array(this.params.maxMemory).fill('empty');

            instructions.forEach((step) => {
                let gvec = this.makeGenreVector(step.genreStrength);
                let activation = this.makeInputVector(fakeMemory, gvec, step.randomStrength);

                let expRes = this.makeActivation(step.instr);
                
                trainingSet.push({
                    input: activation,
                    output: expRes
                });

                this.appendMemory(step.instr, fakeMemory);
            });
        });

        console.log(trainingSet);

        return trainingSet;
    }

    /**
     * Trains the network on a training set, teaching it to imitate the
     * patterns of the notes.
     * @param instructions  A list of tracks, each track a list of instructions; the training set to teach SenseTrack!
     * @param trainOptions  Optional training options that are passed to the underlying Trainer. https://github.com/cazala/synaptic/wiki/Trainer#options
     */
    train(tracks: TrainingTrackSet, trainOptions?: Trainer.TrainingOptions): Trainer.TrainingResult {
        let trainingSet = this.prepareTrainingSet(tracks);

        let trainer = new Trainer(this.net);
        return trainer.train(trainingSet, trainOptions);
    }

    /**
     * Asynchrounously trains the network on a training set, teaching it to imitate the
     * patterns of the notes.
     * @param instructions  A list of tracks, each track a list of instructions; the training set to teach SenseTrack!
     * @param trainOptions  Optional training options that are passed to the underlying Trainer. https://github.com/cazala/synaptic/wiki/Trainer#options
     * @see train
     */
    trainAsync(tracks: TrainingTrackSet, trainOptions?: Trainer.TrainingOptions): Promise<Trainer.TrainingResult> {
        let trainingSet = this.prepareTrainingSet(tracks);

        let trainer = new Trainer(this.net);
        return trainer.trainAsync(trainingSet, trainOptions);
    }

    /**
     * Parses the raw activation output from the network, returning the instruction number.
     * (null = note off, 0 = no-op)
     * @param activation Activation to be parsed.
     * @see net
     * @see step
     */
    parseActivation(res: number[]) {
        let maxInd = res.indexOf(Math.max.apply(Math, res));

        if (maxInd === 0)        // no-op instruction
            return 0;
        
        else if (maxInd === 1)   // note off instruction
            return null;
        
        else {
            maxInd -= 2;

            if (maxInd >= this.params.maxMove) maxInd++; // range-related stuff I won't get into; basically, 0 is not a move proper.
            return maxInd - this.params.maxMove + 1;
        }
    }

    /**
     * Makes a partial activation vector from an instruction.
     * @param instr Instruction to feed.
     * @see net
     * @see step
     */
    makeActivation(instr: number | null | 'empty') {
        let res = new Array(2 + 2 * this.params.maxMove).fill(0);

        if (instr === 'empty') {
            return res;
        }

        if (instr === 0) {  // no-op instruction
            res[0] = 1;
            return res;
        }
        
        else if (instr === null) { // note off instruction
            res[1] = 1;
            return res;
        }
        
        else {
            if (Math.abs(instr) > this.params.maxMove)
                throw new Error(`Semiton offset too wide; expected number between -${this.params.maxMove} and ${this.params.maxMove}, but got ${instr}!`);
            
            if (instr > 0) instr--; // so that positives reside tightly in the 2nd half; 1 is 2 + this.params.maxMove

            res[2 + this.params.maxMove + instr] = 1; // negatives are 1st half as intended; math is beautiful!
            
            return res;
        }
    }

    /**
     * Appends an instruction to the circular buffer of instruction memory that is fed into the network.
     * @param instruction The instruction to memorize.
     * @see memory
     */
    appendMemory(instruction: number, _memoryCtx: number[] = this.memory) {
        if (instruction === null) {
            _memoryCtx.push(null);
        }

        else {
            _memoryCtx.push(instruction);
        }

        while (_memoryCtx.length > this.params.maxMemory) {
            _memoryCtx.shift();
        }
    }

    /**
     * Moves the pen by an offset, automatically appending to memory.
     * @param offset The offset.
     * @see pen
     */
    penMove(offset: number, _memoryCtx: number[] = this.memory) {
        this.pen.move(offset);
        this.appendMemory(offset, _memoryCtx);
    }

    /**
     * Moves the pen 'up', aka. stops any note currently playing.
     * @see pen
     */
    penOff(_memoryCtx: number[] = this.memory) {
        this.pen.up();
        this.appendMemory(null, _memoryCtx);
    }

    /**
     * Keeps the pen in place. This is mostly a no-op, whose only
     * purpose is to update the loopback memory.
     */
    penStay(_memoryCtx: number[] = this.memory) {
        this.appendMemory(0, _memoryCtx);
    }

    /**
     * Adds a new TrackPlayer to this SenseTrack. This player
     * will process any note events as defined.
     * @param player The TrackPlayer to be added.
     * @see TrackPlayer
     */
    addPlayer(player: TrackPlayer) {
        this.players.add(player);
    }

    /**
     * Sets the BPM of all {@link TrackPlayer | players} in this SenseTrack.
     * @param bpm The BPM to set.
     * @see TrackContext
     */
    setBpm(bpm: number) {
        this.players.forEach((player) => {
            player.setBpm(bpm);
        });
    }

    /**
     * Removes a TrackPlayer previously added to this
     * SenseTracker.
     * @param player The TrackPlayer to be removed.
     * @see TrackPlayer
     * @see addPlayer
     */
    removePlayer(player: TrackPlayer) {
        if (this.players.has(player))
            this.players.delete(player);
        
        else
            throw new Error("The given TrackPlayer is already not in this SenseTrack!");
    }
}

/**
 * A single track in the high-level definition input.
 */
export interface InputTrack {
    genre: string,
    random: number,
    absolute?: boolean,
    notes: number[]
}

/**
 * A high-level definition input, often a JSON file.
 */
export interface InputDefinition {
    genres: string[],
    tracks: InputTrack[],
}

/**
 * The track built from the DefinitionLoader,
 * along with the results of training said track.
 */
export interface DefBuildResults {
    training: Trainer.TrainingResult,
    track: SenseTrack
}

/**
 * Loads definitions to train a SenseTrack
 * object. Multiple definitions may be loaded.
 */
export class DefinitionLoader {
    protected tracks: TrainingTrackSet = [];
    protected genres: Set<String> = new Set();

    private safeParams: SenseParamOptions = {};
    private userParams: SenseParamOptions = {};


    /**
     * Adds a definition input unit to this DefinitionLoader.
     * @param defs Definition input to add.
     */
    add(defs: InputDefinition) {
        defs.genres.forEach((genre) => {
            this.genres.add(genre);
        });
        
        let tl: TrainingTrack = [];
        
        defs.tracks.forEach((t) => {
            let moveSize = Math.max.apply(Math, t.notes.filter((n) => !isNaN(+n)).map((n) => Math.abs(n)));
    
            if (t.random) this.safeParams.allowRandom = true;
            if (moveSize > this.safeParams.maxMove) this.safeParams.maxMove = moveSize;
    
            this.tracks.push(tl);

            let rel = 0;
            if (t.absolute) rel = t.notes[0];

            t.notes.forEach((n) => {
                tl.push({ instr: n - rel, genreStrength: t.genre, randomStrength: t.random || 0 });
                if (t.absolute) rel = n;
            });
            
            tl.push({ instr: null, genreStrength: t.genre, randomStrength: t.random || 0 });
        });
    }

    /**
     * Builds and retrieves the full SenseTrack parameter object from
     * this loader.
     * @see SenseTrack
     */
    getParams(): SenseParamOptions {
        let params: SenseParamOptions = Object.assign({}, this.userParams, this.safeParams, {
            genres: Array.from(this.genres)
        });

        // Checks that allow some user parameters if they keep the guarantees
        // required from the 'safe' equivalents.
        if (this.userParams.maxMove && (!this.safeParams.maxMove || this.userParams.maxMove > this.safeParams.maxMove))
            params.maxMove = this.userParams.maxMove;
        
        if (this.userParams.allowRandom)
            params.allowRandom = true;

        return params;
    }

    /**
     * Adds extra configuration parameters to this
     * DefinitionLoader.
     * @param someParams Extra configuration parameters.
     */
    configure(someParams: SenseParamOptions) {
        Object.assign(this.userParams, someParams);
    }

    /**
     * Returns a blank slate {@linkplain SenseTrack | track}, ready to be
     * taught by the {@linkplain DefinitionLoader | loader}.
     * @see build
     * @see buildAsync
     */
    blankNet() {
        return new SenseTrack(this.getParams());
    }

    /**
     * Builds a new {@linkcode SenseTrack}, teaching it the tracks in this Loader.
     * Note that you should use buildAsync if you don't want to block.
     * @param trainOptions Optional training options that are passed to the Synaptic Trainer.
     */
    build(trainOptions?: Trainer.TrainingOptions): DefBuildResults {
        let res = this.blankNet();

        return {
            training: res.train(this.tracks, trainOptions),
            track: res
        };
    }

    /**
     * Asynchronously builds a new {@linkcode SenseTrack}, teaching it the tracks in
     * this Loader.
     * @param trainOptions Optional training options that are passed to the Synaptic Trainer.
     */
    buildAsync(trainOptions?: Trainer.TrainingOptions): Promise<DefBuildResults> {
        let res = this.blankNet();

        return res.trainAsync(this.tracks, trainOptions).then((trainRes) => {
            return {
                training: trainRes,
                track: res
            };
        });
    }
}
