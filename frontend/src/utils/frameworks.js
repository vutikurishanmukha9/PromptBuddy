export const frameworkCategories = {
    essentials: {
        key: 'essentials',
        label: 'Essentials',
        types: [
            { value: 'rtf', label: 'RTF', desc: 'Role, Task, Format' },
            { value: 'race', label: 'RACE', desc: 'Role, Action, Context, Expectation' },
            { value: 'ape', label: 'APE', desc: 'Action, Purpose, Expectation' },
            { value: 'tag', label: 'TAG', desc: 'Task, Audience, Goal' },
            { value: 'era', label: 'ERA', desc: 'Expectation, Role, Action' },
        ],
    },
    structured: {
        key: 'structured',
        label: 'Structured',
        types: [
            { value: 'risen', label: 'RISEN', desc: 'Role, Instructions, Steps, End Goal, Narrowing' },
            { value: 'coast', label: 'COAST', desc: 'Context, Objective, Action, Scenario, Task' },
            { value: 'trace', label: 'TRACE', desc: 'Task, Role, Action, Context, Example' },
            { value: 'crispe', label: 'CRISPE', desc: 'Capacity, Role, Insight, Statement, Personality, Experiment' },
            { value: 'clear', label: 'CLEAR', desc: 'Context, Limits, Expectations, Action, Results' },
        ],
    },
    persuasion: {
        key: 'persuasion',
        label: 'Persuasion',
        types: [
            { value: 'pastor', label: 'PASTOR', desc: 'Problem, Amplify, Story, Transformation, Offer, Response' },
            { value: 'bab', label: 'BAB', desc: 'Before, After, Bridge' },
            { value: 'aida', label: 'AIDA', desc: 'Attention, Interest, Desire, Action' },
            { value: 'peel', label: 'PEEL', desc: 'Point, Evidence, Explain, Link' },
        ],
    },
    problem_solving: {
        key: 'problem_solving',
        label: 'Problem-Solving',
        types: [
            { value: 'scqa', label: 'SCQA', desc: 'Situation, Complication, Question, Answer' },
            { value: 'grow', label: 'GROW', desc: 'Goal, Reality, Options, Will' },
            { value: 'star', label: 'STAR', desc: 'Situation, Task, Action, Result' },
            { value: 'par', label: 'PAR', desc: 'Problem, Action, Result' },
            { value: 'care', label: 'CARE', desc: 'Context, Action, Result, Example' },
        ],
    },
    analysis: {
        key: 'analysis',
        label: 'Analysis',
        types: [
            { value: 'smart', label: 'SMART', desc: 'Specific, Measurable, Achievable, Relevant, Time-bound' },
            { value: 'ice', label: 'ICE', desc: 'Idea, Context, Execution' },
            { value: '5w1h', label: '5W1H', desc: 'Who, What, When, Where, Why, How' },
        ],
    },
};

export const frameworkOptions = Object.values(frameworkCategories).flatMap(category => category.types);

export const getFrameworkLabel = (type) => {
    return frameworkOptions.find(option => option.value === type)?.label || type;
};

export const getFrameworkDescription = (type) => {
    return frameworkOptions.find(option => option.value === type)?.desc || '';
};

export const getFrameworkCategory = (type) => {
    return Object.values(frameworkCategories).find(category =>
        category.types.some(option => option.value === type)
    )?.key || 'essentials';
};
