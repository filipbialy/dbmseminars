/* Seminar 9 · Northway Home board meeting — all seminar content.
   Edit this file to change questions, facts or wording. Nothing here is secret from students who open the page source;
   the check questions only need the printed text, so that is acceptable for a classroom exercise. */
window.CONTENT = (function () {
  const DECISIONS = {
    1: { t: 'Fit or redesign?', d: 'Should Northway buy a standard system (ERP package) and change itself to fit it, or build around the system the board has just designed?' },
    2: { t: 'Junior employees', d: 'Looking at Team D’s wireframe screen: what will the 30 graduates actually do, and how will they build expertise?' }
  };
  const NAV = { A: 'Stock', B: 'Delivery', C: 'Customers', D: 'People', E: 'Dashboard' };
  const STATUS = ['Ordered', 'In warehouse', 'Out for delivery', 'Failed', 'At pick-up point', 'Collected'];

  // f(text, kind, component type(s) accepted, "On your wireframe screen" line)
  // kind: key | case (true case fact) | false (contradicts reading) | mis (misleading) | dis (irrelevant)
  const f = (text, kind, comp, screen) => ({ text, kind, comp: Array.isArray(comp) ? comp : [comp], screen });
  // q(pool, where, question, accepted answers, hint). An answer is accepted if it CONTAINS one of the accepted strings
  // (after removing spaces and punctuation); a string starting with '=' must match exactly.
  const q = (pool, where, q, a, hint) => ({ pool, where, q, a, hint });

  const TEAMS = {
    A: {
      name: 'Inbound Logistics & Procurement', short: 'Inbound logistics', vc: 'Primary activity',
      role: 'You run everything that comes INTO Northway: ordering from suppliers, receiving goods and keeping the warehouse stocked.',
      screenTitle: 'Stock & reorder', screen: 'The warehouse “stock & reorder” screen, used by warehouse staff.',
      test: 'Does it help warehouse staff keep the right stock in the right place?',
      order: 'The velvet cushion for #NW-1042 is in stock — and where it is.',
      read: 'Paragraphs 1–3 (everyone) and 4, 5, 7 (your part)',
      exam: ['Inbound logistics (primary activity)', 'Upstream supply chain', 'Bullwhip effect', 'Just-in-time and safety stock'],
      system: 'Automated warehousing systems',
      qs: [
        q('core', 'Paragraph 1', 'In which year was Alibaba Group founded?', ['=1999', 'in1999'], 'The first sentence of paragraph 1.'),
        q('core', 'Paragraph 1', 'How many founders started Alibaba?', ['=18', '18founder', 'eighteen'], 'A number just before “founders”.'),
        q('core', 'Paragraph 3', 'How many smaller logistics companies joined the Cainiao consortium?', ['8000', '8k', 'eightthousand'], 'Next to “20 major players”.'),
        q('team', 'Paragraph 4', 'What do the robots follow to bring shelving racks to the warehouse clerks?', ['rfid'], 'A four-letter technology abbreviation, on the floor.'),
        q('team', 'Paragraph 4', 'What happened to the efficiency of picking and packing in the intelligent warehouses?', ['doubl', 'twice', '2x', 'x2'], 'One word: it became two times as high.'),
        q('team', 'Paragraph 4', 'Cainiao’s domestic fulfilment centres are dedicated to which Alibaba store?', ['tmall', 'supermarket'], 'TMall …'),
        q('team', 'Paragraph 4', 'What is the term for unexhausted (unused) space in a warehouse?', ['honeycomb'], 'It sounds like something bees build.'),
        q('team', 'Paragraph 5', 'Customs needs three pieces of data for every order: transaction, payment and … ?', ['shipping'], 'The data about sending the parcel.'),
        q('team', 'Paragraph 7', 'Delivery data from Cainiao supports merchants’ daily operations such as replenishment … what?', ['planning'], 'The last word of the sentence about daily operations.')
      ],
      facts: [
        f('Customers rate our “reserve online, collect from the warehouse in 2 hours” service as our best feature. The standard ERP package has no workflow for it.', 'key', ['chips', 'segmented'], 'Chips — tag each pick as “Collect in 2h” or “Home delivery”, so staff prioritise the 2-hour orders'),
        f('We re-order from suppliers using last week’s sales spreadsheet. Our orders to suppliers swing up and down far more than actual customer demand.', 'key', ['list', 'card'], 'List — suggested reorders calculated from today’s live sales, which suppliers can see too'),
        f('Warehouse pickers spend about a quarter of every shift searching for items, because stock locations are not recorded in any system.', 'key', ['card', 'list'], 'Card — one item with its exact location: aisle, bay and shelf'),
        f('In the Cainiao case, robots find shelves by following RFID floor tags, which doubled picking and packing efficiency.', 'case', ['search', 'textfield'], 'Search — scan an item’s tag or type its name to find it straight away'),
        f('In the Cainiao case, warehouse robots find their way using GPS satellites and replaced all warehouse clerks.', 'false', ['card'], 'Card — a map of the robot fleet on GPS'),
        f('The warehouse was refurbished in 2021 and has a new roof.', 'dis', ['carousel'], 'Carousel — photos of the new roof'),
        f('A robotics vendor’s brochure claims its robots cut warehouse costs by 90% in any business.', 'mis', ['efab'], 'Extended FAB — “Buy robots now”'),
        f('Our biggest supplier is a ceramics factory in Portugal.', 'dis', ['tooltip'], 'Tooltip — “Made in Portugal”'),
        f('Warehouse staff voted to move the lunch break to 12:30.', 'dis', ['snackbar'], 'Snackbar — “Lunch is at 12:30”'),
        f('Northway sells around 6,000 different products.', 'dis', ['badge'], 'Badge — “6,000” on the menu icon'),
        f('A consultant’s blog says every company that installs an ERP system saves 20% of its costs.', 'mis', ['dialog'], 'Dialog — “Installing ERP will save us 20%”'),
        f('The forklift trucks are leased and the lease ends in 2028.', 'dis', ['datepicker'], 'Date picker — the lease end date'),
        f('The warehouse car park has 60 spaces.', 'dis', ['slider'], 'Slider — how full the car park is'),
        f('Packaging costs rose by 4% last year.', 'dis', ['progress'], 'Progress indicator — packaging costs this year'),
        f('A supplier offers a 2% discount for paying invoices within 10 days.', 'dis', ['checkbox'], 'Checkbox — “Pay within 10 days”')
      ]
    },
    B: {
      name: 'Outbound Logistics', short: 'Outbound logistics', vc: 'Primary activity',
      role: 'You run everything that goes OUT of Northway: couriers, deliveries and the “last mile” to the customer’s door.',
      screenTitle: 'Choose delivery', screen: 'The customer’s “choose delivery or pick-up point” screen in Northway’s app.',
      test: 'Does it help the customer choose how to get their parcel?',
      order: 'Jane chooses a pick-up point (Spar, Bold Street) after her delivery failed.',
      read: 'Paragraphs 1–3 (everyone) and 6, 8, 9 (your part)',
      exam: ['Outbound logistics (primary activity)', 'Downstream supply chain', 'The last mile', 'Physical flow vs information flow'],
      system: 'Automated shipment scheduling systems',
      qs: [
        q('core', 'Paragraph 1', 'In which city was Alibaba founded?', ['hangzhou'], 'A Chinese city named in the second line.'),
        q('core', 'Paragraph 2', 'What is another name for the “last mile”?', ['lastkilomet', 'kilomet'], 'It is in brackets right after “last mile”.'),
        q('core', 'Paragraph 3', 'What does “Cainiao” mean in Chinese?', ['rookie'], 'In brackets after the name.'),
        q('team', 'Paragraph 6', 'What is the term for delivery vehicles returning empty to the transportation depot?', ['emptyrunning'], 'Two words; the explanation in brackets comes right after it.'),
        q('team', 'Paragraph 6', 'What kind of database is built into Cainiao’s standardised e-shipping labels?', ['address'], 'A “Level 5 Customer … Database”.'),
        q('team', 'Paragraph 8', 'How many self-pickup spots in China does the case mention?', ['40000', '40k', 'fortythousand'], 'A number followed by “thanks to arrangements with…”.'),
        q('team', 'Paragraph 8', 'What is the name of the tracking app Cainiao launched in 2016?', ['guoguo'], '“Cainiao ______”.'),
        q('team', 'Paragraph 8', 'How are customers told their parcel has reached the pick-up station? (one of two ways)', ['sms', 'email', 'text'], 'Two ways, one of them on your phone.'),
        q('team', 'Paragraph 9', 'Cainiao’s goal is delivery anywhere in the world within how many hours?', ['=72', '72hour'], 'Two numbers: one for China, one for the world.')
      ],
      facts: [
        f('18% of first delivery attempts fail, mostly because nobody is at home.', 'key', ['segmented', 'radio'], 'Segmented button — let the customer choose home delivery or a pick-up point before paying'),
        f('Seven in ten of our customers live within one mile of a convenience store, supermarket or college that could act as a pick-up point.', 'key', ['list', 'card'], 'List — nearby pick-up points with distance and opening hours'),
        f('In the Cainiao case, customers are notified by SMS and email when their parcel reaches the pick-up station.', 'case', ['switch', 'checkbox'], 'Switch — let the customer turn arrival alerts on'),
        f('We use three courier firms. Each has its own tracking system, and none shares delivery data with us in real time.', 'key', ['card'], 'Card — one tracking card showing the parcel’s status, whichever courier carries it'),
        f('In the Cainiao case, Alibaba solved the last mile by buying its own fleet of delivery vans.', 'false', ['card'], 'Card — “Track our own vans”'),
        f('A drone start-up says drones could deliver all our parcels within a year.', 'mis', ['radio'], 'Radio button — offer “drone delivery” as an option'),
        f('Our delivery vans are painted in the company’s green and white colours.', 'dis', ['carousel'], 'Carousel — photos of the vans'),
        f('One of our courier firms won an industry award in 2024.', 'dis', ['badge'], 'Badge — an award icon next to the courier’s name'),
        f('Fuel prices fell slightly last quarter.', 'dis', ['progress'], 'Progress indicator — the fuel price trend'),
        f('Since 2022 parcels have been wrapped in recycled cardboard.', 'dis', ['snackbar'], 'Snackbar — “Your parcel is packed in recycled cardboard”'),
        f('Delivery drivers are self-employed contractors of the courier firms.', 'dis', ['list'], 'List — the names of today’s drivers'),
        f('Most orders are placed on Sunday evenings.', 'dis', ['datepicker'], 'Date picker — highlight Sunday evenings'),
        f('A rival retailer advertises “next-day delivery” on TV.', 'dis', ['tooltip'], 'Tooltip — “Our rival offers next-day delivery”'),
        f('Couriers charge Northway extra for deliveries to the Scottish Highlands.', 'dis', ['chips'], 'Chips — “Highlands”, “Islands”'),
        f('Delivery vans are serviced every six months.', 'dis', ['iconbutton'], 'Icon button — open the van service log')
      ]
    },
    C: {
      name: 'Sales, Marketing & Service', short: 'Sales, marketing & service', vc: 'Primary activity',
      role: 'You run everything to do with the customer: selling, marketing, the call centre and after-sales service.',
      screenTitle: 'Customer view', screen: 'A customer-service agent’s “single view of the customer” screen.',
      test: 'Does it help the agent understand and help this customer?',
      order: 'The agent sees Jane Smith’s whole story: order, failed delivery, messages.',
      read: 'Paragraphs 1–3 (everyone), paragraph 8 and the three CRM lecture slides (your part)',
      exam: ['Sales & marketing and service (primary activities)', 'Customer relationship management (CRM)', 'Single view of the customer', 'Churn rate'],
      system: 'Computerised ordering systems + CRM',
      qs: [
        q('core', 'Paragraph 2', 'How many active consumers does Alibaba Group have?', ['552'], 'A number of millions in paragraph 2.'),
        q('core', 'Paragraph 3', 'What is the name of Cainiao’s data-sharing platform?', ['logisticscloud', 'cainiaologistics'], 'In quotation marks: “Cainiao …”.'),
        q('core', 'Paragraph 2', 'A failed delivery results in extra costs and more … what?', ['pollution'], 'An environmental problem.'),
        q('team', 'Paragraph 8', 'In which year did Cainiao launch its tracking app?', ['=2016', 'in2016'], 'A year in the middle of paragraph 8.'),
        q('team', 'Paragraph 8', 'What is the name of that tracking app?', ['guoguo'], '“Cainiao ______”.'),
        q('team', 'Paragraph 8', 'The Cainiao website tracks orders by working with partners abroad and with national … what?', ['postoffice', 'post'], 'Organisations that deliver letters.'),
        q('team', 'Slide “Business Value of Customer Relationship Management Systems”', 'What is the term for the number of customers who stop using or buying a company’s products?', ['churn'], 'Two words; the first starts with “ch”.'),
        q('team', 'Slide “Figure 9.6 Customer Relationship Management (CRM)”', 'The CRM diagram divides its applications into sales, marketing and which third area?', ['service'], 'What a call centre provides.'),
        q('team', 'Slide “Customer Relationship Management”', 'CRM systems provide a single enterprise view of the … what?', ['customer'], 'Who CRM is all about.')
      ],
      facts: [
        f('Customers who suffer a failed delivery are three times more likely to stop buying from us within six months.', 'key', ['badge', 'card', 'chips'], 'Badge — an “at risk of leaving” flag on the customer after a failed delivery'),
        f('Customer data sits in three separate places: the website, the call centre and email marketing. An agent on the phone cannot see a customer’s delivery history.', 'key', ['list'], 'List — one timeline of the customer’s orders, calls, emails and deliveries'),
        f('A pilot AI assistant now answers 70% of routine customer emails (such as “where is my order?”) without a human.', 'key', ['chips', 'segmented'], 'Chips — mark each message “AI reply drafted” or “Needs a person”'),
        f('According to the lecture, CRM systems bring together customer data from across the firm to give a single enterprise view of the customer.', 'case', ['tabs', 'segmented'], 'Tabs — Orders · Deliveries · Messages for the same customer, in one place'),
        f('According to the lecture, churn rate measures how many new customers a firm gains each month.', 'false', ['progress'], 'Progress indicator — “new customers this month (churn)”'),
        f('Our Instagram account gained 12% more followers this year.', 'dis', ['badge'], 'Badge — the follower count'),
        f('Our best-selling product is a green velvet cushion.', 'dis', ['carousel'], 'Carousel — photos of best-selling products'),
        f('The average order is worth £64.', 'dis', ['tooltip'], 'Tooltip — “Average order: £64”'),
        f('A marketing agency claims AI chatbots make human customer service unnecessary in every company.', 'mis', ['switch'], 'Switch — “Turn off human agents”'),
        f('The call centre is open 8am–8pm, Monday to Saturday.', 'dis', ['snackbar'], 'Snackbar — “We’re open 8–8”'),
        f('40% of website visits come from mobile phones.', 'dis', ['slider'], 'Slider — share of mobile visits'),
        f('Customers have been able to pay with Apple Pay since 2023.', 'dis', ['iconbutton'], 'Icon button — Apple Pay logo'),
        f('The Christmas catalogue is printed in October.', 'dis', ['datepicker'], 'Date picker — catalogue print date'),
        f('Our customer satisfaction survey has a 6% response rate.', 'dis', ['radio'], 'Radio button — a 1–5 satisfaction rating'),
        f('The email newsletter goes out every Thursday.', 'dis', ['checkbox'], 'Checkbox — “Send newsletter”')
      ]
    },
    D: {
      name: 'Human Resources', short: 'Human resources', vc: 'Support activity',
      role: 'You are responsible for Northway’s people: hiring, training and careers — including the 30 graduates planned for next year.',
      screenTitle: 'My work today', screen: 'A graduate employee’s work screen: what the AI does, what the person decides, what they are learning.',
      test: 'Does it help the graduate do meaningful work and keep learning?',
      order: 'The graduate’s task: Jane Smith (#NW-1042) has asked for styling advice.',
      read: 'Paragraphs 1–3 of the Alibaba case (everyone) and the HBR article, pages 1–3 and 5–7 (your part)',
      exam: ['Human resource management (support activity)', 'Human-in-the-loop', 'The irony of automation', 'Rebundling work'],
      system: 'Workforce planning systems',
      qs: [
        q('core', 'Paragraph 1', 'Who led Alibaba’s 18 founders?', ['jackma', '=ma'], 'A famous Chinese entrepreneur.'),
        q('core', 'Paragraph 3', 'In which year did Alibaba found Cainiao?', ['=2013', 'in2013'], 'The first words of paragraph 3.'),
        q('core', 'Paragraph 3', 'Before Cainiao, Chinese express delivery firms were competing only on … what?', ['price'], 'One word at the end of a sentence.'),
        q('team', 'HBR, page 2', 'What is the fastest-growing writing request on Fiverr?', ['human'], 'Three words: “… AI content”.'),
        q('team', 'HBR, page 3', 'Whose name is linked to the “irony of automation”? (Surname is enough.)', ['bainbridge'], 'Her first name is Lisanne.'),
        q('team', 'HBR, page 3', 'Roughly how many generalist “AI tutors” did xAI dismiss in September 2025?', ['=500', '500ai', 'fivehundred', 'about500', 'around500', 'roughly500'], 'A round number in the hundreds.'),
        q('team', 'HBR, page 6', 'Which company retrained call-centre employees in remote interior design?', ['ikea', 'ingka'], 'A Swedish furniture retailer.'),
        q('team', 'HBR, page 6', 'Garfield Law’s fees start at how many pounds?', ['=2', '2pound', 'two'], 'A very small number.'),
        q('team', 'HBR, page 7', 'How many “golden questions” did Morgan Stanley’s experts put together?', ['400', 'fourhundred'], 'A round number in the hundreds.')
      ],
      facts: [
        f('20 of the 30 graduate roles planned for next year are first-pass tasks: drafting customer replies, checking orders and producing basic reports.', 'key', ['card', 'list'], 'Card — “The AI handled the routine drafts; you review only the flagged ones”'),
        f('Long-serving customer-service staff have been with the company for nine years on average and know the product range in depth.', 'key', ['button', 'chips', 'efab'], 'Common button — “Ask my mentor” (an experienced colleague)'),
        f('In exit interviews, last year’s graduates said they left mainly because the work was repetitive and they were not learning anything.', 'key', ['progress', 'slider'], 'Progress indicator — the skills I am building this month'),
        f('The HBR article argues that as automation becomes more reliable, the people checking it become less attentive and their skills weaken.', 'case', ['dialog', 'card'], 'Dialog — “Your decision needed”: a case the AI cannot decide, which the graduate must judge'),
        f('The HBR article recommends that every AI output should be checked by a junior employee before it is used.', 'false', ['list'], 'List — “All 500 AI replies to check today”'),
        f('The staff canteen was renovated last year.', 'dis', ['carousel'], 'Carousel — photos of the canteen'),
        f('A tech blog predicts that AI will replace all junior office jobs within two years.', 'mis', ['snackbar'], 'Snackbar — “Your job ends in two years”'),
        f('Staff turnover in the warehouse is 15% a year.', 'dis', ['badge'], 'Badge — “15%”'),
        f('Staff get a free gym membership after two years of service.', 'dis', ['switch'], 'Switch — gym membership on/off'),
        f('Graduate salaries start at £26,000.', 'dis', ['tooltip'], 'Tooltip — “Starting salary £26,000”'),
        f('Most head-office staff work from home on Fridays.', 'dis', ['segmented'], 'Segmented button — Office · Home'),
        f('HR still uses a paper form for holiday requests.', 'dis', ['datepicker'], 'Date picker — book a holiday'),
        f('Northway has 400 staff in total.', 'dis', ['badge'], 'Badge — “400”'),
        f('Staff engagement survey scores rose by 3 points.', 'dis', ['slider'], 'Slider — engagement score'),
        f('Two HR managers will retire in the next three years.', 'dis', ['tooltip'], 'Tooltip — retirement dates')
      ]
    },
    E: {
      name: 'Administration, Management & Technology', short: 'Management & technology', vc: 'Support activity · chairs the board',
      role: 'You are the CEO’s office and the IT department. You choose the company’s systems — and you organise and chair the board meeting.',
      screenTitle: 'Dashboard', screen: 'The board dashboard: “one company, one database”.',
      test: 'Does it help the board see the whole company in one place and decide?',
      order: '#NW-1042 counted in today’s failed deliveries and customers at risk.',
      read: 'Paragraphs 1–3 of the Alibaba case (everyone), the IBD article and the marked TIME excerpt (your part)',
      exam: ['Firm infrastructure and technology (support activities)', 'ERP: one company, one database', 'Built-in “best practice” processes', 'Switching costs and vendor lock-in'],
      system: 'Administration & management systems; technology development',
      qs: [
        q('core', 'Paragraph 1', 'What revenue did Alibaba’s core commerce businesses make in the twelve months to December 2018? (billion dollars)', ['53.13', '5313'], 'A dollar figure with two decimals.'),
        q('core', 'Paragraph 2', 'China’s online retail sales were expected to reach how many trillion dollars in 2020?', ['=6', '6trillion', 'six'], 'The second number in paragraph 2.'),
        q('core', 'Paragraph 3', 'How many major logistics players joined the Cainiao consortium?', ['=20', '20major', 'twenty'], 'Next to “8,000 smaller ones”.'),
        q('team', 'IBD, paragraph 2', 'Up to how much did Alibaba offer to buy Cainiao shares from minority shareholders? (billion dollars)', ['3.75', '375'], 'A dollar figure in billions.'),
        q('team', 'IBD, paragraph 2', 'On which stock exchange was Cainiao going to be listed?', ['hongkong', 'hk'], 'It is named after a city.'),
        q('team', 'IBD, paragraph 3', 'Who is Alibaba’s chairman, quoted in the article?', ['tsai'], 'Joseph …'),
        q('team', 'IBD, paragraph 5', 'Into how many separate entities did Alibaba plan to split in 2023?', ['=6', 'six', '6entit'], 'A small number.'),
        q('team', 'IBD, paragraph 7', 'Which grocery unit’s spin-off did Alibaba also delay?', ['freshippo'], 'Its name contains “hippo”.'),
        q('team', 'TIME excerpt', 'Which smartphone operating system does TIME compare Cainiao’s platform to?', ['android'], 'It is made by Google.')
      ],
      facts: [
        f('The ERP vendor says its standard package would require us to change about 40% of our current processes to fit its built-in “best practice” workflows.', 'key', ['card'], 'Card — “ERP fit: 40% of our processes would have to change”'),
        f('In 2024 Alibaba cancelled Cainiao’s stock-market listing and offered up to $3.75 billion to keep it, calling logistics strategically important.', 'case', ['card', 'dialog'], 'Card — “Keep in-house or outsource?”: which systems Northway must own itself'),
        f('Customers often ask for room-styling advice, but nobody at Northway is trained to give it. A competitor charges £40 per online styling session.', 'key', ['card', 'badge'], 'Card — “Styling requests this week — no adviser yet”'),
        f('The ERP contract would lock us in for seven years. Switching to another system later would cost about twice as much as installing it.', 'key', ['progress', 'card'], 'Progress indicator — “Lock-in: 7 years; switching later costs 2× the installation”'),
        f('In 2024 Alibaba sold Cainiao to a competitor to cut costs.', 'false', ['card'], 'Card — “Sell our delivery arm”'),
        f('The head-office lease ends in 2029.', 'dis', ['datepicker'], 'Date picker — lease end date'),
        f('The CEO visited a warehouse in Hangzhou in 2019.', 'dis', ['carousel'], 'Carousel — photos from the visit'),
        f('The board meets on the first Monday of each month.', 'dis', ['tabs'], 'Tabs — one tab per board meeting'),
        f('The company logo was redesigned in 2023.', 'dis', ['iconbutton'], 'Icon button — the new logo'),
        f('A software salesperson said “everyone in retail is moving to our ERP”.', 'mis', ['efab'], 'Extended FAB — “Buy the ERP now”'),
        f('The office Wi-Fi was upgraded last month.', 'dis', ['switch'], 'Switch — Wi-Fi on/off'),
        f('The IT team has six people.', 'dis', ['badge'], 'Badge — “6”'),
        f('Finance closes the monthly accounts on the fifth working day.', 'dis', ['snackbar'], 'Snackbar — “Accounts closed”'),
        f('The company website was rebuilt in 2020.', 'dis', ['tooltip'], 'Tooltip — “Website rebuilt 2020”'),
        f('The board has five members.', 'dis', ['chips'], 'Chips — board members’ names')
      ]
    }
  };
  return { DECISIONS, NAV, STATUS, TEAMS };
})();
