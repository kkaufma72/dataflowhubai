/**
 * Email Templates for Nurture Sequence
 * 
 * These templates can be used with:
 * - Supabase Edge Functions + Resend/SendGrid
 * - External email service (Mailchimp, ConvertKit)
 * 
 * Sequence:
 * Day 0: Welcome + Quick Start
 * Day 2: Feature Highlight + Video
 * Day 5: Success Story
 * Day 7: "Your data is waiting"
 * Day 10: Limited offer
 * Day 14: Final reminder
 */

export interface EmailTemplate {
  subject: string;
  preheader: string;
  body: string;
  cta: {
    text: string;
    url: string;
  };
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  // Day 0 - Welcome
  welcome: {
    subject: "Welcome to DataFlowHub! Here's your quick start guide 🚀",
    preheader: "You're 3 steps away from your first AI insight",
    body: `
Hi {{name}},

Welcome to DataFlowHub! I'm excited to help you unlock insights from your data.

**Here's how to get started in 3 minutes:**

1. **Upload your data** - CSV, Excel, or connect your database
2. **Ask a question** - Type "What trends do you see?" in the AI chat
3. **Get insights** - Watch as AI analyzes your data instantly

[Get Started Now →]({{app_url}})

**Quick tip:** Try asking the AI: "What's the most important thing I should know about this data?"

Need help? Just reply to this email - I read every message.

Best,
Kyle
Founder, DataFlowHub

P.S. Did you know? Our users save an average of 10 hours per week on data analysis.
    `.trim(),
    cta: {
      text: 'Start Analyzing Data',
      url: '{{app_url}}/data'
    }
  },

  // Day 2 - Feature highlight
  feature_highlight: {
    subject: "Did you try asking the AI this? 🤖",
    preheader: "The question that reveals hidden patterns",
    body: `
Hi {{name}},

Quick tip that saves our users hours:

**Try asking the AI:** "Find the 3 most surprising patterns in this data"

This simple question has helped companies discover:
- Hidden customer segments worth $2M
- Seasonal trends they never noticed
- Data quality issues before they caused problems

[Try it now →]({{app_url}})

**🎥 Watch:** 2-minute video showing how a marketing team found a $50k opportunity
[Watch Video]({{video_url}})

Haven't uploaded data yet? No problem - try our sample datasets to see the AI in action.

Best,
Kyle
    `.trim(),
    cta: {
      text: 'Ask the AI',
      url: '{{app_url}}/data'
    }
  },

  // Day 5 - Success story
  success_story: {
    subject: "How Sarah saved 15 hours/week with DataFlowHub",
    preheader: "From Excel hell to automated insights",
    body: `
Hi {{name}},

I wanted to share a quick story:

**Sarah was spending 15+ hours per week:**
- Manually cleaning data in Excel
- Building the same reports every month
- Answering "can you pull this data?" requests

**After DataFlowHub:**
- Data cleaning: 2 clicks instead of 2 hours
- Reports: Auto-generated with AI
- Data requests: Team members self-serve

"I used to dread Monday mornings. Now I actually have time to think strategically instead of just reacting to data requests."

**Want similar results?**

[Upload Your Data →]({{app_url}})

Or if you're stuck, reply to this email and I'll personally help you get started.

Best,
Kyle
    `.trim(),
    cta: {
      text: 'Start Saving Time',
      url: '{{app_url}}/data'
    }
  },

  // Day 7 - Re-engagement
  data_waiting: {
    subject: "Your data is waiting for you 📊",
    preheader: "Pick up where you left off",
    body: `
Hi {{name}},

I noticed you signed up but haven't analyzed any data yet.

No judgment - we all get busy! But I wanted to remind you that your account is ready and waiting.

**What you're missing:**
✗ Hours spent in Excel doing manual analysis
✗ Guessing which metrics matter
✗ Waiting for IT to run queries

**What you could have:**
✓ Instant AI analysis of any dataset
✓ Beautiful charts generated automatically
✓ Plain English answers to data questions

[Jump Back In →]({{app_url}})

**Need help getting started?**

1. Don't have data handy? Use our sample datasets
2. Not sure what to ask? Try: "Summarize this data"
3. Stuck? Reply to this email - I'll help personally

Best,
Kyle

P.S. Fun fact: Users who upload data in their first week are 3x more likely to become power users.
    `.trim(),
    cta: {
      text: 'Continue Setup',
      url: '{{app_url}}/data'
    }
  },

  // Day 10 - Limited offer
  limited_offer: {
    subject: "🎁 20% off Pro - expires in 48 hours",
    preheader: "Special offer for early adopters",
    body: `
Hi {{name}},

I've been watching your progress in DataFlowHub, and I think you're ready for the next level.

**For the next 48 hours, get 20% off Pro:**

Use code: EARLY20

**What you unlock with Pro:**
- Unlimited AI questions (vs 10/day on Free)
- Rich model narratives with detailed explanations
- Knowledge base for business context
- Smart recommendations
- Priority support

**Regular price:** $49/month
**Your price:** $39/month (save $120/year)

[Claim Your Discount →]({{pricing_url}}?code=EARLY20)

This offer expires {{expiry_date}} and won't be available again.

Best,
Kyle

P.S. Not ready to upgrade? No worries - you can keep using the free tier. But if you've hit any limits, this is your chance to remove them at a discount.
    `.trim(),
    cta: {
      text: 'Get 20% Off Pro',
      url: '{{pricing_url}}?code=EARLY20'
    }
  },

  // Day 14 - Final reminder
  final_reminder: {
    subject: "Last chance: Your Pro discount expires today",
    preheader: "Don't miss out on 20% off",
    body: `
Hi {{name}},

Just a quick note - your 20% discount for DataFlowHub Pro expires today at midnight.

**Use code EARLY20 before it's gone:**
[Upgrade Now →]({{pricing_url}}?code=EARLY20)

After today, Pro will be full price ($49/month).

If you're not ready to upgrade, that's totally fine. You can keep using the free tier for as long as you like.

But if you've been thinking about it - now's the time.

Best,
Kyle

P.S. Questions? Just reply to this email.
    `.trim(),
    cta: {
      text: 'Claim 20% Off',
      url: '{{pricing_url}}?code=EARLY20'
    }
  },

  // Activation milestone - first model
  first_model_congrats: {
    subject: "🎉 Congrats! You trained your first ML model",
    preheader: "You're officially a data scientist now",
    body: `
Hi {{name}},

You just trained your first machine learning model in DataFlowHub!

**Model: {{model_name}}**
**Accuracy: {{accuracy}}%**

This is a huge milestone. Most people never get this far with ML.

**What's next?**

1. **Ask the AI about your model:** "Explain why the model made these predictions"
2. **Try different algorithms:** See if Random Forest beats your current model
3. **Deploy it:** Make predictions on new data

[See Your Model →]({{app_url}}/models)

**Pro tip:** With Pro, you get detailed model narratives that explain exactly why your model works (or doesn't).

Best,
Kyle

P.S. Screenshot your model and share it! You earned this. 🏆
    `.trim(),
    cta: {
      text: 'View Your Model',
      url: '{{app_url}}/models'
    }
  }
};

/**
 * Get email template with variables replaced
 */
export function renderEmail(
  templateId: keyof typeof EMAIL_TEMPLATES,
  variables: Record<string, string>
): EmailTemplate {
  const template = EMAIL_TEMPLATES[templateId];
  
  let body = template.body;
  let subject = template.subject;
  let ctaUrl = template.cta.url;
  
  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    body = body.replace(regex, value);
    subject = subject.replace(regex, value);
    ctaUrl = ctaUrl.replace(regex, value);
  });
  
  return {
    ...template,
    body,
    subject,
    cta: {
      ...template.cta,
      url: ctaUrl
    }
  };
}

/**
 * Email sequence schedule
 */
export const EMAIL_SEQUENCE = [
  { day: 0, templateId: 'welcome' },
  { day: 2, templateId: 'feature_highlight' },
  { day: 5, templateId: 'success_story' },
  { day: 7, templateId: 'data_waiting' },
  { day: 10, templateId: 'limited_offer' },
  { day: 14, templateId: 'final_reminder' },
] as const;

