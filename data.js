/*
   CLARITY, data
   Vocabulary tables, phrase rules, samples,
   profile presets, explanation strategies.
*/
window.Clarity = window.Clarity || {};

Clarity.data = (function () {

  /*  plain-word swaps
     base form → { p: plain word, d: definition, g: grade it becomes safe at }
     `g` = the lowest reading level that keeps the ORIGINAL word.
     Below that grade we swap it and add it to the glossary.        */
  const WORDS = {
    // process / instruction verbs, the ones that stop kids on worksheets
    analyze:      { p:'look closely at',   d:'To break something into parts and study each part.' },
    calculate:    { p:'work out',          d:'To find an answer using math.' },
    compare:      { p:'look at how they are the same', d:'To find what two things share.' },
    contrast:     { p:'look at how they are different', d:'To find how two things differ.' },
    construct:    { p:'build',             d:'To put something together.' },
    demonstrate:  { p:'show',              d:'To show how something works.' },
    describe:     { p:'tell about',        d:'To use words to say what something is like.' },
    determine:    { p:'figure out',        d:'To find out for sure.' },
    evaluate:     { p:'judge',             d:'To decide how good or useful something is.' },
    examine:      { p:'look at closely',   d:'To study something carefully.' },
    identify:     { p:'name',              d:'To say which one it is.' },
    illustrate:   { p:'show with a picture', d:'To explain by drawing or giving an example.' },
    indicate:     { p:'show',              d:'To point something out.' },
    interpret:    { p:'explain the meaning of', d:'To say what something means.' },
    justify:      { p:'give reasons for',  d:'To explain why you think you are right.' },
    predict:      { p:'guess what happens next', d:'To say what you think will happen.' },
    summarize:    { p:'tell the main idea', d:'To say the important parts in a few words.' },
    utilize:      { p:'use',               d:'To use something.' },
    obtain:       { p:'get',               d:'To get something.' },
    require:      { p:'need',              d:'To need something.' },
    provide:      { p:'give',              d:'To give something.' },
    observe:      { p:'watch',             d:'To watch carefully.' },
    complete:     { p:'finish',            d:'To finish something.' },
    select:       { p:'pick',              d:'To choose one.' },
    eliminate:    { p:'take out',          d:'To get rid of something.' },
    estimate:     { p:'make a smart guess', d:'To guess a number that is close.' },
    verify:       { p:'check',             d:'To make sure something is true.' },
    modify:       { p:'change',            d:'To change something a little.' },
    generate:     { p:'make',              d:'To make or create something.' },
    represent:    { p:'stand for',         d:'To be a sign for something else.' },
    classify:     { p:'sort into groups',  d:'To put things into groups that match.' },
    arrange:      { p:'put in order',      d:'To put things in an order.' },
    apply:        { p:'use',               d:'To use a rule or idea on something.' },
    respond:      { p:'answer',            d:'To answer.' },
    submit:       { p:'turn in',           d:'To hand your work to someone.' },
    revise:       { p:'fix and improve',   d:'To change your work to make it better.' },
    consider:     { p:'think about',       d:'To think carefully about something.' },
    conclude:     { p:'decide at the end', d:'To decide something after thinking.' },
    assume:       { p:'take as true',      d:'To believe something without proof.' },
    assess:       { p:'check how well',    d:'To judge or measure something.' },
    label:        { p:'write the name on', d:'To write what each part is called.' },
    define:       { p:'say what it means', d:'To give the meaning of a word.' },

    // academic nouns
    hypothesis:   { p:'smart guess',       d:'A guess you can test with an experiment.' },
    procedure:    { p:'steps',             d:'The order of things you do.' },
    conclusion:   { p:'what you decided',  d:'What you figured out at the end.' },
    observation:  { p:'what you saw',      d:'Something you noticed by watching.' },
    variable:     { p:'the thing that changes', d:'A part of an experiment that can change.' },
    // "solution" is deliberately absent: in a science passage it means a liquid
    // mixture, not an answer, and swapping it destroys the meaning.
    quantity:     { p:'amount',            d:'An amount of something.' },
    equation:     { p:'math sentence',     d:'A math sentence with an equals sign.' },
    remainder:    { p:'what is left over', d:'The part left after you divide.' },
    numerator:    { p:'top number',        d:'The number on top of a fraction.' },
    denominator:  { p:'bottom number',     d:'The number on the bottom of a fraction.' },
    perimeter:    { p:'distance around',   d:'The total length around the outside of a shape.' },
    evidence:     { p:'proof',             d:'Facts that show something is true.' },
    consequence:  { p:'what happens because of it', d:'The result of something.' },
    significance: { p:'why it matters',    d:'How important something is.' },
    characteristic:{ p:'trait',            d:'Something that describes what a thing is like.' },
    component:    { p:'part',              d:'One piece of a bigger thing.' },
    factor:       { p:'thing that matters', d:'One thing that affects a result.' },
    method:       { p:'way',               d:'A way of doing something.' },
    purpose:      { p:'reason',            d:'The reason something is done.' },
    portion:      { p:'part',              d:'A piece of the whole.' },
    majority:     { p:'most',              d:'More than half.' },
    sequence:     { p:'order',             d:'The order things happen in.' },
    principle:    { p:'main rule',         d:'A basic rule or idea.' },
    strategy:     { p:'plan',              d:'A plan for how to do something.' },
    resource:     { p:'thing you can use', d:'Something helpful you can use.' },
    territory:    { p:'land',              d:'An area of land.' },
    legislation:  { p:'laws',              d:'Laws made by a government.' },
    democracy:    { p:'rule by the people', d:'A government where people vote.' },
    economy:      { p:'money system',      d:'How a country makes and uses money.' },
    civilization: { p:'group of people living together', d:'A large, organized society.' },
    migration:    { p:'moving to a new place', d:'When people or animals move somewhere new.' },
    revolution:   { p:'big change',        d:'A big, fast change, often against a government.' },

    // connectors & modifiers
    approximately:{ p:'about',             d:'Close to, but not exact.' },
    subsequently: { p:'after that',        d:'Later, after something else.' },
    previously:   { p:'before',            d:'Earlier.' },
    furthermore:  { p:'also',              d:'In addition.' },
    however:      { p:'but',               d:'Shows the next idea is different.' },
    therefore:    { p:'so',                d:'Shows a result.' },
    nevertheless: { p:'even so',           d:'Even though that is true.' },
    additionally: { p:'also',              d:'In addition.' },
    consequently: { p:'so',                d:'As a result.' },
    initially:    { p:'at first',          d:'In the beginning.' },
    ultimately:   { p:'in the end',        d:'Finally.' },
    primarily:    { p:'mostly',            d:'Mainly.' },
    frequently:   { p:'often',             d:'Many times.' },
    occasionally: { p:'sometimes',         d:'Once in a while.' },
    typically:    { p:'usually',           d:'Most of the time.' },
    essentially:  { p:'basically',         d:'At its core.' },
    numerous:     { p:'many',              d:'A lot of.' },
    sufficient:   { p:'enough',            d:'As much as you need.' },
    additional:   { p:'more',              d:'Extra.' },
    initial:      { p:'first',             d:'The first one.' },
    accurate:     { p:'correct',           d:'Right, with no mistakes.' },
    appropriate:  { p:'right',             d:'Correct for the situation.' },
    significant:  { p:'important',         d:'Big enough to matter.' },
    complex:      { p:'complicated',       d:'Made of many parts, not simple.' },
    numerousness: { p:'amount',            d:'How many there are.' },
    prior:        { p:'earlier',           d:'Before.' },
    various:      { p:'different',         d:'Several different kinds.' },
    similar:      { p:'alike',             d:'Almost the same.' },
    beneficial:   { p:'helpful',           d:'Good for you.' },
    essential:    { p:'needed',            d:'Very important. You must have it.' },
    fundamental:  { p:'basic',             d:'The most basic and important part.' },
    optimal:      { p:'best',              d:'The very best choice.' },
    adequate:     { p:'good enough',       d:'Enough, but not extra.' },
    apparent:     { p:'clear',             d:'Easy to see or understand.' },
    diverse:      { p:'many different',    d:'Made of many different kinds.' },
    entire:       { p:'whole',             d:'All of it.' },
    immense:      { p:'huge',              d:'Very, very big.' },
    minimal:      { p:'very small',        d:'The smallest amount.' },
    numeral:      { p:'number',            d:'A symbol for a number.' },
    rapid:        { p:'fast',              d:'Quick.' },
    reluctant:    { p:'not wanting to',    d:'Not eager, holding back.' },
    abundant:     { p:'plenty of',         d:'More than enough.' },
    vital:        { p:'very important',    d:'Needed to survive or succeed.' }
  };

  /* phrase-level swaps (run before word swaps) */
  const PHRASES = [
    [/\bin order to\b/gi,                 'to'],
    [/\bdue to the fact that\b/gi,        'because'],
    [/\bfor the reason that\b/gi,         'because'],
    [/\bin the event that\b/gi,           'if'],
    [/\bat this point in time\b/gi,       'now'],
    [/\bat the present time\b/gi,         'now'],
    [/\bin the near future\b/gi,          'soon'],
    [/\ba large number of\b/gi,           'many'],
    [/\ba great deal of\b/gi,             'a lot of'],
    [/\bthe majority of\b/gi,             'most of'],
    [/\bis able to\b/gi,                  'can'],
    [/\bare able to\b/gi,                 'can'],
    [/\bhas the ability to\b/gi,          'can'],
    [/\bit is important to note that\b/gi,''],
    [/\bit should be noted that\b/gi,     ''],
    [/\bin conclusion,?\s*/gi,            'So, '],
    [/\bwith regard to\b/gi,              'about'],
    [/\bin regard to\b/gi,                'about'],
    [/\bwith the exception of\b/gi,       'except'],
    [/\bin spite of the fact that\b/gi,   'even though'],
    [/\bprior to\b/gi,                    'before'],
    [/\bsubsequent to\b/gi,               'after'],
    [/\bin addition to\b/gi,              'along with'],
    [/\bas a result of\b/gi,              'because of'],
    [/\bmake a decision\b/gi,             'decide'],
    [/\bcome to a conclusion\b/gi,        'decide'],
    [/\bconduct an investigation\b/gi,    'investigate'],
    [/\btake into consideration\b/gi,     'think about'],
    [/\bon a daily basis\b/gi,            'every day'],
    [/\bin the absence of\b/gi,           'without'],
    [/\bis reflective of\b/gi,            'shows'],
    [/\bserves to\b/gi,                   'helps'],
    [/\butilizing\b/gi,                   'using'],
    [/\bnot unlike\b/gi,                  'like']
  ];

  /* imperative verbs → sentence is an instruction */
  const IMPERATIVES = new Set(('write draw read solve find list name label circle underline color cut ' +
    'paste match choose pick check show explain describe compare contrast calculate measure count add ' +
    'subtract multiply divide graph plot record answer complete fill copy repeat begin start stop use ' +
    'put place take give look observe watch predict identify determine estimate arrange sort group ' +
    'build make create design test try review revise submit turn hand bring get open close click tap ' +
    'select highlight mark cross number order shade fold trace glue draw state summarize define ' +
    // lab, procedure and how-to verbs, the ones that pack two actions per sentence
    'ensure allow dispose rinse pour heat cool mix wait remove wear tie attach connect press drag ' +
    'type enter save print continue avoid keep hold wash dry weigh stir shake cover wrap flip ' +
    'insert push pull lift lower drop raise slide rotate spin swap replace return set reset ' +
    'wipe clean dip soak drain pour scoop spread apply spray tap tighten loosen unscrew screw ' +
    // academic instruction verbs (also in the word list, but they are commands too)
    'obtain determine identify utilize indicate provide examine classify demonstrate illustrate ' +
    'construct evaluate analyze interpret justify verify modify generate represent assemble ' +
    'sketch calculate locate rewrite rearrange assess conclude explain express').split(' '));

  /* sentence starters that mark a NEW step */
  const SEQUENCE = /^(first|second|third|fourth|fifth|next|then|after that|afterwards?|finally|lastly|last|now|begin by|start by|to begin|once you|when you('re| are) done)\b/i;

  /* abbreviations that must not end a sentence */
  const ABBREV = new Set(['mr','mrs','ms','dr','prof','sr','jr','st','mt','vs','etc','eg','ie','ca',
    'fig','no','vol','ch','p','pp','approx','est','dept','univ','inc','ltd','jan','feb','mar','apr',
    'jun','jul','aug','sep','sept','oct','nov','dec','mon','tue','wed','thu','fri','sat','sun','al']);

  /* profile presets */
  const PRESETS = [
    {
      id: 'p_steps', emoji: '📖', name: 'Easy read', icon: 'book', color: '#8A7BEC',
      desc: 'Clear numbered steps, comfortable spacing, and hard words explained.',
      level: 5, mode: 'steps', font: 'lexend', size: 20, lineHeight: 1.95,
      letterSpacing: 0.04, wordSpacing: 0.16, tint: 'cream', rate: 0.85, glossary: true, language: 'en'
    }
  ];

  const TINTS = {
    none:  { name:'Soft',  light:'#FCFAF5', dark:'#152423', swatch:'#FCFAF5' },
    cream: { name:'Cream', light:'#FDF6E4', dark:'#241F14', swatch:'#FDF6E4' },
    peach: { name:'Peach', light:'#FDEDE4', dark:'#2A1D16', swatch:'#FDEDE4' },
    mint:  { name:'Mint',  light:'#E6F5EF', dark:'#12261F', swatch:'#E6F5EF' },
    sky:   { name:'Sky',   light:'#E8F1FB', dark:'#141F2B', swatch:'#E8F1FB' },
    grey:  { name:'Grey',  light:'#F0EFEC', dark:'#1E1E1E', swatch:'#F0EFEC' }
  };

  const FONTS = {
    lexend:   { name:'Lexend',   stack:"'Lexend', system-ui, sans-serif" },
    atkinson: { name:'Atkinson', stack:"'Atkinson Hyperlegible', system-ui, sans-serif" },
    system:   { name:'System',   stack:"-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" },
    serif:    { name:'Serif',    stack:"Georgia, 'Times New Roman', serif" },
    mono:     { name:'Mono',     stack:"ui-monospace, SFMono-Regular, Menlo, monospace" }
  };

  const EMOJIS = ['🪜','👁️','🌏','🎯','📖','🧠','🚀','🌱','⭐','🦉','🐢','🎨','🔭','🧩','☀️','🌊'];

  /*  profile icons
     Clean line icons (SVG inner markup) shown in a coloured badge instead of
     emoji. `emojiMap` lets an old emoji-based profile upgrade to a matching icon. */
  // Profile avatar icons from Lucide (lucide.dev), ISC licensed.
  const PROFILE_ICONS = {
    steps:     '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
    eye:       '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    globe:     '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    target:    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    book:      '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    brain:     '<path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>',
    rocket:    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    sprout:    '<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/>',
    star:      '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    owl:       '<path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/>',
    turtle:    '<path d="m12 10 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4h4Z"/><path d="M4.82 7.9 8 10"/><path d="M15.18 7.9 12 10"/><path d="M16.93 10H20a2 2 0 0 1 0 4H2"/>',
    palette:   '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
    scope:     '<path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/>',
    puzzle:    '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
    sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    bolt:      '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    heart:     '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
    user:      '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };

  const ICON_LIST = Object.keys(PROFILE_ICONS);

  /* colours a profile badge can use */
  const PROFILE_COLORS = ['#E2643C','#1F8C7D','#3D6EE0','#8A5AD6','#D9A21B','#C0497B','#2E9E5B','#4E8CC4'];

  const EMOJI_TO_ICON = { '🪜':'steps','👁️':'eye','🌏':'globe','🎯':'target','📖':'book','🧠':'brain','🚀':'rocket','🌱':'sprout','⭐':'star','🦉':'owl','🐢':'turtle','🎨':'palette','🔭':'scope','🧩':'puzzle','☀️':'sun','🌊':'bolt' };

  /*  home languages
     `es` has a built-in word list, so a Spanish-speaking student sees plain
     Spanish translations of hard words with no internet at all, the most
     common ELL language in US schools.                                     */
  const LANGUAGES = {
    en: { name: 'English',    native: 'English',    flag: '🇺🇸', builtin: true },
    es: { name: 'Spanish',    native: 'Español',    flag: '🇪🇸', builtin: true },
    zh: { name: 'Chinese',    native: '中文',        flag: '🇨🇳', builtin: false },
    vi: { name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', builtin: false },
    ar: { name: 'Arabic',     native: 'العربية',    flag: '🇸🇦', builtin: false },
    fr: { name: 'French',     native: 'Français',   flag: '🇫🇷', builtin: false },
    tl: { name: 'Tagalog',    native: 'Tagalog',    flag: '🇵🇭', builtin: false },
    pt: { name: 'Portuguese', native: 'Português',  flag: '🇧🇷', builtin: false }
  };

  /* Built-in Spanish for the academic words that trip up ELL students on a
     worksheet. Keyed by the same base form as WORDS. { w: word, d: gloss }. */
  const ES = {
    analyze:{w:'analizar',d:'estudiar algo parte por parte'},
    calculate:{w:'calcular',d:'encontrar una respuesta usando matemáticas'},
    compare:{w:'comparar',d:'ver en qué se parecen dos cosas'},
    contrast:{w:'contrastar',d:'ver en qué se diferencian dos cosas'},
    describe:{w:'describir',d:'decir cómo es algo'},
    determine:{w:'determinar',d:'averiguar con seguridad'},
    evaluate:{w:'evaluar',d:'decidir qué tan bueno es algo'},
    examine:{w:'examinar',d:'mirar algo con cuidado'},
    identify:{w:'identificar',d:'decir cuál es'},
    illustrate:{w:'ilustrar',d:'explicar con un dibujo o ejemplo'},
    interpret:{w:'interpretar',d:'decir qué significa algo'},
    justify:{w:'justificar',d:'dar razones de por qué'},
    predict:{w:'predecir',d:'decir qué crees que pasará'},
    summarize:{w:'resumir',d:'decir lo importante en pocas palabras'},
    demonstrate:{w:'demostrar',d:'mostrar cómo funciona algo'},
    observe:{w:'observar',d:'mirar con atención'},
    obtain:{w:'obtener',d:'conseguir algo'},
    require:{w:'requerir',d:'necesitar algo'},
    provide:{w:'proporcionar',d:'dar algo'},
    complete:{w:'completar',d:'terminar algo'},
    select:{w:'seleccionar',d:'escoger uno'},
    estimate:{w:'estimar',d:'hacer una buena suposición de un número'},
    classify:{w:'clasificar',d:'poner cosas en grupos que combinan'},
    arrange:{w:'ordenar',d:'poner cosas en un orden'},
    apply:{w:'aplicar',d:'usar una regla o idea'},
    define:{w:'definir',d:'dar el significado de una palabra'},
    label:{w:'etiquetar',d:'escribir el nombre de cada parte'},
    hypothesis:{w:'hipótesis',d:'una suposición que puedes probar'},
    procedure:{w:'procedimiento',d:'el orden de los pasos'},
    conclusion:{w:'conclusión',d:'lo que decidiste al final'},
    observation:{w:'observación',d:'algo que notaste al mirar'},
    variable:{w:'variable',d:'la parte de un experimento que puede cambiar'},
    quantity:{w:'cantidad',d:'una cantidad de algo'},
    equation:{w:'ecuación',d:'una oración matemática con signo de igual'},
    remainder:{w:'residuo',d:'lo que queda después de dividir'},
    numerator:{w:'numerador',d:'el número de arriba de una fracción'},
    denominator:{w:'denominador',d:'el número de abajo de una fracción'},
    perimeter:{w:'perímetro',d:'la distancia alrededor de una figura'},
    evidence:{w:'evidencia',d:'hechos que muestran que algo es verdad'},
    consequence:{w:'consecuencia',d:'lo que pasa a causa de algo'},
    significance:{w:'importancia',d:'por qué algo importa'},
    component:{w:'componente',d:'una parte de algo más grande'},
    method:{w:'método',d:'una manera de hacer algo'},
    purpose:{w:'propósito',d:'la razón por la que se hace algo'},
    sequence:{w:'secuencia',d:'el orden en que pasan las cosas'},
    strategy:{w:'estrategia',d:'un plan para hacer algo'},
    approximately:{w:'aproximadamente',d:'cerca, pero no exacto'},
    however:{w:'sin embargo',d:'muestra que la siguiente idea es diferente'},
    therefore:{w:'por lo tanto',d:'muestra un resultado'},
    significant:{w:'significativo',d:'lo bastante grande para importar'},
    complex:{w:'complejo',d:'hecho de muchas partes, no simple'},
    various:{w:'varios',d:'de varios tipos diferentes'},
    essential:{w:'esencial',d:'muy importante, necesario'},
    fundamental:{w:'fundamental',d:'la parte más básica e importante'},
    numerous:{w:'numerosos',d:'muchos'},
    sufficient:{w:'suficiente',d:'lo que necesitas'},
    accurate:{w:'preciso',d:'correcto, sin errores'},
    appropriate:{w:'apropiado',d:'correcto para la situación'},
    initial:{w:'inicial',d:'el primero'},
    migration:{w:'migración',d:'cuando personas o animales se mudan a un lugar nuevo'},
    democracy:{w:'democracia',d:'un gobierno donde la gente vota'},
    revolution:{w:'revolución',d:'un cambio grande y rápido'},
    economy:{w:'economía',d:'cómo un país hace y usa el dinero'}
  };

  const TRANSLATIONS = { es: ES };

  /* explanation strategies */
  const STRATEGIES = [
    { id:'analogy', icon:'link', emoji:'🔗', name:'Like something else',
      desc:'Compare it to something you already know',
      prompt:'Explain it with a concrete everyday analogy, something a student already knows from daily life. Name the analogy up front, then map each part of it back to the material, part by part.' },

    { id:'steps', icon:'stairs', emoji:'🪜', name:'Break it down',
      desc:'One tiny step at a time',
      prompt:'Break it into the smallest possible sequential steps. Each step must be one single action. Number them. Do not combine two actions into one step.' },

    { id:'example', icon:'grid', emoji:'🧮', name:'Show an example',
      desc:'Work one all the way through',
      prompt:'Work through one concrete example from beginning to end, showing every single move and saying out loud what you did and why at each move.' },

    { id:'eli5', icon:'seed', emoji:'🐣', name:'Simplest words',
      desc:'No big words',
      prompt:'Explain it using only the most common everyday words a young child knows. Very short sentences. No technical terms at all, if a term is unavoidable, immediately say what it means in plain words.' },

    { id:'picture', icon:'image', emoji:'🖼️', name:'Picture it',
      desc:'Describe what to see in your head',
      prompt:'Describe a clear mental picture the student can hold in their head. Be visual and concrete, say what it looks like, where things are, what moves. Then connect the picture to the idea.' },

    { id:'why', icon:'bulb', emoji:'💡', name:'Why it matters',
      desc:'Where this shows up in real life',
      prompt:'Explain why this matters and where a student would actually run into it in real life. Make it feel useful, not academic. Give one real situation.' }
  ];

  /* built-in sample pages */
  const SAMPLES = [
    {
      id:'s_science', tag:'Science', title:'Photosynthesis worksheet',
      text:`Photosynthesis

Photosynthesis is the process by which green plants utilize energy obtained from sunlight in order to convert carbon dioxide and water into glucose, which is a sugar that provides the plant with energy, and oxygen, which is subsequently released into the atmosphere. This process occurs primarily within the chloroplasts, which are structures located inside plant cells that contain a green pigment known as chlorophyll.

Directions: Read the passage above and complete the following.

1. Identify the two substances that a plant requires in order for photosynthesis to occur.
2. Describe what the plant generates as a result of this process.
3. Explain the significance of chlorophyll to the overall procedure.
4. Predict what would occur if a plant were placed in a location where it received no light for a period of two weeks.`
    },
    {
      id:'s_math', tag:'Math', title:'Fractions word problem',
      text:`Directions: Solve each problem. Show all of your work in the space provided, and be sure to simplify your final answer where it is appropriate to do so.

Maria was baking cookies for the school fundraiser, and although the recipe she was using called for 3/4 of a cup of sugar, she decided that she wanted to make double the quantity indicated by the original recipe because a large number of students had signed up to attend.

a) Determine the total amount of sugar Maria will require.
b) If Maria only has a 1/4 cup measuring scoop available to her, calculate how many times she must fill the scoop.
c) Justify your answer to part b using a drawing or an equation.`
    },
    {
      id:'s_history', tag:'History', title:'Textbook paragraph',
      text:`The Industrial Revolution, which initially began in Great Britain during the latter portion of the eighteenth century and subsequently spread throughout Europe and North America, fundamentally transformed the manner in which goods were produced. Prior to this period, the majority of manufacturing was conducted in homes and small workshops utilizing hand tools; however, the invention of powered machinery made it possible for goods to be produced in factories at a significantly faster rate and at a considerably lower cost.

Although this transformation generated immense wealth and made numerous products available to ordinary people for the first time, it also produced serious consequences. Cities expanded rapidly, and because housing construction was unable to keep pace with the migration of workers into urban areas, many families were compelled to live in overcrowded and unsanitary conditions.`
    },
    {
      id:'s_lab', tag:'Directions', title:'Lab safety instructions',
      text:`Before beginning the experiment, put on your safety goggles and ensure that your hair is tied back. Obtain a clean beaker from the supply cabinet, and after you have rinsed it thoroughly with distilled water, measure out approximately 50 mL of the solution provided by your instructor and pour it carefully into the beaker. Do not, under any circumstances, pour the solution directly into the sink when you have finished.

Next, using the thermometer that is located at your station, record the initial temperature of the solution in the data table, and then place the beaker on the hot plate. While the solution is heating, observe it continuously and record the temperature every thirty seconds until it reaches 80 degrees Celsius. When you have completed all of your measurements, turn off the hot plate, allow the beaker to cool for a minimum of ten minutes, and then dispose of the solution in the waste container that is labeled for that purpose.`
    },
    {
      id:'s_medicine', tag:'Health', title:'Medicine label',
      text:`Children's Pain Reliever, Oral Suspension, 160 mg per 5 mL

Directions: Shake well before each use. Whenever it is possible to do so, determine the correct dose using your child's weight, and only use their age if the weight is not known. For a child who weighs between 48 and 59 pounds, or who is 6 to 8 years of age, give 10 mL. Repeat the dose every 4 hours as needed, but do not give more than 5 doses in any 24 hour period. If your child is under 2 years of age, do not use this product unless a doctor tells you to.

Warnings: Stop use and ask a doctor if the pain gets worse or lasts more than 5 days, or if the fever gets worse or lasts more than 3 days.`
    },
    {
      id:'s_form', tag:'School form', title:'Permission slip',
      text:`Field Trip Permission Form

In order for your child to attend the upcoming educational field trip, this form must be completed and returned to the classroom teacher no later than Friday, October 10th. Please be aware that students who do not return a signed form by the stated deadline will be unable to attend and will instead remain at school under the supervision of another staff member.

The trip will depart from the main entrance at 8:30 a.m. and is expected to return by approximately 3:00 p.m. Students should bring a bagged lunch and a water bottle, and they should wear comfortable walking shoes that are appropriate for the weather. A fee of twelve dollars is requested to help cover the cost of transportation, although no student will be denied participation because of an inability to pay.`
    },
    {
      id:'s_recipe', tag:'Everyday', title:'Recipe',
      text:`Simple Banana Bread

Preheat your oven to 350 degrees Fahrenheit and lightly grease a loaf pan so the bread does not stick. In a large bowl, mash three ripe bananas until they are mostly smooth, and then stir in one third of a cup of melted butter until the mixture is well combined. Add three quarters of a cup of sugar, one beaten egg, and one teaspoon of vanilla, and mix everything together thoroughly. Sprinkle one teaspoon of baking soda and a pinch of salt over the mixture and stir it in, and then gently fold in one and a half cups of flour, being careful not to overmix. Pour the batter into the prepared pan and bake it for about fifty minutes, or until a toothpick inserted into the center comes out clean.`
    }
  ];

  /* Real, established organizations that help people who struggle with
     reading because of dyslexia, ADHD, or other learning differences.
     Links verified. Clarity points people to real help, it is not the
     only help. */
  const RESOURCES = [
    { name:'Understood', tag:'Learning differences', logo:'img/org-understood.png',
      desc:'Free guides and tools for dyslexia, ADHD, and other learning and thinking differences.',
      url:'https://www.understood.org' },
    { name:'International Dyslexia Association', tag:'Dyslexia', logo:'img/org-ida.png',
      desc:'Fact sheets, research, and help finding dyslexia support near you.',
      url:'https://dyslexiaida.org' },
    { name:'Learning Ally', tag:'Audiobooks', logo:'img/org-learningally.png',
      desc:'Human-read audiobooks made for students with dyslexia.',
      url:'https://learningally.org' },
    { name:'Yale Center for Dyslexia & Creativity', tag:'Dyslexia', logo:'img/org-yale.png',
      desc:'The science of dyslexia, and the strengths that come with it.',
      url:'https://dyslexia.yale.edu' },
    { name:'Stanford Center for Teaching & Learning', tag:'Study strategies', logo:'img/org-stanford.png',
      desc:'Stanford’s guide to reading strategies and assistive tech for dyslexia.',
      url:'https://ctl.stanford.edu/students/strategies-managing-dyslexia' }
  ];

  /* Plain-language explainers of common learning differences, to raise
     awareness in the Support tab. Distilled and cited, not copied. */
  const LEARNING_DIFFS = [
    { name:'Dyslexia', what:'Reading', icon:'book', color:'#CF6B45',
      desc:'A common, brain-based difference that makes linking letters to sounds harder, so reading and spelling take more effort. It has nothing to do with intelligence. About 1 in 5 people have it.' },
    { name:'ADHD', what:'Attention', icon:'spark', color:'#5B76B8',
      desc:'Attention-deficit/hyperactivity disorder affects focus, restlessness, and working memory. It comes in inattentive, hyperactive, and combined types, and often shows up alongside dyslexia.' },
    { name:'Dysgraphia', what:'Writing', icon:'edit', color:'#2A897C',
      desc:'A difference that makes turning thoughts into handwriting and spelling difficult, even when the ideas are strong. Around a third of dyslexic readers show signs of it too.' },
    { name:'Dyscalculia', what:'Math', icon:'grid', color:'#9C6FB0',
      desc:'A learning difference in number sense, math facts, and calculation. An estimated 4 to 7% of students have it, often one or two in every class.' }
  ];

  /* Real presentations released by institutions, shown with a preview of
     their first slide. The images are local; the link opens the full deck. */
  const PRESENTATIONS = [
    { title:'Understanding Dyslexia', by:'Marla Migdal, Dyslexia Specialist',
      img:'img/understanding-dyslexia.jpg',
      url:'https://msla.maryland.gov/2025%20Dyslexia%20Summit%20Handouts/Marla%20Dyselxia%20Presenation.pdf' },
    { title:'Dyslexia Advocacy', by:'International Dyslexia Association, DC Branch',
      img:'img/dyslexia-advocacy.jpg',
      url:'https://msla.maryland.gov/2025%20Dyslexia%20Summit%20Handouts/IDA%20DC%20-%20Adovacacy.pdf' },
    { title:'Library Services for Print Disabilities', by:'Maryland Library for the Blind & Print Disabled',
      img:'img/library-services.jpg',
      url:'https://msla.maryland.gov/2025%20Dyslexia%20Summit%20Handouts/Dyslexia%20Summit%20Slides%20-%20LBPD.pdf' }
  ];

  /* Real, free lessons and guides from trusted organizations. Tapping one
     opens the actual page. Photos are CC0 (public domain). */
  const LESSONS = [
    { title: 'What is dyslexia?', by: 'Yale Center for Dyslexia & Creativity', tag: 'Dyslexia',
      url: 'https://dyslexia.yale.edu/dyslexia/what-is-dyslexia/', img: 'img/lesson-dyslexia.jpg' },
    { title: 'Classroom accommodations for dyslexia', by: 'Understood', tag: 'Dyslexia',
      url: 'https://www.understood.org/en/articles/classroom-accommodations-for-dyslexia', img: 'img/lesson-accommodations.jpg' },
    { title: 'Understanding ADHD', by: 'CHADD', tag: 'ADHD',
      url: 'https://chadd.org/about-adhd/', img: 'img/lesson-understand-adhd.jpg' },
    { title: 'ADHD: a guide for families', by: 'CHADD', tag: 'ADHD',
      url: 'https://chadd.org/for-parents/overview/', img: 'img/lesson-adhd-family.jpg' }
  ];

  /* Feature walkthrough, opened from the home "How it works" card.
     Same slide shape as a lesson so it reuses the slideshow. */
  const FEATURES_TOUR = {
    id: 'features', tag: 'Clarity', title: 'How Clarity works',
    slides: [
      { h: '1. Scan any page', b: 'Point your camera at a worksheet or book page. Clarity reads the words right off the photo, on your device, no internet needed.' },
      { h: '2. It becomes clear steps', b: 'Clarity rebuilds the page into short, numbered steps, one action at a time, at your reading level. No more wall of text.' },
      { h: '3. Listen as you read', b: 'Press play and every word lights up as it is spoken. Seeing and hearing a word together helps it stick.' },
      { h: '4. See the difference', b: 'The impact card shows how much easier the page became, like grade 9 down to grade 3, so you know it worked.' },
      { h: '5. Explain it a new way', b: 'If the first version does not click, tap Explain differently for a fresh angle on the same idea.' },
      { h: '6. Check you got it', b: 'A short, no-pressure quiz after reading. Testing yourself locks in memory far better than reading again.' },
      { h: '7. Made for your brain', b: 'Set your reading level, spacing, font, and colors once in your profile. Every page you scan arrives exactly that way.' }
    ]
  };

  /* Focus timer lengths. Short study bursts with a real break between them
     is what the ADHD research points to, so Clarity offers short options and
     makes the break its own thing, not an afterthought. */
  const TIMERS = [
    { study: 10, brk: 3, label: 'Quick 10' },
    { study: 15, brk: 5, label: 'Steady 15' },
    { study: 25, brk: 5, label: 'Deep 25' }
  ];

  /* A guided breathing brain-break. Box breathing (equal counts) is a simple,
     evidence-backed way to settle a restless mind between study bursts. */
  const BREATH = [
    { label: 'Breathe in', secs: 4, scale: 1 },
    { label: 'Hold',       secs: 4, scale: 1 },
    { label: 'Breathe out',secs: 4, scale: 0 },
    { label: 'Hold',       secs: 4, scale: 0 }
  ];

  /* Daily Challenge question pool. Five are picked each day. They are quick and
     they teach a real focus or reading strategy, so the points mean something.
     { q, opts, a (index of answer), tip } */
  const DAILY = [
    { q: 'What is the best way to take on a long reading?',
      opts: ['Read it all in one go', 'Break it into small chunks', 'Only read the first line'], a: 1,
      tip: 'Chunking beats one long push, for both dyslexia and ADHD.' },
    { q: 'A quick way to actually remember what you read is to…',
      opts: ['Reread it three times', 'Test yourself on it', 'Read it louder'], a: 1,
      tip: 'Self-testing builds lasting memory far better than rereading.' },
    { q: 'Research shows reading is easier when words have…',
      opts: ['More space between them', 'Smaller text', 'No punctuation'], a: 0,
      tip: 'Extra spacing, not a special font, is what the studies point to.' },
    { q: 'For a busy, restless mind, focus works best in…',
      opts: ['One long two-hour block', 'Short bursts with breaks', 'Total silence only'], a: 1,
      tip: 'About 10 to 15 minutes, then a quick break, tends to beat one long push.' },
    { q: 'Before you start a reading, it helps to first…',
      opts: ['Name what you need from it', 'Read the last page', 'Count the pages'], a: 0,
      tip: 'You are far more likely to hit a goal you can name.' },
    { q: 'Needing tools like read-aloud or bigger text means…',
      opts: ['You are behind', 'You are using what works', 'You should stop'], a: 1,
      tip: 'Using your supports is the point, not a weakness.' },
    { q: 'Dyslexia is mainly about…',
      opts: ['How smart you are', 'How the brain links letters to sounds', 'How hard you try'], a: 1,
      tip: 'Dyslexia has nothing to do with intelligence.' },
    { q: 'A good way to handle a hard word is to…',
      opts: ['Skip the sentence', 'Picture it in your head', 'Give up'], a: 1,
      tip: 'Turning a word into a mental image helps you recognize it.' },
    { q: 'When you lose your place in a paragraph, it helps to…',
      opts: ['Start the whole page over', 'Dim everything but one line', 'Read faster'], a: 1,
      tip: 'Focus mode in the reader dims everything except the line you are on.' },
    { q: 'About how many people have dyslexia?',
      opts: ['1 in 100', '1 in 5', '1 in 1000'], a: 1,
      tip: 'It is very common, around 1 in 5 people.' },
    { q: 'The smartest way to skim a reading is to start with the…',
      opts: ['Headings, intro, and conclusion', 'Footnotes', 'Middle paragraph'], a: 0,
      tip: 'Skimming on purpose is reading selectively to meet your goal.' },
    { q: 'A fair reward setup for studying is…',
      opts: ['Punish every missed day', 'Small wins for real effort', 'No rewards at all'], a: 1,
      tip: 'Positive, no-punishment rewards are what help an ADHD brain keep going.' }
  ];

  return { WORDS, PHRASES, IMPERATIVES, SEQUENCE, ABBREV, PRESETS, TINTS, FONTS, EMOJIS,
           PROFILE_ICONS, ICON_LIST, PROFILE_COLORS, EMOJI_TO_ICON,
           LANGUAGES, TRANSLATIONS, STRATEGIES, SAMPLES, RESOURCES, LESSONS, FEATURES_TOUR,
           LEARNING_DIFFS, PRESENTATIONS, TIMERS, BREATH, DAILY };
})();
