export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: "Lead" | "Contato" | "Orçamento" | "Negociação" | "Fechado" | "Execução" | "Concluído";
  service: string;
  value: number;
  date: string;
  latOffset: number;
  lngOffset: number;
  address: string;
  outreachScript: string;
  documents: string[];
  photos: string[];
  notes?: string[];
}

export interface Transaction {
  id: string;
  description: string;
  type: "payable" | "receivable";
  value: number;
  date: string;
  status: "pago" | "pendente";
  category: "PIX" | "Boleto" | "Cartão" | "Dinheiro" | "Comissão" | "Nota Fiscal" | "Outro";
}

export interface ChecklistItem {
  item: string;
  checked: boolean;
}

export interface ServiceOrder {
  id: string;
  leadId: string;
  title: string;
  engineer: string;
  status: "Pendente" | "Em Andamento" | "Concluído";
  checklist: ChecklistItem[];
  startDate: string;
  endDate: string;
  photoUrl: string;
  signature: string;
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  publishDate?: string;
}

export interface Automation {
  id: string;
  event: string;
  actions: string[];
  enabled: boolean;
}

export interface AutomationLog {
  time: string;
  event: string;
  message: string;
}

export interface PartnerLogo {
  id: string;
  name: string;
  url: string;
}

export interface SiteSettings {
  logoType: string;
  logoText: string;
  logoSubtext: string;
  logoSlogan: string;
  customLogoUrl: string;
  phone: string;
  email: string;
  crea: string;
  cnpj?: string;
  city: string;
  state: string;
  // Custom Site Images
  imgEngineer?: string;
  imgService1?: string;
  imgService2?: string;
  imgCardNr12?: string;
  imgCardNr13?: string;
  imgCardPontes?: string;
  imgCardLaudos?: string;
  imgCardEstruturas?: string;
  logoScale?: number;
  logoBg?: "white" | "transparent" | "dark";
  landingPagesContent?: Record<string, { title: string; subtitle: string; description: string; items: string[]; norm?: string }>;
  partnerLogos?: PartnerLogo[];
}

export interface Project {
  id: string;
  title: string;
  client: string;
  category: string;
  location: string;
  date: string;
  image: string;
  description: string;
  tags: string[];
}

