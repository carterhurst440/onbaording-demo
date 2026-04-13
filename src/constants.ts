export const ENTITY_TYPES = [
  'LLC',
  'S-Corporation',
  'C-Corporation',
  'Sole Proprietor',
  'General Partnership',
  'Limited Partnership',
  'Non-Profit',
  'Professional Corporation (PC)',
  'Other',
];

export const PTO_OPTIONS = [
  { value: 'set_amount', label: 'Set Amount', description: 'Employees receive a fixed number of PTO days per year' },
  { value: 'accrual', label: 'Accrual', description: 'PTO accumulates over time based on hours or days worked' },
  { value: 'covers_sick', label: 'PTO Covers Sick Leave', description: 'Vacation/PTO time also covers sick days — no separate sick leave' },
];

export const JURISDICTIONS = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'Washington D.C.',
];

export const REQUIRED_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'companyName', label: 'Company Name' },
  { key: 'entityType', label: 'Entity Type' },
  { key: 'industry', label: 'Industry' },
  { key: 'totalEmployees', label: 'Total Employees' },
  { key: 'youngestEmployeeAge', label: 'Youngest Employee Age' },
  { key: 'operatingYears', label: 'Operating Years' },
  { key: 'ptoHandling', label: 'PTO Policy' },
  { key: 'hrContactName', label: 'HR Contact' },
  { key: 'backupContactName', label: 'Backup Contact' },
  { key: 'physicalLocations', label: 'Physical Locations' },
];

export const INITIAL_GREETING = `Welcome! I'll be guiding you through setting up your organization profile today. This information helps us tailor your employee handbook to your specific situation and applicable state laws.

Let's start with the basics — what's your **company name**, and what type of business entity is it? (For example: LLC, S-Corp, C-Corporation, Sole Proprietorship, Partnership, etc.)`;

export const SYSTEM_PROMPT = `You are a friendly, professional onboarding assistant helping a new organization complete their profile for an HR handbook compliance platform. Your job is to gather specific information through natural conversation — one topic at a time.

## Information to gather (in roughly this order, but follow the conversation naturally):

1. **Company Name** — the legal business name
2. **Entity Type** — LLC, S-Corp, C-Corp, Sole Proprietor, Partnership, Non-Profit, etc.
3. **Industry** — the sector or type of business
4. **Total Employees** — current headcount
5. **Age of Youngest Employee** — important for minor labor law compliance
6. **Operating Years** — how long the company has been in business
7. **PTO Policy Approach** — choose from:
   - "set_amount": fixed PTO days per year
   - "accrual": PTO accumulates based on time worked
   - "covers_sick": PTO/vacation also covers sick days
8. **HR Contact** (name, email, phone) — who employees reach out to for handbook questions
9. **Backup Contact** (name, email, phone) — separate contact for sensitive reports like sexual harassment complaints (kept confidential)
10. **Physical Locations** — which US states/jurisdictions the company has employees or offices in (this determines which state laws apply)

## Rules:
- Ask ONE topic at a time, or naturally group closely-related items (e.g., ask for a name and email together)
- Be warm, concise, and professional — max 2-3 sentences per response unless explaining something complex
- **ALWAYS call the \`update_org_profile\` tool immediately whenever you learn any piece of information** — even partial info
- After a tool call, continue the conversation naturally asking for the next missing piece
- Never re-ask for information you've already saved
- For **Physical Locations**: briefly explain that state laws differ and this determines compliance requirements
- For **Backup Contact**: briefly note this is kept separate for privacy/sensitivity reasons
- For **PTO**: briefly explain the three options before asking which applies
- When all 10 fields are complete, congratulate the user warmly and give a brief summary of what was captured

## Tone: Friendly, efficient, trustworthy. You're helping them get something important done.`;
