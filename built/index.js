"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefinitionLoader = exports.SenseTrack = exports.TrackContext = exports.isGenreMap = exports.HowlerPlayer = exports.HowlerNote = exports.TonejsPlayer = void 0;
const EventEmitter = require("eventemitter3");
const Tone = require("tone");
const synaptic_1 = require("synaptic");
/**
 * A {@linkcode TrackPlayer} implementation that uses
 * {@link Tone | Tone.js} as a backend..
 */
class TonejsPlayer {
    /**
     * @param bpm Beats per minute.
     * @param baseNote Base note (need not be middle C). This is what the pen will be relative to.
     * @param synOpts Tone.js synth options.
     */
    constructor(bpm = 130, baseNote = 440, synOpts) {
        this.bpm = bpm;
        this.baseNote = baseNote;
        /**
         * Last note.
         */
        this.note = null;
        /**
         * Last position in eighth notes.
         */
        this.pos = 0;
        this.synth = new Tone.Synth(synOpts).toMaster();
        this.loop = new Tone.Loop(time => {
            this.synth.triggerAttack(this.getNoteFreq(), time);
        }, '8n');
    }
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
    // TrackPlayer implementors
    on(pitch) {
        this.loop.stop();
        this.note = pitch;
        this.loop.start(this.getPosSecs());
        this.pos++;
    }
    off() {
        this.synth.triggerRelease();
        this.loop.stop();
    }
    setBpm(bpm) {
        this.bpm = bpm;
    }
}
exports.TonejsPlayer = TonejsPlayer;
/**
 * An instance of a playing note in a {@link HowlerPlayer}.
 */
class HowlerNote {
    constructor(howl, soundID, envelope, resolution = 50, done) {
        this.howl = howl;
        this.soundID = soundID;
        this.envelope = envelope;
        this.done = done;
        /**
         * Current state of this ADSR instance.
         */
        this.adsr = {
            state: 'attack',
            phase: 0.0,
            pos: 0.0,
            prevLevel: 0.0,
        };
        this.level = 0.0;
        this.adsrInterval = setInterval(this.adsrLoop.bind(this, resolution / 1000), resolution);
    }
    adsrLoop(deltaTime) {
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
                    if (this.done)
                        this.done(this);
                    return;
            }
        }
        // Now, compute current level using interpolation.
        let nextLevel;
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
    noteOff() {
        if (this.adsrInterval) {
            clearInterval(this.adsrInterval);
            this.howl.fade(this.level, 0, 0.15, this.soundID);
            if (this.done)
                this.done(this);
        }
    }
}
exports.HowlerNote = HowlerNote;
/**
 * A {@linkcode TrackPlayer} implementation that
 * uses {@link Howler | Howler.js} as its backend.
 */
class HowlerPlayer {
    constructor(howl, envelope, resolution = 50) {
        this.howl = howl;
        this.envelope = envelope;
        this.resolution = resolution;
        this.playing = new Set();
    }
    /**
     * Stops all playing {@linkcode HowlerNote | notes}.
     */
    clear() {
        this.playing.forEach((note) => {
            note.noteOff();
        });
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
    setBpm(bpm) {
        return; // no-op, as this is not needed here; aka let SenseTrack take care of it!
    }
}
exports.HowlerPlayer = HowlerPlayer;
/**
 * Current state of the SenseTrack note generator.
 */
class NotePen {
    constructor(events, position, params) {
        this.events = events;
        this.position = position;
        this.on = false; // whether pen is on
        this.bounds = [null, null];
    }
    /**
     * Sets the minimum position of the pen, in the absolute semiton scale.
     * @param min The minimum position of the pen.
     * @see setMax
     * @see setBounds
     */
    setMin(min) {
        this.bounds[0] = min;
    }
    /**
     * Sets the maximum position of the pen, in the absolute semiton scale.
     * @param min The maximum position of the pen.
     * @see setMin
     * @see setBounds
     */
    setMax(max) {
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
    setBounds(min, max) {
        this.bounds = [min, max];
    }
    /**
     * Naively moves the note pen's position in semitons,
     * honouring any bounds set.
     *
     * @param offsetSemitons Relative, signed move amount, in semitons.
     */
    move(offsetSemitons) {
        let newPos = this.position + offsetSemitons;
        let bMin = null;
        let bMax = null;
        bMin = this.bounds[0];
        bMax = this.bounds[1];
        if (bMin)
            while (newPos < bMin)
                newPos += 12; //    move by an octave...
        if (bMax)
            while (newPos > bMax)
                newPos -= 12; // ...until the note is pleasant!
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
 * Checks whether the genre value passed is specifically
 * a custom distribution, aka a GenreMap.
 * @param value The value to be checked.
 * @see GenreMap
 */
function isGenreMap(value) {
    return value.values !== undefined;
}
exports.isGenreMap = isGenreMap;
/**
 * The context under the which a {@linkcode SenseTrack}
 * is played. Use this to play it!
 */
class TrackContext {
    constructor(track, bpm) {
        this.track = track;
        this.bpm = bpm;
    }
    start() {
    }
}
exports.TrackContext = TrackContext;
/**
 * The spotlit class, responsible for driving
 * the pen responsibly.
 */
class SenseTrack {
    constructor(params) {
        this.players = new Set();
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
        this.net = new synaptic_1.Architect.Perceptron(numMoves * this.params.maxMemory + this.params.genres.length + (this.params.allowRandom ? 1 : 0), 
        // Some hidden layer size determination behaviour is hard-coded for now.
        Math.max(Math.ceil(numMoves * this.params.maxMemory * this.params.genres.length / 2), 15), Math.max(Math.ceil(numMoves * this.params.maxMemory * this.params.genres.length / 3), 8), numMoves);
        this.trainer = new synaptic_1.Trainer(this.net);
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
    step(genreStrength = [1, 0, 0], randomStrength = 0.2) {
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
    execute(instr, memoryCtx = this.memory) {
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
    makeGenreVector(genreStrength) {
        if (Array.isArray(genreStrength))
            return genreStrength;
        else if (isGenreMap(genreStrength)) {
        }
        let ind = 0;
        if (typeof genreStrength === 'string') {
            ind = this.params.genres.map((s) => s.toUpperCase()).indexOf(genreStrength.toUpperCase());
        }
        else if (typeof genreStrength === 'number')
            ind = genreStrength;
        return new Array(this.params.genres.length).map((_, i) => +(i == ind));
    }
    /**
     * Prepares a track training set into a format that can be
     * used by the underlying Synpatic network.
     * @param tracks The list of training tracks to parse into a
     * Synpatic-compaible training set.
     * @see train
     */
    prepareTrainingSet(tracks) {
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
    train(tracks, trainOptions) {
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
    trainAsync(tracks, trainOptions) {
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
    parseActivation(activation) {
        let maxInd = null;
        let maxVal = -1;
        activation.forEach((a, ind) => {
            if (!maxInd || a > maxVal) {
                maxInd = ind;
                maxVal = a;
            }
        });
        if (maxInd == 0) // note off
            return 0;
        else if (maxInd == 1) // no-op
            return null;
        else {
            maxInd -= 2;
            if (maxInd >= this.params.maxMove)
                maxInd++; // range-related stuff I won't get into; basically, 0 is not a move proper.
            return maxInd - this.params.maxMove + 1;
        }
    }
    /**
     * Makes a partial activation vector from an instruction.
     * @param instr Instruction to feed.
     * @see net
     * @see step
     */
    makeActivation(instr) {
        let emptyPart = new Array(this.params.maxMove * 2).fill(0);
        if (instr === null) // no-op
            return [0, 1].concat(emptyPart);
        else if (instr === 0) // note off
            return [1, 0].concat(emptyPart);
        else {
            if (Math.abs(instr) > this.params.maxMove)
                throw new Error(`Semiton offset too wide; expected number between -${this.params.maxMove} and ${this.params.maxMove}, but got ${instr}!`);
            if (instr > 0)
                instr--; // so that positives reside tightly in the 2nd half; 1 is 2 + this.params.maxMove
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
    appendMemory(instruction, _memoryCtx = this.memory) {
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
    penMove(offset, _memoryCtx = this.memory) {
        this.pen.move(offset);
        this.appendMemory(offset, _memoryCtx);
    }
    /**
     * Moves the pen 'up', aka. stops any note currently playing.
     * @see pen
     */
    penOff(_memoryCtx = this.memory) {
        this.pen.up();
        this.appendMemory(null, _memoryCtx);
    }
    /**
     * Keeps the pen in place. This is mostly a no-op, whose only
     * purpose is to update the loopback memory.
     */
    penStay(_memoryCtx = this.memory) {
        this.appendMemory(0, _memoryCtx);
    }
    /**
     * Adds a new TrackPlayer to this SenseTrack. This player
     * will process any note events as defined.
     * @param player The TrackPlayer to be added.
     * @see TrackPlayer
     */
    addPlayer(player) {
        this.players.add(player);
    }
    /**
     * Removes a TrackPlayer previously added to this
     * SenseTracker.
     * @param player The TrackPlayer to be removed.
     * @see TrackPlayer
     * @see addPlayer
     */
    removePlayer(player) {
        if (this.players.has(player))
            this.players.delete(player);
        else
            throw new Error("The given TrackPlayer is already not in this SenseTrack!");
    }
}
exports.SenseTrack = SenseTrack;
/**
 * Loads definitions to train a SenseTrack
 * object. Multiple definitions may be loaded.
 */
class DefinitionLoader {
    constructor() {
        this.tracks = [];
        this.genres = new Set();
        this.safeParams = {};
        this.userParams = {};
    }
    /**
     * Adds a definition input unit to this DefinitionLoader.
     * @param defs Definition input to add.
     */
    add(defs) {
        defs.genres.forEach((genre) => {
            this.genres.add(genre);
        });
        defs.tracks.forEach((t) => {
            let moveSize = Math.max.apply(Math, t.notes.filter((n) => !isNaN(+n)).map((n) => Math.abs(n)));
            if (t.random)
                this.safeParams.allowRandom = true;
            if (moveSize > this.safeParams.maxMove)
                this.safeParams.maxMove = moveSize;
            let tl = [];
            this.tracks.push(tl);
            let rel = 0;
            if (t.absolute)
                rel = t.notes[0];
            t.notes.forEach((n) => {
                tl.push({ instr: n - rel, genreStrength: t.genre, randomStrength: t.random || 0 });
                if (t.absolute)
                    rel = n;
            });
            tl.push(null);
        });
    }
    /**
     * Builds and retrieves the full SenseTrack parameter object from
     * this loader.
     * @see SenseTrack
     */
    getParams() {
        let params = Object.assign({}, this.userParams, this.safeParams, {
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
    configure(someParams) {
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
    build(trainOptions) {
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
    buildAsync(trainOptions) {
        let res = this.blankNet();
        return res.trainAsync(this.tracks, trainOptions).then((trainRes) => {
            return {
                training: trainRes,
                track: res
            };
        });
    }
}
exports.DefinitionLoader = DefinitionLoader;
