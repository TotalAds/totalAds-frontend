import { ICPField } from './api/icpClient';

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
      {
        name: "Company Stage",
        description: "Startup, seed, series A-C funding stage",
      },
      {
        name: "Product Type",
        description: "SaaS, web app, mobile app, or platform",
      },
      { name: "Target Market", description: "B2B, B2C, or B2B2C focus" },
      {
        name: "Team Size",
        description: "Number of employees (1-50 for startups)",
      },
      {
        name: "Funding Status",
        description: "Bootstrap, angel, VC-backed, revenue stage",
      },
      {
        name: "Technology Stack",
        description: "Programming languages, frameworks, cloud providers",
      },
      {
        name: "Growth Metrics",
        description: "MRR, ARR, user growth, customer acquisition",
      },
    ],
    tags: ["SaaS", "Startup", "Technology", "Growth"],
    popularity: 95,
  },
  {
    id: "enterprise-software",
    name: "Enterprise Software",
    description: "Large enterprises seeking software solutions",
    category: "Enterprise",
    icon: "🏢",
    fields: [
      {
        name: "Company Size",
        description: "Number of employees (1000+ for enterprise)",
      },
      {
        name: "Industry Vertical",
        description: "Healthcare, finance, manufacturing, retail, etc.",
      },
      {
        name: "Annual Revenue",
        description: "Company's yearly revenue ($100M+ for enterprise)",
      },
      {
        name: "IT Budget",
        description: "Annual technology spending and procurement process",
      },
      {
        name: "Decision Makers",
        description: "CTO, CIO, IT Director, procurement team",
      },
      {
        name: "Compliance Needs",
        description: "SOC2, HIPAA, GDPR, industry-specific requirements",
      },
      {
        name: "Integration Requirements",
        description: "Existing systems, APIs, data migration needs",
      },
    ],
    tags: ["Enterprise", "Software", "B2B", "Compliance"],
    popularity: 88,
  },
  {
    id: "ecommerce-business",
    name: "E-commerce Business",
    description: "Online retailers and marketplace sellers",
    category: "Retail",
    icon: "🛒",
    fields: [
      {
        name: "Business Model",
        description: "B2C, B2B, marketplace, dropshipping, subscription",
      },
      {
        name: "Product Categories",
        description: "Fashion, electronics, home goods, digital products",
      },
      {
        name: "Sales Volume",
        description: "Monthly/annual sales revenue and order volume",
      },
      {
        name: "Platform Used",
        description: "Shopify, WooCommerce, Magento, Amazon, custom",
      },
      {
        name: "Marketing Channels",
        description: "SEO, PPC, social media, email, influencer marketing",
      },
      {
        name: "Customer Base",
        description: "Demographics, geography, buying behavior",
      },
      {
        name: "Growth Stage",
        description: "Startup, scaling, established, enterprise",
      },
    ],
    tags: ["E-commerce", "Retail", "Online", "Sales"],
    popularity: 82,
  },
  {
    id: "digital-agency",
    name: "Digital Marketing Agency",
    description: "Agencies providing digital marketing services",
    category: "Services",
    icon: "📈",
    fields: [
      {
        name: "Service Offerings",
        description: "SEO, PPC, social media, content, web design",
      },
      {
        name: "Client Industries",
        description: "Verticals they specialize in serving",
      },
      {
        name: "Agency Size",
        description: "Number of employees and client capacity",
      },
      {
        name: "Client Tier",
        description: "SMB, mid-market, enterprise client focus",
      },
      {
        name: "Geographic Focus",
        description: "Local, national, or international clients",
      },
      {
        name: "Technology Stack",
        description: "Marketing tools, CRM, project management",
      },
      {
        name: "Growth Goals",
        description: "Scaling services, new offerings, market expansion",
      },
    ],
    tags: ["Agency", "Marketing", "Services", "Digital"],
    popularity: 76,
  },
  {
    id: "healthcare-provider",
    name: "Healthcare Provider",
    description: "Hospitals, clinics, and medical practices",
    category: "Healthcare",
    icon: "🏥",
    fields: [
      {
        name: "Provider Type",
        description: "Hospital, clinic, private practice, telehealth",
      },
      {
        name: "Specialties",
        description: "Medical specialties and services offered",
      },
      {
        name: "Patient Volume",
        description: "Number of patients served annually",
      },
      {
        name: "Technology Adoption",
        description: "EHR systems, telemedicine, digital health tools",
      },
      {
        name: "Compliance Status",
        description: "HIPAA, state regulations, accreditation",
      },
      {
        name: "Geographic Coverage",
        description: "Service area and location coverage",
      },
      {
        name: "Growth Initiatives",
        description: "Expansion plans, new services, technology upgrades",
      },
    ],
    tags: ["Healthcare", "Medical", "Compliance", "B2B"],
    popularity: 71,
  },
  {
    id: "fintech-company",
    name: "FinTech Company",
    description: "Financial technology and services companies",
    category: "Financial",
    icon: "💳",
    fields: [
      {
        name: "Product Category",
        description: "Payments, lending, investing, insurance, banking",
      },
      {
        name: "Target Audience",
        description: "Consumers, SMBs, enterprises, financial institutions",
      },
      {
        name: "Regulatory Status",
        description: "Licensed, registered, compliance framework",
      },
      {
        name: "Technology Focus",
        description: "Blockchain, AI/ML, mobile-first, API-driven",
      },
      {
        name: "Business Model",
        description: "SaaS, transaction fees, subscription, marketplace",
      },
      {
        name: "Funding Stage",
        description: "Seed, growth, series funding, public company",
      },
      {
        name: "Geographic Markets",
        description: "Regions and countries of operation",
      },
    ],
    tags: ["FinTech", "Financial", "Technology", "Regulated"],
    popularity: 69,
  },
  {
    id: "manufacturing-company",
    name: "Manufacturing Company",
    description: "Industrial and consumer goods manufacturers",
    category: "Manufacturing",
    icon: "🏭",
    fields: [
      {
        name: "Industry Sector",
        description: "Automotive, aerospace, consumer goods, industrial",
      },
      {
        name: "Production Scale",
        description: "Small batch, mass production, custom manufacturing",
      },
      {
        name: "Technology Adoption",
        description: "Automation, IoT, Industry 4.0, digital transformation",
      },
      {
        name: "Supply Chain",
        description: "Supplier relationships, logistics, inventory management",
      },
      {
        name: "Quality Standards",
        description: "ISO certifications, industry-specific standards",
      },
      {
        name: "Market Position",
        description: "OEM, supplier, brand manufacturer, contract manufacturer",
      },
      {
        name: "Sustainability Focus",
        description: "Environmental initiatives, green manufacturing",
      },
    ],
    tags: ["Manufacturing", "Industrial", "B2B", "Operations"],
    popularity: 64,
  },
  {
    id: "educational-institution",
    name: "Educational Institution",
    description: "Schools, universities, and training organizations",
    category: "Education",
    icon: "🎓",
    fields: [
      {
        name: "Institution Type",
        description: "K-12, university, community college, training center",
      },
      {
        name: "Student Population",
        description: "Number of students and demographics",
      },
      {
        name: "Academic Programs",
        description: "Degrees, certifications, specializations offered",
      },
      {
        name: "Technology Infrastructure",
        description: "LMS, student systems, digital learning tools",
      },
      {
        name: "Funding Model",
        description: "Public, private, tuition-based, grant-funded",
      },
      {
        name: "Geographic Scope",
        description: "Local, regional, national, international reach",
      },
      {
        name: "Innovation Focus",
        description: "EdTech adoption, online learning, research initiatives",
      },
    ],
    tags: ["Education", "Academic", "Non-profit", "Technology"],
    popularity: 58,
  },
  {
    id: "digital-marketing-agency",
    name: "Digital Marketing Agency",
    description: "Marketing agencies and consultancies serving businesses",
    category: "Services",
    icon: "📈",
    fields: [
      {
        name: "Agency Size",
        description: "Number of employees and client capacity",
      },
      {
        name: "Service Specialization",
        description: "SEO, PPC, social media, content, email marketing",
      },
      {
        name: "Client Industries",
        description: "Verticals they typically serve",
      },
      {
        name: "Client Size Focus",
        description: "SMB, mid-market, enterprise clients",
      },
      {
        name: "Technology Stack",
        description: "Marketing tools, CRM, analytics platforms used",
      },
      {
        name: "Geographic Market",
        description: "Local, national, or international client base",
      },
      {
        name: "Growth Stage",
        description: "Startup, established, scaling, mature agency",
      },
    ],
    tags: ["Marketing", "Agency", "Services", "Digital"],
    popularity: 72,
  },
  {
    id: "real-estate-company",
    name: "Real Estate Company",
    description: "Real estate agencies, brokerages, and property companies",
    category: "Services",
    icon: "🏠",
    fields: [
      {
        name: "Business Type",
        description: "Residential, commercial, industrial, mixed-use",
      },
      {
        name: "Market Focus",
        description: "Buying, selling, leasing, property management",
      },
      {
        name: "Geographic Area",
        description: "Local, regional, national coverage",
      },
      {
        name: "Property Value Range",
        description: "Average price range of properties handled",
      },
      {
        name: "Agent Count",
        description: "Number of real estate agents/brokers",
      },
      {
        name: "Technology Adoption",
        description: "CRM, virtual tours, digital marketing tools",
      },
      {
        name: "Target Clients",
        description: "First-time buyers, investors, luxury market",
      },
    ],
    tags: ["Real Estate", "Property", "Services", "Local"],
    popularity: 65,
  },
  {
    id: "manufacturing-company",
    name: "Manufacturing Company",
    description: "Manufacturing and industrial companies",
    category: "Manufacturing",
    icon: "🏭",
    fields: [
      {
        name: "Industry Sector",
        description: "Automotive, electronics, food, textiles, chemicals",
      },
      {
        name: "Production Type",
        description: "Mass production, custom manufacturing, job shop",
      },
      {
        name: "Company Size",
        description: "Number of employees and production capacity",
      },
      {
        name: "Annual Revenue",
        description: "Yearly revenue and financial stability",
      },
      {
        name: "Technology Level",
        description: "Automation, Industry 4.0, traditional processes",
      },
      {
        name: "Supply Chain",
        description: "Local, national, global suppliers and customers",
      },
      {
        name: "Compliance Requirements",
        description: "ISO certifications, safety standards, regulations",
      },
    ],
    tags: ["Manufacturing", "Industrial", "B2B", "Production"],
    popularity: 61,
  },
  {
    id: "nonprofit-organization",
    name: "Nonprofit Organization",
    description: "Charitable organizations and NGOs",
    category: "Services",
    icon: "❤️",
    fields: [
      {
        name: "Mission Focus",
        description: "Healthcare, education, environment, social services",
      },
      {
        name: "Organization Size",
        description: "Number of staff, volunteers, and beneficiaries",
      },
      {
        name: "Annual Budget",
        description: "Operating budget and funding sources",
      },
      {
        name: "Geographic Scope",
        description: "Local, regional, national, international operations",
      },
      {
        name: "Fundraising Methods",
        description: "Donations, grants, events, corporate partnerships",
      },
      {
        name: "Technology Needs",
        description: "Donor management, volunteer coordination, outreach",
      },
      {
        name: "Growth Stage",
        description: "Startup, established, expanding, mature organization",
      },
    ],
    tags: ["Nonprofit", "Charity", "Social Impact", "Community"],
    popularity: 54,
  },
  {
    id: "tech-startup",
    name: "Tech Startup",
    description: "Early-stage technology companies and startups",
    category: "Technology",
    icon: "💡",
    fields: [
      {
        name: "Industry Focus",
        description: "AI/ML, blockchain, IoT, cybersecurity, mobile apps",
      },
      {
        name: "Development Stage",
        description: "Idea, MVP, beta, launched, scaling",
      },
      {
        name: "Team Size",
        description: "Number of founders, developers, employees",
      },
      {
        name: "Funding Status",
        description: "Self-funded, angel, seed, Series A-C",
      },
      {
        name: "Target Market",
        description: "B2B, B2C, B2B2C, marketplace",
      },
      {
        name: "Technology Stack",
        description: "Programming languages, frameworks, cloud platforms",
      },
      {
        name: "Business Model",
        description: "SaaS, marketplace, freemium, subscription, one-time",
      },
    ],
    tags: ["Startup", "Technology", "Innovation", "Growth"],
    popularity: 78,
  },
  {
    id: "consulting-firm",
    name: "Consulting Firm",
    description: "Management and specialized consulting companies",
    category: "Services",
    icon: "🎯",
    fields: [
      {
        name: "Consulting Type",
        description: "Management, IT, HR, financial, strategy consulting",
      },
      {
        name: "Firm Size",
        description: "Number of consultants and partners",
      },
      {
        name: "Client Industries",
        description: "Industries and verticals served",
      },
      {
        name: "Project Types",
        description: "Strategy, implementation, transformation, advisory",
      },
      {
        name: "Geographic Reach",
        description: "Local, regional, national, global presence",
      },
      {
        name: "Expertise Areas",
        description: "Specialized knowledge and methodologies",
      },
      {
        name: "Client Size Focus",
        description: "SMB, mid-market, enterprise, government",
      },
    ],
    tags: ["Consulting", "Professional Services", "Strategy", "Advisory"],
    popularity: 67,
  },
  {
    id: "food-beverage-business",
    name: "Food & Beverage Business",
    description: "Restaurants, food manufacturers, and beverage companies",
    category: "Retail",
    icon: "🍕",
    fields: [
      {
        name: "Business Type",
        description: "Restaurant, food truck, catering, manufacturing, retail",
      },
      {
        name: "Cuisine/Product Type",
        description: "Food category, cuisine style, beverage type",
      },
      {
        name: "Service Model",
        description: "Dine-in, takeout, delivery, wholesale, retail",
      },
      {
        name: "Location Count",
        description: "Single location, chain, franchise, online-only",
      },
      {
        name: "Target Demographics",
        description: "Age groups, income levels, dietary preferences",
      },
      {
        name: "Technology Adoption",
        description: "POS systems, delivery apps, online ordering",
      },
      {
        name: "Growth Plans",
        description: "Expansion, franchising, new products, markets",
      },
    ],
    tags: ["Food", "Restaurant", "Retail", "Consumer"],
    popularity: 63,
  },
  {
    id: "fitness-wellness",
    name: "Fitness & Wellness",
    description: "Gyms, wellness centers, and health-focused businesses",
    category: "Healthcare",
    icon: "💪",
    fields: [
      {
        name: "Business Type",
        description:
          "Gym, yoga studio, spa, wellness center, personal training",
      },
      {
        name: "Service Offerings",
        description: "Fitness classes, personal training, wellness services",
      },
      {
        name: "Target Audience",
        description: "Age groups, fitness levels, wellness goals",
      },
      {
        name: "Facility Size",
        description: "Square footage, equipment, capacity",
      },
      {
        name: "Membership Model",
        description: "Monthly, annual, drop-in, package deals",
      },
      {
        name: "Technology Integration",
        description: "Apps, wearables, booking systems, virtual classes",
      },
      {
        name: "Location Strategy",
        description: "Urban, suburban, multiple locations, online",
      },
    ],
    tags: ["Fitness", "Wellness", "Health", "Lifestyle"],
    popularity: 59,
  },
  {
    id: "legal-services",
    name: "Legal Services",
    description: "Law firms and legal service providers",
    category: "Services",
    icon: "⚖️",
    fields: [
      {
        name: "Practice Areas",
        description: "Corporate, litigation, family, criminal, IP, real estate",
      },
      {
        name: "Firm Size",
        description: "Solo practice, small firm, mid-size, large firm",
      },
      {
        name: "Client Types",
        description: "Individual, small business, corporate, government",
      },
      {
        name: "Geographic Scope",
        description: "Local, state, national, international practice",
      },
      {
        name: "Technology Adoption",
        description: "Case management, document automation, e-discovery",
      },
      {
        name: "Billing Model",
        description: "Hourly, flat fee, contingency, retainer",
      },
      {
        name: "Specialization Level",
        description: "General practice, specialized, niche expertise",
      },
    ],
    tags: ["Legal", "Professional Services", "Law", "Compliance"],
    popularity: 56,
  },
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
  "Education",
];

export function getTemplatesByCategory(category: string): ICPTemplate[] {
  if (category === "All") return ICP_TEMPLATES;
  return ICP_TEMPLATES.filter((template) => template.category === category);
}

export function getPopularTemplates(limit: number = 4): ICPTemplate[] {
  return ICP_TEMPLATES.sort((a, b) => b.popularity - a.popularity).slice(
    0,
    limit
  );
}

export function searchTemplates(query: string): ICPTemplate[] {
  const searchTerm = query.toLowerCase();
  return ICP_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
  );
}

export function getTemplateById(id: string): ICPTemplate | undefined {
  return ICP_TEMPLATES.find((template) => template.id === id);
}
