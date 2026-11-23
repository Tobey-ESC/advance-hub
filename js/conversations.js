/* ============================================================================
   ADVANCED HUB — conversation records  (the ONLY place records live)

   HOW TO ADD A CASE
   1. Copy any object below and paste it at the TOP of the array (newest first
      is nice, but the app sorts by dateAdded so order does not matter).
   2. Give it a unique id (ADV-0XX), and fill in the fields.
   3. Save and refresh the browser. Dashboard, filters and counts update.

   FIELDS
     id            unique, e.g. "ADV-015"
     title         short, specific headline
     category      "inbox" | "automation"            (see js/config.js)
     topic         one topic from that category's list in js/config.js
     tags          free-form array; independent from category and topic
     status        "investigating" | "resolved" | "workaround" | "escalated"
     dateAdded     "YYYY-MM-DD"
     summary       what the customer reported
     investigation what was checked / how it was reproduced      (optional)
     findings      what was discovered                           (optional)
     resolution    fix or workaround                             (optional)
     intercomUrl   link to the original conversation             (optional)

   TEXT FORMATTING (inside summary / investigation / findings / resolution)
     blank line = new paragraph          - item   = bullet list
     1. item    = numbered list          `code`   = inline code
     **bold**   = highlight              ```...```= code block
     > quote    = quote                  ## Head  = small heading
   Use backtick template strings (`...`) so multi-line text works.

   NOTE: records below are SAMPLE DATA with placeholder links. Replace them.
   ========================================================================== */

window.ADVANCED_CONVERSATIONS = [
  {
    id: "ADV-001",
    title: "Forwarding Setup",
    category: "inbox",
    topic: "Assignment & Routing",
    tags: ["Email Deliverability", "Missing Inbound Replies", "Outbound Email Status", "Sent Status", "Delivery Logs", "Bounce Check", "Customer Mailbox Issue", "No Bug Found", "Awaiting Customer"],
    status: "investigating",
    dateAdded: "2026-11-17",
    summary: "Cx wanted emails to trust@polymarket.us and legal.escalations@polymarket.com forwarded into Intercom as tickets. They wanted this to match their existing support@ setup in the Polymarket US workspace. Forwarding for both addresses now works. They still want the tickets routed to a dedicated Legal inbox, and that is not working yet. My 15:10 reply on the workflow fix is the last message, and the customer hasn't answered it",
    investigation: `
    - The customer's Google forwarding test failed for trust@polymarket.us with an admin-access banner.
- Logs showed the Google confirmation email was for trust@polymarket.com, not .us.
- Their IT confirmed .com is the real inbox and .us is an alias.
- The confirmation email had landed as a ticket in their T1 - Decagon team inbox, not in Unassigned. That is why they couldn't find it.
- legal.escalations@polymarket.com was set up in the Polymarket workspace, not Polymarket US. That is why the forwarded "Complaint Resolution Process" email didn't show under Polymarket US.
- trust@polymarket.us was added in both workspaces and was verified in neither.
- Google returned a 502 error when the customer clicked verify.
- Test emails reached Intercom, but replies went out from the Intercom alias instead of support@.
- Tickets landed in Unassigned T2, not the Legal inbox they created.
`,
    findings: `- Forwarding only delivers mail. Where it lands depends on workflows and the default assignment settings, and that was sending it to T1 Decagon.
- A "when customer sends any message" workflow only catches conversations, not tickets.
- A "May be delayed" note on the assignment workflow meant another auto-reply workflow was running first.
- The Google 502 was temporary and came from Google's side.
- The customer's IT person doesn't need Polymarket US access for the Google confirmation step.
`,
    resolution: `- Confirmed the forwarding from the trust@polymarket.com mailbox, and the customer completed it.
- Found the confirmation email for the customer. It was in the T1 Decagon team inbox.
- legal.escalations@ was verified.
- Gave the customer steps to move legal.escalations@ to Polymarket US: re-add it there, repoint forwarding to the Polymarket US address, then delete it from the Polymarket workspace.
- For trust@polymarket.us, told the customer to delete it from the Polymarket workspace so it lives only in Polymarket US.
- Gave steps for a workflow that assigns legal.escalations@ to the Legal inbox, with Channel set to Email and an Email recipient condition. Sent a Loom video as well.
- Gave steps to exclude that address from the auto-reply workflow.
- Gave steps to send replies from the inbound address, using Email settings > Sending addresses > "Teammate replies from" > Inbound address.
- Advised a separate workflow with the "A ticket is created" trigger to route tickets to the Legal inbox.
- Open: waiting for the customer to confirm the ticket-routing workflow works.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476892153143?skipRedirection=true"
  },
  {
    id: "ADV-002",
    title: "Missing Replies and Missing Emails even it's 'Sent'",
    category: "automation",
    topic: "Email & Deliverability",
    tags: ["Workflows", "Workflow not triggering", "Email recipient or audience matching", "Bug / known issue", "Timing bug (race condition on inbound email)", "Engineering escalation", "GitHub issue #556742 (second occurrence)", "Feature flag disabled", "Workaround provided", "Fin handoff"],
    status: "investigating",
    dateAdded: "2026-11-17",
    summary: "two email issues. First, a patient said she replied to several emails, but the replies never appeared in the conversation. Second, outbound emails sent on Nov 5 showed only 'Sent' and the patient said she never received them. We found no sign of either problem on our side. We told the customer to check their own mailboxes and sent two follow-ups. As of Nov 19, 06:06 the customer hasn't replied",
    investigation: `- Checked the inbound logs for the patient's address, with and without the address filter. Nothing came up for the dates in question.
- Checked the patient's profile. She is not on the bounce list.
- Checked the outbound logs for the Nov 5 emails to the second patient. She is also not on the bounce list.
- Reviewed a later message in the same conversation.
`,
    findings: `- Missing replies: no inbound email from the patient's address reached Intercom. Nothing was dropped, bounced or attached to another conversation.
- "Sent" emails: the Nov 5 email was handed off to the email provider with no errors or drops. Later emails to the same address were delivered and opened, so the address works.
- "Sent" only means the email was handed off. Inbox doesn't show delivery or deferral events.
- The Nov 5 logs had already aged out, so we couldn't see what the recipient's mail provider did with it.
- Both issues point to the customer's side or the patient's mailbox, not to Intercom.

`,
    resolution: `- Replied to the customer on Nov 17 with the findings above.
- Missing replies: asked them to check the help@ mailbox and the CC'd hello@ mailbox for the patient's replies. Also asked them to confirm help@ forwards to their Intercom inbound address, and to send a sent reply or message ID if they want us to look further.
- "Sent" emails: asked them to have the patient search All Mail for "from:help@" and to check the hello@ mailbox. Told them that if it happens again they should send it within a few days so we can pull the logs while they still exist.
- Sent follow-ups on Nov 18 and Nov 19, and said we would close the conversation if we heard nothing.
- Status: awaiting customer response. No bug or product issue was identified.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/conversation/215476890564388?skipRedirection=true"
  },
  {
    id: "ADV-003",
    title: "Workflow didn't trigger on email sent to supportuk@choco.com (known timing bug, #556742)",
    category: "automation",
    topic: "Workflows",
    tags: ["Bug", "Workflow TS"],
    status: "resolved",
    dateAdded: "2026-11-17",
    summary: "Cx asked why a conversation wasn't closed by the 'Route emails v2' workflow, which should have followed the AI Path, then Close branch. Fin first said the workflow was blocked by the two-minute customer-facing trigger limit and suggested a background workflow. Iana then asked for a human. The workflow never ran. I found that the participants list didn't show supportuk@choco.com, which the audience rule matches on. After Iana's screenshot showed the address in the To field, I confirmed the rule should have matched. A senior teammate (Vinicius) reviewed it and identified a known timing bug, and I logged the case against the existing GitHub issue. The customer was told it was logged with Engineering, with no ETA, and the conversation was closed on 2026-11-19.",
    investigation: `I compared the workflow audience rules with the email participants and ran the match debugger. I initially read the mismatch as the recipients (notifications@integrate.choco.com, the slf.uk.com addresses and roberta.saverio@choco.com) not being on the list. I told Iana this.
Iana then showed supportuk@choco.com in the To field. I confirmed the address was in the email but not in the participants list, which was odd.
I sent it to a senior review, and Vinicius checked the logs with Claude.`,
    findings: `Workflow 43897388 was live but had zero execution records, so it never fired.
The trigger fired at 14:23:28.244 UTC. About 54ms later the matching engine logged Election_NoCandidateMatched, and the workflow was dropped with reason no_election.
The To/Cc participants were still being added afterwards, at 14:23:28.633, 14:23:29.185 and 14:23:29.631. At match time supportuk@choco.com wasn't attached yet.
The same workflow hit the same failure in August. That is GitHub issue #556742, still open. The cause is that the workflow trigger fires on conversation creation before the "add all To/Cc recipients as participants" step finishes.
The fix is behind the feature flag delay-workflows-for-inbound-email-pipeline-work-completion. The flag is still disabled for this workspace, so the bug recurred.
The audience rules weren't the problem.
Fin's earlier "emailed within two minutes" explanation did not match these logs.
`,
    resolution: `No fix was applied. The bug is open with Engineering.
Vinicius asked me to comment on #556742 and link this conversation as a second occurrence, including the log findings. The ticket was submitted (state: "GitHub issue submitted").
Workaround given to the customer: add a rule for the sender (notifications@integrate.choco.com) or the subject "Missing / Insufficient Stock", so these emails close reliably.
I told Iana the issue may not be prioritised unless more customers report it, then closed the conversation. She can reopen it at any time.
`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476890913488?skipRedirection=true"
  },
  {
    id: "ADV-004",
    title: "Fin ignored SEPA escalation guidance and falsely escalated on 'Mitarbeiter'",
    category: "inbox",
    topic: "Fin TS",
    tags: ["Fin AI Agent", "Fin Troubleshooting", "Escalation Guidance", "False Escalation", "Missed Escalation", "SEPA", "Lohn & Gehalt", "Guidance Conflict", "Content Flag", "German", "EU Workspace", "Awaiting Customer"],
    status: "workaround",
    dateAdded: "2026-11-17",
    summary: "two problems: Fin ignored an escalation in a SEPA mandate chat. Several chats that day triggered escalation falsely. The link he first sent came from the mentions view, not the Inbox, so Fin couldn't read it and the chat went to a human. I investigated and replied on 2026-11-17. Paul didn't answer the follow-ups on 11-18 and 11-19.",
    investigation: "I reviewed the SEPA chat, which used several German-language guidances, and translated them. I checked the 'Beschwerde Eskalation' guidance against the reported false escalations. I then opened one false-escalation chat and compared it with the 'Explizite Eskalation - New' guidance. That guidance was last updated 2026-09-03..",
    findings: `SEPA chat: Fin matched the SEPA guidance twice (on the PDF and on the mandate-submission message). It still answered from the "SEPA-Firmenlastschrift im Lexware Geschäftskonto" article instead of handing over. The article and the guidance likely conflict. The "don't answer, just confirm the handover" line is a reply instruction, which escalation guidance isn't built for.
False escalations: the "Mitarbeiter" line in "Explizite Eskalation - New" tells Fin to always treat the word as a request for a human. In the chat I checked, the customer meant their own employee's payslips, so Fin handed over. This would affect most Lohn & Gehalt chats that mention employees.
"Beschwerde Eskalation" doesn't match the checked message, so it was probably just listed alongside the real cause.
Only one of the four reported false-escalation chats was checked.`,
    resolution: `I advised Paul to:

Trim the SEPA guidance to just when to escalate, and add an Escalation Rule on the "Thema Lexware Geschäftskonto: SEPA- und Firmenlastschriftmandate" attribute.

Limit the "Mitarbeiter" line to customers asking for a Lexware person, and exclude their own employees.

I supplied suggested wording. Paul hasn't confirmed whether the fixes worked.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/conversation/215476888948009?skipRedirection=true"
  },
  {
    id: "ADV-005",
    title: "Spam handling and SLA exclusion in workflows (email)",
    category: "automation",
    topic: "Workflows",
    tags: ["Workflows", "Spam Management", "SLA", "SLA Reporting", "Email", "Branches", "Custom Attributes", "Fin Handled", "How-To", "No Customer Response"],
    status: "investigating",
    dateAdded: "2026-11-19",
    summary: "Felipe Dias wanted spam emails kept out of his SLA reports and routed automatically to a Spam inbox. Fin handled most of the thread. It escalated to a teammate when the customer asked 'so, else = end?'. I replied, then followed up twice with no response from the customer.",
    investigation: `Customer asked how to get an SLA report that excludes spam. He also asked about:
what happens to the SLA when he manually tags a conversation as spam
auto-tagging spam and auto-sending messages to the Spam folder
SLAs on old or closed conversations
whether deleted spam still counts in reports
how to verify an SLA is applied
He shared screenshots of his workflows and Spam inbox. Fin used them to review his branches.
Fin checked two emails that slipped through his live spam workflow.
On 11-17 he created a custom boolean attribute "Is Spam?" to drive routing.`,
    findings: `A first-message workflow runs once. Tagging or setting an attribute afterwards doesn't rerun it or remove an SLA that was already applied.
Fin's built-in Spam inbox only receives emails filtered before a conversation exists. Workflows can't move an existing conversation there.
The two missed emails were caused by "Rejected:" still being joined with AND instead of OR in the Message Content branch.
Spam and SLA workflows run in parallel, so a single combined workflow with the spam branch first is safest.
The "Is Spam?" path was set up correctly. Its Else path ended, so non-spam conversations got no SLA or routing from that workflow.
Deleting conversations doesn't remove them from reports by default.`,
    resolution: `Fixed the missed emails by changing the connector to OR, adding the extra phrases, and publishing.
Told him to filter reports by tag or "Is Spam?" to exclude manually identified spam.
I confirmed Else = End is fine, because non-spam conversations skip that branch and carry on. I suggested a reusable workflow that can be run manually from the Inbox, so no attribute is needed.
The customer didn't reply to two follow-ups. I said the conversation would be closed, and it reopens if he writes back.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/conversation/215476848776097?skipRedirection=true"
  },
  {
    id: "ADV-006",
    title: "Inbound Eurofins email shows blank in the conversation view (base64 inline image removed)",
    category: "automation",
    topic: "Email & Deliverability",
    tags: ["Inbound Email", "Email Rendering", "Blank Email Body", "Base64 Inline Image", "Expected Behavior", "Feature Request", "Fin Content Gap", "Workaround Provided"],
    status: "resolved",
    dateAdded: "2026-11-14",
    summary: "Janko Milunovic (Axo Longevity, with Carles Roca as their contact) reported that some inbound emails show only the sender and an empty body. The example was a daily Eurofins lab appointment confirmation. Fin suggested TNEF/winmail.dat and attachment-setting causes. The customer ruled both out, then asked for a human. I confirmed with a senior teammate that this is expected behavior. The customer accepted it and will manage a workaround.",
    investigation: `- Checked the raw incoming email. Its HTML body starts with an embedded base64 image (<img src="data:image/png;base64,...), but the admin message content is empty.
- Confirmed there is no real attachment and it is not a TNEF case. The customer's attachment-setting change had no effect.
- Found a GitHub PR, "Don't show image data src in inbound emails", and an open issue about base64 image URLs being rejected.
- Asked a senior teammate (Dave Burke) to sanity-check the behavior.
`,
    findings: `- Intercom keeps only cid: (attached) images and http(s)-linked images in inbound emails. Base64 inline images are removed on purpose, so an email containing only that image renders as blank.
- Fin's earlier answer missed this, and Fin flagged a content gap in the docs.
`,
    resolution: `- I told the customer this is expected. The best fix is for Eurofins to send the image as a normal attachment or include the details as text.
- I said I would pass the request to Product as a feature request (convert inline base64 images to hosted images). Dave agreed it should be filed as an FRQ.
- The customer replied "we will manage a workaround", and I closed out the thread.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/conversation/215476834405279?skipRedirection=true"
  },
  {
    id: "ADV-007",
    title: "Fin sends 'return during support hours' message while the team is open",
    category: "automation",
    topic: "Fin Guidance",
    tags: ["Fin Guidance", "Fin Escalation", "Office Hours", "Human Handoff", "Configuration Issue", "Workflow", "Guidance Scheduling"],
    status: "resolved",
    dateAdded: "2026-11-17",
    summary: "Cx reported that Fin told customers to 'return during support hours' when they asked for a human during staffed hours. About 30 seconds later, the workflow handed off with 'Our team will be with you shortly'. He sent four examples, plus a fifth during the thread. He had already added guidance to stop it, and it didn't help. Fin's first two replies pointed to office hours, timezone and workflow trigger settings. Joshua then asked for a person to review. The conversation was fast-passed to AI & Automation Adv., and I took it from there.",
    investigation: `Joshua confirmed his office hours were correct and that he wasn't using custom team hours.
I reviewed the sample conversations. In the second one, two workflows ran, but nothing showed the workflow caused the off-hours message. The other was only a CSAT request.
I don't have Fin debugger access yet, so I couldn't see Fin's reasoning directly.
I found an older guidance, "Human Support Availability — No Outreach Promises". It sets the exact line "When you return during support hours, request a human agent in this chat and you'll be connected", and it has no time condition. I saw it conflict with his newer support-hours guidance in all four samples.
`,
    findings: `This was a configuration issue, not a bug.
The older guidance had no schedule, so Fin used it at any hour. It spells out the exact wording, so it won over the newer guidance.
Fin can't check office hours from guidance text, so the time rules in the newer guidance couldn't fix it.
The "Our team will be with you shortly" message comes from his workflow, not Fin. It only looked contradictory because of the off-hours line.
`,
    resolution: `I advised three changes:

Set the "Human Support Availability" guidance Schedule to Outside office hours.
Move the "never promise outreach" rule into a separate guidance set to Any time, without the hours wording.
Add a guidance set to During hours that offers an immediate human handoff.
Joshua applied this by creating three separate guidance pieces with different time rules, and said he'd monitor it. I told him I'd hang back and asked him to send a fresh example if it recurs.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476887573636?skipRedirection=true"
  },
   {
    id: "ADV-008",
    title: "Second Slack notification not firing on Live Chat workflow",
    category: "automation",
    topic: "Workflows",
    tags: ["Workflows", "Slack Notification", "Fin Handover", "Workflow Troubleshooting", "Teammate Assignment", "Wait Step", "Branch Conditions", "Customer Error", "Fin Content Gap"],
    status: "resolved",
    dateAdded: "2026-11-17",
    summary: "Nicole wanted to add a second Slack alert to her Fin Live Chat workflow. It should fire if no teammate has taken the chat within 50 seconds. Fin walked her through a Wait, a Branch and a Notify Slack step. She then tested twice and no second alert came through, so she asked for a human. I picked it up, explained the setup and worked out why both tests failed. It was down to how she tested, not a fault in the workflow",
    investigation: `I checked the Slack channel settings and screenshots she shared.
I asked whether a teammate was auto-assigned or replied during the wait. She said chats sit unassigned until an agent replies, and that nobody replied during the wait.
I asked for links to both test chats and checked the path each one took.
`,
    findings: `I confirmed her setup was right: a branch on 'Teammate assigned is None', with the else path left empty so the chat stays open.
The Notify Slack step uses a fixed message template. She can only pick the channel and the attributes to show, so she can't add custom text or tag a Slack group. Fin had told her otherwise at first.
In the first test chat, the 50 second wait started at 14:51:38 and Emily replied at 14:52:25. That was about 47 seconds in, and a teammate reply during the wait ends the workflow before it reaches the Slack branch.
The second test chat went down the 'I've found a bug' path. That path has no wait, branch or second Slack notification, so nothing could fire.
`,
    resolution: `I told her to retest and leave a full minute after the handover message before anyone replies.
I told her that if she wants the same alert on the 'I've found a bug' path, or any other handover path, she needs to add the same Wait, Branch and Notify Slack steps there.
She said both results made sense, put it down to her own testing, and said it should be fine to close.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476888082528?skipRedirection=true"
  },
  {
    id: "ADV-009",
    title: "Workflow didn't fire when the customer went inactive",
    category: "automation",
    topic: "Workflows",
    tags: ["Workflows", "Troubleshooting", "Workflow Not Firing", "Audience Targeting", "Tag Conflict", "Channel Targeting", "Inactivity Trigger", "Fin Handoff"],
    status: "Fixed",
    dateAdded: "2026-11-19",
    summary: "Arda AI wrote in through Fin and asked for a human agent. They wanted to know why a workflow with the 'Customer has been unresponsive' trigger didn't fire when a customer went inactive in another conversation. I looked into it and replied with the cause and the fix.",
    investigation: `I checked the workflow's trigger and audience, and ran the debugger on the other conversation.
I found the workflow itself never ran for that conversation.
I checked how the audience was evaluated, including the tag rule and the channel rule.
`,
    findings: `The audience didn't match the conversation, so the workflow never started.
The tag rule is a "conversation.tag_ids in" check on ongoing_ai and conversation_ai. Neither tag was on the conversation when the customer went quiet, so it came back as not matched.
The tag group is joined to the rest of the audience with AND, so that one miss made the whole audience fail.
The channel check also came back as not matched for web, iOS, Android and Telegram.
The workflow's target channels are only web, iOS and Android. Telegram is in the extra rules but isn't ticked as a target channel, so those two settings conflict.
Fin's summary also didn't append the conversation link in admin, so I had to find it myself.
`,
    resolution: `I told the customer why the audience didn't match. I advised them to:

tick Telegram as a target channel if these chats come in through Telegram;
make sure the tag is added before the customer goes inactive, or drop the tag rule.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476926518743?skipRedirection=true"
  },
  {
    id: "ADV-010",
    title: "Workflow ticket auto-close counting weekends",
    category: "automation",
    topic: "Workflows",
    tags: ["Workflows", "Ticket Automation", "Office Hours", "Snooze", "Weekend Exclusion", "Workaround", "Feature Limitation", "Waiting on Customer", "Fin Handoff", "Solutioning"],
    status: "Workaround",
    dateAdded: "2026-11-19",
    summary: "Avery asked whether the workflow that closes tickets after X days can skip weekends. Fin said the snooze counts calendar time and suggested an office-hours workaround. Avery asked for a human, then shared the workflow link and asked again. I replied with a workaround. Avery hadn't tried it and was confused by the term 'snooze'. I clarified that the 'close in 3 days' step is the snooze and wrote out the full workflow layout.",
    investigation: `I reviewed Fin's earlier answers and Avery's workflow setup. It triggers when a teammate sets the ticket to 'waiting on customer', then closes it after 3 days. I checked whether the wait step could exclude weekends.
`,
    findings: `Weekend exclusion isn't supported natively. The wait counts plain clock time, so a 3-day wait that starts on a Thursday closes the ticket on a Sunday. An office-hours check can work around this, but only if the default office hours are Mon to Fri. With hours like 9 to 5, a wake-up after 5pm also counts as 'outside' and gets pushed a day.
`,
    resolution: `I gave Avery a workaround and a step-by-step layout:

Keep the trigger, the 'waiting on customer' branch, and the 3-day wait.
Add a branch for 'Office hours is Outside office hours'. If yes, snooze 1 more day.
Repeat that branch once more to cover a full weekend.
Then close the ticket.
I followed up on 2026-11-19 and sent the clarified steps. Avery hasn't confirmed yet that it works.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476910577778?skipRedirection=true"
  },
  {
    id: "ADV-011",
    title: "Workflow went down the Else path even though the conditions were met (Create Jira issue)",
    category: "automation",
    topic: "Workflows",
    tags: ["Workflows", "Ticket Automation", "Office Hours", "Snooze", "Weekend Exclusion", "Workaround", "Feature Limitation", "Waiting on Customer", "Fin Handoff", "Solutioning"],
    status: "Workaround",
    dateAdded: "2026-11-19",
    summary: "Sara asked why her workflow action didn't complete when she believed the conditions were met. The workflow is the Jira 'Create Jira issue' workflow for Feature Request tickets. I looked into it and saw that the workflow ran but went down the Else path, so the Jira action never started. I suspect a race condition, and I've asked internally for a second look.",
    investigation: `I read Fin's check of the affected conversation. It showed the workflow matched, started and finished, but it couldn't say which branch ran.
I opened the match debugger. It showed the conversation didn't match the condition and went to the Else path.
I checked the audience rules, and by those rules it should have matched.
I confirmed the affected item is a customer ticket.
I considered whether the ticket type wasn't set yet when the workflow evaluated the branch, which would be a race condition. I also wondered whether a delay before the branch would help.
`,
    findings: `The workflow ran, so channel targeting wasn't the cause.
The conversation fell through the Else path even though the audience rules say it should have matched.
This isn't an API or technical issue. It is a branch-evaluation problem, possibly a timing or race condition.
I haven't confirmed the cause.
`,
    resolution: `Not resolved yet. I've told the customer I'm coordinating internally. I still need to confirm whether the ticket type was set at the moment the branch was evaluated. If it wasn't, I'll advise adding a delay before the branch and update Sara.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476928221827?skipRedirection=true"
  },
  {
    id: "ADV-012",
    title: "Fin still handling The Good Butcher emails despite brand audience filter",
    category: "automation",
    topic: "Fin Deployment",
    tags: ["Fin AI Agent", "Fin Troubleshooting", "Fin Email Deployment", "Fin Audience", "Multibrand", "Brand Filter", "Workflow Check", "Solutioning"],
    status: "Workaround",
    dateAdded: "2026-11-19",
    summary: "Moustafa wanted to stop Fin from replying to The Good Butcher, his second brand, while keeping it live for HelloChef. He added 'Brand is HelloChef' and 'Brand is not The Good Butcher' filters to the Fin Deploy audiences for chat and email. Fin kept handling The Good Butcher emails anyway. He sent several example conversations. He disagreed with my first answer and suspected a workflow was overriding his filters.",
    investigation: `I reviewed the example conversations and the Fin summary notes. The only recorded workflow was 'Route customer conversations to the right team'. It only assigns The Good Butcher Support and has no Fin step.
I checked the conversation timeline. The brand starts as Hello Chef and changes to The Good Butcher a moment after Fin acts.
I opened one sample conversation and found Fin closed it as junk/spam without replying.
I left stream links as internal notes for the examples.
`,
    findings: `The audience setup and the email-to-brand mapping were fine, and no workflow was overriding the filter.
It's a timing issue. Fin's Deploy checks its audience the moment the email lands, before the brand is set. A brand-based rule can't match, so Fin goes ahead.
One sample was a separate case. Fin closed it as junk, not as a reply.
`,
    resolution: `My first reply suggested connecting The Good Butcher's address to the brand. He disagreed because the addresses were already mapped.
My second reply told him to swap the brand rule in Fin > Email for an address-based rule. That means 'Email to' is the HelloChef address, or 'Email recipient' does not contain The Good Butcher's address. If emails are forwarded in, he should use the address in the To field on the original email.
I've replied with the fix, and he hasn't confirmed it worked yet.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476928221827?skipRedirection=true"
  },
  {
    id: "ADV-013",
    title: "Payout notification auto-close workflow and Fin guidance review",
    category: "automation",
    topic: "Fin Deployment",
    tags: ["Workflows", "Auto-Close", "Fin Guidance Review", "Fin Escalation Setup", "Email Automation", "Workflow Troubleshooting", "Solutioning", "Customer Education"],
    status: "Workaround",
    dateAdded: "2026-11-19",
    summary: "Aicel from Blackbird was getting payout notification emails that she wanted auto-closed. She couldn't work out the workflow setup and asked Fin for a human. I took it from there. I helped her build the auto-close workflow, then reviewed her Fin guidance and escalation setup. Last, I advised her on which payout workflow to keep.",
    investigation: `I checked the existing background workflow. It only adds a tag to the card-related emails. The payout emails fall through to the else path, so nothing happens to them.
I looked at the payout email headers and the sender (restaurants@blackbird.xyz). I decided to match on the message content, because that sender probably sends other emails she still wants to see.
Aicel later said some payout emails closed and others didn't. I had her grant workspace access so I could compare the closed and open ones.
I went through her Fin guidance and escalation pages to answer her greeting question and check her setup.

`,
    findings: `The open payout emails were older ones, like the Nov 16 one, that arrived before the workflow went live. The workflow only closes new emails, so it doesn't touch the old ones.
Her Greetings guidance says 'Do not include greetings in follow-up responses', but Fin reads 'follow-up' loosely and adds a greeting on email.
I found these guidance issues:
Her phone and email policies contradict each other.
The Fly & Standard Timelines guidance is missing the chat channel.
Her escalation rules compete with each other.
The answer-first exceptions would work better as Content guidance.
The tier and bonus details belong in Help Center articles or snippets.
`,
    resolution: `I gave her steps for a standalone auto-close workflow. It triggers on 'Customer sends their first message' with a condition on 'Payout for period ending' (or the email subject) and ends with a Close conversation step.
I told her to clear the older payout emails in bulk from her inbox.
I gave her an explicit first-reply-only greeting rule to try in the email preview.
I listed the guidance fixes, and she said she has made the adjustments.
I told her to keep only one payout workflow, either the standalone one or the branch inside her routing workflow. I recommended the standalone one so two workflows aren't closing the same email.
I asked her to watch the next payout email to confirm it closes.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476924617189?skipRedirection=true"
  },
  {
    id: "ADV-014",
    title: "Forward composer omits email thread history",
    category: "automation",
    topic: "Email Forwarding",
    tags: ["Bug", "Email Forwarding", "Forward Composer", "Inbox Composer", "Email Conversation History", "Engineering Escalation", "GitHub Issue Submitted", "Workaround Provided", "Impersonation", "Reproduced"],
    status: "Workaround",
    dateAdded: "2026-11-18",
    summary: "Matthew Wheeler reported that when he forwards an email from Intercom, the composer leaves out the thread history he can see in the original message. 'Include conversation history in replies' was already enabled, and the original conversation was a native email. Fin's troubleshooting didn't resolve it, and the customer asked for an escalation. I picked it up and confirmed the bug, gave him a workaround, and logged it with Engineering. I told him it may not be prioritized quickly without more reports. He replied 'ty' and I'm keeping the conversation open for a day or so.",
    investigation: `I reviewed Fin's troubleshooting. It covered the history setting, chat versus email origin, and history deleted in the composer. The customer ruled all of these out.
I asked for account access to check on my end. He approved it.
I reproduced it through impersonation: click the 3 dots on the original email, click Forward, and the composer opens without the history.
I found a similar bug that was already closed and used it as a reference.
`,
    findings: `The history shows on the original message, but the Forward composer populates without it. This is a bug on our side, not a settings or user error.
It happens on a native email conversation with the history setting turned on.
I classed it as a P2/P3 issue, not P1. There was no matching issue in the backlog, so I created a new one.
`,
    resolution: `I gave the customer a workaround. He can click the 3 dots under the original message to expand the history, copy it, and paste it into the forward.
I converted the conversation to a 'Report an issue' ticket and submitted a GitHub issue to Engineering.
I set expectations with him that this may not be addressed right away unless more customers report it.
I told him I'd keep the conversation open for a day or so in case he has more details, questions, or Engineering needs more information.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476914434536?skipRedirection=true"
  },
  {
    id: "ADV-015",
    title: "Fin Vision misread URL in screenshot, falsely reported a domain typo",
    category: "automation",
    topic: " Fin Vision",
    tags: [ "Fin Vision", "Fin AI Agent", "Fin Reasoning", "Fin Hallucination", "Screenshot Misread", "Bug", "Engineering Escalation", "GitHub Issue", "P2/P3"],
    status: "Open",
    dateAdded: "2026-11-23",
    summary: "Cx reported that Fin Vision misread a customer's screenshot. Fin told the customer they had typed an extra 'a' in 'jaxaautodealers.com', but the screenshot showed the correct domain, 'jaxautodealers.com'. I confirmed it was a misread and escalated it to Engineering through a GitHub issue. I'm now waiting on their review.",
    investigation: `I reviewed the screenshot and the Fin reasoning lines Melissa quoted from the original conversation.
I checked what the screenshot showed against what Fin told the customer.
I checked for a known issue with Fin misreading one-character differences in URLs. I also checked whether there is a way to view the image description Fin generates.
I converted the conversation to a ticket and logged a GitHub issue with the evidence.

`,
    findings: `The screenshot showed the correct domain, "jaxautodealers.com", with the error "ERR_QUIC_PROTOCOL_ERROR". There was no typo.
Fin Vision extracted the URL and the error code correctly. The failure was in the reasoning step, which wrongly flagged a typo and told the customer to use a different link.
The customer never confirmed a typo and asked for a live agent right after.
I found no known issue for one-character URL misreads. I also found no way for Melissa to view Fin's image description.

`,
    resolution: `I gave the customer a workaround. He can click the 3 dots under the original message to expand the history, copy it, and paste it into the forward.
I converted the conversation to a 'Report an issue' ticket and submitted a GitHub issue to Engineering.
I set expectations with him that this may not be addressed right away unless more customers report it.
I told him I'd keep the conversation open for a day or so in case he has more details, questions, or Engineering needs more information.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476972098875?skipRedirection=true"
  },
  {
    id: "ADV-016",
    title: "Forward composer omits email thread history",
    category: "automation",
    topic: "Email Forwarding",
    tags: ["Bug", "Email Forwarding", "Forward Composer", "Inbox Composer", "Email Conversation History", "Engineering Escalation", "GitHub Issue Submitted", "Workaround Provided", "Impersonation", "Reproduced"],
    status: "Workaround",
    dateAdded: "2026-11-18",
    summary: "Matthew Wheeler reported that when he forwards an email from Intercom, the composer leaves out the thread history he can see in the original message. 'Include conversation history in replies' was already enabled, and the original conversation was a native email. Fin's troubleshooting didn't resolve it, and the customer asked for an escalation. I picked it up and confirmed the bug, gave him a workaround, and logged it with Engineering. I told him it may not be prioritized quickly without more reports. He replied 'ty' and I'm keeping the conversation open for a day or so.",
    investigation: `I reviewed Fin's troubleshooting. It covered the history setting, chat versus email origin, and history deleted in the composer. The customer ruled all of these out.
I asked for account access to check on my end. He approved it.
I reproduced it through impersonation: click the 3 dots on the original email, click Forward, and the composer opens without the history.
I found a similar bug that was already closed and used it as a reference.
`,
    findings: `The history shows on the original message, but the Forward composer populates without it. This is a bug on our side, not a settings or user error.
It happens on a native email conversation with the history setting turned on.
I classed it as a P2/P3 issue, not P1. There was no matching issue in the backlog, so I created a new one.
`,
    resolution: `I gave the customer a workaround. He can click the 3 dots under the original message to expand the history, copy it, and paste it into the forward.
I converted the conversation to a 'Report an issue' ticket and submitted a GitHub issue to Engineering.
I set expectations with him that this may not be addressed right away unless more customers report it.
I told him I'd keep the conversation open for a day or so in case he has more details, questions, or Engineering needs more information.`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476914434536?skipRedirection=true"
  },
  {
    id: "ADV-017",
    title: "Preventing multiple chats in the Messenger, plus avatar and customer name questions",
    category: "automation",
    topic: "Messenger",
    tags: [ "Messenger", "Conversation Management", "Multiple Conversations", "Outbound", "Expected Behavior", "Settings Guidance", "Fin Escalation", "Solutioning"],
    status: "Open",
    dateAdded: "2026-11-23",
    summary: "Cx asked how to limit users to one conversation. Fin walked him through the setting, he turned it on, and he then reported a customer who still opened two chats. He also asked about an avatar tool and about showing names instead of emails. He asked Fin for a human and a video call, and Fin routed the chat to me. I checked the customer's two chats and explained that the setting was working and the second chat was expected. I also answered the avatar and name questions.",
    investigation: `I looked at the customer Nathan flagged and checked both of their conversations. I also checked the selection set to see where each chat came from.
`,
    findings: `The first chat was an outbound chat started by Nathan's teammate from the Inbox (14:43 UTC).
The customer started a second chat from the Messenger about six minutes later (14:49 UTC, from the status page).
The 'prevent multiple' setting only looks at chats the customer starts. It didn't see the outbound chat as open, so the start button was still shown.
The setting also only takes effect after a page refresh, and it doesn't cover replies to outbound messages or workflows.
'Let visitors start a conversation' only controls the start button, so it doesn't affect the URL visit workflow.
Intercom has no built-in avatar creator, and there is no setting to show names instead of emails. Inbox shows the name if the contact has one and falls back to the email if not.
`,
    resolution: `explained that this was expected behaviour. Here is what I told him:

His team should reply in a customer's existing chat when there is one, and check for an open conversation before starting a new one from the Inbox.
If his team needs to message someone first, they can send it as an email so it doesn't open a chat.
He can also turn on 'Prevent visitors/users replying to closed conversations'.
He should keep 'Let visitors start a conversation' on.
Teammates can upload their own photo under Settings > Personal > Details, and Canva or DiceBear are free tools for making one.
To get names instead of emails, he can pass the name when installing Intercom for logged-in users, or collect it with a workflow.
`,
    intercomUrl: "https://intercomrades.intercom.com/a/inbox/tx2p130c/inbox/admin/8803726/conversation/215476971566452?skipRedirection=true"
  }
];