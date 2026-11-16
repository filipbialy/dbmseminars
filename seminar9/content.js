/* Seminar 9 · Northway Home board meeting — all seminar content.
   Edit this file to change questions, facts or wording. Nothing here is secret from students who open the page source;
   the check questions only need the printed text, so that is acceptable for a classroom exercise. */
window.CONTENT = (function () {
  const DECISIONS = {
    1: { t: 'Fit or redesign?', d: 'Should Northway buy a standard system (ERP package) and change itself to fit it, or build around the system the board has just designed?' },
    2: { t: 'Junior employees', d: 'Looking at Team D’s wireframe screen: what will the 30 graduates actually do, and how will they build expertise?' }
  };
  const NAV = { A: 'Stock', B: 'Delivery', C: 'Customers', D: 'People', E: 'Systems', F: 'Project' };
  const STATUS = ['Ordered', 'In warehouse', 'Out for delivery', 'Failed', 'At pick-up point', 'Collected'];

  // f(text, kind, component type(s) accepted, "On your wireframe screen" line)
  // All facts are about Northway. kind: key (belongs on the screen) | false (a wrong lesson drawn from the case) | mis (misleading) | dis (irrelevant)
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
      read: 'Your printed pack: paragraphs 1–3 (everyone) and 4–8 (your part)',
      exam: ['Inbound logistics (primary activity)', 'Upstream supply chain', 'Bullwhip effect', 'Just-in-time and safety stock'],
      system: 'Automated warehousing systems',
      qs: [
        q('core', 'Paragraph 1', 'In which year was Alibaba Group founded?', ['=1999', 'in1999'], 'The first sentence of paragraph 1.'),
        q('core', 'Paragraph 1', 'How many founders started Alibaba?', ['=18', '18founder', 'eighteen'], 'A number just before “founders”.'),
        q('core', 'Paragraph 3', 'How many smaller logistics companies joined the Cainiao consortium?', ['8000', '8k', 'eightthousand'], 'Next to “20 major players”.'),
        q('team', 'Paragraph 5', 'What do the robots follow to bring shelving racks to the warehouse clerks?', ['rfid'], 'A four-letter technology abbreviation, on the floor.'),
        q('team', 'Paragraph 5', 'What happened to the efficiency of picking and packing in the intelligent warehouses?', ['doubl', 'twice', '2x', 'x2'], 'One word: it became two times as high.'),
        q('team', 'Paragraph 4', 'Cainiao’s domestic fulfilment centres are dedicated to which Alibaba store?', ['tmall', 'supermarket'], 'TMall …'),
        q('team', 'Paragraph 4', 'What is the term for unexhausted (unused) space in a warehouse?', ['honeycomb'], 'It sounds like something bees build.'),
        q('team', 'Paragraph 6', 'Customs needs three pieces of data for every order: transaction, payment and … ?', ['shipping'], 'The data about sending the parcel.'),
        q('team', 'Paragraph 7', 'Delivery data from Cainiao supports merchants’ daily operations such as replenishment … what?', ['planning'], 'The last word of the sentence about daily operations.')
      ],
      ref: [["card", "Velvet cushion #NW-1042 · Aisle 14 · Bay 3", 16, 72, "A3"], ["search", "Scan or search item", 16, 184, "A4"], ["chips", "Collect in 2h,Delivery", 16, 256, "A1"], ["list", "Suggested reorders (today’s sales)", 16, 304, "A2"]],
      facts: [
        f("Customers love collecting their orders from the warehouse within 2 hours.", 'key', ["chips", "segmented"], "Chips — add Chips labelled “Collect in 2h” and “Delivery”, so each order shows which kind it is"),
        f("Northway orders from suppliers using last week’s sales, so its orders swing up and down.", 'key', ["list", "card"], "List — add a List titled “Suggested reorders”, one row per item, worked out from today’s sales and shared with the supplier"),
        f("Pickers waste a quarter of every shift looking for items.", 'key', ["card", "list"], "Card — add a Card for one item showing exactly where it is kept, e.g. “Velvet cushion · Aisle 14 · Bay 3 · Shelf B”"),
        f("Staff type paper delivery notes into a spreadsheet by hand.", 'key', ["search", "textfield"], "Search — add a Search bar with the text “Scan or type an item”, so staff record new stock without retyping"),
        f("A manager wants GPS robots to replace all warehouse staff, “like Alibaba”.", 'false', ["card"], "Card — add a Card titled “GPS robot map” showing where the robots are"),
        f("A robot seller says its robots cut costs by 90% in any business.", 'mis', ["efab"], "Extended FAB — add an Extended FAB labelled “Buy robots now”"),
        f("The warehouse got a new roof in 2021.", 'dis', ["carousel"], "Carousel — add a Carousel of photos of the new roof"),
        f("Staff voted to move lunch to 12:30.", 'dis', ["snackbar"], "Snackbar — add a Snackbar saying “Lunch is at 12:30”"),
        f("The forklift lease ends in 2028.", 'dis', ["datepicker"], "Date picker — add a Date picker showing the forklift lease end date"),
        f("The warehouse car park has 60 spaces.", 'dis', ["slider"], "Slider — add a Slider showing how full the car park is")
      ]
    },
    B: {
      name: 'Outbound Logistics', short: 'Outbound logistics', vc: 'Primary activity',
      role: 'You run everything that goes OUT of Northway: couriers, deliveries and the “last mile” to the customer’s door.',
      screenTitle: 'Delivery desk', screen: 'The delivery coordinator’s screen: rebook failed deliveries and choose pick-up points.',
      test: 'Does it help the delivery coordinator get every parcel to the customer?',
      order: 'The coordinator rebooks #NW-1042 to a pick-up point (Spar, Bold Street) after the delivery failed.',
      read: 'Your printed pack: paragraphs 1–3 (everyone) and 4–9 (your part)',
      exam: ['Outbound logistics (primary activity)', 'Downstream supply chain', 'The last mile', 'Physical flow vs information flow'],
      system: 'Automated shipment scheduling systems',
      qs: [
        q('core', 'Paragraph 1', 'In which city was Alibaba founded?', ['hangzhou'], 'A Chinese city named in the second line.'),
        q('core', 'Paragraph 2', 'What is another name for the “last mile”?', ['lastkilomet', 'kilomet'], 'It comes right after “last mile”, in quotation marks.'),
        q('core', 'Paragraph 3', 'What does “Cainiao” mean in Chinese?', ['rookie'], 'In brackets after the name.'),
        q('team', 'Paragraph 5', 'What is the term for delivery vehicles returning empty to the transportation depot?', ['emptyrunning'], 'Two words; the explanation follows a dash.'),
        q('team', 'Paragraph 4', 'What kind of database is built into Cainiao’s standardised e-shipping labels?', ['address'], 'A “Level 5 Customer … Database”.'),
        q('team', 'Paragraph 7', 'How many self-pickup spots in China does the case mention?', ['40000', '40k', 'fortythousand'], 'A number followed by “thanks to arrangements with…”.'),
        q('team', 'Paragraph 6', 'What is the name of the tracking app Cainiao launched in 2016?', ['guoguo'], '“Cainiao ______”.'),
        q('team', 'Paragraph 7', 'How are customers told their parcel has reached the pick-up station? (one of two ways)', ['sms', 'email', 'text'], 'Two ways, one of them on your phone.'),
        q('team', 'Paragraph 8', 'Cainiao’s goal is delivery anywhere in the world within how many hours?', ['=72', '72hour'], 'Two numbers: one for China, one for the world.')
      ],
      ref: [["card", "#NW-1042 · Velvet cushion · Failed", 16, 72, ""], ["segmented", "Home delivery,Pick-up point", 30, 184, "B1"], ["list", "Spar, Bold Street · 0.3 mi", 16, 240, "B2"], ["switch", "Text on status change", 16, 416, "B3"], ["card", "Tracking: all 3 couriers in one view", 16, 456, "B4"]],
      facts: [
        f("18% of first deliveries fail because nobody is at home.", 'key', ["segmented", "radio"], "Segmented button — add a Segmented button with two options, “Home delivery” and “Pick-up point”, to rebook a failed delivery"),
        f("Most customers live within a mile of a shop or college that could be a pick-up point.", 'key', ["list", "card"], "List — add a List titled “Pick-up points near the customer”, each row with a name, distance and opening hours"),
        f("Customers phone 900 times a week to ask where their parcel is.", 'key', ["switch", "checkbox"], "Switch — add a Switch labelled “Text the customer when the status changes”"),
        f("Each of Northway’s three couriers has its own tracking system.", 'key', ["card"], "Card — add a Card titled “Tracking” showing the parcel’s status from whichever of the three couriers carries it"),
        f("A director wants Northway to buy its own delivery vans, “like Alibaba”.", 'false', ["card"], "Card — add a Card titled “Our own vans” showing where Northway’s vans are"),
        f("A start-up says drones could deliver every parcel within a year.", 'mis', ["radio"], "Radio button — add a Radio button option labelled “Drone delivery”"),
        f("Northway’s vans are painted green and white.", 'dis', ["carousel"], "Carousel — add a Carousel of photos of the vans"),
        f("Fuel prices fell slightly last quarter.", 'dis', ["progress"], "Progress indicator — add a Progress indicator showing the fuel price trend"),
        f("One courier won an industry award.", 'dis', ["badge"], "Badge — add a Badge with an award icon next to the courier’s name"),
        f("The vans are serviced every six months.", 'dis', ["iconbutton"], "Icon button — add an Icon button that opens the van service log")
      ]
    },
    C: {
      name: 'Sales, Marketing & Service', short: 'Sales, marketing & service', vc: 'Primary activity',
      role: 'You run everything to do with the customer: selling, marketing, the call centre and after-sales service.',
      screenTitle: 'Customer view', screen: 'A customer-service agent’s “single view of the customer” screen.',
      test: 'Does it help the agent understand and help this customer?',
      order: 'The agent sees Jane Smith’s whole story: order, failed delivery, messages.',
      read: 'Your printed pack: paragraphs 1–3 (everyone) and 4–8 (your part)',
      exam: ['Sales & marketing and service (primary activities)', 'Customer relationship management (CRM)', 'Single view of the customer', 'Churn rate'],
      system: 'Computerised ordering systems + CRM',
      qs: [
        q('core', 'Paragraph 2', 'How many active consumers does Alibaba Group have?', ['552'], 'A number of millions in paragraph 2.'),
        q('core', 'Paragraph 3', 'What is the name of Cainiao’s data-sharing platform?', ['logisticscloud', 'cainiaologistics'], 'In quotation marks: “Cainiao …”.'),
        q('core', 'Paragraph 2', 'A failed delivery results in extra costs and more … what?', ['pollution'], 'An environmental problem.'),
        q('team', 'Paragraph 4', 'In which year did Cainiao launch its tracking app?', ['=2016', 'in2016'], 'A year in the middle of paragraph 8.'),
        q('team', 'Paragraph 4', 'What is the name of that tracking app?', ['guoguo'], '“Cainiao ______”.'),
        q('team', 'Paragraph 4', 'The Cainiao website tracks orders by working with partners abroad and with national … what?', ['postoffice', 'post'], 'Organisations that deliver letters.'),
        q('team', 'Paragraph 8', 'What is the term for the number of customers who stop using or buying a company’s products?', ['churn'], 'Two words; the first starts with “ch”.'),
        q('team', 'Paragraph 6', 'Figure 9.6 groups CRM applications around the customer: sales, marketing and which third area?', ['service'], 'What a call centre provides.'),
        q('team', 'Paragraph 5', 'CRM systems provide a single enterprise view of the … what?', ['customer'], 'Who CRM is all about.')
      ],
      ref: [["tabs", "Orders,Deliveries,Messages", 0, 64, "C4"], ["card", "Jane Smith · #NW-1042 · Failed", 16, 120, ""], ["badge", "At risk", 272, 128, "C1"], ["list", "Order · call · email · delivery", 16, 232, "C2"], ["chips", "AI reply ready,Needs a person", 16, 408, "C3"]],
      facts: [
        f("Customers whose delivery fails are three times more likely to stop buying.", 'key', ["badge", "chips", "card"], "Badge — add a Badge “At risk” next to the customer’s name after a failed delivery"),
        f("Agents cannot see a customer’s orders, calls and emails together.", 'key', ["list"], "List — add a List titled “Customer timeline”, one row each for orders, calls, emails and deliveries"),
        f("An AI pilot already answers 70% of routine emails.", 'key', ["chips", "segmented"], "Chips — add Chips “AI reply ready” and “Needs a person” to each message"),
        f("Agents open three different systems to answer one call.", 'key', ["tabs", "segmented"], "Tabs — add Tabs “Orders”, “Deliveries” and “Messages”, all for the same customer"),
        f("A manager says churn means the new customers gained each month.", 'false', ["progress"], "Progress indicator — add a Progress indicator titled “Churn: new customers this month”"),
        f("An agency says chatbots make human agents unnecessary.", 'mis', ["switch"], "Switch — add a Switch labelled “Turn off human agents”"),
        f("Northway’s Instagram followers grew by 12%.", 'dis', ["badge"], "Badge — add a Badge showing the Instagram follower count"),
        f("The best-selling product is a green velvet cushion.", 'dis', ["carousel"], "Carousel — add a Carousel of photos of best-selling products"),
        f("Customers can pay with Apple Pay.", 'dis', ["iconbutton"], "Icon button — add an Apple Pay Icon button"),
        f("The newsletter goes out on Thursdays.", 'dis', ["checkbox"], "Checkbox — add a Checkbox labelled “Send newsletter”")
      ]
    },
    D: {
      name: 'Human Resources', short: 'Human resources', vc: 'Support activity',
      role: 'You are responsible for Northway’s people: hiring, training and careers — including the 30 graduates planned for next year.',
      screenTitle: 'My work today', screen: 'A graduate employee’s work screen: what the AI does, what the person decides, what they are learning.',
      test: 'Does it help the graduate do meaningful work and keep learning?',
      order: 'The graduate’s task: Jane Smith (#NW-1042) has asked for styling advice.',
      read: 'Your printed pack: paragraphs 1–3 (everyone) and 4–9 (your part)',
      exam: ['Human resource management (support activity)', 'Human-in-the-loop', 'The irony of automation', 'Rebundling work'],
      system: 'Workforce planning systems',
      qs: [
        q('core', 'Paragraph 1', 'Who led Alibaba’s 18 founders?', ['jackma', '=ma'], 'A famous Chinese entrepreneur.'),
        q('core', 'Paragraph 3', 'In which year did Alibaba found Cainiao?', ['=2013', 'in2013'], 'The first words of paragraph 3.'),
        q('core', 'Paragraph 3', 'Before Cainiao, Chinese express delivery firms were competing only on … what?', ['price'], 'One word at the end of a sentence.'),
        q('team', 'Paragraph 4', 'What is the fastest-growing writing request on Fiverr?', ['human'], 'Three words: “… AI content”.'),
        q('team', 'Paragraph 6', 'Whose name is linked to the “irony of automation”? (Surname is enough.)', ['bainbridge'], 'Her first name is Lisanne.'),
        q('team', 'Paragraph 6', 'Roughly how many generalist “AI tutors” did xAI dismiss in September 2025?', ['=500', '500ai', 'fivehundred', 'about500', 'around500', 'roughly500'], 'A round number in the hundreds.'),
        q('team', 'Paragraph 7', 'Which company retrained call-centre employees in remote interior design?', ['ikea', 'ingka'], 'A Swedish furniture retailer.'),
        q('team', 'Paragraph 8', 'Garfield Law’s fees start at how many pounds?', ['=2', '2pound', 'two'], 'A very small number.'),
        q('team', 'Paragraph 9', 'How many “golden questions” did Morgan Stanley’s experts put together?', ['400', 'fourhundred'], 'A round number in the hundreds.')
      ],
      ref: [["card", "AI drafted 42 replies — check 3 flagged", 16, 72, "D1"], ["dialog", "Your decision: #NW-1042 styling advice", 30, 184, "D4"], ["progress", "Skills I am learning", 30, 384, "D3"], ["button", "Ask my mentor", 100, 416, "D2"]],
      facts: [
        f("Most graduate jobs would be routine drafting that the AI now does.", 'key', ["card", "list"], "Card — add a Card titled “AI did the routine drafts — check only the 3 flagged ones”"),
        f("Experienced staff know Northway’s products very well.", 'key', ["button", "chips", "efab"], "Common button — add a Common button labelled “Ask my mentor”"),
        f("Last year’s graduates left because they were not learning anything.", 'key', ["progress", "slider"], "Progress indicator — add a Progress indicator titled “Skills I am learning this month”"),
        f("Staff stopped spotting the AI’s mistakes once it became good.", 'key', ["dialog", "card"], "Dialog — add a Dialog titled “Your decision”, showing one case the AI could not decide"),
        f("HR wants graduates to check every AI reply, “as HBR recommends”.", 'false', ["list"], "List — add a List titled “All 500 AI replies to check today”"),
        f("A blog says AI will replace all junior jobs within two years.", 'mis', ["snackbar"], "Snackbar — add a Snackbar saying “Your job ends in two years”"),
        f("The staff canteen was renovated.", 'dis', ["carousel"], "Carousel — add a Carousel of photos of the canteen"),
        f("Staff get a free gym membership.", 'dis', ["switch"], "Switch — add a Switch labelled “Gym membership”"),
        f("Holiday requests are still on paper.", 'dis', ["datepicker"], "Date picker — add a Date picker for booking a holiday"),
        f("Northway has 400 staff.", 'dis', ["badge"], "Badge — add a Badge showing “400 staff”")
      ]
    },
    E: {
      name: 'Technology', short: 'Technology', vc: 'Support activity',
      role: 'You are Northway’s IT department. You decide which systems Northway buys or builds, and how they connect into one database.',
      screenTitle: 'Systems', screen: 'The IT team’s “systems & integration” screen: how Northway’s systems connect, and the ERP decision.',
      test: 'Does it help the IT team see how Northway’s systems fit together, and decide what to buy or build?',
      order: '#NW-1042 shown as one shared record that every department’s system reads.',
      read: 'Your printed pack: paragraphs 1–3 (everyone) and 4–9 (your part)',
      exam: ['Technology development (support activity)', 'ERP: one company, one database', 'Built-in “best practice” processes', 'Switching costs and vendor lock-in'],
      system: 'Technology development (computer-aided design systems); enterprise application integration',
      qs: [
        q('core', 'Paragraph 1', 'What revenue did Alibaba’s core commerce businesses make in the twelve months to December 2018? (billion dollars)', ['53.13', '5313'], 'A dollar figure with two decimals.'),
        q('core', 'Paragraph 2', 'China’s online retail sales were expected to reach how many trillion dollars in 2020?', ['=6', '6trillion', 'six'], 'The second number in paragraph 2.'),
        q('core', 'Paragraph 3', 'How many major logistics players joined the Cainiao consortium?', ['=20', '20major', 'twenty'], 'Next to “8,000 smaller ones”.'),
        q('team', 'Paragraph 4', 'Which smartphone operating system does TIME compare Cainiao’s platform to?', ['android'], 'It is made by Google.'),
        q('team', 'Paragraph 5', 'With how many logistics partners does Cainiao’s open platform collaborate?', ['3000', '3k', 'threethousand'], 'A number in the thousands.'),
        q('team', 'Paragraph 5', 'Cainiao’s goal: a 1 kg package anywhere in the world within 72 hours for how many dollars?', ['=3', '3dollar', 'three'], 'A very small number.'),
        q('team', 'Paragraph 6', 'Which Alibaba company processes the payments?', ['ant'], '“… Financial”.'),
        q('team', 'Paragraph 6', 'How many parcels does Cainiao now process for customs clearance in a single day?', ['20million', '=20', '20m', 'twentymillion'], 'A number of millions.'),
        q('team', 'Paragraph 5', 'How many couriers work within Cainiao’s system?', ['3million', '3m', 'threemillion', '=3000000'], 'A number of millions.')
      ],
      ref: [["card", "ERP fit: 40% of processes change", 16, 72, "E1"], ["progress", "Lock-in: 7 years", 30, 184, "E2"], ["card", "#NW-1042 · one shared record", 16, 216, "E3"], ["list", "Connected: couriers, suppliers, payments", 16, 328, "E4"]],
      facts: [
        f("A standard ERP package would force Northway to change 40% of its processes.", 'key', ["card"], "Card — add a Card titled “ERP fit: 40% of processes would change”"),
        f("The ERP contract would lock Northway in for seven years.", 'key', ["progress", "card"], "Progress indicator — add a Progress indicator titled “Lock-in: 7 years”"),
        f("Northway’s three systems keep three different copies of each order.", 'key', ["card", "list"], "Card — add a Card titled “One order record”, showing order #NW-1042 as every department’s system sees it"),
        f("Couriers and suppliers each send data in a different format.", 'key', ["list", "chips"], "List — add a List titled “Connected systems”, one row each for couriers, suppliers and payments, all using one data standard"),
        f("The IT manager wants to stop using outside couriers, “like Cainiao”.", 'false', ["card"], "Card — add a Card titled “Block outside couriers”"),
        f("A salesperson says “everyone is buying our ERP”.", 'mis', ["efab"], "Extended FAB — add an Extended FAB labelled “Buy the ERP now”"),
        f("The office Wi-Fi was upgraded.", 'dis', ["switch"], "Switch — add a Switch labelled “Wi-Fi”"),
        f("The IT team has six people.", 'dis', ["badge"], "Badge — add a Badge showing “6” on the IT team icon"),
        f("Laptops are replaced every four years.", 'dis', ["datepicker"], "Date picker — add a Date picker showing the next laptop replacement"),
        f("The server room is kept at 20°C.", 'dis', ["slider"], "Slider — add a Slider showing the server room temperature")
      ]
    },
    F: {
      demo: true, draw: [0, 2], pick: [2, 2],  // demo: 6 facts, 2 correct
      name: 'Administration & Management', short: 'Management', vc: 'Support activity · your tutor’s demo team',
      role: 'The managers. Your tutor uses this team at the start to show every step — and then chairs the board meeting as Management.',
      screenTitle: 'Project', screen: 'The managers’ project dashboard: how every department’s work is going, and the decisions waiting for the board.',
      test: 'Does it help the managers see how every team’s work is going, and what they must decide?',
      order: '#NW-1042 used as the test case: has it passed through every department’s screen?',
      read: 'The demo reading, paragraphs 1–3',
      exam: ['Administration & management (support activity)', 'Enterprise systems: firm-wide information for decisions', 'What to keep in-house'],
      system: 'Administration & management systems (scheduling, messaging, reporting)',
      qs: [
        q('team', 'Paragraph 2', 'On which stock exchange was Cainiao going to be listed?', ['hongkong', 'hk'], 'It is named after a city.'),
        q('team', 'Paragraph 3', 'Who is Alibaba’s chairman, quoted in the article?', ['tsai'], 'Joseph …')
      ],
      ref: [["list", "Stock ✓ · Delivery: blocked · Customers ✓", 16, 72, "F1"], ["card", "Decisions for the board: ERP or redesign? Graduate roles?", 16, 248, "F2"], ["card", "Test case #NW-1042: passed A → E", 16, 360, ""]],
      facts: [
        f("Managers cannot see which departments’ work is finished and which is stuck.", 'key', ["list", "chips"], "List — add a List titled “Project status”, one row per department with its status: done, in progress or blocked"),
        f("Two decisions are waiting for the board: buy an ERP or redesign, and what graduates will do.", 'key', ["card", "dialog"], "Card — add a Card titled “Decisions for the board” listing the two decisions"),
        f("A board member wants to sell the delivery operation, “because Alibaba sold Cainiao”.", 'false', ["card"], "Card — add a Card titled “Sell our delivery operation”"),
        f("The head-office lease ends in 2029.", 'dis', ["datepicker"], "Date picker — add a Date picker showing the lease end date"),
        f("The CEO visited Hangzhou in 2019.", 'dis', ["carousel"], "Carousel — add a Carousel of photos from the CEO’s visit"),
        f("The board meets on the first Monday of the month.", 'dis', ["tabs"], "Tabs — add Tabs, one for each board meeting")
      ]
    }
  };
  return { VERSION: 'S9-1116-1015', DECISIONS, NAV, STATUS, TEAMS };
})();
