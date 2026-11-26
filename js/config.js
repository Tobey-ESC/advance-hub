window.AH = window.AH || {};

AH.CONFIG = {
  appName: "Advanced Hub",
  recentCount: 5,
autoHighlight: true, // set false to turn off the automatic text highlighter


  categories: {
    inbox: {
      key: "inbox",
      label: "Inbox Advanced",
      short: "Inbox",
      icon: "inbox",
      blurb: "Assignment, snoozing, states, views, permissions and reporting.",
      topics: [
        "Assignment & Routing",
        "Snooze Behavior",
        "Conversation State",
        "Inbox Views",
        "Teammate Permissions",
        "SLA & Response Time",
        "Reporting & Metrics",
        "Customer Experience",
        "Fin TS",
        "Fin Troubleshooting",
        "Other"
      ]
    },
    automation: {
      key: "automation",
      label: "Automation Advanced",
      short: "Automation",
      icon: "zap",
      blurb: "Workflows, Fin AI, knowledge, triggers, branching and APIs.",
      topics: [
        "Workflows",
        "Email Forwarding",
        "Fin AI",
        "Fin Guidance",
        "Fin Deployment",
        "Knowledge Sources",
        "Triggers & Events",
        "Conditions & Branching",
        "Integrations & APIs",
        "Data Attributes",
        "Automation Bugs",
        "Email & Deliverability",
        "Fin Guidance",
        "Fin Vision",
        "Messenger",
        "Other"
      ]
    }
  },

  statuses: {
    investigating: { label: "Investigating", icon: "flask" },
    resolved:      { label: "Resolved",      icon: "circle-check" },
    workaround:    { label: "Workaround",    icon: "wrench" },
    escalated:     { label: "Escalated",     icon: "arrow-up-right" },
        closed:        { label: "Closed",        icon: "check" },
    fixed:         { label: "Fixed",         icon: "circle-check" },
    open:          { label: "Open",          icon: "flask" }

  }
};
