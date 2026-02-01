export const mockBooks = [
  {
    id: 1,
    title: "Seto Bagh",
    nepaliTitle: "सेतो बाघ",
    author: "Diamond Shumsher",
    nepaliAuthor: "डायमण्ड शमशेर",
    rating: 4.8,
    reviews: 1247,
    coverImage: null, // Will use CSS placeholder
    thumbnails: [null, null], // Will use CSS placeholders
    buyPrice: 450,
    rentPrice: 225,
    rentDays: 15,
    categories: ["Novels", "Nepali", "Classic"],
    nominations: [
      "Padmashree Sahitya Puraskar, 1975",
      "Madan Puraskar, 1974"
    ],
    descriptionEn: "A classic Nepali novel that explores themes of love, sacrifice, and social change in early 20th century Nepal. Set against the backdrop of the Rana regime, this masterpiece tells the story of forbidden love and the struggle for personal freedom. The novel presents a vivid portrayal of Nepali society during the Rana period, exploring themes of love, duty, and social transformation.",
    descriptionNp: "सेतो बाघ नेपाली साहित्यको एक उत्कृष्ट कृति हो। यो उपन्यासले राणाकालीन नेपाली समाजको चित्रण गर्दै प्रेम, त्याग र सामाजिक परिवर्तनका विषयहरूलाई उजागर गर्छ। यसमा निषेधित प्रेम र व्यक्तिगत स्वतन्त्रताको संघर्षको कथा भनिएको छ।",
    available: true,
    featured: true,
    bestseller: true,
    tags: ["Classic", "Romance", "Historical", "Nepali Literature"],
    userReviews: [
      {
        id: 1,
        reviewerName: "Sita Sharma",
        reviewerAvatar: "S",
        rating: 5,
        date: "December 18, 2025",
        reviewText: "सेतो बाघ नेपाली साहित्यको अमूल्य रत्न हो। डायमण्ड शमशेरको लेखनी शैली अतुलनीय छ। यो पुस्तकले मलाई गहिरो रूपमा प्रभावित पार्यो।"
      },
      {
        id: 2,
        reviewerName: "Rajesh Thapa",
        reviewerAvatar: "R",
        rating: 5,
        date: "December 10, 2025",
        reviewText: "A masterpiece of Nepali literature! The way Diamond Shumsher portrays the Rana period society is absolutely brilliant. Every character feels real and relatable."
      },
      {
        id: 3,
        reviewerName: "Kamala Devi",
        reviewerAvatar: "K",
        rating: 4,
        date: "November 28, 2025",
        reviewText: "राणाकालीन समयको सामाजिक चित्रण उत्कृष्ट छ। प्रेम कथा मन छुने छ। नेपाली साहित्यप्रेमीहरूका लागि अवश्य पढ्नुपर्ने पुस्तक।"
      }
    ]
  },
  {
    id: 2,
    title: "Palpasa Café",
    nepaliTitle: "पल्पसा क्याफे",
    author: "Narayan Wagle",
    nepaliAuthor: "नारायण वाग्ले",
    rating: 4.6,
    reviews: 892,
    coverImage: null,
    thumbnails: [null, null],
    buyPrice: 380,
    rentPrice: 190,
    rentDays: 16,
    categories: ["Novels", "Nepali", "Contemporary"],
    nominations: [
      "Madan Puraskar, 2005",
      "Jagadamba Shree Puraskar, 2006"
    ],
    descriptionEn: "A contemporary novel set during Nepal's civil war period, exploring love, conflict, and the search for peace through the eyes of a young artist and journalist. The story follows Drishya, a young artist, as he navigates love, loss, and the harsh realities of conflict.",
    descriptionNp: "पल्पसा क्याफे नेपालको गृहयुद्धकालीन परिस्थितिमा आधारित एक समसामयिक उपन्यास हो। यसले एक युवा कलाकार र पत्रकारको आँखाबाट प्रेम, द्वन्द्व र शान्तिको खोजीलाई चित्रण गर्छ।",
    available: true,
    featured: true,
    bestseller: false,
    tags: ["Contemporary", "War", "Romance", "Social Issues"],
    userReviews: [
      {
        id: 1,
        reviewerName: "Priya Adhikari",
        reviewerAvatar: "P",
        rating: 5,
        date: "December 15, 2025",
        reviewText: "पल्पसा क्याफे पढ्दा आँसु रोक्न सकिनँ। नारायण वाग्लेले युद्धकालीन पीडालाई यति सुन्दर तरिकाले प्रस्तुत गर्नुभएको छ। अविस्मरणीय कृति!"
      },
      {
        id: 2,
        reviewerName: "Arjun Karki",
        reviewerAvatar: "A",
        rating: 4,
        date: "December 8, 2025",
        reviewText: "A powerful narrative about love during wartime. Narayan Wagle's storytelling is exceptional. The characters are well-developed and the emotions feel genuine."
      },
      {
        id: 3,
        reviewerName: "Sunita Rai",
        reviewerAvatar: "S",
        rating: 5,
        date: "November 30, 2025",
        reviewText: "यो उपन्यासले नेपालको गृहयुद्धको वास्तविकतालाई उजागर गर्छ। प्रेम र युद्धको बीचमा फसेका मानिसहरूको कथा मन छुन्छ।"
      },
      {
        id: 4,
        reviewerName: "Bikash Shrestha",
        reviewerAvatar: "B",
        rating: 4,
        date: "November 22, 2025",
        reviewText: "Contemporary Nepali literature at its finest. The way the author captures the essence of conflict and human relationships is remarkable."
      }
    ]
  },
  {
    id: 3,
    title: "Karnali Blues",
    nepaliTitle: "कर्णाली ब्लुज",
    author: "Buddhisagar",
    nepaliAuthor: "बुद्धिसागर",
    rating: 4.7,
    reviews: 654,
    coverImage: null,
    thumbnails: [null, null],
    buyPrice: 420,
    rentPrice: 210,
    rentDays: 15,
    categories: ["Memoir", "Nepali", "Biography"],
    nominations: [
      "Madan Puraskar, 2010",
      "Padmashree Sahitya Puraskar, 2011"
    ],
    descriptionEn: "A deeply personal memoir that chronicles the author's journey from rural Karnali to urban life, exploring themes of identity, belonging, and the cost of progress. The narrative explores the complexities of rural-urban migration and the loss of traditional ways of life.",
    descriptionNp: "कर्णाली ब्लुज लेखकको ग्रामीण कर्णालीदेखि शहरी जीवनसम्मको यात्राको गहिरो व्यक्तिगत संस्मरण हो। यसले पहिचान, अपनत्व र प्रगतिको मूल्यका विषयहरूलाई अन्वेषण गर्छ।",
    available: true,
    featured: false,
    bestseller: true,
    tags: ["Memoir", "Rural Life", "Identity", "Social Change"],
    userReviews: [
      {
        id: 1,
        reviewerName: "Deepak Bohara",
        reviewerAvatar: "D",
        rating: 5,
        date: "December 12, 2025",
        reviewText: "कर्णाली ब्लुज पढ्दा आफ्नै गाउँको सम्झना आयो। बुद्धिसागरले ग्रामीण जीवनको वास्तविकतालाई यति सुन्दर तरिकाले प्रस्तुत गर्नुभएको छ।"
      },
      {
        id: 2,
        reviewerName: "Maya Gurung",
        reviewerAvatar: "M",
        rating: 4,
        date: "December 5, 2025",
        reviewText: "A beautifully written memoir that captures the essence of rural Nepal. The author's journey from Karnali to the city is both heartbreaking and inspiring."
      },
      {
        id: 3,
        reviewerName: "Ramesh Dahal",
        reviewerAvatar: "R",
        rating: 5,
        date: "November 25, 2025",
        reviewText: "यो पुस्तकले मलाई गहिरो रूपमा प्रभावित पार्यो। ग्रामीण र शहरी जीवनको बीचको द्वन्द्वलाई उत्कृष्ट तरिकाले चित्रण गरिएको छ।"
      }
    ]
  },
  {
    id: 4,
    title: "Summer Love",
    nepaliTitle: "समर लभ",
    author: "Subin Bhattarai",
    nepaliAuthor: "सुबिन भट्टराई",
    rating: 4.3,
    reviews: 1156,
    coverImage: null,
    thumbnails: [null, null],
    buyPrice: 350,
    rentPrice: 175,
    rentDays: 16,
    categories: ["Romance", "Nepali", "Youth"],
    nominations: [
      "Youth Choice Award, 2012",
      "Popular Fiction Award, 2013"
    ],
    descriptionEn: "A modern romance novel that captures the essence of young love in contemporary Nepal, filled with humor, emotion, and relatable characters. The novel resonates with young readers through its authentic dialogue and honest portrayal of relationships.",
    descriptionNp: "समर लभ समसामयिक नेपालमा युवा प्रेमको सार समेट्ने एक आधुनिक रोमान्स उपन्यास हो। यो हास्य, भावना र सम्बन्धनीय पात्रहरूले भरिएको छ।",
    available: true,
    featured: false,
    bestseller: false,
    tags: ["Romance", "Contemporary", "Youth", "Humor"],
    userReviews: [
      {
        id: 1,
        reviewerName: "Anjali Poudel",
        reviewerAvatar: "A",
        rating: 5,
        date: "December 20, 2025",
        reviewText: "Yo book le ekdam man chuyo! Subin ji ko har novel jhai sabda ma jaddu xa ❤️ Summer love ko story le malai hasayeko pani xa, ruwayeko pani xa."
      },
      {
        id: 2,
        reviewerName: "Rohit Tamang",
        reviewerAvatar: "R",
        rating: 4,
        date: "December 14, 2025",
        reviewText: "Perfect book for young readers! The characters are so relatable and the story flows beautifully. Subin Bhattarai knows how to capture youth emotions."
      },
      {
        id: 3,
        reviewerName: "Kritika Sharma",
        reviewerAvatar: "K",
        rating: 4,
        date: "December 7, 2025",
        reviewText: "युवाहरूको प्रेम कथा यति सुन्दर तरिकाले भनिएको छ। हास्य र भावनाको मिश्रण उत्कृष्ट छ। सुबिन भट्टराईको लेखनी शैली मन पर्छ।"
      },
      {
        id: 4,
        reviewerName: "Nischal Khadka",
        reviewerAvatar: "N",
        rating: 3,
        date: "November 28, 2025",
        reviewText: "Good read for teenagers. The story is engaging but sometimes feels a bit predictable. Overall, it's a decent romance novel."
      }
    ]
  },
  {
    id: 5,
    title: "Sirish Ko Phool",
    nepaliTitle: "सिरिसको फूल",
    author: "Parijat",
    nepaliAuthor: "पारिजात",
    rating: 4.9,
    reviews: 743,
    coverImage: null,
    thumbnails: [null, null],
    buyPrice: 395,
    rentPrice: 198,
    rentDays: 15,
    categories: ["Feminist", "Nepali", "Classic"],
    nominations: [
      "Madan Puraskar, 1965",
      "Sajha Puraskar, 1966",
      "Tribhuvan Puraskar, 1968"
    ],
    descriptionEn: "A groundbreaking feminist novel that challenged social norms and explored themes of love, independence, and women's rights in traditional Nepali society. The novel's exploration of love, freedom, and female agency was revolutionary for its time.",
    descriptionNp: "सिरिसको फूल नेपाली नारीवादी साहित्यको एक महत्वपूर्ण कृति हो। यसले परम्परागत नेपाली समाजमा प्रेम, स्वतन्त्रता र महिला अधिकारका विषयहरूलाई अन्वेषण गर्छ।",
    available: true,
    featured: true,
    bestseller: true,
    tags: ["Feminist", "Classic", "Social Issues", "Literature"],
    userReviews: [
      {
        id: 1,
        reviewerName: "Dr. Laxmi Devkota",
        reviewerAvatar: "L",
        rating: 5,
        date: "December 16, 2025",
        reviewText: "पारिजातको सिरिसको फूल नेपाली साहित्यको अमर कृति हो। महिला अधिकार र स्वतन्त्रताको पक्षमा यति बलियो आवाज उठाउने पहिलो उपन्यास।"
      },
      {
        id: 2,
        reviewerName: "Indira Joshi",
        reviewerAvatar: "I",
        rating: 5,
        date: "December 9, 2025",
        reviewText: "A revolutionary work that broke many social taboos. Parijat's bold narrative style and feminist themes were way ahead of her time. A must-read classic!"
      },
      {
        id: 3,
        reviewerName: "Kamala Sangraula",
        reviewerAvatar: "K",
        rating: 4,
        date: "December 1, 2025",
        reviewText: "यो उपन्यासले महिलाको स्वतन्त्र व्यक्तित्वलाई उजागर गर्छ। पारिजातको साहसिक लेखनीले समाजमा नयाँ चेतना जगाएको थियो।"
      },
      {
        id: 4,
        reviewerName: "Shanti Thapa",
        reviewerAvatar: "S",
        rating: 5,
        date: "November 20, 2025",
        reviewText: "Timeless masterpiece! The way Parijat challenges patriarchal norms through Sakambari's character is brilliant. Every woman should read this book."
      }
    ]
  },
  {
    id: 6,
    title: "Muna Madan",
    nepaliTitle: "मुनामदन",
    author: "Laxmi Prasad Devkota",
    nepaliAuthor: "लक्ष्मीप्रसाद देवकोटा",
    rating: 4.9,
    reviews: 2134,
    coverImage: null,
    thumbnails: [null, null],
    buyPrice: 280,
    rentPrice: 140,
    rentDays: 15,
    categories: ["Poetry", "Nepali", "Epic"],
    nominations: [
      "National Poet Laureate, 1936",
      "Tribhuvan Puraskar, 1962",
      "Prithvi Pragya Puraskar, 1955"
    ],
    descriptionEn: "Nepal's most beloved epic poem that tells the tragic story of Muna and Madan, exploring themes of love, sacrifice, and the human condition. The work is renowned for its beautiful language and profound themes.",
    descriptionNp: "मुनामदन नेपाली साहित्यको सबैभन्दा प्रिय महाकाव्य हो जसले मुना र मदनको दुःखद कथा भन्छ। यसले प्रेम, त्याग र मानवीय अवस्थाका विषयहरूलाई अन्वेषण गर्छ।",
    available: true,
    featured: true,
    bestseller: true,
    tags: ["Poetry", "Epic", "Classic", "Tragedy", "Love"],
    userReviews: [
      {
        id: 1,
        reviewerName: "Bishnu Kumari",
        reviewerAvatar: "B",
        rating: 5,
        date: "December 22, 2025",
        reviewText: "मुनामदन नेपाली साहित्यको मुकुटमणि हो। महाकवि देवकोटाको यो कृतिले हरेक नेपालीको मन छुन्छ। प्रेम र त्यागको अमर गाथा।"
      },
      {
        id: 2,
        reviewerName: "Govinda Raj Bhattarai",
        reviewerAvatar: "G",
        rating: 5,
        date: "December 18, 2025",
        reviewText: "The greatest work in Nepali literature! Devkota's poetic genius shines through every verse. The story of Muna and Madan is both heartbreaking and beautiful."
      },
      {
        id: 3,
        reviewerName: "Saraswati Pradhan",
        reviewerAvatar: "S",
        rating: 5,
        date: "December 11, 2025",
        reviewText: "यो महाकाव्य पढ्दा आँसु आउँछ। मुना र मदनको प्रेम कथाले मानवीय भावनाको गहिराइलाई छुन्छ। अविस्मरणीय कृति!"
      },
      {
        id: 4,
        reviewerName: "Ramchandra Poudel",
        reviewerAvatar: "R",
        rating: 4,
        date: "December 3, 2025",
        reviewText: "A timeless epic that captures the essence of human emotions. The language is beautiful and the story is deeply moving. Every Nepali should read this."
      },
      {
        id: 5,
        reviewerName: "Ganga Devi Thapa",
        reviewerAvatar: "G",
        rating: 5,
        date: "November 26, 2025",
        reviewText: "महाकवि देवकोटाको यो कृति नेपाली भाषा र साहित्यको गौरव हो। मुनामदनको कथाले मानवीय मूल्यहरूलाई उजागर गर्छ।"
      }
    ]
  }
];

// Helper function to get book by ID
export const getBookById = (id) => {
  return mockBooks.find(book => book.id === parseInt(id));
};

// Helper function to get featured books
export const getFeaturedBooks = () => {
  return mockBooks.filter(book => book.featured);
};

// Helper function to get bestsellers
export const getBestsellers = () => {
  return mockBooks.filter(book => book.bestseller);
};

// Helper function to get books by category
export const getBooksByCategory = (category) => {
  return mockBooks.filter(book => book.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase())));
};