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
import * as Tone from "tone";
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
 * A {@linkcode TrackPlayer} implementation that uses
 * {@link Tone | Tone.js} as a backend..
 */
export class TonejsPlayer {
    protected synth: Tone.Synth;
    protected loop: Tone.Loop;

    /**
     * Last note.
     */
    protected note: number = null;

    /**
     * Last position in eighth notes.
     */
    protected pos: number = 0;

    /**
     * Gets the current note's frequency, in hertz.
     */
    getNoteFreq() {
        return this.baseNote * Math.pow(2, this.note / 12);
    }

    /**
     * Gets the duration in seconds of a quarter note.
     */
    quarterNoteSecs() {
        return 60 / this.bpm;
    }

    /**
     * Gets the last position in seconds.
     */
    getPosSecs() {
        return 30 * this.pos / this.bpm;
    }

    /**
     * @param bpm Beats per minute.
     * @param baseNote Base note (need not be middle C). This is what the pen will be relative to.
     * @param synOpts Tone.js synth options.
     */
    constructor(protected bpm: number = 130, protected baseNote: number = 440, synOpts?: Tone.SynthOptions) {
        this.synth = new Tone.Synth(synOpts).toMaster();

        this.loop = new Tone.Loop(time => {
            this.synth.triggerAttack(this.getNoteFreq(), time);
        }, '8n');
    }

    // TrackPlayer implementors

    on(pitch: number) {
        this.loop.stop();
        this.note = pitch;

        this.loop.start(this.getPosSecs());
        this.pos++;
    }

    off() {
        this.synth.triggerRelease();
        this.loop.stop();
    }

    setBpm(bpm: number) {
        this.bpm = bpm;
    }
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
     * The initial gain level in sustain.
     */
    sustainLevelStart: number,

    /**
     * The final gain level in sustain.
     */
    sustainLevelEnd: number,
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
     * The current position in the overall envelope, in seconds.
     */
    pos: number,

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
        pos: 0.0,
        prevLevel: 0.0,
    };

    private adsrInterval: number;

    public level: number = 0.0;

    adsrLoop(deltaTime: number) {
        this.adsr.pos += deltaTime;
        this.adsr.phase += deltaTime / this.envelope[this.adsr.state];

        while (this.adsr.phase > 1.0) {
            this.adsr.phase -= 1.0;

            switch (this.adsr.state) {
                case 'attack':
                    this.adsr.prevLevel = 1.0;
                    this.adsr.state = 'decay';
                    break;
                
                case 'decay':
                    this.adsr.prevLevel = this.envelope.sustainLevelStart;
                    this.adsr.state = 'sustain';
                    break;
                
                case 'sustain':
                    this.adsr.prevLevel = this.envelope.sustainLevelEnd;
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
                nextLevel = this.envelope.sustainLevelStart;
                break;
            
            case 'sustain':
                nextLevel = this.envelope.sustainLevelEnd;
                break;
            
            case 'release':
                nextLevel = 0.0;
                break;
        }

        this.level = this.adsr.prevLevel + (nextLevel - this.adsr.prevLevel) * this.adsr.phase;

        // Set the note volume accordingly.
        this.howl.volume(this.level, this.soundID);
    }

    constructor(private howl: Howl, private soundID: number, private envelope: AdsrEnvelope, resolution: number = 50, private done?: (HowlerNote) => void) {
        this.adsrInterval = setInterval(this.adsrLoop.bind(this, resolution / 1000), resolution);
    }

    noteOff() {
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
    clear() {
        this.playing.forEach((note) => {
            note.noteOff();
        })
    }

    // TrackPlayer implementors

    on(pitch) {
        this.clear(); // stop any playing notes first

        let sndId = this.howl.play();

        this.howl.rate(Math.pow(2, pitch / 12), sndId); // yay for the semitone formula!
        this.howl.loop(true, sndId);

        this.playing.add(new HowlerNote(this.howl, sndId, this.envelope, this.resolution, (note) => {
            this.playing.delete(note);
        }));
    }

    off() {
        this.clear();
    }

    setBpm(bpm: number) {
        return; // no-op, as this is not needed here; aka let SenseTrack take care of it!
    }
}

/**
 * Current state of the SenseTrack note generator.
 */
class NotePen {
    public on: boolean = false;         // whether pen is on
    public bounds: [number, number];    // max pen position

    constructor(private events: EventEmitter, public position: number, params: SenseParams) {
        this.bounds = [null, null];
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

    constructor(protected track: SenseTrack, protected genre: GenreValue, protected bpm: number = 130) {
        track.setBpm(bpm);
    }

    doLoop() {
        
    }
    
    start() {
        this.playing = true;

        this.doLoop();

        setTimeout(() => {
            if (this.playing) this.start();
        }, 30 / this.bpm /* eighth note */);
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
    private net: Architect.Perceptron;
    private trainer: Trainer;
    private players: Set<TrackPlayer> = new Set();

    constructor(params?: SenseParamOptions) {
        this.params = {
            // default params
            maxMove: 7,
            genres: ['A', 'B', 'C'],
            maxMemory: 6,
            allowRandom: true,
        };

        // Creating a new object also helps prevent
        // mutability, which could cause nasty bugs which
        // would totally not be our fault anyways.

        Object.assign(this.params, params);

        let initBounds = params.initBounds || { min: -15, max: 15 };
        let events = new EventEmitter();

        this.pen = new NotePen(events, params.initPos || 0, this.params);

        if (params.initBounds)
            this.pen.setBounds(initBounds.min || null, initBounds.max || null);
        
        events.on('on', (note) => {
            this.players.forEach((player) => {
                player.on(note);
            });
        });

        events.on('off', () => {
            this.players.forEach((player) => {
                player.off();
            });
        });

        let numMoves = 2 + this.params.maxMove * 2;

        this.memory = Array(params.maxMemory).fill(null);
        this.net = new Architect.Perceptron(
            numMoves * this.params.maxMemory + this.params.genres.length + (this.params.allowRandom ? 1 : 0),

            // Some hidden layer size determination behaviour is hard-coded for now.
            Math.max(Math.ceil(numMoves * this.params.maxMemory * this.params.genres.length / 2), 15),
            Math.max(Math.ceil(numMoves * this.params.maxMemory * this.params.genres.length / 3), 8),
            
            numMoves
        );
        this.trainer = new Trainer(this.net);
    }

    /**
     * Do one step (usually a 8th note), which involves
     * activating the neural network and updating the pen
     * appropriately.
     * 
     * Note handlers (aka TrackPlayer) will automatically be
     * called as a result.
     * 
     * @param genreStrength     The weight of each genre defined in the params.
     * @param randomStrength    The weight of randomization.
     * 
     * @see net
     * @see params
     * @see players
     */
    step(genreStrength: number[] = [1, 0, 0], randomStrength: number = 0.2) {
        let activation = []
            .concat(this.memory.map((m) => this.makeActivation(m)))
            .concat(genreStrength)
            .concat(this.params.allowRandom ? [Math.random() * randomStrength] : []);
        
        let output = this.net.activate(activation);
        let instr = this.parseActivation(output);

        this.execute(instr);
    }

    /**
     * Executes an instruction.
     * @param instr Instruction to execute.
     * @param memoryCtx Optionally, activation memory buffer to use in place of SenseTrack.memory.
     */
    execute(instr: number, memoryCtx: number[] = this.memory) {
        if (instr == null)
            this.penOff();
        
        else if (instr == 0)
            this.penStay();
    
        else
            this.penMove(instr);
    }

    /**
     * Make a genre vector from a genre name, index, distribution, or vector.
     * @see GenreValue
     */
    makeGenreVector(genreStrength: GenreValue | number[]): number[] {
        if (Array.isArray(genreStrength))
            return genreStrength;
        
        else if (isGenreMap(genreStrength)) {

        }

        let ind = 0;

        if (typeof genreStrength === 'string') {
            ind = this.params.genres.map((s) => s.toUpperCase()).indexOf(genreStrength.toUpperCase())
        }

        else if (typeof genreStrength === 'number')
            ind = genreStrength;
            
        return new Array(this.params.genres.length).map((_, i) => +(i == ind))
    }

    /**
     * Prepares a track training set into a format that can be 
     * used by the underlying Synpatic network.
     * @param tracks The list of training tracks to parse into a
     * Synpatic-compaible training set.
     * @see train
     */
    prepareTrainingSet(tracks: TrainingTrackSet): Trainer.TrainingSet {
        let trainingSet = [];

        tracks.forEach((instructions) => {
            let fakeMemory = Array(this.params.maxMemory).fill(null);

            instructions.forEach((step) => {
                let activation = []
                    .concat(fakeMemory.map((m) => this.makeActivation(m)))
                    .concat(step.genreStrength || new Array(this.params.genres.length).map((_, i) => +(i == 0)))
                    .concat(this.params.allowRandom ? [Math.random() * (step.randomStrength || 0)] : []);

                trainingSet.push({
                    input: activation,
                    output: this.makeActivation(step.instr)
                });

                this.appendMemory(step.instr, fakeMemory);
            });
        });

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

        return this.trainer.train(trainingSet, trainOptions);
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

        return this.trainer.trainAsync(trainingSet, trainOptions);
    }

    /**
     * Parses the raw activation output from the network, returning the instruction number.
     * (null = note off, 0 = no-op)
     * @param activation Activation to be parsed.
     * @see net
     * @see step
     */
    parseActivation(activation: number[]) {
        let maxInd = null;
        let maxVal = -1;

        activation.forEach((a, ind) => {
            if (!maxInd || a > maxVal) {
                maxInd = ind;
                maxVal = a;
            }
        });

        if (maxInd == 0)        // note off
            return 0;
        
        else if (maxInd == 1)   // no-op
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
    makeActivation(instr: number | null) {
        let emptyPart = new Array(this.params.maxMove * 2).fill(0);

        if (instr === null)   // no-op
            return [0, 1].concat(emptyPart);
        
        else if (instr === 0) // note off
            return [1, 0].concat(emptyPart);
        
        else {
            if (Math.abs(instr) > this.params.maxMove)
                throw new Error(`Semiton offset too wide; expected number between -${this.params.maxMove} and ${this.params.maxMove}, but got ${instr}!`);
            
            if (instr > 0) instr--; // so that positives reside tightly in the 2nd half; 1 is 2 + this.params.maxMove

            let res = [0, 0].concat(emptyPart);
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

        if (_memoryCtx.length > this.params.maxMemory) {
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
        
        defs.tracks.forEach((t) => {
            let moveSize = Math.max.apply(Math, t.notes.filter((n) => !isNaN(+n)).map((n) => Math.abs(n)));
    
            if (t.random) this.safeParams.allowRandom = true;
            if (moveSize > this.safeParams.maxMove) this.safeParams.maxMove = moveSize;
    
            let tl = [];
            this.tracks.push(tl);

            let rel = 0;
            if (t.absolute) rel = t.notes[0];

            t.notes.forEach((n) => {
                tl.push({ instr: n - rel, genreStrength: t.genre, randomStrength: t.random || 0 });
                if (t.absolute) rel = n;
            });

            tl.push(null);
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
