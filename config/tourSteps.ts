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
    title: "💳 Your Research Credits",
    text: `
      <div class="tour-content">
        <p>This shows how many company searches you have left. Each time you research a website, it uses some credits.</p>
        <p class="tour-tip">💡 Don't worry - you start with 20 free searches to try everything out!</p>
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
    title: "🚀 Try It Right Now!",
    text: `
      <div class="tour-content">
        <p>This is where the magic happens! Paste any company website here and watch what we find:</p>
        <ul class="tour-list">
          <li>📧 Email addresses and phone numbers</li>
          <li>👥 Who works there and their roles</li>
          <li>💼 What the company does and how they make money</li>
          <li>🎯 How well they match your ideal customer</li>
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
    title: "📊 Your Navigation Menu",
    text: `
      <div class="tour-content">
        <p>Use this menu to move around and access all the tools:</p>
        <ul class="tour-list">
          <li>🏠 <strong>Dashboard</strong> - Your starting point</li>
          <li>🔍 <strong>Sales Intelligence</strong> - Where you research companies</li>
          <li>🎯 <strong>Customer Profiles</strong> - Describe your ideal customers</li>
          <li>🔑 <strong>API Keys</strong> - Connect to your own apps</li>
          <li>📚 <strong>Docs</strong> - Help for developers</li>
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
    title: "📈 Your Research History",
    text: `
      <div class="tour-content">
        <p>Never lose track of companies you've researched! Come back here to:</p>
        <ul class="tour-list">
          <li>📋 See all the companies you've looked up</li>
          <li>📊 Review your findings anytime</li>
          <li>🔄 Download the data again</li>
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
    title: "🎯 Smart Customer Profiles",
    text: `
      <div class="tour-content">
        <p>Describe your perfect customers to get even better results:</p>
        <ul class="tour-list">
          <li>🎯 Tell us what your ideal customer looks like</li>
          <li>📊 Get scores showing how well companies match</li>
          <li>🚀 Focus on the best opportunities first</li>
        </ul>
        <p class="tour-tip">💡 The more you tell us about your ideal customer, the smarter our suggestions become!</p>
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
        <p>Here's your simple action plan to start finding amazing leads:</p>
        <ol class="tour-list">
          <li>🎯 <strong>Optional:</strong> Create a customer profile for better matches</li>
          <li>🔍 Go to <strong>Sales Intelligence</strong> and paste any company website</li>
          <li>⚡ Watch us find all their contact info and business details in seconds!</li>
        </ol>
        <p class="tour-highlight">🎯 Ready to find your next big opportunity? Let's go!</p>
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
        text: "Start Finding Leads! 🎯",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.complete();
        },
      },
    ],
    id: "complete",
  },
];

// Sales Intelligence page tour steps
export const scraperTourSteps = [
  {
    title: "🎉 Welcome to Sales Intelligence!",
    text: `
      <div class="tour-content">
        <p><strong>This is where the magic happens!</strong></p>
        <p>Turn any company website into a complete business profile in seconds. Let's show you how easy it is to find your next big lead.</p>
        <p class="tour-highlight">✨ Ready to discover what makes this tool so powerful?</p>
      </div>
    `,
    buttons: [
      {
        text: "Skip Tour",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.complete();
        },
      },
      {
        text: "Show Me How! 🚀",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.next();
        },
      },
    ],
    id: "sales-welcome",
  },
  {
    title: "🌐 Website URL Input",
    text: `
      <div class="tour-content">
        <p>Start by pasting any company website here. That's it!</p>
        <ul class="tour-list">
          <li>🏢 Works with any business website</li>
          <li>⚡ No setup or configuration needed</li>
          <li>🎯 Just paste and go!</li>
        </ul>
        <p class="tour-tip">💡 Try companies like hubspot.com, semrush.com, or any business you're curious about!</p>
      </div>
    `,
    attachTo: {
      element: '[data-tour="url-input"]',
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
    id: "url-input",
  },
  {
    title: "🎯 Smart Profiles (Optional)",
    text: `
      <div class="tour-content">
        <p>Want even smarter results? Use your customer profiles!</p>
        <ul class="tour-list">
          <li>📊 Get matching scores for each company</li>
          <li>🎯 See how well they fit your ideal customer</li>
          <li>🚀 Prioritize the best leads automatically</li>
        </ul>
        <p class="tour-tip">💡 Click "Advanced" to choose a customer profile, or skip this for now!</p>
      </div>
    `,
    attachTo: {
      element: '[data-tour="advanced-button"]',
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
    id: "icp-selection",
  },
  {
    title: "📊 View Your Research History",
    text: `
      <div class="tour-content">
        <p>Never lose track of your research! Access all your previous company profiles here.</p>
        <ul class="tour-list">
          <li>📋 See all companies you've researched</li>
          <li>💾 Download data anytime</li>
          <li>🔍 Search through your findings</li>
        </ul>
        <p class="tour-tip">💡 Perfect for building your prospect database!</p>
      </div>
    `,
    attachTo: {
      element: 'a[href="/scraper/history"]',
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
    id: "history-link",
  },
  {
    title: "🚀 You're All Set!",
    text: `
      <div class="tour-content">
        <p><strong>That's it! You're ready to start finding amazing leads.</strong></p>
        <p>Here's what happens when you extract intelligence:</p>
        <ol class="tour-list">
          <li>📧 Contact information (emails, phones)</li>
          <li>👥 Team and leadership details</li>
          <li>💼 Business model and revenue insights</li>
          <li>🎯 How well they match your ideal customer</li>
        </ol>
        <p class="tour-highlight">🎯 Ready to find your next big opportunity?</p>
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
        text: "Start Finding Leads! 🎯",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.complete();
        },
      },
    ],
    id: "sales-complete",
  },
];

// ICP Profiles page tour steps
export const icpTourSteps = [
  {
    title: "🎯 Customer Profiles Made Easy",
    text: `
      <div class="tour-content">
        <p><strong>Smart lead scoring starts here!</strong></p>
        <p>Create profiles of your perfect customers to get better results from every search.</p>
        <ul class="tour-list">
          <li>📝 Describe your ideal customer in simple terms</li>
          <li>🎯 Set criteria like company size, industry, location</li>
          <li>📊 Get matching scores for every company you research</li>
          <li>🚀 Focus on the best leads first</li>
        </ul>
        <p class="tour-highlight">The more details you add, the smarter our matching becomes!</p>
      </div>
    `,
    buttons: [
      {
        text: "Start Creating Profiles!",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.complete();
        },
      },
    ],
    id: "icp-intro",
  },
];

// API Tokens page tour steps
export const apiTokensTourSteps = [
  {
    title: "🔑 Welcome to API Access!",
    text: `
      <div class="tour-content">
        <p><strong>Connect Leadsnipper to your own apps!</strong></p>
        <p>API tokens let you use our lead generation power in your own software, websites, or automation tools.</p>
        <p class="tour-highlight">✨ Perfect for developers and power users!</p>
      </div>
    `,
    buttons: [
      {
        text: "Skip Tour",
        classes: "tour-btn-secondary",
        action(this: any) {
          return this.complete();
        },
      },
      {
        text: "Show Me How! 🚀",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.next();
        },
      },
    ],
    id: "api-welcome",
  },
  {
    title: "➕ Create Your First Token",
    text: `
      <div class="tour-content">
        <p>Start by creating an API token. Think of it as a special password for your apps.</p>
        <ul class="tour-list">
          <li>🏷️ Give it a memorable name (like "My Website" or "CRM Integration")</li>
          <li>🔒 Each token is unique and secure</li>
          <li>📱 Use different tokens for different projects</li>
        </ul>
        <p class="tour-tip">💡 You can create as many tokens as you need!</p>
      </div>
    `,
    attachTo: {
      element: '[data-tour="create-token-button"]',
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
    id: "create-token",
  },
  {
    title: "🚀 You're Ready to Build!",
    text: `
      <div class="tour-content">
        <p><strong>That's all you need to get started!</strong></p>
        <p>Once you create a token, you can:</p>
        <ol class="tour-list">
          <li>📋 Copy the token to your clipboard</li>
          <li>🔗 Use it in your API calls</li>
          <li>📊 Extract company data programmatically</li>
          <li>🔄 Automate your lead generation</li>
        </ol>
        <p class="tour-highlight">🎯 Ready to supercharge your apps with lead intelligence?</p>
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
        text: "Start Building! 🔧",
        classes: "tour-btn-primary",
        action(this: any) {
          return this.complete();
        },
      },
    ],
    id: "api-complete",
  },
];

export { tourOptions };
