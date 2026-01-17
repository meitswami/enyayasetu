import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'hinglish';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Hero Section
    'hero.badge': 'AI-Powered Justice',
    'hero.title.1': 'E-COURT',
    'hero.title.2': 'ROOM',
    'hero.subtitle': 'Experience virtual court hearings in a stunning comic-book style. Watch AI judges, lawyers, and prosecutors bring cases to life!',
    'hero.feature.1': 'AI-Powered Analysis',
    'hero.feature.2': 'Realistic Proceedings',
    'hero.feature.3': 'Detailed Verdicts',
    'hero.cta.example': 'EXAMPLE CASES',
    'hero.cta.custom': 'CUSTOM PROMPT',
    'hero.action': '🎬 JUSTICE AWAITS! 🎬',
    
    // Language Modal
    'lang.title': 'Select Language',
    'lang.subtitle': 'Choose your preferred language for the court hearing',
    'lang.en': 'English',
    'lang.hi': 'हिंदी (Hindi)',
    'lang.hinglish': 'Hinglish (Hindi + English)',
    'lang.continue': 'Continue',
    
    // Court Hearing
    'court.back': 'BACK',
    'court.plaintiff': 'Plaintiff',
    'court.defendant': 'Defendant',
    'court.dialogue': 'Dialogue',
    'court.of': 'of',
    'court.pause': 'PAUSE',
    'court.play': 'PLAY',
    'court.replay': 'REPLAY',
    'court.adjourned': '⚖️ COURT ADJOURNED ⚖️',
    'court.concluded': 'The virtual hearing has concluded',
    
    // Voice Controls
    'voice.language': 'Language',
    'voice.speed': 'Speech Rate',
    'voice.mute': 'Mute',
    'voice.unmute': 'Unmute',
    'voice.mic': 'Voice Input',
    'voice.prompt': 'Ask a question...',
    'voice.send': 'Send',
    
    // Speakers
    'speaker.judge': '⚖️ JUDGE',
    'speaker.prosecutor': '🔴 PROSECUTOR',
    'speaker.lawyer': '🟢 DEFENSE',
    'speaker.accused': '🔵 ACCUSED',
    'speaker.clerk': '📋 CLERK',
    
    // Dialogue templates
    'dialogue.clerk.intro': 'All rise! This honorable E-Court is now in session. Case number {caseId} - {caseTitle}. The Honorable Justice Verma presiding.',
    'dialogue.judge.seated': 'Be seated. We are assembled today to hear the matter of {plaintiff} versus {defendant}. This court has reviewed the preliminary documents.',
    'dialogue.judge.category': 'The case pertains to {category}. I understand there are {evidenceCount} pieces of evidence to be presented. Let the prosecution begin.',
    'dialogue.prosecutor.summary': 'Thank you, Your Honor. The prosecution would like to present the case summary: {summary}...',
    'dialogue.prosecutor.evidence': 'We have substantial evidence including: {evidence}. These clearly establish the defendant\'s culpability.',
    'dialogue.judge.defense': 'The court takes note of the prosecution\'s submissions. Defense counsel, you may present your client\'s case.',
    'dialogue.lawyer.deny': 'Your Honor, my client {accused} categorically denies these allegations. The evidence presented is circumstantial at best.',
    'dialogue.lawyer.request': 'We request this honorable court to consider that {legalIssue} requires clear and convincing evidence, which the prosecution has failed to provide.',
    'dialogue.accused.innocent': 'Your Honor, I am innocent. I have been wrongly implicated in this matter. I trust this court will see the truth.',
    'dialogue.judge.issues': 'This court has carefully considered the submissions of both parties. The legal issues at stake include: {legalIssues}.',
    'dialogue.prosecutor.gravity': 'Your Honor, we urge the court to consider the gravity of the offense. Justice must be served to protect the rights of the aggrieved party.',
    'dialogue.lawyer.objection': 'Objection, Your Honor! The prosecution is appealing to emotion rather than facts. The burden of proof has not been met.',
    'dialogue.judge.noted': 'Objection noted. Both counsels are advised to maintain decorum. This court will now pronounce its observations.',
    'dialogue.judge.decision': 'After careful deliberation and review of all evidence presented, this E-Court finds that further investigation is warranted. The matter is adjourned for detailed hearing.',
    'dialogue.judge.adjourn': 'The next hearing date shall be communicated to both parties. All evidence submitted shall be preserved. This court is adjourned! *GAVEL STRIKE*',
  },
  hi: {
    // Hero Section
    'hero.badge': 'AI-संचालित न्याय',
    'hero.title.1': 'ई-कोर्ट',
    'hero.title.2': 'रूम',
    'hero.subtitle': 'कॉमिक-बुक शैली में वर्चुअल कोर्ट सुनवाई का अनुभव करें। AI न्यायाधीश, वकील और अभियोजक मामलों को जीवंत करते हैं!',
    'hero.feature.1': 'AI-संचालित विश्लेषण',
    'hero.feature.2': 'यथार्थवादी कार्यवाही',
    'hero.feature.3': 'विस्तृत फैसले',
    'hero.cta.example': 'उदाहरण मामले',
    'hero.cta.custom': 'कस्टम प्रॉम्प्ट',
    'hero.action': '🎬 न्याय आपकी प्रतीक्षा में! 🎬',
    
    // Language Modal
    'lang.title': 'भाषा चुनें',
    'lang.subtitle': 'कोर्ट सुनवाई के लिए अपनी पसंदीदा भाषा चुनें',
    'lang.en': 'English',
    'lang.hi': 'हिंदी',
    'lang.hinglish': 'हिंग्लिश (हिंदी + अंग्रेजी)',
    'lang.continue': 'जारी रखें',
    
    // Court Hearing
    'court.back': 'वापस',
    'court.plaintiff': 'वादी',
    'court.defendant': 'प्रतिवादी',
    'court.dialogue': 'संवाद',
    'court.of': 'का',
    'court.pause': 'रुकें',
    'court.play': 'चलाएं',
    'court.replay': 'फिर से',
    'court.adjourned': '⚖️ कोर्ट स्थगित ⚖️',
    'court.concluded': 'वर्चुअल सुनवाई समाप्त हुई',
    
    // Voice Controls
    'voice.language': 'भाषा',
    'voice.speed': 'बोलने की गति',
    'voice.mute': 'म्यूट',
    'voice.unmute': 'अनम्यूट',
    'voice.mic': 'वॉइस इनपुट',
    'voice.prompt': 'सवाल पूछें...',
    'voice.send': 'भेजें',
    
    // Speakers
    'speaker.judge': '⚖️ न्यायाधीश',
    'speaker.prosecutor': '🔴 अभियोजक',
    'speaker.lawyer': '🟢 बचाव पक्ष',
    'speaker.accused': '🔵 आरोपी',
    'speaker.clerk': '📋 क्लर्क',
    
    // Dialogue templates
    'dialogue.clerk.intro': 'सब उठें! यह माननीय ई-कोर्ट अब सत्र में है। केस नंबर {caseId} - {caseTitle}। माननीय न्यायाधीश वर्मा अध्यक्षता कर रहे हैं।',
    'dialogue.judge.seated': 'बैठ जाइए। हम आज {plaintiff} बनाम {defendant} के मामले की सुनवाई के लिए एकत्र हुए हैं। इस न्यायालय ने प्रारंभिक दस्तावेजों की समीक्षा कर ली है।',
    'dialogue.judge.category': 'यह मामला {category} से संबंधित है। मुझे समझ है कि {evidenceCount} सबूत प्रस्तुत किए जाने हैं। अभियोजन पक्ष शुरू करे।',
    'dialogue.prosecutor.summary': 'धन्यवाद, माननीय। अभियोजन पक्ष मामले का सारांश प्रस्तुत करना चाहता है: {summary}...',
    'dialogue.prosecutor.evidence': 'हमारे पास पर्याप्त सबूत हैं जिसमें शामिल हैं: {evidence}। ये स्पष्ट रूप से प्रतिवादी के अपराध को स्थापित करते हैं।',
    'dialogue.judge.defense': 'न्यायालय ने अभियोजन पक्ष के तर्कों को नोट किया है। बचाव पक्ष के वकील, आप अपने मुवक्किल का पक्ष प्रस्तुत कर सकते हैं।',
    'dialogue.lawyer.deny': 'माननीय, मेरे मुवक्किल {accused} इन आरोपों से स्पष्ट रूप से इनकार करते हैं। प्रस्तुत साक्ष्य अधिकतम परिस्थितिजन्य है।',
    'dialogue.lawyer.request': 'हम इस माननीय न्यायालय से अनुरोध करते हैं कि {legalIssue} के लिए स्पष्ट और ठोस सबूतों की आवश्यकता है, जो अभियोजन पक्ष प्रदान करने में विफल रहा है।',
    'dialogue.accused.innocent': 'माननीय, मैं निर्दोष हूं। मुझे इस मामले में गलत तरीके से फंसाया गया है। मुझे विश्वास है कि यह न्यायालय सच्चाई देखेगा।',
    'dialogue.judge.issues': 'इस न्यायालय ने दोनों पक्षों के तर्कों पर सावधानीपूर्वक विचार किया है। कानूनी मुद्दों में शामिल हैं: {legalIssues}।',
    'dialogue.prosecutor.gravity': 'माननीय, हम न्यायालय से अपराध की गंभीरता पर विचार करने का आग्रह करते हैं। पीड़ित पक्ष के अधिकारों की रक्षा के लिए न्याय होना चाहिए।',
    'dialogue.lawyer.objection': 'आपत्ति, माननीय! अभियोजन पक्ष तथ्यों के बजाय भावनाओं की अपील कर रहा है। सबूत का बोझ पूरा नहीं हुआ है।',
    'dialogue.judge.noted': 'आपत्ति नोट की गई। दोनों वकीलों को सलाह दी जाती है कि वे शिष्टाचार बनाए रखें। यह न्यायालय अब अपनी टिप्पणियां देगा।',
    'dialogue.judge.decision': 'सभी प्रस्तुत साक्ष्यों की सावधानीपूर्वक समीक्षा के बाद, यह ई-कोर्ट पाता है कि आगे की जांच आवश्यक है। विस्तृत सुनवाई के लिए मामला स्थगित किया जाता है।',
    'dialogue.judge.adjourn': 'अगली सुनवाई की तारीख दोनों पक्षों को सूचित की जाएगी। सभी प्रस्तुत साक्ष्य संरक्षित किए जाएंगे। यह न्यायालय स्थगित है! *गैवल स्ट्राइक*',
    
    // RTI Tutorial
    'rti.tutorial.title': 'RTI ट्यूटोरियल और आवेदन',
    'rti.tutorial.subtitle': 'सूचना का अधिकार अधिनियम की पूर्ण गाइड',
    'rti.tutorial.progress': 'प्रगति',
    'rti.tutorial.sections': 'अनुभाग',
    'rti.tutorial.askAssistant': 'RTI सहायक से पूछें',
    'rti.tutorial.keyPoints': 'मुख्य बिंदु:',
    'rti.tutorial.steps': 'चरण:',
    'rti.tutorial.previous': 'पिछला',
    'rti.tutorial.next': 'अगला',
    'rti.tutorial.markComplete': 'पूर्ण के रूप में चिह्नित करें',
    'rti.tutorial.completed': 'पूर्ण',
    'rti.tutorial.applyNow': 'अभी RTI के लिए आवेदन करें',
    'rti.tutorial.paymentRequired': 'RTI ट्यूटोरियल तक पहुंच के लिए ₹50 के भुगतान की आवश्यकता है। पहुंच खरीदने के लिए नीचे क्लिक करें।',
  },
  hinglish: {
    // Hero Section
    'hero.badge': 'AI-Powered Justice',
    'hero.title.1': 'E-COURT',
    'hero.title.2': 'ROOM',
    'hero.subtitle': 'Virtual court hearings ka experience karein comic-book style mein. AI judges, lawyers aur prosecutors cases ko live laate hain!',
    'hero.feature.1': 'AI-Powered Analysis',
    'hero.feature.2': 'Realistic Proceedings',
    'hero.feature.3': 'Detailed Verdicts',
    'hero.cta.example': 'EXAMPLE CASES',
    'hero.cta.custom': 'CUSTOM PROMPT',
    'hero.action': '🎬 JUSTICE AWAITS! 🎬',
    
    // Language Modal
    'lang.title': 'Language Select Karein',
    'lang.subtitle': 'Court hearing ke liye apni preferred language choose karein',
    'lang.en': 'English',
    'lang.hi': 'हिंदी (Hindi)',
    'lang.hinglish': 'Hinglish (Hindi + English)',
    'lang.continue': 'Continue',
    
    // Court Hearing
    'court.back': 'BACK',
    'court.plaintiff': 'Plaintiff',
    'court.defendant': 'Defendant',
    'court.dialogue': 'Dialogue',
    'court.of': 'of',
    'court.pause': 'PAUSE',
    'court.play': 'PLAY',
    'court.replay': 'REPLAY',
    'court.adjourned': '⚖️ COURT ADJOURNED ⚖️',
    'court.concluded': 'Virtual hearing conclude ho gayi hai',
    
    // Voice Controls
    'voice.language': 'Language',
    'voice.speed': 'Speech Rate',
    'voice.mute': 'Mute',
    'voice.unmute': 'Unmute',
    'voice.mic': 'Voice Input',
    'voice.prompt': 'Sawaal poochein...',
    'voice.send': 'Send',
    
    // Speakers
    'speaker.judge': '⚖️ JUDGE',
    'speaker.prosecutor': '🔴 PROSECUTOR',
    'speaker.lawyer': '🟢 DEFENSE',
    'speaker.accused': '🔵 ACCUSED',
    'speaker.clerk': '📋 CLERK',
    
    // Dialogue templates
    'dialogue.clerk.intro': 'Sab uthein! Yeh mananiya E-Court ab session mein hai. Case number {caseId} - {caseTitle}. Mananiya Justice Verma presiding hain.',
    'dialogue.judge.seated': 'Baithiye. Hum aaj {plaintiff} versus {defendant} ke matter ki sunwai ke liye ikatte hue hain. Is court ne preliminary documents review kar liye hain.',
    'dialogue.judge.category': 'Yeh case {category} se related hai. Mujhe pata hai ki {evidenceCount} evidences present kiye jaane hain. Prosecution shuru kare.',
    'dialogue.prosecutor.summary': 'Dhanyavaad, Your Honor. Prosecution case ka summary present karna chahti hai: {summary}...',
    'dialogue.prosecutor.evidence': 'Hamare paas substantial evidence hai including: {evidence}. Yeh clearly defendant ki culpability establish karte hain.',
    'dialogue.judge.defense': 'Court ne prosecution ki submissions note kar li hain. Defense counsel, aap apne client ka case present kar sakte hain.',
    'dialogue.lawyer.deny': 'Your Honor, mere client {accused} in allegations ko categorically deny karte hain. Presented evidence at best circumstantial hai.',
    'dialogue.lawyer.request': 'Hum is mananiya court se request karte hain ki {legalIssue} ke liye clear aur convincing evidence chahiye, jo prosecution provide karne mein fail hua hai.',
    'dialogue.accused.innocent': 'Your Honor, main innocent hoon. Mujhe is matter mein galat tarike se implicate kiya gaya hai. Mujhe bharosa hai ki yeh court sach dekhegi.',
    'dialogue.judge.issues': 'Is court ne dono parties ki submissions ko carefully consider kiya hai. Legal issues mein include hain: {legalIssues}.',
    'dialogue.prosecutor.gravity': 'Your Honor, hum court se offense ki gravity consider karne ki request karte hain. Aggrieved party ke rights protect karne ke liye justice hona chahiye.',
    'dialogue.lawyer.objection': 'Objection, Your Honor! Prosecution facts ke bajaye emotion ki appeal kar rahi hai. Burden of proof meet nahi hua hai.',
    'dialogue.judge.noted': 'Objection noted. Dono counsels ko advise ki jaati hai ki decorum maintain karein. Yeh court ab apni observations pronounce karegi.',
    'dialogue.judge.decision': 'Saare presented evidence ki careful deliberation aur review ke baad, yeh E-Court finds ki further investigation warranted hai. Matter adjourned hai detailed hearing ke liye.',
    'dialogue.judge.adjourn': 'Next hearing date dono parties ko communicate ki jayegi. All submitted evidence preserve kiya jayega. Yeh court adjourned hai! *GAVEL STRIKE*',
    
    // RTI Tutorial
    'rti.tutorial.title': 'RTI Tutorial & Application',
    'rti.tutorial.subtitle': 'Complete guide to Right to Information Act',
    'rti.tutorial.progress': 'Progress',
    'rti.tutorial.sections': 'sections',
    'rti.tutorial.askAssistant': 'Ask RTI Assistant',
    'rti.tutorial.keyPoints': 'Key Points:',
    'rti.tutorial.steps': 'Steps:',
    'rti.tutorial.previous': 'Previous',
    'rti.tutorial.next': 'Next',
    'rti.tutorial.markComplete': 'Mark as Complete',
    'rti.tutorial.completed': 'Completed',
    'rti.tutorial.applyNow': 'Apply for RTI Now',
    'rti.tutorial.paymentRequired': 'Access to RTI Tutorial requires a payment of ₹50. Click below to purchase access.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('ecourt-language');
    return (saved as Language) || 'en';
  });
  
  const [speechRate, setSpeechRate] = useState(() => {
    const saved = localStorage.getItem('ecourt-speech-rate');
    return saved ? parseFloat(saved) : 1.0;
  });

  useEffect(() => {
    localStorage.setItem('ecourt-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('ecourt-speech-rate', String(speechRate));
  }, [speechRate]);

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, speechRate, setSpeechRate, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
