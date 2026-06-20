import { Question, MockTest, ExamLanguage, ExamDifficulty } from './types';

export const DEFAULT_QUESTIONS: Question[] = [
  // Tamil Questions
  {
    id: 'q-tamil-1',
    subject: 'Tamil Literature',
    text: 'திருக்குறளை இயற்றியவர் யார்?',
    options: [
      'கம்பர் (Kambar)',
      'திருவள்ளுவர் (Thiruvalluvar)',
      'இளங்கோவடிகள் (Ilango Adigal)',
      'பாரதியார் (Bharathiyar)'
    ],
    correctOptionIndex: 1,
    explanation: 'திருக்குறள் உலகப் பொதுமறை என்று அழைக்கப்படுகிறது. இதை இயற்றியவர் திருவள்ளுவர் ஆவார். இதில் 133 அதிகாரங்களும், 1330 குறள்களும் உள்ளன.',
    language: 'tamil',
    difficulty: 'easy',
    approved: true
  },
  {
    id: 'q-tamil-2',
    subject: 'Tamil Grammar',
    text: 'தமிழ் மொழியின் முதல் இலக்கண நூல் எது தொல்காப்பியம் ஆகும். இதன் ஆசிரியர் யார்?',
    options: [
      'அகத்தியர்',
      'தொல்காப்பியர்',
      'பவணந்தி முனிவர்',
      'வீரமாமுனிவர்'
    ],
    correctOptionIndex: 1,
    explanation: 'தமிழில் கிடைத்த மிகப்பழமையான இலக்கண நூல் தொல்காப்பியம். இதன் ஆசிரியர் தொல்காப்பியர் ஆவார்.',
    language: 'tamil',
    difficulty: 'medium',
    approved: true
  },
  // English Questions
  {
    id: 'q-eng-1',
    subject: 'Science - Biology',
    text: 'Which organelle is known as the powerhouse of the cell?',
    options: [
      'Nucleus',
      'Mitochondria',
      'Ribosome',
      'Golgi Apparatus'
    ],
    correctOptionIndex: 1,
    explanation: 'Mitochondria are double-membraned organelles that produce Adenosine Triphosphate (ATP), which serves as the cellular energy currency, hence the name Powerhouse of the cell.',
    language: 'english',
    difficulty: 'easy',
    approved: true
  },
  {
    id: 'q-eng-2',
    subject: 'General Science',
    text: 'What is the chemical symbol for Gold?',
    options: [
      'Go',
      'Gd',
      'Au',
      'Ag'
    ],
    correctOptionIndex: 2,
    explanation: 'The chemical symbol for Gold is Au, derived from its Latin name "Aurum", which means "shining dawn". Ag is for Silver, and Go/Gd are not the correct symbols.',
    language: 'english',
    difficulty: 'easy',
    approved: true
  },
  {
    id: 'q-eng-3',
    subject: 'Computer Science',
    text: 'Which of the following sorting algorithms has a worst-case time complexity of O(n log n)?',
    options: [
      'Bubble Sort',
      'Insertion Sort',
      'Merge Sort',
      'Selection Sort'
    ],
    correctOptionIndex: 2,
    explanation: 'Merge Sort and Heap Sort maintain a time complexity of O(n log n) in all cases (best, average, and worst). Bubble and Insertion sort have worst-case O(n^2).',
    language: 'english',
    difficulty: 'hard',
    approved: true
  },
  // Bilingual Questions
  {
    id: 'q-bi-1',
    subject: 'Indian History (இந்திய வரலாறு)',
    text: 'Who was the famous King of the Chola Dynasty who built the Brihadeeswarar Temple in Thanjavur?\nதஞ்சாவூர் பிரகதீஸ்வரர் கோயிலைக் கட்டிய புகழ்பெற்ற சோழ மன்னன் யார்?',
    options: [
      'Rajendra Chola I (முதலாம் ராஜேந்திர சோழன்)',
      'Rajaraja Chola I (முதலாம் ராஜராஜ சோழன்)',
      'Karikala Chola (கரிகால சோழன்)',
      'Aditya Chola I (முதலாம் ஆதித்த சோழன்)'
    ],
    correctOptionIndex: 1,
    explanation: 'The Brihadeeswarar Temple, also known as the Big Temple (தஞ்சை பெரிய கோவில்), was built by Rajaraja Chola I and completed in 1010 AD. இக்கோவில் முதலாம் இராஜராஜ சோழனால் கட்டப்பட்டது.',
    language: 'bilingual',
    difficulty: 'medium',
    approved: true
  },
  {
    id: 'q-bi-2',
    subject: 'General Science (பொது அறிவியல்)',
    text: 'What gas do plants absorb from the atmosphere for photosynthesis?\nஒளிச்சேர்க்கைக்காக தாவரங்கள் வளிமண்டலத்திலிருந்து உறிஞ்சும் வாயு எது?',
    options: [
      'Oxygen (ஆக்ஸிஜன்)',
      'Nitrogen (நைட்ரஜன்)',
      'Carbon Dioxide (கார்பன் டை ஆக்சைடு)',
      'Hydrogen (ஹைட்ரஜன்)'
    ],
    correctOptionIndex: 2,
    explanation: 'Plants absorb Carbon Dioxide (CO2) from the air and release Oxygen (O2) during photosynthesis. தாவரங்கள் ஒளிச்சேர்க்கையின் போது கார்பன் டை ஆக்சைடை உட்கொண்டு ஆக்ஸிஜனை வெளியிடுகின்றன.',
    language: 'bilingual',
    difficulty: 'easy',
    approved: true
  },
  {
    id: 'q-bi-3',
    subject: 'Indian Constitution (இந்திய அரசியல் அமைப்பு)',
    text: 'Who is known as the Father of the Indian Constitution?\nஇந்திய அரசியலமைப்பின் தந்தை என்று அழைக்கப்படுபவர் யார்?',
    options: [
      'Mahatma Gandhi (மகாத்மா காந்தி)',
      'Dr. B. R. Ambedkar (டாக்டர் பி. ஆர். அம்பேத்கர்)',
      'Jawaharlal Nehru (ஜவஹர்லால் நேரு)',
      'Dr. Rajendra Prasad (டாக்டர் ராஜேந்திர பிரசாத்)'
    ],
    correctOptionIndex: 1,
    explanation: 'Dr. B.R. Ambedkar was the Chairman of the Drafting Committee of the Indian Constitution. டாக்டர் பி.ஆர்.அம்பேத்கர் இந்திய அரசியலமைப்பை வரைந்த குழுவின் தலைவராக இருந்தார்.',
    language: 'bilingual',
    difficulty: 'easy',
    approved: true
  }
];

export const DEFAULT_TESTS: MockTest[] = [
  {
    id: 'test-1',
    title: 'Biology & History Revision',
    subject: 'General Knowledge',
    createdAt: '2026-06-15',
    language: 'bilingual',
    difficulty: 'medium',
    questions: [DEFAULT_QUESTIONS[5], DEFAULT_QUESTIONS[6], DEFAULT_QUESTIONS[2]],
    score: 66,
    correctCount: 2,
    timeSpent: 145,
    totalTime: 300,
    selectedAnswers: {
      'q-bi-1': 1, // correct
      'q-bi-2': 2, // correct
      'q-eng-1': 0  // wrong (selected Nucleus, correct is Mitochondria)
    },
    isCompleted: true
  },
  {
    id: 'test-2',
    title: 'அடிப்படை தமிழ் தேர்வு',
    subject: 'Tamil Literature',
    createdAt: '2026-06-16',
    language: 'tamil',
    difficulty: 'easy',
    questions: [DEFAULT_QUESTIONS[0], DEFAULT_QUESTIONS[1]],
    score: 100,
    correctCount: 2,
    timeSpent: 42,
    totalTime: 200,
    selectedAnswers: {
      'q-tamil-1': 1, // correct
      'q-tamil-2': 1  // correct
    },
    isCompleted: true
  }
];

// Subject-based mock templates to generate realistic content
const SUBJECT_TEMPLATES: Record<string, { English: Partial<Question>[]; Tamil: Partial<Question>[]; Bilingual: Partial<Question>[] }> = {
  chemistry: {
    English: [
      {
        text: "What is the atomic number of Carbon?",
        options: ["4", "6", "8", "12"],
        correctOptionIndex: 1,
        explanation: "Carbon has 6 protons, which gives it an atomic number of 6."
      },
      {
        text: "Which of the following is an alkali metal?",
        options: ["Sodium", "Calcium", "Iron", "Helium"],
        correctOptionIndex: 0,
        explanation: "Sodium (Na) is in Group 1 of the periodic table, making it an alkali metal."
      },
      {
        text: "What is the primary component of natural gas?",
        options: ["Ethane", "Propane", "Butane", "Methane"],
        correctOptionIndex: 3,
        explanation: "Methane (CH4) makes up about 70-90% of natural gas."
      }
    ],
    Tamil: [
      {
        text: "நீரின் வேதியியல் வாய்ப்பாடு என்ன?",
        options: ["CO2", "H2O", "O2", "NaCl"],
        correctOptionIndex: 1,
        explanation: "நீரின் வேதியியல் மூலக்கூறு இரு ஹைட்ரஜன் அணுக்களும் ஒரு ஆக்ஸிஜன் அணுவும் கொண்ட H2O ஆகும்."
      },
      {
        text: "சாதாரண உப்பின் வேதியியல் பெயர் என்ன?",
        options: ["சோடியம் குளோரைடு", "சோடியம் பைகார்பனேட்", "கால்சியம் கார்பனேட்", "பொட்டாசியம் ஹைட்ராக்சைடு"],
        correctOptionIndex: 0,
        explanation: "சாதாரண சமையல் உப்பின் வேதியியல் பெயர் சோடியம் குளோரைடு (NaCl) ஆகும்."
      }
    ],
    Bilingual: [
      {
        text: "Which acid is present in lemon?\nஎலுமிச்சையில் உள்ள அமிலம் எது?",
        options: ["Citric acid (சிட்ரிக் அமிலம்)", "Acetic acid (அசிட்டிக் அமிலம்)", "Lactic acid (லாக்டிக் அமிலம்)", "Tartaric acid (டார்டாரிக் அமிலம்)"],
        correctOptionIndex: 0,
        explanation: "Lemons contain a high amount of Citric acid, which gives them a sour taste. எலுமிச்சம்பழத்தில் சிட்ரிக் அமிலம் அதிகளவில் காணப்படுவதால் அது புளிப்புச் சுவை கொண்டது."
      }
    ]
  },
  physics: {
    English: [
      {
        text: "What is the SI unit of power?",
        options: ["Joule", "Watt", "Newton", "Pascal"],
        correctOptionIndex: 1,
        explanation: "Watt is the SI unit of power, equivalent to one joule per second."
      },
      {
        text: "What type of lens is used to correct myopia (nearsightedness)?",
        options: ["Convex lens", "Concave lens", "Cylindrical lens", "Bifocal lens"],
        correctOptionIndex: 1,
        explanation: "A concave lens is diverging and is used to correct myopia by focusing the image properly onto the retina."
      }
    ],
    Tamil: [
      {
        text: "ஒளியின் திசைவேகம் விநாடிக்கு தோராயமாக எத்தனை கிலோமீட்டர்?",
        options: ["1,50,000 கி.மீ", "3,00,000 கி.மீ", "4,50,000 கி.மீ", "2,00,000 கி.மீ"],
        correctOptionIndex: 1,
        explanation: "வெற்றிடத்தில் ஒளியின் திசைவேகம் விநாடிக்கு 3,00,000 கிலோமீட்டர் (3 x 10^8 m/s) ஆகும்."
      }
    ],
    Bilingual: [
      {
        text: "What is the acceleration due to gravity on Earth's surface?\nபூமியின் மேற்பரப்பில் ஈர்ப்பு விசையினால் ஏற்படும் முடுக்கத்தின் மதிப்பு என்ன?",
        options: ["9.8 m/s²", "8.9 m/s²", "10.5 m/s²", "6.7 m/s²"],
        correctOptionIndex: 0,
        explanation: "The acceleration due to gravity is approximately 9.8 meters per second squared. பூமியில் புவியீர்ப்பு முடுக்கம் தோராயமாக 9.8 மீ/விநாடி² ஆகும்."
      }
    ]
  },
  math: {
    English: [
      {
        text: "What is the value of pi (π) correct to two decimal places?",
        options: ["3.12", "3.14", "3.16", "3.18"],
        correctOptionIndex: 1,
        explanation: "The value of pi is approximately 3.14159..., so 3.14 is correct to two decimal places."
      }
    ],
    Tamil: [
      {
        text: "ஒரு நேர்வட்ட உருளையின் வளைபரப்பைக் காணும் சூத்திரம் என்ன?",
        options: ["πr²h", "2πrh", "2πr(r+h)", "1/3 πr²h"],
        correctOptionIndex: 1,
        explanation: "உருளையின் வளைபரப்பு = 2πrh சதுர அலகுகள்."
      }
    ],
    Bilingual: [
      {
        text: "What is the sum of angles in a triangle?\nஒரு முக்கோணத்தின் மூன்று கோணங்களின் கூடுதல் என்ன?",
        options: ["90°", "180°", "270°", "360°"],
        correctOptionIndex: 1,
        explanation: "The sum of interior angles of any triangle is always 180 degrees. முக்கோணத்தின் மூன்று கோணங்களின் கூட்டுத்தொகை எப்போதும் 180° ஆகும்."
      }
    ]
  },
  history: {
    English: [
      {
        text: "Who was the first Prime Minister of India?",
        options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel", "Dr. B. R. Ambedkar"],
        correctOptionIndex: 1,
        explanation: "Jawaharlal Nehru served as the first Prime Minister of independent India from 1947 to 1964."
      }
    ],
    Tamil: [
      {
        text: "சுதந்திர இந்தியாவின் முதல் குடியரசுத் தலைவர் யார்?",
        options: ["டாக்டர் ராஜேந்திர பிரசாத்", "டாக்டர் ராதாகிருஷ்ணன்", "ஜவஹர்லால் நேரு", "அப்துல் கலாம்"],
        correctOptionIndex: 0,
        explanation: "டாக்டர் ராஜேந்திர பிரசாத் சுதந்திர இந்தியாவின் முதல் குடியரசுத் தலைவராகப் பொறுப்பேற்றார்."
      }
    ],
    Bilingual: [
      {
        text: "In which year did India gain Independence?\nஇந்தியா எந்த ஆண்டில் சுதந்திரம் பெற்றது?",
        options: ["1945", "1947", "1950", "1935"],
        correctOptionIndex: 1,
        explanation: "India achieved independence from British rule on August 15, 1947. இந்தியா பிரிட்டிஷ் ஆட்சியில் இருந்து ஆகஸ்ட் 15, 1947 இல் விடுதலை அடைந்தது."
      }
    ]
  }
};

const RANDOM_QUESTION_TEMPLATES = [
  {
    topic: "History",
    templates: {
      English: [
        { text: "Where did the Indus Valley Civilization emerge?", options: ["Nile River", "Indus River Basin", "Yellow River", "Tigris River"], correct: 1, why: "As the name suggests, it flourished around the basin of the Indus River." },
        { text: "Who was the founder of the Mughal Empire?", options: ["Akbar", "Babur", "Humayun", "Shah Jahan"], correct: 1, why: "Babur founded the Mughal dynasty in 1926 after securing victory in the Battle of Panipat." }
      ],
      Tamil: [
        { text: "கீழடி அகழ்வாராய்ச்சி எதனுடன் தொடர்புடையது?", options: ["பல்லவர் காலம்", "சங்க கால பாண்டியர்", "சேரர் காலம்", "பிற்கால சோழர்"], correct: 1, why: "கீழடி அகழ்வாராய்ச்சி சுமார் 2600 ஆண்டுகள் பழமையான சங்க கால வைகை நதி நாகரிகத்துடன் தொடர்புடையது." }
      ],
      Bilingual: [
        { text: "What is the capital of Tamil Nadu?\nதமிழ்நாட்டின் தலைநகரம் எது?", options: ["Madurai (மதுரை)", "Coimbatore (கோயம்புத்தூர்)", "Chennai (சென்னை)", "Trichy (திருச்சி)"], correct: 2, why: "Chennai is the capital and largest city of Tamil Nadu. தமிழ்நாட்டின் தலைநகரம் மற்றும் பெரிய நகரம் சென்னை ஆகும்." }
      ]
    }
  },
  {
    topic: "General Science",
    templates: {
      English: [
        { text: "What is the closest planet to the Sun?", options: ["Venus", "Mars", "Mercury", "Earth"], correct: 2, why: "Mercury is closest, followed by Venus, Earth, and Mars." },
        { text: "What is the normal body temperature of a healthy human?", options: ["35°C (95°F)", "37°C (98.6°F)", "39°C (102.2°F)", "41°C (105.8°F)"], correct: 1, why: "37°C or 98.6°F is the standard physiological baseline for healthy humans." }
      ],
      Tamil: [
        { text: "ஒலியின் அலகு என்ன?", options: ["ஹெர்ட்ஸ் (Hz)", "டெசிபல் (dB)", "வாட் (W)", "நியூட்டன் (N)"], correct: 1, why: "ஒலியின் செறிவு அல்லது சத்தத்தின் வீச்சு டெசிபல் (dB) அலகால் அளவிடப்படுகிறது." }
      ],
      Bilingual: [
        { text: "Which gas is most abundant in Earth's atmosphere?\nபூமியின் வளிமண்டலத்தில் மிக அதிக அளவில் உள்ள வாயு எது?", options: ["Oxygen (ஆக்ஸிஜன்)", "Nitrogen (நைட்ரஜன்)", "Carbon Dioxide (கார்பன் டை ஆக்சைடு)", "Argon (ஆர்கான்)"], correct: 1, why: "Nitrogen makes up roughly 78% of the Earth's atmosphere. வளிமண்டலத்தில் நைட்ரஜன் சுமார் 78% அளவில் உள்ளது." }
      ]
    }
  }
];

export function generateMockQuestions(
  subject: string,
  language: ExamLanguage,
  difficulty: ExamDifficulty,
  count: number,
  optionsCount: number
): Question[] {
  const normSubject = subject.trim().toLowerCase();
  let basePool: { text: string; options: string[]; correctOptionIndex: number; explanation: string }[] = [];

  // 1. Try to find custom subject templates map
  let found = false;
  for (const [key, val] of Object.entries(SUBJECT_TEMPLATES)) {
    if (normSubject.includes(key)) {
      found = true;
      let langKey: 'English' | 'Tamil' | 'Bilingual' = 'English';
      if (language === 'tamil') langKey = 'Tamil';
      else if (language === 'bilingual') langKey = 'Bilingual';

      // Grab templates (and fallback to general if empty)
      const list = val[langKey] || val['English'];
      list.forEach(q => {
        basePool.push({
          text: q.text!,
          options: [...q.options!],
          correctOptionIndex: q.correctOptionIndex!,
          explanation: q.explanation!
        });
      });
    }
  }

  // 2. If not found or empty pool, pull from general random templates
  if (basePool.length === 0) {
    const langKey: 'English' | 'Tamil' | 'Bilingual' = 
      language === 'tamil' ? 'Tamil' : (language === 'bilingual' ? 'Bilingual' : 'English');

    RANDOM_QUESTION_TEMPLATES.forEach(item => {
      const list = item.templates[langKey] || item.templates['English'];
      list.forEach(q => {
        basePool.push({
          text: `[${subject}] ${q.text}`,
          options: [...q.options],
          correctOptionIndex: q.correct,
          explanation: q.why
        });
      });
    });
  }

  // 3. Duplicate and synthesize questions to match requested count
  const results: Question[] = [];
  for (let i = 0; i < count; i++) {
    const template = basePool[i % basePool.length];
    
    // Adjust number of options if requested (e.g., optionsCount: 2, 3, 4, 5)
    let processedOptions = [...template.options];
    let correctIdx = template.correctOptionIndex;

    if (optionsCount < processedOptions.length) {
      // Need to shrink options but make sure the correct option stays!
      const correctText = processedOptions[correctIdx];
      const others = processedOptions.filter((_, idx) => idx !== correctIdx).slice(0, optionsCount - 1);
      processedOptions = [correctText, ...others];
      correctIdx = 0; // The first is now the correct one, let's randomize it back within the range
      const newCorrectIdx = Math.floor(Math.random() * optionsCount);
      const temp = processedOptions[newCorrectIdx];
      processedOptions[newCorrectIdx] = correctText;
      processedOptions[0] = temp;
      correctIdx = newCorrectIdx;
    } else if (optionsCount > processedOptions.length) {
      // Add general placeholder options
      const extraOptions = ["None of the above (மேற்கண்ட எதுவும் இல்லை)", "All of the above (மேற்கூறிய அனைத்தும்)", "Not applicable", "Cannot be determined"];
      while (processedOptions.length < optionsCount) {
        processedOptions.push(extraOptions[(processedOptions.length - template.options.length) % extraOptions.length]);
      }
    }

    results.push({
      id: `q-gen-${Date.now()}-${i}`,
      subject: subject || 'General Studies',
      text: template.text,
      options: processedOptions,
      correctOptionIndex: correctIdx,
      explanation: template.explanation,
      language,
      difficulty,
      approved: false // Created, needs review in the Admin/Review Page!
    });
  }

  return results;
}
