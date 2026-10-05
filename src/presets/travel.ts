import type { Preset } from "./types";

/** Travel agency / tour operator. Sample content is in Marathi and English. */
export const travel: Preset = {
  id: "travel",
  label: "Travel agency",
  defaultStyle: "warm",
  schemaType: "TravelAgency",
  mustReplace: ["testimonials", "stats"],
  looks: [
    {
      id: "adventure",
      name: { mr: "साहस", en: "Adventure" },
      style: "warm",
      layouts: {
        navbar: "simple", hero: "image", packages: "cards", features: "grid", stats: "band", gallery: "masonry",
        testimonials: "cards", faq: "accordion", cta: "card", enquiry: "split", contact: "map", footer: "columns",
      },
    },
    {
      id: "boutique",
      name: { mr: "बुटीक", en: "Boutique" },
      style: "elegant",
      layouts: {
        navbar: "centered", hero: "split", packages: "list", features: "split", stats: "cards", gallery: "grid",
        testimonials: "scroll", faq: "two-column", cta: "strip", enquiry: "simple", contact: "details", footer: "simple",
      },
    },
    {
      id: "fresh",
      name: { mr: "फ्रेश", en: "Fresh" },
      style: "modern",
      layouts: {
        navbar: "simple", hero: "centered", packages: "cards", features: "grid", stats: "cards", gallery: "grid",
        testimonials: "scroll", faq: "accordion", cta: "card", enquiry: "split", contact: "map", footer: "columns",
      },
    },
    {
      id: "coastal",
      name: { mr: "किनारा", en: "Coastal" },
      style: "modern",
      layouts: {
        navbar: "centered", hero: "image", packages: "list", features: "split", stats: "band", gallery: "masonry",
        testimonials: "cards", faq: "two-column", cta: "strip", enquiry: "simple", contact: "map", footer: "simple",
      },
    },
    {
      id: "heritage",
      name: { mr: "वारसा", en: "Heritage" },
      style: "elegant",
      layouts: {
        navbar: "simple", hero: "image", packages: "cards", features: "grid", stats: "band", gallery: "masonry",
        testimonials: "cards", faq: "accordion", cta: "card", enquiry: "split", contact: "map", footer: "columns",
      },
    },
    {
      id: "family",
      name: { mr: "कुटुंब", en: "Family" },
      style: "warm",
      layouts: {
        navbar: "centered", hero: "split", packages: "cards", features: "split", stats: "cards", gallery: "grid",
        testimonials: "scroll", faq: "accordion", cta: "strip", enquiry: "simple", contact: "details", footer: "columns",
      },
    },
  ],
  order: ["hero", "packages", "features", "stats", "gallery", "testimonials", "faq", "cta", "enquiry", "contact"],
  sections: {
    navbar: { layout: "simple" },
    footer: { layout: "columns" },

    hero: {
      layout: "image",
      image: "/placeholders/mountains.svg",
      eyebrow: { mr: "कुटुंबासोबत सुरक्षित सहल", en: "Safe, family-friendly tours" },
      title: { mr: "तुमची पुढची सहल, आमची जबाबदारी", en: "Your next trip, fully taken care of" },
      subtitle: {
        mr: "प्रवास, हॉटेल, जेवण आणि फिरणे – सगळे एकाच पॅकेजमध्ये. फक्त बॅग भरा.",
        en: "Travel, hotels, meals and sightseeing in one package. Just pack your bags.",
      },
      badges: [
        { mr: "५,०००+ आनंदी प्रवासी", en: "5,000+ happy travellers" },
        { mr: "२४x७ सहल मदत", en: "24x7 trip support" },
        { mr: "कोणतेही छुपे शुल्क नाही", en: "No hidden charges" },
      ],
      secondaryCta: { label: { mr: "पॅकेज पहा", en: "View packages" }, href: "#packages" },
    },

    packages: {
      layout: "cards",
      navLabel: { mr: "पॅकेज", en: "Packages" },
      eyebrow: { mr: "लोकप्रिय सहली", en: "Popular tours" },
      title: { mr: "तुमच्यासाठी निवडक पॅकेज", en: "Handpicked packages for you" },
      subtitle: {
        mr: "सर्व पॅकेजमध्ये प्रवास, राहणे आणि नाश्ता समाविष्ट. तारीख आणि बजेटनुसार बदल करून मिळेल.",
        en: "All packages include travel, stay and breakfast. We customise dates and budget for you.",
      },
      items: [
        {
          title: { mr: "कोकण दर्शन", en: "Konkan Darshan" },
          image: "/placeholders/beach.svg",
          location: { mr: "गणपतीपुळे, रत्नागिरी", en: "Ganpatipule, Ratnagiri" },
          days: 3,
          price: 6999,
          badge: { mr: "बेस्ट सेलर", en: "Best seller" },
          highlights: [
            { mr: "समुद्रकिनारी हॉटेल", en: "Beach-side hotel" },
            { mr: "AC बस प्रवास", en: "AC bus travel" },
            { mr: "कोकणी जेवण", en: "Konkani meals" },
          ],
        },
        {
          title: { mr: "गोवा बीच हॉलिडे", en: "Goa Beach Holiday" },
          image: "/placeholders/sunset.svg",
          location: { mr: "उत्तर आणि दक्षिण गोवा", en: "North & South Goa" },
          days: 4,
          price: 11499,
          highlights: [
            { mr: "३-स्टार हॉटेल", en: "3-star hotel" },
            { mr: "बोट क्रूझ", en: "Boat cruise" },
            { mr: "दोन्ही गोवा दर्शन", en: "North & South sightseeing" },
          ],
        },
        {
          title: { mr: "काश्मीर – पृथ्वीवरचा स्वर्ग", en: "Kashmir – Paradise on Earth" },
          image: "/placeholders/snow.svg",
          location: { mr: "श्रीनगर, गुलमर्ग, पहलगाम", en: "Srinagar, Gulmarg, Pahalgam" },
          days: 6,
          price: 24999,
          badge: { mr: "नवीन", en: "New" },
          highlights: [
            { mr: "हाऊसबोट मुक्काम", en: "Houseboat stay" },
            { mr: "गोंडोला राइड", en: "Gondola ride" },
            { mr: "विमान प्रवास", en: "Flights included" },
          ],
        },
        {
          title: { mr: "केरळ बॅकवॉटर्स", en: "Kerala Backwaters" },
          image: "/placeholders/backwaters.svg",
          location: { mr: "मुन्नार, अलेप्पी", en: "Munnar, Alleppey" },
          days: 5,
          price: 18999,
          highlights: [
            { mr: "हाऊसबोट रात्र", en: "Night on a houseboat" },
            { mr: "चहाचे मळे", en: "Tea gardens" },
            { mr: "सर्व जेवण", en: "All meals" },
          ],
        },
        {
          title: { mr: "राजस्थान राजेशाही सहल", en: "Royal Rajasthan" },
          image: "/placeholders/desert.svg",
          location: { mr: "जयपूर, जोधपूर, जैसलमेर", en: "Jaipur, Jodhpur, Jaisalmer" },
          days: 7,
          price: 21999,
          highlights: [
            { mr: "वाळवंटात कॅम्प", en: "Desert camp" },
            { mr: "किल्ले आणि महाल", en: "Forts & palaces" },
            { mr: "उंट सफारी", en: "Camel safari" },
          ],
        },
        {
          title: { mr: "अष्टविनायक यात्रा", en: "Ashtavinayak Yatra" },
          image: "/placeholders/temple.svg",
          location: { mr: "पुणे आणि परिसर", en: "Around Pune" },
          days: 2,
          price: 3499,
          highlights: [
            { mr: "आठही गणपती दर्शन", en: "All eight Ganpati temples" },
            { mr: "शाकाहारी जेवण", en: "Vegetarian meals" },
            { mr: "अनुभवी गाइड", en: "Experienced guide" },
          ],
        },
      ],
    },

    features: {
      layout: "grid",
      tone: "surface",
      navLabel: { mr: "आमच्याबद्दल", en: "Why us" },
      eyebrow: { mr: "आम्हालाच का निवडावे?", en: "Why travel with us" },
      title: { mr: "निश्चिंत प्रवास, प्रत्येक वेळी", en: "Worry-free travel, every time" },
      items: [
        {
          icon: "shield",
          title: { mr: "सुरक्षित प्रवास", en: "Safe travel" },
          text: { mr: "अनुभवी ड्रायव्हर, तपासलेली वाहने आणि सुरक्षित हॉटेल.", en: "Experienced drivers, checked vehicles and safe hotels." },
        },
        {
          icon: "wallet",
          title: { mr: "योग्य किंमत", en: "Fair prices" },
          text: { mr: "सगळे खर्च आधीच सांगतो. कोणतेही छुपे शुल्क नाही.", en: "All costs upfront. No hidden charges." },
        },
        {
          icon: "support",
          title: { mr: "२४x७ मदत", en: "24x7 support" },
          text: { mr: "सहलीदरम्यान कधीही फोन करा – आम्ही सोबत आहोत.", en: "Call us any time during your trip – we're with you." },
        },
        {
          icon: "users",
          title: { mr: "कुटुंब आणि ग्रुप सहली", en: "Family & group tours" },
          text: { mr: "ज्येष्ठ नागरिक, शाळा आणि ऑफिस ग्रुपसाठी खास नियोजन.", en: "Special plans for seniors, schools and office groups." },
        },
        {
          icon: "food",
          title: { mr: "घरच्यासारखे जेवण", en: "Home-style food" },
          text: { mr: "शाकाहारी आणि महाराष्ट्रीयन जेवणाची सोय.", en: "Vegetarian and Maharashtrian meals available." },
        },
        {
          icon: "calendar",
          title: { mr: "तुमच्या तारखेनुसार", en: "Your dates, your way" },
          text: { mr: "तारीख, हॉटेल आणि ठिकाणे तुमच्या सोयीनुसार बदलून मिळतील.", en: "We adjust dates, hotels and places to suit you." },
        },
      ],
    },

    stats: {
      layout: "band",
      items: [
        { value: "12+", label: { mr: "वर्षांचा अनुभव", en: "Years of experience" } },
        { value: "5,000+", label: { mr: "आनंदी प्रवासी", en: "Happy travellers" } },
        { value: "80+", label: { mr: "ठिकाणे", en: "Destinations" } },
        { value: "4.8★", label: { mr: "गूगल रेटिंग", en: "Google rating" } },
      ],
    },

    gallery: {
      layout: "masonry",
      navLabel: { mr: "गॅलरी", en: "Gallery" },
      eyebrow: { mr: "आमच्या सहलींमधून", en: "From our trips" },
      title: { mr: "प्रवाशांच्या आठवणी", en: "Memories from our travellers" },
      items: [
        { image: "/placeholders/snow.svg", caption: { mr: "गुलमर्ग", en: "Gulmarg" } },
        { image: "/placeholders/beach.svg", caption: { mr: "गणपतीपुळे", en: "Ganpatipule" } },
        { image: "/placeholders/fort.svg", caption: { mr: "रायगड", en: "Raigad" } },
        { image: "/placeholders/desert.svg", caption: { mr: "जैसलमेर", en: "Jaisalmer" } },
        { image: "/placeholders/backwaters.svg", caption: { mr: "अलेप्पी", en: "Alleppey" } },
        { image: "/placeholders/group.svg", caption: { mr: "आमचा ग्रुप", en: "Our group" } },
      ],
    },

    testimonials: {
      layout: "cards",
      tone: "surface",
      navLabel: { mr: "अभिप्राय", en: "Reviews" },
      eyebrow: { mr: "प्रवासी काय म्हणतात", en: "What travellers say" },
      title: { mr: "आमच्या प्रवाशांचा विश्वास", en: "Trusted by our travellers" },
      items: [
        {
          name: "Sunita Kulkarni",
          place: { mr: "पुणे", en: "Pune" },
          rating: 5,
          text: {
            mr: "आई-बाबांना काश्मीरला पाठवले. संपूर्ण सहलीत टीमने खूप काळजी घेतली. पुन्हा नक्की जाणार!",
            en: "We sent our parents to Kashmir. The team took great care of them the whole trip. Will book again!",
          },
        },
        {
          name: "Rahul Deshmukh",
          place: { mr: "कोल्हापूर", en: "Kolhapur" },
          rating: 5,
          text: {
            mr: "ऑफिसच्या ४० जणांची गोवा सहल अगदी व्यवस्थित झाली. हॉटेल आणि जेवण उत्तम.",
            en: "Our 40-person office trip to Goa went perfectly. Great hotel and food.",
          },
        },
        {
          name: "Meera Joshi",
          place: { mr: "नाशिक", en: "Nashik" },
          rating: 5,
          text: {
            mr: "अष्टविनायक यात्रा शांतपणे आणि वेळेत पूर्ण झाली. गाइड खूप माहितीपूर्ण होते.",
            en: "The Ashtavinayak yatra was calm and on time. Our guide was very knowledgeable.",
          },
        },
      ],
    },

    faq: {
      layout: "accordion",
      navLabel: { mr: "प्रश्न", en: "FAQ" },
      eyebrow: { mr: "शंका आहे?", en: "Questions?" },
      title: { mr: "नेहमी विचारले जाणारे प्रश्न", en: "Frequently asked questions" },
      items: [
        {
          q: { mr: "बुकिंगसाठी किती आगाऊ रक्कम भरावी लागते?", en: "How much advance do I pay to book?" },
          a: {
            mr: "साधारणपणे २५% आगाऊ रक्कम भरून बुकिंग होते. उरलेली रक्कम प्रवासाच्या ७ दिवस आधी.",
            en: "Usually 25% to confirm the booking, and the rest 7 days before travel.",
          },
        },
        {
          q: { mr: "पॅकेजमध्ये बदल करता येतो का?", en: "Can I customise a package?" },
          a: {
            mr: "हो. तारीख, हॉटेल, ठिकाणे आणि दिवस तुमच्या बजेटनुसार बदलून देतो.",
            en: "Yes. We change dates, hotels, places and number of days to fit your budget.",
          },
        },
        {
          q: { mr: "सहल रद्द केल्यास पैसे परत मिळतात का?", en: "What if I cancel?" },
          a: {
            mr: "रद्द करण्याच्या तारखेनुसार परतावा मिळतो. संपूर्ण नियम बुकिंगवेळी लेखी देतो.",
            en: "Refunds depend on how early you cancel. We give you the full policy in writing when you book.",
          },
        },
        {
          q: { mr: "ज्येष्ठ नागरिकांसाठी सोय आहे का?", en: "Is it suitable for senior citizens?" },
          a: {
            mr: "हो. कमी चालणे, आरामदायक हॉटेल आणि सोबत मदतनीस अशी खास सोय करतो.",
            en: "Yes. We plan less walking, comfortable hotels and an assistant who travels with the group.",
          },
        },
      ],
    },

    cta: {
      layout: "card",
      title: { mr: "सहलीचे नियोजन आजच सुरू करा", en: "Start planning your trip today" },
      subtitle: {
        mr: "व्हॉट्सॲपवर मेसेज करा – १५ मिनिटांत तुमच्यासाठी पॅकेज पाठवतो.",
        en: "Message us on WhatsApp – we'll send you a package within 15 minutes.",
      },
    },

    enquiry: {
      layout: "split",
      tone: "surface",
      navLabel: { mr: "चौकशी", en: "Enquire" },
      eyebrow: { mr: "मोफत सल्ला", en: "Free trip planning" },
      title: { mr: "तुमची सहल सांगा", en: "Tell us about your trip" },
      subtitle: {
        mr: "माहिती भरा आणि व्हॉट्सॲपवर पाठवा. आम्ही लगेच संपर्क करू.",
        en: "Fill in the details and send them on WhatsApp. We'll get back to you right away.",
      },
    },

    contact: {
      layout: "map",
      navLabel: { mr: "संपर्क", en: "Contact" },
      eyebrow: { mr: "भेट द्या", en: "Visit us" },
      title: { mr: "आमचे ऑफिस", en: "Our office" },
    },
  },
};
