// ============================================================================
// LyZov E-Commerce Platform — Official Store Policies Data
// Structured for effortless editing, compliance, and multi-channel rendering.
// ============================================================================

export const policiesData = [
  {
    id: "privacy-policy",
    slug: "privacy-policy",
    aliases: ["privacy"],
    title: "Privacy Policy",
    shortTitle: "Privacy Policy",
    icon: "ShieldCheck",
    lastUpdated: "September 2026",
    effectiveDate: "January 1, 2025",
    version: "2.4",
    summary:
      "At LyZov, your privacy and trust are paramount. We are committed to safeguarding your personal data, being completely transparent about the information we collect, and ensuring secure shopping across all our platforms.",
    highlights: [
      {
        title: "256-Bit SSL Encryption",
        desc: "All personal & transactional data is securely encrypted in transit and at rest.",
      },
      {
        title: "Zero Data Selling",
        desc: "We never sell, rent, or trade your personal information to third-party advertisers.",
      },
      {
        title: "Full User Control",
        desc: "Easily update your personal data or request account deletion anytime via support.",
      },
    ],
    sections: [
      {
        id: "introduction",
        heading: "1. Introduction & Scope",
        paragraphs: [
          "Welcome to LyZov ('LyZov', 'we', 'us', or 'our'). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you visit our website, use our mobile or desktop interfaces, and purchase our premium workout equipment, spiritual idols, and lifestyle accessories.",
          "By accessing or using our services, you consent to the collection and use of information in accordance with this policy. If you do not agree with any part of this policy, please refrain from using our services.",
        ],
      },
      {
        id: "information-we-collect",
        heading: "2. Information We Collect",
        paragraphs: [
          "We collect only the information strictly necessary to provide seamless shopping, order fulfillment, and account management services:",
        ],
        listItems: [
          "Personal Identification Data: Name, email address, contact phone number, and delivery addresses provided during registration or checkout.",
          "Order & Transaction Details: Products purchased, variant selections, order history, timestamps, invoice amounts, and promotional codes applied.",
          "Payment Information: Payment processing is handled directly by PCI-DSS certified payment gateways (e.g., Razorpay, UPI providers). LyZov never stores your full credit card numbers, CVVs, or banking passwords on our servers.",
          "Device & Technical Logs: IP address, browser type, operating system, device identifiers, referring URLs, and page interaction timestamps gathered automatically for security and diagnostic purposes.",
          "Customer Service Communications: Inquiries, return requests, and messages submitted through our support forms or dashboard concierge.",
        ],
      },
      {
        id: "how-we-use-information",
        heading: "3. How We Use Your Information",
        paragraphs: [
          "We use the collected information for specific, legitimate business purposes:",
        ],
        listItems: [
          "Fulfilling and delivering your orders, providing dispatch updates, and sending electronic tax invoices.",
          "Processing payments safely, detecting fraud, and preventing unauthorized account access.",
          "Facilitating customer support inquiries, returns, replacements, and order cancellations.",
          "Communicating important service announcements, security alerts, and order status notifications via Email or SMS.",
          "Analyzing website performance and user preferences to enhance catalog navigation and catalog recommendations (with your opt-in consent for marketing).",
        ],
      },
      {
        id: "cookies-and-tracking",
        heading: "4. Cookies & Tracking Technologies",
        paragraphs: [
          "LyZov uses essential cookies and local storage tokens to keep you logged in, remember items in your shopping bag, and preserve your theme preferences (Dark / Light mode).",
          "We do not use invasive third-party tracking or behavioral profiling scripts. You can configure your browser to reject cookies, although doing so may restrict certain functionalities such as persistent cart storage.",
        ],
      },
      {
        id: "sharing-and-disclosure",
        heading: "5. Information Sharing & Third Parties",
        paragraphs: [
          "We do not sell, trade, or monetize your personal information. We only share relevant data with vetted, trusted partners under strict confidentiality agreements:",
        ],
        listItems: [
          "Logistics & Courier Partners: National shipping carriers (e.g., Blue Dart, Delhivery, DTDC) to deliver your packages to your doorstep.",
          "Payment Processing Gateways: Certified payment intermediaries ensuring encrypted and authenticated transactions.",
          "Cloud & Infrastructure Providers: Secure enterprise servers and database hosting compliant with modern data protection standards.",
          "Legal & Statutory Authorities: When mandated by applicable Indian law, court order, or governmental regulation to protect the rights and safety of LyZov and our users.",
        ],
      },
      {
        id: "data-retention-and-security",
        heading: "6. Data Retention & Security Measures",
        paragraphs: [
          "We implement industry-standard administrative, physical, and technical safeguards — including TLS encryption, hashed passwords (bcrypt), and rate-limiting against unauthorized access.",
          "Your transaction history is retained as required by Indian accounting and taxation regulations (e.g., GST laws). Non-essential account logs are routinely purged.",
        ],
      },
      {
        id: "user-rights",
        heading: "7. Your Rights & Choices",
        paragraphs: [
          "You have the right to access, verify, correct, or update your personal account details at any time via your LyZov Account Dashboard. You may also request deletion of your account and personal data by reaching out to our Grievance Officer, provided there are no active pending orders or legal obligations.",
        ],
      },
      {
        id: "contact-and-grievance",
        heading: "8. Grievance Officer & Contact Information",
        paragraphs: [
          "If you have questions, concerns, or grievances regarding this Privacy Policy or our data handling practices, please contact our designated Grievance Officer:",
        ],
        callout: {
          title: "LyZov Privacy & Grievance Cell",
          email: "lyzovindia@gmail.com",
          address: "LyZov Headquarters, India",
          sla: "Responses are provided within 48 business hours.",
        },
      },
    ],
  },
  {
    id: "terms-and-conditions",
    slug: "terms-and-conditions",
    aliases: ["terms", "tos"],
    title: "Terms & Conditions",
    shortTitle: "Terms & Conditions",
    icon: "FileText",
    lastUpdated: "September 2026",
    effectiveDate: "January 1, 2025",
    version: "2.3",
    summary:
      "These Terms & Conditions govern your access to and purchase of products on the LyZov platform. Please read them carefully before using our website or placing an order.",
    highlights: [
      {
        title: "Transparent Pricing",
        desc: "All prices are displayed in Indian Rupees (INR) inclusive of applicable taxes.",
      },
      {
        title: "Authentic Products",
        desc: "Every item is 100% genuine, directly curated, and inspected prior to dispatch.",
      },
      {
        title: "Fair Use Policy",
        desc: "Orders and accounts are subject to verification to safeguard genuine buyers.",
      },
    ],
    sections: [
      {
        id: "agreement-to-terms",
        heading: "1. Agreement to Terms",
        paragraphs: [
          "By accessing or purchasing through the LyZov website ('Platform'), you agree to be bound by these Terms & Conditions ('Terms'). These Terms constitute a legally binding agreement between you ('Customer', 'User') and LyZov ('Company', 'we', 'us').",
          "If you do not agree to all terms and conditions, you must discontinue your use of our platform immediately.",
        ],
      },
      {
        id: "eligibility-and-account",
        heading: "2. User Eligibility & Account Responsibilities",
        paragraphs: [
          "To purchase items on LyZov, you must be at least 18 years of age or possess legal parental/guardian consent. When registering an account, you agree to provide truthful, accurate, and complete information.",
          "You are solely responsible for maintaining the confidentiality of your account credentials and password. Any actions executed through your account remain your responsibility. If you suspect unauthorized access, notify us immediately at lyzovindia@gmail.comlyzov.com.",
        ],
      },
      {
        id: "products-and-pricing",
        heading: "3. Product Descriptions & Pricing",
        paragraphs: [
          "We take utmost care to present product dimensions, materials, colors, and craftsmanship as accurately as possible. However, due to individual display monitor settings and natural material variations in handcrafted idols and gym gear, subtle variances may occur.",
          "All prices are quoted in Indian Rupees (INR) and are inclusive of GST unless explicitly stated otherwise. We reserve the right to correct typographical pricing errors. In the event an item is erroneously listed at an incorrect price, we will notify you before processing or issue a full cancellation and refund.",
        ],
      },
      {
        id: "orders-and-acceptance",
        heading: "4. Order Confirmation & Acceptance",
        paragraphs: [
          "Placing an order constitutes an offer to purchase. Upon completing checkout, you will receive an automated order confirmation email containing your Order Number.",
          "LyZov reserves the right to accept or decline orders at our sole discretion, including cases where inventory becomes unavailable, delivery pincodes are unserviceable, or suspicious/fraudulent activity is identified.",
        ],
      },
      {
        id: "intellectual-property",
        heading: "5. Intellectual Property Rights",
        paragraphs: [
          "All content on LyZov — including logos, brand marks, product imagery, visual designs, software code, written copy, and trademarks — is the exclusive property of LyZov or its content licensors and is protected under Indian and international intellectual property laws.",
          "Reproduction, redistribution, framing, scraping, or commercial exploitation of any platform material without express prior written consent is strictly prohibited.",
        ],
      },
      {
        id: "prohibited-activities",
        heading: "6. Prohibited Activities",
        paragraphs: [
          "Users agree not to:",
        ],
        listItems: [
          "Attempt to bypass platform security, inject malicious scripts, or probe vulnerabilities.",
          "Place fraudulent, speculative, or fictitious orders.",
          "Misrepresent identity or impersonate any individual or entity.",
          "Interfere with the normal operation of our payment gateways or web servers.",
        ],
      },
      {
        id: "limitation-of-liability",
        heading: "7. Limitation of Liability & Warranties",
        paragraphs: [
          "LyZov provides the platform and products on an 'as is' and 'as available' basis. To the maximum extent permitted under applicable law, LyZov disclaims all warranties, express or implied, regarding merchantability or fitness for a particular purpose.",
          "Under no circumstances shall LyZov be liable for indirect, incidental, punitive, or consequential damages resulting from product use or platform downtime. Our aggregate liability shall not exceed the amount actually paid by you for the specific order in question.",
        ],
      },
      {
        id: "governing-law",
        heading: "8. Governing Law & Dispute Resolution",
        paragraphs: [
          "These Terms are governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or purchases shall be subject to the exclusive jurisdiction of the competent courts in India.",
        ],
      },
    ],
  },
  {
    id: "return-exchange-policy",
    slug: "return-exchange-policy",
    aliases: ["returns", "exchange-policy"],
    title: "Return & Exchange Policy",
    shortTitle: "Return & Exchange",
    icon: "RotateCcw",
    lastUpdated: "September 2026",
    effectiveDate: "January 1, 2025",
    version: "2.1",
    summary:
      "We want you to love your purchase. If a product arrives damaged, defective, or incorrect, our 7-Day Replacement Guarantee ensures a swift and hassle-free resolution.",
    highlights: [
      {
        title: "7-Day Replacement Window",
        desc: "Request a return or replacement within 7 calendar days from the date of delivery.",
      },
      {
        title: "Free Doorstep Pickup",
        desc: "Our courier partners collect the item directly from your address at zero extra cost.",
      },
      {
        title: "Swift Replacements",
        desc: "Replacement units are dispatched within 24-48 hours of return inspection approval.",
      },
    ],
    sections: [
      {
        id: "eligibility",
        heading: "1. Return & Exchange Eligibility",
        paragraphs: [
          "To be eligible for a replacement or return, the request must be initiated within 7 calendar days of package delivery as logged by the courier partner tracking.",
          "Eligible situations include:",
        ],
        listItems: [
          "Transit Damage: Item arrived broken, cracked, chipped, or structurally compromised.",
          "Manufacturing Defect: Significant functional defect or missing critical hardware components.",
          "Incorrect Item / Variant: You received a different size, color, or model than ordered.",
          "Incomplete Package: Item missing vital parts or accessories listed on the product page.",
        ],
      },
      {
        id: "return-conditions",
        heading: "2. Condition of Returned Items",
        paragraphs: [
          "To ensure a seamless inspection and approval, all returned merchandise must meet the following guidelines:",
        ],
        listItems: [
          "Item must be in unused, unwashed, and original condition with brand tags intact.",
          "Original packaging, protective bubble wraps, boxes, manuals, and accessories must be included.",
          "For spiritual idols & murtis, items must not have been consecrated, washed, or altered in rituals.",
          "The return package must include the original invoice or order packaging slip.",
        ],
      },
      {
        id: "how-to-initiate",
        heading: "3. Step-by-Step Return Process",
        paragraphs: [
          "Initiating a return is quick and transparent:",
        ],
        listItems: [
          "Step 1: Go to your Account Dashboard > Orders page and locate your order.",
          "Step 2: Click 'Need Help? Email Support' or submit a request via our Contact Page, referencing your Order Number.",
          "Step 3: Attach clear photos or a short video showing the damage, defect, or wrong item alongside the outer courier box label.",
          "Step 4: Our support concierge will verify the claim within 24 business hours and schedule a reverse courier pickup.",
          "Step 5: Hand the sealed package to our pickup executive. Upon inspection at our fulfillment center, your replacement or refund is promptly triggered.",
        ],
      },
      {
        id: "non-returnable",
        heading: "4. Non-Returnable & Final Sale Items",
        paragraphs: [
          "For hygiene and customization reasons, certain items are non-returnable unless they arrived damaged or with a verified manufacturing defect:",
        ],
        listItems: [
          "Custom-engraved, personalized, or made-to-order lifestyle items.",
          "Clearance / Final Sale items explicitly marked as non-returnable on the product page.",
          "Items returned without their original protective packaging or missing manufacturer tags.",
        ],
      },
      {
        id: "exchanges",
        heading: "5. Size & Variant Exchanges",
        paragraphs: [
          "If you ordered an incorrect size or color variant of gym apparel/accessories, you may request a one-time size exchange within the 7-day window, subject to inventory availability. If the desired size is out of stock, you may choose a full refund or store credit.",
        ],
      },
    ],
  },
  {
    id: "refund-cancellation-policy",
    slug: "refund-cancellation-policy",
    aliases: ["refund-policy", "cancellation", "refunds"],
    title: "Refund & Cancellation Policy",
    shortTitle: "Refund & Cancellation",
    icon: "Banknote",
    lastUpdated: "September 2026",
    effectiveDate: "January 1, 2025",
    version: "2.2",
    summary:
      "We believe in honest, customer-centric policies. Cancel orders before dispatch with 1-click, and enjoy prompt, automated refunds directly to your original payment method.",
    highlights: [
      {
        title: "100% Pre-Dispatch Refund",
        desc: "Cancel anytime before your order is dispatched for an immediate, full refund.",
      },
      {
        title: "5-7 Business Day Turnaround",
        desc: "Refunds are processed to your original bank/card/UPI within 5-7 working days.",
      },
      {
        title: "Transparent Tracking",
        desc: "Receive real-time email notifications with payment gateway reference IDs.",
      },
    ],
    sections: [
      {
        id: "order-cancellation",
        heading: "1. Order Cancellation Policy",
        paragraphs: [
          "We understand plans change. Our cancellation policy is simple and fair:",
        ],
        listItems: [
          "Cancellation Before Dispatch: You can cancel your order directly from your Account Dashboard under 'My Orders' as long as the status is 'Pending' or 'Processing'. A 100% full refund will be initiated immediately.",
          "Cancellation After Dispatch: Once an order is handed over to the courier partner and marked 'Shipped', it cannot be cancelled in-transit. You may refuse delivery upon arrival or initiate a return under our 7-Day Return & Exchange Policy once received.",
        ],
      },
      {
        id: "cancellation-by-lyzov",
        heading: "2. Cancellations Initiated by LyZov",
        paragraphs: [
          "LyZov reserves the right to cancel an order under rare circumstances:",
        ],
        listItems: [
          "Product becomes out of stock during quality inspection before packaging.",
          "Delivery address is determined to be non-serviceable by our logistics network.",
          "Fraudulent, unauthorized, or security flags identified by payment gateway fraud filters.",
          "In any such event, our team will notify you immediately and process a complete 100% refund without deduction.",
        ],
      },
      {
        id: "refund-modes-and-timelines",
        heading: "3. Refund Modes & Timelines",
        paragraphs: [
          "All refunds are credited back to the original source of payment used during checkout:",
        ],
        listItems: [
          "UPI / Netbanking: 2 to 4 business days from processing date.",
          "Credit Cards & Debit Cards: 5 to 7 business days (timing depends on your issuing bank).",
          "Wallets (Paytm / PhonePe): 24 to 48 business hours.",
        ],
        callout: {
          title: "Bank Processing Cycles",
          email: "lyzovindia@gmail.com",
          address: "LyZov Billing Operations",
          sla: "While LyZov initiates refunds within 24 hours of approval, bank clearance timelines may vary depending on national holidays and issuing bank policies.",
        },
      },
      {
        id: "failed-transactions",
        heading: "4. Failed or Deducted Transactions",
        paragraphs: [
          "If money was debited from your account but your order was not successfully placed due to a connection disruption or payment timeout, your bank will automatically reverse the amount back to your account within 3 to 5 business days. If not received after 5 business days, please email us your transaction ID at lyzovindia@gmail.com.",
        ],
      },
      {
        id: "shipping-fee-refunds",
        heading: "5. Shipping Charges on Refunds",
        paragraphs: [
          "If an order is cancelled prior to shipment or returned due to an error on our part (damaged, defective, or incorrect item), any shipping fees charged will be refunded in full.",
          "For customer-remorse returns where the product delivered was accurate and undamaged, outward shipping costs may be non-refundable.",
        ],
      },
    ],
  },
  {
    id: "shipping-delivery-policy",
    slug: "shipping-delivery-policy",
    aliases: ["shipping", "delivery", "shipping-policy"],
    title: "Shipping & Delivery Policy",
    shortTitle: "Shipping & Delivery",
    icon: "Truck",
    lastUpdated: "September 2026",
    effectiveDate: "January 1, 2025",
    version: "2.3",
    summary:
      "LyZov delivers across India with precision and care. Enjoy fast order dispatch, multi-layer protective packaging, and real-time SMS/Email shipment tracking.",
    highlights: [
      {
        title: "Free Delivery Above ₹999",
        desc: "All domestic orders over ₹999 qualify for complimentary premium shipping.",
      },
      {
        title: "24-48 Hour Dispatch",
        desc: "Orders undergo thorough quality checks and dispatch within 1-2 business days.",
      },
      {
        title: "Pan-India Coverage",
        desc: "We serve 19,000+ pincodes across metros, tier-2, and remote Indian regions.",
      },
    ],
    sections: [
      {
        id: "serviceable-areas",
        heading: "1. Serviceable Areas & Pincodes",
        paragraphs: [
          "LyZov partners with leading national courier agencies (including Blue Dart, Delhivery, DTDC, and Xpressbees) to deliver packages safely across 19,000+ pin codes in India.",
          "During checkout, our address validator verifies pincode serviceability to guarantee dependable doorstep delivery.",
        ],
      },
      {
        id: "shipping-rates",
        heading: "2. Shipping Rates & Thresholds",
        paragraphs: [
          "We offer transparent, uncomplicated shipping charges across our entire catalog:",
        ],
        listItems: [
          "Orders Above ₹999: 100% FREE Standard Shipping across all serviceable pin codes in India.",
          "Orders Below ₹999: A flat standard delivery fee of ₹99 is applied at checkout to cover insured transit packaging.",
          "No Hidden Surcharges: All charges are visibly calculated and displayed prior to payment confirmation.",
        ],
      },
      {
        id: "processing-time",
        heading: "3. Order Processing & Dispatch",
        paragraphs: [
          "Orders placed before 2:00 PM IST (Monday through Saturday) are typically processed the same business day.",
          "All orders undergo a multi-point quality check and are cushioned with heavy-duty protective materials (essential for delicate murtis and heavy workout equipment) before dispatch within 24 to 48 hours. Orders placed on Sundays or public holidays are processed the next business day.",
        ],
      },
      {
        id: "transit-times",
        heading: "4. Estimated Transit & Delivery Times",
        paragraphs: [
          "Estimated transit durations from our fulfillment centers to your doorstep:",
        ],
        listItems: [
          "Tier-1 Metro Cities (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune): 2 to 4 business days.",
          "Tier-2 & Tier-3 Cities: 3 to 6 business days.",
          "North-East, J&K, and Remote Islands: 5 to 8 business days.",
        ],
      },
      {
        id: "tracking-and-updates",
        heading: "5. Real-Time Shipment Tracking",
        paragraphs: [
          "As soon as your package is scanned by our logistics carrier, you will receive an automated Dispatch Confirmation email and SMS containing your Air Waybill (AWB) number and direct courier tracking URL.",
          "You can also monitor live tracking milestones directly within your LyZov Account Dashboard under 'My Orders'.",
        ],
      },
      {
        id: "delivery-protocol",
        heading: "6. Secure Delivery & Inspection",
        paragraphs: [
          "Our courier personnel may request an OTP or signature verification upon delivery. Please ensure a responsible individual is present at the shipping address.",
          "Important Guidance: If the outer shipping box appears severely crushed, tampered with, or open, please refuse delivery and immediately alert our support concierge with photos. Do not accept tampered packages.",
        ],
      },
      {
        id: "rto-and-address-issues",
        heading: "7. Undelivered Shipments & Address Changes",
        paragraphs: [
          "Our logistics partners will attempt delivery up to 3 times before marking a package as Return to Origin (RTO). Please ensure your contact phone number and landmark are accurately entered at checkout.",
          "If you notice an error in your shipping address, please contact lyzovindia@gmail.com immediately before dispatch. Once dispatched, address rerouting is subject to courier feasibility.",
        ],
      },
    ],
  },
];

// Helper helper utilities
export const getPolicyBySlug = (slug) => {
  if (!slug) return policiesData[0];
  const normalized = slug.toLowerCase().trim();
  return (
    policiesData.find(
      (p) =>
        p.slug === normalized ||
        p.id === normalized ||
        (p.aliases && p.aliases.includes(normalized))
    ) || policiesData[0]
  );
};
