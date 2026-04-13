export interface OrgProfile {
  companyName: string;
  entityType: string;
  industry: string;
  totalEmployees: string;
  youngestEmployeeAge: string;
  operatingYears: string;
  ptoHandling: string;
  hrContactName: string;
  hrContactEmail: string;
  hrContactPhone: string;
  backupContactName: string;
  backupContactEmail: string;
  backupContactPhone: string;
  physicalLocations: string[];
}

export const EMPTY_PROFILE: OrgProfile = {
  companyName: '',
  entityType: '',
  industry: '',
  totalEmployees: '',
  youngestEmployeeAge: '',
  operatingYears: '',
  ptoHandling: '',
  hrContactName: '',
  hrContactEmail: '',
  hrContactPhone: '',
  backupContactName: '',
  backupContactEmail: '',
  backupContactPhone: '',
  physicalLocations: [],
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}
