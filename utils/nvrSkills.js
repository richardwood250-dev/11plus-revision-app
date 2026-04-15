// utils/nvrSkills.js

export const NVR_STRANDS = [
  { id: 'similarities', title: 'Similarities', description: 'Find a matching pattern', color: '#8B5CF6', icon: '👯' },
  { id: 'odd_one_out', title: 'Odd One Out', description: 'Identify the difference', color: '#EF4444', icon: '🦄' },
  { id: 'series', title: 'Series', description: 'What comes next?', color: '#3B82F6', icon: '➡️' },
  { id: 'matrices', title: 'Matrices', description: 'Complete the grid', color: '#10B981', icon: '🔳' },
  { id: 'analogies', title: 'Analogies', description: 'A is to B, as C is to...', color: '#F59E0B', icon: '⚖️' }
];

export const BELTS = [
  { id: 'white', name: 'White Belt', color: '#E2E8F0', text: '#333' },
  { id: 'yellow', name: 'Yellow Belt', color: '#FCD34D', text: '#854D0E' },
  { id: 'orange', name: 'Orange Belt', color: '#F97316', text: '#FFF' },
  { id: 'green', name: 'Green Belt', color: '#22C55E', text: '#FFF' },
  { id: 'blue', name: 'Blue Belt', color: '#3B82F6', text: '#FFF' },
  { id: 'brown', name: 'Brown Belt', color: '#78350F', text: '#FFF' },
  { id: 'black', name: 'Black Belt', color: '#111827', text: '#FFF' },
];

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#111827'];
const SHAPES = ['circle', 'square', 'triangle', 'hexagon', 'star'];

const BELT_LEVELS = {
    white: 0, yellow: 0,
    orange: 1, green: 1,
    blue: 2, brown: 2,
    black: 3
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
    return arr[getRandomInt(0, arr.length - 1)];
}

function areShapesEqual(s1, s2) {
    if (!s1 || !s2) return s1 === s2;
    return s1.type === s2.type && 
           s1.color === s2.color && 
           s1.rotation === s2.rotation && 
           s1.fill === s2.fill &&
           s1.dashed === s2.dashed &&
           areShapesEqual(s1.inner, s2.inner);
}

// Helper to create a shape object with complexity
export function createShape(overrides = {}, level = 0) {
    let shape = {
        type: pickRandom(SHAPES),
        color: pickRandom(COLORS),
        size: 40,
        rotation: 0,
        fill: true,
        dashed: false,
        borderWidth: 2,
        ...overrides
    };

    if (level >= 1) {
        if (Math.random() > 0.5) shape.rotation = pickRandom([0, 45, 90, 180, 270]);
        if (Math.random() > 0.7) shape.fill = false;
    }
    if (level >= 2) {
        if (Math.random() > 0.6) shape.dashed = true;
        if (Math.random() > 0.5) {
            shape.inner = {
                type: pickRandom(SHAPES),
                color: pickRandom(COLORS.filter(c => c !== shape.color)), // Prevent invisible shapes
                fill: Math.random() > 0.5,
                rotation: 0
            };
        }
    }

    return shape;
}

export function getNVRStrandBelts(strandId) {
    const descriptions = {
        'similarities': ['Color matching', 'Shape matching', 'Positional logic', 'Nested property match', 'Pattern rules', 'Complex property sets', 'Visual logic master'],
        'odd_one_out': ['Obvious color diff', 'Simple shape diff', 'Rotation anomaly', 'Fill property diff', 'Nested shape diff', 'Multiple feature anomalies', 'Subtle property logic'],
        'series': ['90° Rotation steps', '45° Rotation steps', 'Color cycling', 'Size & Property steps', 'Positional movement', 'Dual property sequences', 'Complex logical series'],
        'matrices': ['Simple color map', 'Shape morph map', 'Rotation map', 'Fill property map', 'Nested horizontal logic', 'Combined transformations', 'Expert matrix patterns'],
        'analogies': ['Color mapping (A->B)', 'Shape morphing', 'Relative rotation', 'Inner shape mapping', 'Size & Position logic', 'Mirroring & Inversion', 'Complex attribute logic']
    };

    const strDesc = descriptions[strandId] || descriptions['similarities'];
    
    return BELTS.map((belt, idx) => ({
        ...belt,
        description: strDesc[idx] || 'Visual logic training'
    }));
}

export function generateNVRSkillQuestion(strandId, beltId) {
    const level = BELT_LEVELS[beltId] || 0;
    let res;
    if (strandId === 'similarities') res = genSimilarities(level);
    else if (strandId === 'odd_one_out') res = genOddOneOut(level);
    else if (strandId === 'matrices') res = genMatrices(level);
    else if (strandId === 'series') res = genSeries(level);
    else if (strandId === 'analogies') res = genAnalogies(level);
    else res = genOddOneOut(level);

    return {
        ...res,
        id: Math.random().toString(36).substr(2, 9),
        inputMode: 'choice',
    };
}

// --- GENERATORS ---

function genOddOneOut(level) {
    let options = [];
    const correctIdx = getRandomInt(0, 4);
    
    // Feature to vary the "Odd" one on
    const features = level === 0 ? ['color', 'type'] : 
                    level === 1 ? ['color', 'type', 'rotation', 'fill'] :
                    ['color', 'type', 'rotation', 'fill', 'dashed', 'inner'];
    
    const varFeature = pickRandom(features);

    // Common base
    const base = createShape({}, level);
    const commonValues = {
        color: base.color,
        type: base.type,
        rotation: base.rotation,
        fill: base.fill,
        dashed: base.dashed,
        innerType: base.inner?.type
    };

    // Noise feature to make them not look identical
    const noiseFeature = pickRandom(features.filter(f => f !== varFeature));

    // To ensure noise is actually noise and doesn't create a secondary pattern,
    // we try to give every shape a UNIQUE noise value.
    const noiseValues = {
        color: [...COLORS].sort(() => Math.random() - 0.5),
        type: [...SHAPES].sort(() => Math.random() - 0.5),
        rotation: [0, 45, 90, 180, 270].sort(() => Math.random() - 0.5),
        fill: [true, false, true, false, true].sort(() => Math.random() - 0.5)
    };

    for (let i = 0; i < 5; i++) {
        let shape;
        let attempts = 0;
        do {
            // 1. Start with an EXACT copy of the primary base
            shape = JSON.parse(JSON.stringify(base));
            
            // 2. Apply unique noise (to ensure they don't look identical)
            // We only vary ONE noise feature to keep the logic focused
            if (noiseFeature === 'color') shape.color = noiseValues.color[i];
            else if (noiseFeature === 'type') shape.type = noiseValues.type[i];
            else if (noiseFeature === 'rotation') shape.rotation = noiseValues.rotation[i];
            else if (noiseFeature === 'fill') shape.fill = noiseValues.fill[i];

            if (i !== correctIdx) {
                // 3. Force the logic (common values)
                if (varFeature === 'color') shape.color = commonValues.color;
                else if (varFeature === 'type') shape.type = commonValues.type;
                else if (varFeature === 'rotation') shape.rotation = commonValues.rotation;
                else if (varFeature === 'fill') shape.fill = commonValues.fill;
                else if (varFeature === 'dashed') shape.dashed = commonValues.dashed;
                else if (varFeature === 'inner') { 
                    if (!shape.inner) shape.inner = { type: 'circle', color: pickRandom(COLORS.filter(c => c !== shape.color)), fill: true };
                    shape.inner.type = commonValues.innerType || 'circle';
                }
            } else {
                // 4. Force the anomaly (odd value)
                if (varFeature === 'color') shape.color = pickRandom(COLORS.filter(c => c !== commonValues.color));
                else if (varFeature === 'type') shape.type = pickRandom(SHAPES.filter(s => s !== commonValues.type));
                else if (varFeature === 'rotation') shape.rotation = (commonValues.rotation + 45) % 360;
                else if (varFeature === 'fill') shape.fill = !commonValues.fill;
                else if (varFeature === 'dashed') shape.dashed = !commonValues.dashed;
                else if (varFeature === 'inner') {
                     if (base.inner) delete shape.inner;
                     else shape.inner = { type: 'star', color: pickRandom(COLORS.filter(c => c !== shape.color)), fill: true };
                }
            }

            // Safety visibility checks
            if (shape.inner && shape.inner.color === shape.color) {
                shape.inner.color = pickRandom(COLORS.filter(c => c !== shape.color));
            }
            if (varFeature === 'rotation' && (shape.type === 'circle' || shape.type === 'square')) {
                shape.type = pickRandom(['triangle', 'hexagon', 'star']);
            }

            attempts++;
        } while (options.some(o => areShapesEqual(o, shape)) && attempts < 15);
        options.push(shape);
    }

    const featureNames = { color: 'color', type: 'shape type', rotation: 'rotation', fill: 'fill (solid vs outline)', dashed: 'border style (solid vs dashed)', inner: 'inner shape' };

    return {
        questionText: "Which shape is the odd one out?",
        testShapes: [],
        options: options,
        correctAnswer: ['A', 'B', 'C', 'D', 'E'][correctIdx],
        logic: `Logic: Every shape shares the same ${featureNames[varFeature] || varFeature}, except the odd one out.`
    };
}

function genSimilarities(level) {
    const varFeature = level === 0 ? pickRandom(['type', 'color']) : pickRandom(['type', 'color', 'rotation', 'fill', 'inner']);
    
    // Choose the "winning" property value
    const base = createShape({}, level);
    if (varFeature === 'rotation' && (base.type === 'circle' || base.type === 'square')) {
        base.type = pickRandom(['triangle', 'hexagon', 'star']);
    }
    const winValue = varFeature === 'inner' ? (base.inner?.type || 'circle') : base[varFeature];

    const examples = [
        createShape({ [varFeature]: winValue, type: base.type }, level),
        createShape({ [varFeature]: winValue, type: base.type }, level)
    ];
    // Ensure examples are unique
    if (areShapesEqual(examples[0], examples[1])) examples[1].rotation = (examples[1].rotation + 90) % 360;

    let options = [];
    const correctIdx = getRandomInt(0, 4);

    const noiseFeature = pickRandom(level === 0 ? ['color'] : ['color', 'rotation', 'fill', 'inner'].filter(f => f !== varFeature));
    const noiseValues = {
        color: [...COLORS].sort(() => Math.random() - 0.5),
        rotation: [0, 45, 90, 180, 270].sort(() => Math.random() - 0.5),
        fill: [true, false, true, false, true].sort(() => Math.random() - 0.5),
        inner: SHAPES.sort(() => Math.random() - 0.5)
    };

    for (let i = 0; i < 5; i++) {
        let shape;
        let attempts = 0;
        do {
            shape = JSON.parse(JSON.stringify(base));

            if (i === correctIdx) {
                // Force the logic (winning value)
                if (varFeature === 'inner') {
                    if (!shape.inner) shape.inner = { type: winValue, color: pickRandom(COLORS.filter(c => c !== shape.color)), fill: true };
                    shape.inner.type = winValue;
                } else {
                    shape[varFeature] = winValue;
                }
            } else {
                // Force the distractor (bad value)
                let badValue = varFeature === 'color' ? pickRandom(COLORS.filter(c => c !== winValue)) :
                               varFeature === 'type' ? pickRandom(SHAPES.filter(s => s !== winValue)) :
                               varFeature === 'rotation' ? (winValue + 90) % 360 : 
                               !winValue;
                
                if (varFeature === 'inner') {
                    if (!shape.inner) shape.inner = { type: 'star', color: pickRandom(COLORS.filter(c => c !== shape.color)), fill: true };
                    shape.inner.type = pickRandom(SHAPES.filter(s => s !== winValue));
                } else {
                    shape[varFeature] = badValue;
                }
            }

            // Apply unique noise to prevent identical distractors
            if (noiseFeature === 'color') shape.color = noiseValues.color[i];
            else if (noiseFeature === 'rotation') shape.rotation = noiseValues.rotation[i];

            if (shape.inner && shape.inner.color === shape.color) {
                shape.inner.color = pickRandom(COLORS.filter(c => c !== shape.color));
            }
            attempts++;
        } while (options.some(o => areShapesEqual(o, shape)) && attempts < 15);
        options.push(shape);
    }

    const featureNames = { color: 'color', type: 'shape type', rotation: 'rotation', fill: 'fill', inner: 'inner shape' };

    return {
        questionText: "Find the shape most like the examples.",
        testShapes: examples,
        options: options,
        correctAnswer: ['A', 'B', 'C', 'D', 'E'][correctIdx],
        logic: `Logic: The examples and the correct answer all share the same ${featureNames[varFeature] || varFeature}.`
    };
}

function genSeries(level) {
    const varFeature = level === 0 ? 'rotation' : pickRandom(['rotation', 'color', 'size']);
    const base = createShape({}, level);
    
    let testShapes = [];
    let target;

    if (varFeature === 'rotation') {
        const step = level === 0 ? 90 : 45;
        // Avoid circles for rotation. Avoid squares if step is 90.
        if (base.type === 'circle' || (base.type === 'square' && step === 90)) {
            base.type = pickRandom(['triangle', 'hexagon', 'star']);
        }
        testShapes = [0, 1, 2].map(i => ({ ...base, rotation: (base.rotation + i * step) % 360 }));
        target = { ...base, rotation: (base.rotation + 3 * step) % 360 };
    } else if (varFeature === 'color') {
        const c1 = base.color;
        const c2 = pickRandom(COLORS.filter(c => c !== c1));
        testShapes = [
            { ...base, color: c1 },
            { ...base, color: c2 },
            { ...base, color: c1 }
        ];
        target = { ...base, color: c2 };
    } else {
        // Simple scale
        testShapes = [
            { ...base, size: 30 },
            { ...base, size: 45 },
            { ...base, size: 60 }
        ];
        target = { ...base, size: 75 };
    }

    let options = [];
    const correctIdx = getRandomInt(0, 4);
    const noiseColors = [...COLORS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 5; i++) {
        let shape;
        let attempts = 0;
        do {
            if (i === correctIdx) shape = JSON.parse(JSON.stringify(target));
            else {
                // Clone target but disrupt the logic property
                shape = JSON.parse(JSON.stringify(target));
                if (varFeature === 'rotation') shape.rotation = (shape.rotation + 90) % 360;
                else if (varFeature === 'color') shape.color = pickRandom(COLORS.filter(c => c !== target.color));
                else shape.size = target.size === 75 ? 60 : 75;
                
                // Add noise color uniquely to avoid 4-vs-1 collision
                if (varFeature !== 'color') shape.color = noiseColors[i];
            }
            attempts++;
        } while (options.some(o => areShapesEqual(o, shape)) && attempts < 15);
        options.push(shape);
    }

    const featureNames = { rotation: 'rotation', color: 'color', size: 'size' };

    return {
        questionText: "What comes next in the sequence?",
        testShapes: testShapes,
        options: options,
        correctAnswer: ['A', 'B', 'C', 'D', 'E'][correctIdx],
        logic: `Logic: The shapes are following a pattern based on ${featureNames[varFeature] || varFeature}.`
    };
}

function genMatrices(level) {
    // 2x2: A -> B as C -> D
    const varFeature = level === 0 ? 'color' : pickRandom(['color', 'type', 'rotation', 'fill']);
    const baseA = createShape({}, level);
    
    let baseB;
    if (varFeature === 'color') baseB = { ...baseA, color: pickRandom(COLORS.filter(c => c !== baseA.color)) };
    else if (varFeature === 'type') baseB = { ...baseA, type: pickRandom(SHAPES.filter(s => s !== baseA.type)) };
    else if (varFeature === 'rotation') {
        // Ensure rotation is visible
        if (baseA.type === 'circle' || baseA.type === 'square') baseA.type = pickRandom(['triangle', 'hexagon', 'star']);
        baseB = { ...baseA, rotation: (baseA.rotation + 90) % 360 };
    }
    else baseB = { ...baseA, fill: !baseA.fill };

    const baseC = createShape({}, level);
    // Ensure C is different from A
    if (areShapesEqual(baseC, baseA)) baseC.type = pickRandom(SHAPES.filter(s => s !== baseA.type));

    let baseD = { ...baseC };
    if (varFeature === 'color') baseD.color = baseB.color;
    else if (varFeature === 'type') baseD.type = baseB.type;
    else if (varFeature === 'rotation') baseD.rotation = (baseC.rotation + 90) % 360;
    else baseD.fill = baseB.fill;

    const testShapes = [baseA, baseB, baseC, null];

    let options = [];
    const correctIdx = getRandomInt(0, 4);
    const noiseColors = [...COLORS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 5; i++) {
        let shape;
        let attempts = 0;
        do {
            if (i === correctIdx) shape = JSON.parse(JSON.stringify(baseD));
            else {
                // Clone target but disrupt the logic property
                shape = JSON.parse(JSON.stringify(baseD));
                if (varFeature === 'type') shape.type = pickRandom(SHAPES.filter(s => s !== baseD.type));
                else if (varFeature === 'rotation') shape.rotation = (baseD.rotation + 90) % 360;
                else if (varFeature === 'color') shape.color = pickRandom(COLORS.filter(c => c !== baseD.color));
                else shape.fill = !baseD.fill;

                // Add unique noise to ensure unique looks
                if (varFeature !== 'color') shape.color = noiseColors[i];
            }
            attempts++;
        } while (options.some(o => areShapesEqual(o, shape)) && attempts < 15);
        options.push(shape);
    }

    const featureNames = { color: 'color', type: 'shape type', rotation: 'rotation', fill: 'fill' };

    return {
        questionText: "Complete the matrix.",
        testShapes: testShapes,
        isMatrix: true,
        options: options,
        correctAnswer: ['A', 'B', 'C', 'D', 'E'][correctIdx],
        logic: `Logic: The grid follows a consistent ${featureNames[varFeature] || varFeature} transformation across rows and columns.`
    };
}

function genAnalogies(level) {
    const varFeature = level === 0 ? 'color' : pickRandom(['color', 'type', 'rotation', 'fill', 'inner']);
    const baseA = createShape({}, level);
    
    let baseB;
    if (varFeature === 'color') baseB = { ...baseA, color: pickRandom(COLORS.filter(c => c !== baseA.color)) };
    else if (varFeature === 'type') baseB = { ...baseA, type: pickRandom(SHAPES.filter(s => s !== baseA.type)) };
    else if (varFeature === 'rotation') {
        // Ensure rotation is visible
        if (baseA.type === 'circle' || baseA.type === 'square') baseA.type = pickRandom(['triangle', 'hexagon', 'star']);
        baseB = { ...baseA, rotation: (baseA.rotation + 90) % 360 };
    }
    else if (varFeature === 'fill') baseB = { ...baseA, fill: !baseA.fill };
    else {
        baseB = { ...baseA };
        if (!baseB.inner) baseB.inner = { type: 'circle', color: '#000', fill: true };
        else baseB.inner.type = pickRandom(SHAPES.filter(s => s !== baseB.inner.type));
    }

    const baseC = createShape({}, level);
    if (areShapesEqual(baseC, baseA)) baseC.type = pickRandom(SHAPES.filter(s => s !== baseA.type));

    let baseD = { ...baseC };
    if (varFeature === 'color') baseD.color = baseB.color;
    else if (varFeature === 'type') baseD.type = baseB.type;
    else if (varFeature === 'rotation') baseD.rotation = (baseC.rotation + 90) % 360;
    else if (varFeature === 'fill') baseD.fill = baseB.fill;
    else {
        if (!baseD.inner) baseD.inner = { type: 'circle', color: '#000', fill: true };
        else baseD.inner.type = baseB.inner.type;
    }

    let options = [];
    const correctIdx = getRandomInt(0, 4);
    const noiseColors = [...COLORS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 5; i++) {
        let shape;
        let attempts = 0;
        do {
            if (i === correctIdx) shape = JSON.parse(JSON.stringify(baseD));
            else {
                shape = JSON.parse(JSON.stringify(baseD));
                if (varFeature === 'type') shape.type = pickRandom(SHAPES.filter(s => s !== baseD.type));
                else if (varFeature === 'rotation') shape.rotation = (baseD.rotation + 90) % 360;
                else if (varFeature === 'color') shape.color = pickRandom(COLORS.filter(c => c !== baseD.color));
                else if (varFeature === 'inner') {
                    if (shape.inner) shape.inner.type = pickRandom(SHAPES.filter(s => s !== baseD.inner?.type));
                }
                else shape.fill = !baseD.fill;

                if (varFeature !== 'color') shape.color = noiseColors[i];
            }
            attempts++;
        } while (options.some(o => areShapesEqual(o, shape)) && attempts < 15);
        options.push(shape);
    }

    const featureNames = { color: 'color', type: 'shape type', rotation: 'rotation', fill: 'fill', inner: 'inner shape' };

    return {
        questionText: "A is to B, as C is to...?",
        testShapes: [baseA, baseB, baseC],
        isAnalogy: true,
        options: options,
        correctAnswer: ['A', 'B', 'C', 'D', 'E'][correctIdx],
        logic: `Logic: The transformation between A and B (a change in ${featureNames[varFeature] || varFeature}) must be applied to C.`
    };
}
