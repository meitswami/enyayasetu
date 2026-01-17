export interface CaseData {
  id: string;
  title: string;
  year: number;
  category: string;
  summary: string;
  plaintiff: string;
  defendant: string;
  evidence: string[];
  legalIssues: string[];
  status: 'pending' | 'resolved' | 'appeal';
}

export const exampleCases: CaseData[] = [
  {
    id: "CASE-1999-LP-001",
    title: "Singh vs. Singh - Land Dispute",
    year: 1999,
    category: "Property Law",
    summary: "A deceased landowner's family holds original property papers, but a relative has illegally obtained duplicate documents and claims ownership. The case involves forged signatures and fraudulent transfer deeds.",
    plaintiff: "Rajesh Singh (Son of deceased)",
    defendant: "Vikram Singh (Brother of deceased)",
    evidence: ["Original sale deed from 1975", "Death certificate", "Witness statements", "Bank records showing original owner's transactions"],
    legalIssues: ["Forgery", "Fraudulent transfer", "Property rights", "Inheritance law"],
    status: "pending"
  },
  {
    id: "CASE-2005-CR-042",
    title: "State vs. Mehta - Corporate Fraud",
    year: 2005,
    category: "Criminal Law",
    summary: "A corporate executive embezzled ₹50 crores from shareholders through fake invoices and shell companies. Multiple investors lost their life savings.",
    plaintiff: "State of Maharashtra",
    defendant: "Anil Mehta (Former CEO)",
    evidence: ["Forensic audit report", "Bank transaction records", "Email correspondence", "Shell company documents"],
    legalIssues: ["Embezzlement", "Securities fraud", "Money laundering", "Breach of fiduciary duty"],
    status: "pending"
  },
  {
    id: "CASE-2010-FAM-078",
    title: "Sharma vs. Sharma - Custody Battle",
    year: 2010,
    category: "Family Law",
    summary: "A custody dispute where the father seeks primary custody of two minor children after separation. Mother alleges domestic violence, father claims false accusations.",
    plaintiff: "Priya Sharma",
    defendant: "Rahul Sharma",
    evidence: ["Medical reports", "School records", "Child psychologist evaluation", "Financial statements"],
    legalIssues: ["Child custody", "Domestic violence allegations", "Best interest of child", "Visitation rights"],
    status: "pending"
  },
  {
    id: "CASE-2015-ENV-023",
    title: "Citizens Forum vs. Industrial Corp",
    year: 2015,
    category: "Environmental Law",
    summary: "A factory has been dumping toxic waste into a river, affecting 5000 residents in nearby villages. Multiple health issues reported including skin diseases and respiratory problems.",
    plaintiff: "Greenville Citizens Forum",
    defendant: "National Industrial Corporation",
    evidence: ["Water quality reports", "Medical records of affected villagers", "Satellite imagery", "Expert environmental assessment"],
    legalIssues: ["Environmental pollution", "Public health hazard", "Corporate negligence", "Compensation claims"],
    status: "pending"
  },
  {
    id: "CASE-2018-IP-156",
    title: "TechStart vs. MegaCorp - Patent Dispute",
    year: 2018,
    category: "Intellectual Property",
    summary: "A startup claims a tech giant stole their patented AI algorithm after a failed acquisition meeting. The algorithm is now central to the giant's flagship product.",
    plaintiff: "TechStart Innovations Pvt Ltd",
    defendant: "MegaCorp Technologies",
    evidence: ["Patent registration documents", "Meeting recordings", "Code comparison analysis", "Development timeline"],
    legalIssues: ["Patent infringement", "Trade secret theft", "Corporate espionage", "Damages assessment"],
    status: "pending"
  },
  {
    id: "CASE-2019-LAB-089",
    title: "Workers Union vs. Textile Factory",
    year: 2019,
    category: "Labor Law",
    summary: "200 factory workers were terminated without notice or compensation after they formed a union. They allege unsafe working conditions and unpaid overtime.",
    plaintiff: "Textile Workers Union",
    defendant: "Golden Thread Textiles Ltd",
    evidence: ["Employment contracts", "Termination letters", "Safety inspection reports", "Payroll records"],
    legalIssues: ["Wrongful termination", "Union rights", "Workplace safety", "Wage theft"],
    status: "pending"
  },
  {
    id: "CASE-2020-MED-034",
    title: "Kapoor Family vs. City Hospital",
    year: 2020,
    category: "Medical Negligence",
    summary: "A routine surgery resulted in patient death due to alleged negligence. The hospital failed to conduct pre-operative tests and used expired medication.",
    plaintiff: "Kapoor Family",
    defendant: "City Super Specialty Hospital",
    evidence: ["Medical records", "Autopsy report", "Expert medical opinion", "Hospital protocols"],
    legalIssues: ["Medical negligence", "Hospital liability", "Informed consent", "Wrongful death"],
    status: "pending"
  },
  {
    id: "CASE-2021-CYB-112",
    title: "State vs. Anonymous Hackers",
    year: 2021,
    category: "Cyber Crime",
    summary: "A hacking group breached a major bank's systems, stealing data of 2 million customers and demanding ransom in cryptocurrency.",
    plaintiff: "State Cyber Crime Unit",
    defendant: "Unknown Perpetrators (2 arrested)",
    evidence: ["Digital forensics report", "IP tracking data", "Cryptocurrency transaction records", "Server logs"],
    legalIssues: ["Cyber terrorism", "Data theft", "Extortion", "Banking fraud"],
    status: "pending"
  },
  {
    id: "CASE-2022-CON-067",
    title: "Homebuyers vs. Dream Developers",
    year: 2022,
    category: "Consumer Protection",
    summary: "500 homebuyers paid for apartments promised in 2019 but construction was never completed. The developer diverted funds to other projects.",
    plaintiff: "Dream Heights Buyers Association",
    defendant: "Dream Developers Pvt Ltd",
    evidence: ["Sale agreements", "Payment receipts", "Construction progress reports", "Fund diversion proof"],
    legalIssues: ["Consumer fraud", "Breach of contract", "Fund misappropriation", "Compensation"],
    status: "pending"
  },
  {
    id: "CASE-2023-DEF-008",
    title: "Social Activist vs. Media House",
    year: 2023,
    category: "Defamation",
    summary: "A prominent activist was falsely accused of financial irregularities in a news report. The story was later proven false but caused significant reputation damage.",
    plaintiff: "Dr. Ananya Reddy",
    defendant: "National News Network",
    evidence: ["Original news broadcast", "Retraction statement", "Financial audit clearing plaintiff", "Social media impact analysis"],
    legalIssues: ["Criminal defamation", "Media liability", "Right to reputation", "Damages"],
    status: "pending"
  }
];

export const generateCustomCase = (prompt: string): CaseData => {
  return {
    id: `CASE-CUSTOM-${Date.now()}`,
    title: "Custom Case - User Submitted",
    year: new Date().getFullYear(),
    category: "Custom",
    summary: prompt,
    plaintiff: "To be determined",
    defendant: "To be determined",
    evidence: ["Evidence to be presented"],
    legalIssues: ["To be analyzed by AI"],
    status: "pending"
  };
};
