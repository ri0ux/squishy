/* Product catalog — the single source of truth for every squishy page.
   To launch a new squishy: append one object. No template changes needed.
   NOTE: no placeholder reviews or ratings, by design. The site shows product
   content until real reviews exist. When they do, fill in
   rating/reviewCount/reviews and restore the review sections. */

window.CATALOG = [
  {
    slug: "peanut-squishy",
    theme: "peanut",
    status: "live",
    name: "Peanut Squishy",
    tagline: "The crunchy little desk peanut",
    blurb:
      "A hyper-realistic little peanut with a soft, squeezable shell and a crackly clay-and-bead core. Squeeze it flat, work the beads, and feel the crunch.",
    price: 10,
    compareAt: 15,
    rating: null,
    reviewCount: 0,
    badges: ["New drop", "Bead-filled"],
    images: [
      { src: "/images/main-peanut-box.png", alt: "Peanut squishy with its gift box on a warm illustrated background" },
      { src: "/images/better-hand-squeeze.avif", alt: "Manicured hand squeezing the peanut squishy with its gift box behind it" },
      { src: "/images/handheld-peanut.png", alt: "Thumb pressing into the peanut squishy" },
      { src: "/images/main-peanut-box-white-background.avif", alt: "Peanut squishy next to its packaging on a clean background" },
    ],
    perks: [
      { icon: "truck", title: "Free shipping", text: "Free tracked delivery, worldwide" },
      { icon: "bag", title: "Gift-ready box", text: "Cute packaging, zero wrapping required" },
      { icon: "sparkle", title: "Safe & non-toxic", text: "Soft TPR shell, ages 3 and up" },
    ],
    benefits: [
      { title: "Crisp bead crunch", text: "A clay and micro-bead core that crackles under every squeeze. ASMR in your palm." },
      { title: "Stupidly realistic", text: "Textured shell, peanut shape, buttery matte finish. People will try to eat it. (Don't.)" },
      { title: "Pocket-size calm", text: "About 10.5 cm — fits your palm, your pocket, and your pencil case for stress-on-the-go." },
      { title: "Gift-ready box", text: "Arrives in a cute illustrated gift box. Birthday? Exam season? Tuesday? Covered." },
    ],
    specs: [
      ["Outside", "Soft, stretchy TPR shell with a realistic peanut texture"],
      ["Inside", "Moldable clay and micro-bead mixture — that's the crunch"],
      ["Size", "Approx. 10.5 × 5 cm (4.1 × 2 in)"],
      ["Sound", "Crisp, crunchy bead sound — ASMR-grade"],
      ["Safety", "Non-toxic. Ages 3+. Not edible (seriously)."],
      ["Care", "Wipe clean with a damp cloth. Don't puncture — the beads stay inside."],
    ],
    bundles: [
      { id: "peanut-1", qty: 1, label: "Single", price: 10, compareAt: 15, note: "One perfect peanut", tag: null },
      { id: "peanut-2", qty: 2, label: "Double trouble", price: 18, compareAt: 30, note: "One for you, one for your bestie", tag: "Most popular" },
      { id: "peanut-3", qty: 3, label: "Triple pack", price: 25, compareAt: 50, note: "Start the collection", tag: "Best value" },
    ],
    reviews: [],
    faqs: [
      ["How long does shipping take?", "Orders ship tracked and typically arrive in 7–12 business days. You'll get a tracking link the moment your squishy leaves our warehouse."],
      ["Is it safe?", "Yes — it's made from non-toxic materials and rated for ages 3+. That said, it's a fidget toy, not food. Please don't eat the peanut."],
      ["What does it feel like?", "Soft and squishy on the outside with a crackly bead crunch inside — like popping bubble wrap, but it never runs out."],
      ["What if my order arrives damaged?", "Email us a photo at hello@thesquishycorner.com and we'll make it right. No forms, no interrogation."],
      ["How do I clean it?", "A quick wipe with a damp cloth keeps it fresh. Keep it away from keys and sharp objects — and don't puncture it."],
    ],
    related: ["bean-squishy"],
  },

  {
    slug: "bean-squishy",
    theme: "bean",
    status: "coming-soon",
    name: "Boba Bean",
    tagline: "A chubby little bean with main-character energy",
    blurb: "Something new is squishing its way here. Check back soon.",
    price: 11.95,
    compareAt: null,
    rating: null,
    reviewCount: 0,
    badges: ["Coming soon"],
    images: [],
    perks: [],
    benefits: [],
    specs: [],
    bundles: [],
    reviews: [],
    faqs: [["When does it drop?", "It's in the works — check back soon."]],
    related: ["peanut-squishy"],
  },
];

window.getProduct = function (slug) {
  return (window.CATALOG || []).find((p) => p.slug === slug) || null;
};

window.money = function (n) {
  return "$" + Number(n).toFixed(2);
};
