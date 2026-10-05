export const LANGS = ["mr", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** Text that is either the same in every language, or given per language. */
export type Localized = string | Partial<Record<Lang, string>>;

export const LANG_NAMES: Record<Lang, string> = { mr: "मराठी", en: "English" };

/** Pick the text for `lang`, falling back to the other languages so nothing renders blank. */
export function translate(value: Localized | undefined, lang: Lang): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? LANGS.map((l) => value[l]).find(Boolean) ?? "";
}

/** Fixed interface text (buttons, labels). Content text comes from presets / client config. */
const en = {
  call: "Call now",
  whatsapp: "WhatsApp",
  enquireWhatsApp: "Enquire on WhatsApp",
  days: "days",
  nights: "nights",
  perPerson: "per person",
  startingFrom: "Starting from",
  menu: "Menu",
  language: "Language",
  form: {
    name: "Your name",
    phone: "Mobile number",
    package: "Package",
    anyPackage: "Not decided yet",
    date: "Travel date",
    people: "Number of travellers",
    message: "Message (optional)",
    submit: "Send on WhatsApp",
    note: "This opens WhatsApp with your details filled in. Just press send.",
  },
  wa: {
    intro: "Hello! I'd like to enquire.",
    package: "Hi, I'm interested in this package:",
    name: "Name",
    phone: "Mobile",
    date: "Travel date",
    people: "Travellers",
    message: "Message",
  },
  contact: { address: "Address", phone: "Phone", email: "Email", hours: "Hours", directions: "Get directions" },
  footer: { rights: "All rights reserved", quickLinks: "Quick links", contact: "Contact" },
};

export type UiStrings = typeof en;

export const UI: Record<Lang, UiStrings> = {
  en,
  mr: {
    call: "कॉल करा",
    whatsapp: "व्हॉट्सॲप",
    enquireWhatsApp: "व्हॉट्सॲपवर चौकशी करा",
    days: "दिवस",
    nights: "रात्री",
    perPerson: "प्रति व्यक्ती",
    startingFrom: "सुरुवात",
    menu: "मेनू",
    language: "भाषा",
    form: {
      name: "तुमचे नाव",
      phone: "मोबाइल नंबर",
      package: "पॅकेज",
      anyPackage: "अजून ठरवले नाही",
      date: "प्रवासाची तारीख",
      people: "प्रवाशांची संख्या",
      message: "संदेश (ऐच्छिक)",
      submit: "व्हॉट्सॲपवर पाठवा",
      note: "तुमची माहिती भरलेले व्हॉट्सॲप उघडेल. फक्त सेंड दाबा.",
    },
    wa: {
      intro: "नमस्कार! मला चौकशी करायची आहे.",
      package: "नमस्कार, मला या पॅकेजमध्ये रस आहे:",
      name: "नाव",
      phone: "मोबाइल",
      date: "प्रवासाची तारीख",
      people: "प्रवासी",
      message: "संदेश",
    },
    contact: { address: "पत्ता", phone: "फोन", email: "ईमेल", hours: "वेळ", directions: "दिशा पहा" },
    footer: { rights: "सर्व हक्क राखीव", quickLinks: "महत्त्वाच्या लिंक", contact: "संपर्क" },
  },
};
