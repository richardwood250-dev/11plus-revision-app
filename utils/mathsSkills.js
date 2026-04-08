// utils/mathsSkills.js

export const MATHS_STRANDS = [
  { id: 'mental', title: 'Mental Maths', description: 'Bonds, times tables, rapid recall', color: '#3B82F6', icon: '🧠' },
  { id: 'arithmetic', title: 'Arithmetic', description: 'Addition, subtraction, multiplication', color: '#EF4444', icon: '➕' },
  { id: 'fractions', title: 'Fractions & Decimals', description: 'Equivalents, fractions of amounts', color: '#10B981', icon: '➗' },
  { id: 'time_money', title: 'Time & Money', description: 'Change, elapsed time', color: '#F59E0B', icon: '⏰' },
  { id: 'geometry', title: 'Geometry', description: 'Area, perimeter, angles', color: '#8B5CF6', icon: '📐' }
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getStrandBelts(strandId) {
    // Return custom descriptions for each belt based on the strand
    const descriptions = {
        'mental': [
            'Number bonds to 10 & 20',
            'Assisted times tables (up to 12x12)',
            'All times tables (up to 12x12)',
            'Challenging times tables (e.g. 24x3, 30x5)',
            'Adding multiples of 10',
            'Halving and doubling',
            'Mixed rapid recall'
        ],
        'arithmetic': [
            '2-digit addition (no carry)',
            '2-digit addition (with carry)',
            '3-digit subtraction',
            '2-digit x 1-digit multiplication',
            'Decimal addition & subtraction',
            'Short division',
            'Mixed arithmetic operations'
        ],
        'fractions': [
            'Halves and Quarters',
            'Fractions of amounts (simple)',
            'Equivalent fractions',
            'Adding fractions (same denominator)',
            'Decimals to fractions',
            'Percentages of amounts (10%, 50%)',
            'Mixed FDP'
        ],
        'time_money': [
            'Making £1',
            'Calculating change from £5',
            'Reading time (15 min intervals)',
            'Time durations (minutes)',
            'Money word problems',
            '24-hour clock conversions',
            'Mixed Time & Money'
        ],
        'geometry': [
            'Perimeter of rectangles',
            'Area of rectangles',
            'Missing angles on a straight line',
            'Angles in a triangle',
            'Area of compound shapes',
            'Volume of cubes/cuboids',
            'Mixed Geometry'
        ]
    };

    const strDesc = descriptions[strandId] || descriptions['mental'];
    
    return BELTS.map((belt, idx) => ({
        ...belt,
        description: strDesc[idx] || 'Skill training'
    }));
}

export function generateMathsSkillQuestion(strandId, beltId) {
    let questionText = '';
    let correctAnswer = '';
    let inputMode = 'keypad'; // Default to keypad input

    // Basic routing for generation
    let res;
    if (strandId === 'mental') {
        res = generateMental(beltId);
    } else if (strandId === 'arithmetic') {
        res = generateArithmetic(beltId);
    } else if (strandId === 'fractions') {
        res = generateFractions(beltId);
    } else if (strandId === 'time_money') {
        res = generateTimeMoney(beltId);
    } else if (strandId === 'geometry') {
        res = generateGeometry(beltId);
    } else {
        // Fallback for unimplemented strands
        const a = getRandomInt(1, 10);
        const b = getRandomInt(1, 10);
        res = { a: a+b, q: `${a} + ${b} = ?` };
    }
    
    questionText = res.q;
    correctAnswer = String(res.a);

    return {
        questionText,
        correctAnswer,
        inputMode,
        isAssisted: res?.isAssisted || false,
        geometryData: res?.geometryData,
        id: Math.random().toString(36).substr(2, 9)
    };
}

// ------ MENTAL MATHS STRAND ------
function generateMental(belt) {
    switch (belt) {
        case 'white': {
            const sum = getRandomInt(0, 1) === 0 ? 10 : 20;
            const a = getRandomInt(0, sum);
            return { a: sum - a, q: `${a} + ? = ${sum}` };
        }
        case 'yellow': {
            const a = getRandomInt(2, 12);
            const b = getRandomInt(2, 12);
            return { a: a * b, q: `${a} × ${b} = ?`, isAssisted: true };
        }
        case 'orange': {
            const a = getRandomInt(2, 12);
            const b = getRandomInt(2, 12);
            return { a: a * b, q: `${a} × ${b} = ?` };
        }
        case 'green': {
            // Challenging tables (e.g. 24*3, 30*5)
            const type = getRandomInt(0, 1);
            if (type === 0) {
                // Multiples of 10 (e.g. 30 * 5)
                const a = getRandomInt(2, 12) * 10;
                const b = getRandomInt(2, 9);
                return { a: a * b, q: `${a} × ${b} = ?` };
            } else {
                // Double a standard multiple (e.g. 24 * 3) -> a is between 13 and 24
                const a = getRandomInt(13, 24);
                const b = getRandomInt(2, 5);
                return { a: a * b, q: `${a} × ${b} = ?` };
            }
        }
        case 'blue': {
            const a = getRandomInt(1, 40) * 10;
            const b = getRandomInt(1, 40) * 10;
            return { a: a + b, q: `${a} + ${b} = ?` };
        }
        case 'brown': {
            const a = getRandomInt(5, 50) * 2;
            const isHalf = getRandomInt(0, 1) === 0;
            if (isHalf) return { a: a / 2, q: `Half of ${a} = ?` };
            return { a: a * 2, q: `Double ${a} = ?` };
        }
        case 'black': {
            const a = getRandomInt(2, 12);
            const b = getRandomInt(2, 12);
            const ans = a * b;
            return getRandomInt(0,1) === 0 ? { a: b, q: `${ans} ÷ ${a} = ?` } : { a: a, q: `? × ${b} = ${ans}` };
        }
        default: return { a: 1, q: `1 + 0 = ?` };
    }
}

// ------ ARITHMETIC STRAND ------
function generateArithmetic(belt) {
    switch (belt) {
        case 'white': {
            const a = getRandomInt(10, 40);
            const b = getRandomInt(10, 40);
            return { a: a + b, q: `${a}\n+ ${b}\n---` };
        }
        case 'yellow': {
            // Force carry
            const a1 = getRandomInt(1, 8) * 10;
            const a2 = getRandomInt(5, 9);
            const b1 = getRandomInt(1, 8) * 10;
            const b2 = getRandomInt(15 - a2, 9); // ensures carry
            const a = a1 + a2;
            const b = b1 + b2;
            return { a: a + b, q: `${a}\n+ ${b}\n---` };
        }
        case 'orange': {
            const a = getRandomInt(200, 999);
            const b = getRandomInt(10, a - 10);
            return { a: a - b, q: `${a}\n- ${b}\n---` };
        }
        case 'green': {
            const a = getRandomInt(12, 99);
            const b = getRandomInt(2, 9);
            return { a: a * b, q: `${a}\n×  ${b}\n---` };
        }
        case 'blue': {
            const isAdd = getRandomInt(0, 1) === 0;
            if (isAdd) {
                const a = (getRandomInt(10, 99) / 10).toFixed(1);
                const b = (getRandomInt(10, 99) / 10).toFixed(1);
                const MathAns = parseFloat(a) + parseFloat(b);
                const ans = (Math.round(MathAns * 10) / 10).toString();
                return { a: ans, q: `${a}\n+ ${b}\n---` };
            } else {
                const a = (getRandomInt(50, 150) / 10).toFixed(1);
                const b = (getRandomInt(10, 49) / 10).toFixed(1);
                const MathAns = parseFloat(a) - parseFloat(b);
                const ans = (Math.round(MathAns * 10) / 10).toString();
                return { a: ans, q: `${a}\n- ${b}\n---` };
            }
        }
        case 'brown': {
            const b = getRandomInt(2, 9);
            const a = b * getRandomInt(15, 111);
            return { a: a / b, q: `${a} ÷ ${b} = ?` };
        }
        case 'black': {
            const op = getRandomInt(0, 2);
            if (op===0) return generateArithmetic('yellow');
            if (op===1) return generateArithmetic('blue');
            return generateArithmetic('brown');
        }
        default: return { a: 1, q: `1 + 0 = ?` };
    }
}

// ------ FRACTIONS & DECIMALS STRAND ------
function generateFractions(belt) {
    switch (belt) {
        case 'white': {
            const a = getRandomInt(1, 12) * 2;
            const isQ = getRandomInt(0, 1) === 0;
            if (isQ && a % 4 === 0) return { a: a/4, q: `1/4 of ${a} = ?` };
            return { a: a/2, q: `Half of ${a} = ?` };
        }
        case 'yellow': {
            const denoms = [3, 4, 5, 10];
            const d = denoms[getRandomInt(0, 3)];
            const ans = getRandomInt(2, 9);
            return { a: ans, q: `1/${d} of ${d*ans} = ?` };
        }
        case 'orange': {
            const a = getRandomInt(1, 5);
            const b = getRandomInt(2, 6);
            if (a >= b) return { a: 4, q: `1/2 = ?/8` }; // fallback
            const mult = getRandomInt(2, 5);
            return { a: a*mult, q: `${a}/${b} = ?/${b*mult}` };
        }
        case 'green': {
            const d = getRandomInt(4, 10);
            const numSum = getRandomInt(2, d - 1);
            const a = getRandomInt(1, numSum - 1);
            const b = numSum - a;
            return { a: numSum, q: `${a}/${d} + ${b}/${d} = ?/${d}` };
        }
        case 'blue': {
            const decimals = [{d: "0.1", f: 1}, {d: "0.2", f: 2}, {d: "0.5", f: 5}, {d: "0.9", f: 9}];
            const pick = decimals[getRandomInt(0, 3)];
            return { a: pick.f, q: `${pick.d} = ?/10` };
        }
        case 'brown': {
            const amt = getRandomInt(2, 20) * 10;
            const is50 = getRandomInt(0, 1) === 0;
            return is50 ? { a: amt/2, q: `50% of ${amt} = ?` } : { a: amt/10, q: `10% of ${amt} = ?` };
        }
        case 'black': {
            const b = ['white', 'yellow', 'orange', 'green', 'blue', 'brown'];
            return generateFractions(b[getRandomInt(0, 5)]);
        }
        default: return { a: 1, q: `1/2 of 2 = ?` };
    }
}

// ------ TIME & MONEY STRAND ------
function formatMoney(pence) {
    if (pence >= 100) {
        if (pence % 100 === 0) {
            return `£${pence / 100}`;
        }
        return `£${(pence / 100).toFixed(2)}`;
    }
    return `${pence}p`;
}

function formatPoundsAnswer(pence) {
    if (pence % 100 === 0) {
        return String(pence / 100);
    }
    return (pence / 100).toFixed(2);
}

function generateTimeMoney(belt) {
    switch (belt) {
        case 'white': {
            const spent = getRandomInt(2, 9) * 10;
            return { a: 100 - spent, q: `${spent}p + ? = £1` };
        }
        case 'yellow': {
            const spent = getRandomInt(1, 4) * 100 + getRandomInt(0, 9) * 10;
            const changePence = 500 - spent;
            return { a: formatPoundsAnswer(changePence), q: `Cost: ${formatMoney(spent)}\nPaid: £5\nChange = £?` };
        }
        case 'orange': {
            const hrs = getRandomInt(1, 3);
            const mins = getRandomInt(1, 3) * 15;
            return { a: hrs * 60 + mins, q: `Mins in ${hrs}h ${mins}m = ?` };
        }
        case 'green': {
            const hr = getRandomInt(1, 10);
            const start = getRandomInt(0, 2) * 15; // 0, 15, 30
            const dur = getRandomInt(1, 3) * 15;
            let end = start + dur;
            let targetHr = hr;
            if (end >= 60) {
                end -= 60;
                targetHr += 1;
            }
            const s = start === 0 ? "00" : start;
            const e = end === 0 ? "00" : end;
            return { a: dur, q: `Mins from ${hr}:${s} to ${targetHr}:${e}?` };
        }
        case 'blue': {
            const q = getRandomInt(2, 5);
            const p = getRandomInt(12, 30);
            const totalPence = q * p;
            if (totalPence >= 100) {
                return { a: formatPoundsAnswer(totalPence), q: `Cost of ${q} items\nat ${p}p each:\nTotal = £?` };
            }
            return { a: totalPence, q: `Cost of ${q} items\nat ${p}p each:\nTotal = ?p` };
        }
        case 'brown': {
            const pmHr = getRandomInt(1, 11);
            return { a: pmHr, q: `${pmHr + 12}:00 = ? PM` };
        }
        case 'black': {
            const b = ['white', 'yellow', 'orange', 'green', 'blue', 'brown'];
            return generateTimeMoney(b[getRandomInt(0, 5)]);
        }
        default: return { a: 1, q: `1p = ?p` };
    }
}

// ------ GEOMETRY STRAND ------
function generateGeometry(belt) {
    const units = ['cm', 'm', 'mm'];
    const u = units[getRandomInt(0, 2)];
    switch (belt) {
        case 'white': {
            const w = getRandomInt(2, 10);
            const h = getRandomInt(2, 10);
            return { 
                a: (w+h)*2, 
                q: `What is the perimeter?`,
                geometryData: { type: 'rectangle', w, h, unit: u }
            };
        }
        case 'yellow': {
            const w = getRandomInt(2, 12);
            const h = getRandomInt(2, 12);
            return { 
                a: w*h, 
                q: `What is the area?`,
                geometryData: { type: 'rectangle', w, h, unit: u }
            };
        }
        case 'orange': {
            const angle = getRandomInt(40, 140);
            return { 
                a: 180 - angle, 
                q: `Find the missing angle (x).`,
                geometryData: { type: 'straight_line', a1: angle }
            };
        }
        case 'green': {
            const a1 = getRandomInt(40, 80);
            const a2 = getRandomInt(40, 80);
            return { 
                a: 180 - a1 - a2, 
                q: `Find the missing angle (x)`,
                geometryData: { type: 'triangle_angles', a1, a2 }
            };
        }
        case 'blue': {
            const side = getRandomInt(3, 12);
            return { 
                a: side*side, 
                q: `Find the area of the square.`,
                geometryData: { type: 'square', side, unit: u }
            };
        }
        case 'brown': {
            const w = getRandomInt(2, 5);
            const h = getRandomInt(2, 5);
            const d = getRandomInt(2, 5);
            return { 
                a: w*h*d, 
                q: `Find the volume of the cuboid.`,
                geometryData: { type: 'cuboid', w, h, d, unit: u }
            };
        }
        case 'black': {
            const b = ['white', 'yellow', 'orange', 'green', 'blue', 'brown'];
            return generateGeometry(b[getRandomInt(0, 5)]);
        }
        default: return { a: 1, q: `Area = ?` };
    }
}
