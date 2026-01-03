export type QuestionType =
  | "YES_NO"
  | "TEXT"
  | "PHOTO"
  | "RATING_ABC"
  | "SIGNATURE";

export type FieldType = "TEXT" | "NUMBER" | "DATE";

export interface CustomField {
  id: string;
  label: string; // Ej: "Kilometraje"
  type: FieldType; // Ej: "NUMBER"
  required: boolean;
}

export interface QuestionItem {
  id: string;
  text: string;
  type: QuestionType;
  answer?: boolean | string | null;
}

export interface Section {
  id: string;
  title: string;
  items: QuestionItem[];
}

export interface Template {
  id: string;
  title: string;
  description: string;
  structure: Section[]; // 👈 Ahora guardamos Secciones, no preguntas sueltas
  customFields?: CustomField[];
  createdAt: string;
}

export interface Company {
  id: string;
  rut: string;
  name: string;
  industry?: string; // El signo ? significa que puede ser null/undefined
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  createdAt: string;
}

// Nuestra estructura "Envelope" estándar
export interface ApiListResponse<T> {
  data: T[];
  meta: {
    page: number;
    total: number;
    totalPages: number;
  };
  error: string | null;
}

export interface Worker {
  id: string;
  rut: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  companyId: string;
  // Propiedad opcional para cuando hacemos "include" en prisma
  company?: {
    name: string;
  };
}

export interface Company {
  // 👈 Agrega esto si no lo tienes para el selector
  id: string;
  name: string;
}

export interface InspectionItem {
  question: string;
  approved: boolean;
  comment?: string;
}

export interface Inspection {
  id: string;
  title: string;
  score: number;
  status: string;
  company: { name: string };
  worker: { name: string };
  createdAt: string;
  checklist: InspectionItem[]; // Typescript infiere esto del JSON
}

export interface MetaData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
