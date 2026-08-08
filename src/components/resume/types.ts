export interface ResumeEducation {
  university?: string;
  institution?: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
}

export interface ResumeExperience {
  title?: string;
  position?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface ResumeProject {
  name?: string;
  title?: string;
  link?: string;
  description?: string;
}

export interface ResumeSkill {
  name: string;
}

export interface ResumeCertificate {
  name: string;
  issuer?: string;
  year?: string;
}

export interface ResumeLanguage {
  language: string;
  level?: string;
}


export interface ResumeData {
  id?: number;

  full_name?: string;
  professional_title?: string;
  avatar?: string | null;

  email?: string;
  phone?: string;
  location?: string;
  portfolio?: string;

  summary?: string;

  education?: ResumeEducation[];
  experience?: ResumeExperience[];
  skills?: ResumeSkill[];
  projects?: ResumeProject[];
  certificates?: ResumeCertificate[];
  languages?: ResumeLanguage[];

  template?: string;
}


export type TemplateId =
  | "modern"
  | "professional"
  | "minimal";


export interface TemplateProps {
  data: ResumeData;
}