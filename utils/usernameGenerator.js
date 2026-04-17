export const ADJECTIVES = [
    'Brave', 'Speedy', 'Clever', 'Happy', 'Mighty', 'Cool', 'Calm', 'Bright', 'Sharp', 'Bold',
    'Swift', 'Fierce', 'Strong', 'Wise', 'Quick', 'Agile', 'Loyal', 'Great', 'Super', 'Hyper',
    'Golden', 'Silver', 'Magic', 'Cosmic', 'Wild', 'Steady', 'Ready', 'Kind', 'Funny', 'Smart'
];

export const NOUNS = [
    'Ninja', 'Panda', 'Tiger', 'Lion', 'Dragon', 'Eagle', 'Shark', 'Wolf', 'Fox', 'Owl',
    'Rex', 'Hawk', 'Bear', 'Falcon', 'Cheetah', 'Leopard', 'Panther', 'Cobra', 'Python', 'Rhino',
    'Robot', 'Pilot', 'Knight', 'Scout', 'Hero', 'Wizard', 'Ghost', 'Shadow', 'Storm', 'Bolt'
];

export const generateUsername = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const number = Math.floor(Math.random() * 90) + 10; // 10-99
    return `${adj}${noun}${number}`;
};
