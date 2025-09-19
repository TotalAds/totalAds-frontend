import { ICPField } from "./api/icpClient";

export interface ICPTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  fields: ICPField[];
  tags: string[];
  popularity: number;
}

export const ICP_TEMPLATES: ICPTemplate[] = [
  {
    id: "saas-startup",
    name: "SaaS Startup",
    description: "Early-stage SaaS companies with growth potential",
    category: "Technology",
    icon: "🚀",
    fields: [
      { name: "Company Stage", description: "Startup, seed, series A-C funding stage" },
      { name: "Product Type", description: "SaaS, web app, mobile app, or platform" },
      { name: "Target Market", description: "B2B, B2C, or B2B2C focus" },
      { name: "Team Size", description: "Number of employees (1-50 for startups)" },
      { name: "Funding Status", description: "Bootstrap, angel, VC-backed, revenue stage" },
      { name: "Technology Stack", description: "Programming languages, frameworks, cloud providers" },
      { name: "Growth Metrics", description: "MRR, ARR, user growth, customer acquisition" }
    ],
    tags: ["SaaS", "Startup", "Technology", "Growth"],
    popularity: 95
  },
  {
    id: "enterprise-software",
    name: "Enterprise Software",
    description: "Large enterprises seeking software solutions",
    category: "Enterprise",
    icon: "🏢",
    fields: [
      { name: "Company Size", description: "Number of employees (1000+ for enterprise)" },
      { name: "Industry Vertical", description: "Healthcare, finance, manufacturing, retail, etc." },
      { name: "Annual Revenue", description: "Company's yearly revenue ($100M+ for enterprise)" },
      { name: "IT Budget", description: "Annual technology spending and procurement process" },
      { name: "Decision Makers", description: "CTO, CIO, IT Director, procurement team" },
      { name: "Compliance Needs", description: "SOC2, HIPAA, GDPR, industry-specific requirements" },
      { name: "Integration Requirements", description: "Existing systems, APIs, data migration needs" }
    ],
    tags: ["Enterprise", "Software", "B2B", "Compliance"],
    popularity: 88
  },
  {
    id: "ecommerce-business",
    name: "E-commerce Business",
    description: "Online retailers and marketplace sellers",
    category: "Retail",
    icon: "🛒",
    fields: [
      { name: "Business Model", description: "B2C, B2B, marketplace, dropshipping, subscription" },
      { name: "Product Categories", description: "Fashion, electronics, home goods, digital products" },
      { name: "Sales Volume", description: "Monthly/annual sales revenue and order volume" },
      { name: "Platform Used", description: "Shopify, WooCommerce, Magento, Amazon, custom" },
      { name: "Marketing Channels", description: "SEO, PPC, social media, email, influencer marketing" },
      { name: "Customer Base", description: "Demographics, geography, buying behavior" },
      { name: "Growth Stage", description: "Startup, scaling, established, enterprise" }
    ],
    tags: ["E-commerce", "Retail", "Online", "Sales"],
    popularity: 82
  },
  {
    id: "digital-agency",
    name: "Digital Marketing Agency",
    description: "Agencies providing digital marketing services",
    category: "Services",
    icon: "📈",
    fields: [
      { name: "Service Offerings", description: "SEO, PPC, social media, content, web design" },
      { name: "Client Industries", description: "Verticals they specialize in serving" },
      { name: "Agency Size", description: "Number of employees and client capacity" },
      { name: "Client Tier", description: "SMB, mid-market, enterprise client focus" },
      { name: "Geographic Focus", description: "Local, national, or international clients" },
      { name: "Technology Stack", description: "Marketing tools, CRM, project management" },
      { name: "Growth Goals", description: "Scaling services, new offerings, market expansion" }
    ],
    tags: ["Agency", "Marketing", "Services", "Digital"],
    popularity: 76
  },
  {
    id: "healthcare-provider",
    name: "Healthcare Provider",
    description: "Hospitals, clinics, and medical practices",
    category: "Healthcare",
    icon: "🏥",
    fields: [
      { name: "Provider Type", description: "Hospital, clinic, private practice, telehealth" },
      { name: "Specialties", description: "Medical specialties and services offered" },
      { name: "Patient Volume", description: "Number of patients served annually" },
      { name: "Technology Adoption", description: "EHR systems, telemedicine, digital health tools" },
      { name: "Compliance Status", description: "HIPAA, state regulations, accreditation" },
      { name: "Geographic Coverage", description: "Service area and location coverage" },
      { name: "Growth Initiatives", description: "Expansion plans, new services, technology upgrades" }
    ],
    tags: ["Healthcare", "Medical", "Compliance", "B2B"],
    popularity: 71
  },
  {
    id: "fintech-company",
    name: "FinTech Company",
    description: "Financial technology and services companies",
    category: "Financial",
    icon: "💳",
    fields: [
      { name: "Product Category", description: "Payments, lending, investing, insurance, banking" },
      { name: "Target Audience", description: "Consumers, SMBs, enterprises, financial institutions" },
      { name: "Regulatory Status", description: "Licensed, registered, compliance framework" },
      { name: "Technology Focus", description: "Blockchain, AI/ML, mobile-first, API-driven" },
      { name: "Business Model", description: "SaaS, transaction fees, subscription, marketplace" },
      { name: "Funding Stage", description: "Seed, growth, series funding, public company" },
      { name: "Geographic Markets", description: "Regions and countries of operation" }
    ],
    tags: ["FinTech", "Financial", "Technology", "Regulated"],
    popularity: 69
  },
  {
    id: "manufacturing-company",
    name: "Manufacturing Company",
    description: "Industrial and consumer goods manufacturers",
    category: "Manufacturing",
    icon: "🏭",
    fields: [
      { name: "Industry Sector", description: "Automotive, aerospace, consumer goods, industrial" },
      { name: "Production Scale", description: "Small batch, mass production, custom manufacturing" },
      { name: "Technology Adoption", description: "Automation, IoT, Industry 4.0, digital transformation" },
      { name: "Supply Chain", description: "Supplier relationships, logistics, inventory management" },
      { name: "Quality Standards", description: "ISO certifications, industry-specific standards" },
      { name: "Market Position", description: "OEM, supplier, brand manufacturer, contract manufacturer" },
      { name: "Sustainability Focus", description: "Environmental initiatives, green manufacturing" }
    ],
    tags: ["Manufacturing", "Industrial", "B2B", "Operations"],
    popularity: 64
  },
  {
    id: "educational-institution",
    name: "Educational Institution",
    description: "Schools, universities, and training organizations",
    category: "Education",
    icon: "🎓",
    fields: [
      { name: "Institution Type", description: "K-12, university, community college, training center" },
      { name: "Student Population", description: "Number of students and demographics" },
      { name: "Academic Programs", description: "Degrees, certifications, specializations offered" },
      { name: "Technology Infrastructure", description: "LMS, student systems, digital learning tools" },
      { name: "Funding Model", description: "Public, private, tuition-based, grant-funded" },
      { name: "Geographic Scope", description: "Local, regional, national, international reach" },
      { name: "Innovation Focus", description: "EdTech adoption, online learning, research initiatives" }
    ],
    tags: ["Education", "Academic", "Non-profit", "Technology"],
    popularity: 58
  }
];

export const ICP_CATEGORIES = [
  "All",
  "Technology",
  "Enterprise", 
  "Retail",
  "Services",
  "Healthcare",
  "Financial",
  "Manufacturing",
  "Education"
];

export function getTemplatesByCategory(category: string): ICPTemplate[] {
  if (category === "All") return ICP_TEMPLATES;
  return ICP_TEMPLATES.filter(template => template.category === category);
}

export function getPopularTemplates(limit: number = 4): ICPTemplate[] {
  return ICP_TEMPLATES
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export function searchTemplates(query: string): ICPTemplate[] {
  const searchTerm = query.toLowerCase();
  return ICP_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

export function getTemplateById(id: string): ICPTemplate | undefined {
  return ICP_TEMPLATES.find(template => template.id === id);
}
