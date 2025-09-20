// Common tour options
const tourOptions = {
  defaultStepOptions: {
    classes: "tour-step",
    scrollTo: { behavior: "smooth", block: "center" },
    cancelIcon: {
      enabled: true,
    },
  },
  useModalOverlay: true,
};

// Main dashboard tour steps
export const dashboardTourSteps = [
  {
    title: "🎉 Welcome to Leadsnipper!",
    text: `
      <div class="tour-content">
        <p><strong>Congratulations on joining Leadsnipper!</strong></p>
        <p>You're about to discover the fastest way to find leads from any website. Let's take a quick 2-minute tour to get you started.</p>
        <p class="tour-highlight">✨ Ready to become a lead generation expert?</p>
      </div>
    `,
    buttons: [
      {
        text: "Skip for Now",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.complete();
        },
      },
      {
        text: "Let's Go! 🚀",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.next();
        },
      },
    ],
    id: "welcome",
  },
  {
    title: "💳 Your Credits",
    text: `
      <div class="tour-content">
        <p>This shows your available credits. Each website scan uses credits based on the data extracted.</p>
        <p class="tour-tip">💡 New users get 20 free credits to get started!</p>
      </div>
    `,
    attachTo: {
      element: '[data-tour="credits-display"]',
      on: "bottom",
    },
    buttons: [
      {
        text: "Back",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.back();
        },
      },
      {
        text: "Next",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.next();
        },
      },
    ],
    id: "credits",
  },
  {
    title: "🚀 Quick Start",
    text: `
      <div class="tour-content">
        <p>This is where the magic happens! Paste any company website URL here to extract:</p>
        <ul class="tour-list">
          <li>📧 Contact information</li>
          <li>👥 Team details</li>
          <li>💼 Business intelligence</li>
          <li>🎯 ICP matching scores</li>
        </ul>
      </div>
    `,
    attachTo: {
      element: '[data-tour="quick-start"]',
      on: "top",
    },
    buttons: [
      {
        text: "Back",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.back();
        },
      },
      {
        text: "Next",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.next();
        },
      },
    ],
    id: "quick-start",
  },
  {
    title: "📊 Navigation Menu",
    text: `
      <div class="tour-content">
        <p>Use the sidebar to navigate between different features:</p>
        <ul class="tour-list">
          <li>🏠 <strong>Dashboard</strong> - Your home base</li>
          <li>🔍 <strong>Sales Intelligence</strong> - Main scraping tool</li>
          <li>🎯 <strong>ICP Profiles</strong> - Define your ideal customers</li>
          <li>🔑 <strong>API Tokens</strong> - For developers</li>
          <li>📚 <strong>Docs</strong> - API documentation</li>
        </ul>
      </div>
    `,
    attachTo: {
      element: '[data-tour="sidebar"]',
      on: "right",
    },
    buttons: [
      {
        text: "Back",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.back();
        },
      },
      {
        text: "Next",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.next();
        },
      },
    ],
    id: "navigation",
  },
  {
    title: "📈 View History",
    text: `
      <div class="tour-content">
        <p>Access all your previous scans and results here. Perfect for:</p>
        <ul class="tour-list">
          <li>📋 Reviewing past leads</li>
          <li>📊 Tracking your research</li>
          <li>🔄 Re-downloading data</li>
        </ul>
      </div>
    `,
    attachTo: {
      element: '[data-tour="history-link"]',
      on: "top",
    },
    buttons: [
      {
        text: "Back",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.back();
        },
      },
      {
        text: "Next",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.next();
        },
      },
    ],
    id: "history",
  },
  {
    title: "🎯 Smart Profiles",
    text: `
      <div class="tour-content">
        <p>Create Ideal Customer Profiles (ICPs) to get smarter results:</p>
        <ul class="tour-list">
          <li>🎯 Define your target customers</li>
          <li>📊 Get matching scores</li>
          <li>🚀 Prioritize better leads</li>
        </ul>
        <p class="tour-tip">💡 ICPs help our AI understand what you're looking for!</p>
      </div>
    `,
    attachTo: {
      element: '[data-tour="icp-link"]',
      on: "top",
    },
    buttons: [
      {
        text: "Back",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.back();
        },
      },
      {
        text: "Next",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.next();
        },
      },
    ],
    id: "icp",
  },
  {
    title: "🚀 You're Ready to Rock!",
    text: `
      <div class="tour-content">
        <p><strong>Congratulations! You've completed the tour.</strong></p>
        <p>Here's your action plan to start generating leads:</p>
        <ol class="tour-list">
          <li>🎯 <strong>Optional:</strong> Create an ICP profile for smarter results</li>
          <li>🔍 Go to <strong>Sales Intelligence</strong> and paste any website URL</li>
          <li>⚡ Watch our AI extract comprehensive business data in seconds!</li>
        </ol>
        <p class="tour-highlight">🎯 Ready to find your next big lead? Let's go!</p>
      </div>
    `,
    buttons: [
      {
        text: "Back",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.back();
        },
      },
      {
        text: "Start Lead Hunting! 🎯",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.complete();
        },
      },
    ],
    id: "complete",
  },
];

// Scraper page tour steps
export const scraperTourSteps = [
  {
    title: "🔍 Sales Intelligence Tool",
    text: `
      <div class="tour-content">
        <p>This is your main lead generation tool. Here's how it works:</p>
        <ol class="tour-list">
          <li>📝 Paste any company website URL</li>
          <li>🎯 Select an ICP profile (optional)</li>
          <li>🚀 Click "Extract Intelligence" and wait</li>
          <li>📊 Get comprehensive business data</li>
        </ol>
        <p class="tour-tip">💡 Try with popular sites like semrush.com or hubspot.com for best results!</p>
      </div>
    `,
    buttons: [
      {
        text: "Got it!",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.complete();
        },
      },
    ],
    id: "scraper-intro",
  },
];

// ICP Profiles page tour steps
export const icpTourSteps = [
  {
    title: "🎯 Ideal Customer Profiles",
    text: `
      <div class="tour-content">
        <p>Create profiles of your ideal customers to get smarter lead scoring:</p>
        <ul class="tour-list">
          <li>📝 Define what makes a perfect customer</li>
          <li>🎯 Set criteria like company size, industry, etc.</li>
          <li>📊 Get matching scores when scraping</li>
          <li>🚀 Prioritize the best leads automatically</li>
        </ul>
        <p class="tour-highlight">The more detailed your ICP, the better our AI matching!</p>
      </div>
    `,
    buttons: [
      {
        text: "Start Creating ICPs!",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.complete();
        },
      },
    ],
    id: "icp-intro",
  },
];

export { tourOptions };
