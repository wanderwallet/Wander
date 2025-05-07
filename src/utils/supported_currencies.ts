const supportedCurrencies = [
  {
    id: "aed",
    name: "United Arab Emirates Dirham",
  },
  {
    id: "aud",
    name: "Australian Dollar",
  },
  {
    id: "azn",
    name: "Azerbaijan Manat",
  },
  {
    id: "bgn",
    name: "Bulgarian Lev",
  },
  {
    id: "bhd",
    name: "Bahraini Dinar",
  },
  {
    id: "brl",
    name: "Brazilian Real",
  },
  {
    id: "cad",
    name: "Canadian Dollar",
  },
  {
    id: "clp",
    name: "Chilean Peso",
  },
  {
    id: "cop",
    name: "Colombian Peso",
  },
  {
    id: "crc",
    name: "Costa Rican Colón",
  },
  {
    id: "czk",
    name: "Czech Republic Koruna",
  },
  {
    id: "dkk",
    name: "Danish Krone",
  },
  {
    id: "dop",
    name: "Dominican Peso",
  },
  {
    id: "eur",
    name: "Euro Member Countries",
  },
  {
    id: "gbp",
    name: "British Pound Sterling",
  },
  {
    id: "gel",
    name: "Georgian Lari",
  },
  {
    id: "gtq",
    name: "Guatemalan Quetzal",
  },
  {
    id: "hkd",
    name: "Hong Kong Dollar",
  },
  {
    id: "hnl",
    name: "Honduran Lempira",
  },
  {
    id: "huf",
    name: "Hungarian Forint",
  },
  {
    id: "idr",
    name: "Indonesian Rupiah",
  },
  {
    id: "ils",
    name: "Israeli New Shekel",
  },
  {
    id: "inr",
    name: "Indian Rupee",
  },
  {
    id: "krw",
    name: "South Korean Won",
  },
  {
    id: "kwd",
    name: "Kuwaiti Dinar",
  },
  {
    id: "mdl",
    name: "Moldovan Leu",
  },
  {
    id: "mxn",
    name: "Mexican Peso",
  },
  {
    id: "myr",
    name: "Malaysian Ringgit",
  },
  {
    id: "nok",
    name: "Norwegian Krone",
  },
  {
    id: "nzd",
    name: "New Zealand Dollar",
  },
  {
    id: "omr",
    name: "Omani Rial",
  },
  {
    id: "pen",
    name: "Peruvian Nuevo Sol",
  },
  {
    id: "php",
    name: "Philippine Peso",
  },
  {
    id: "pln",
    name: "Polish Złoty",
  },
  {
    id: "pyg",
    name: "Paraguayan Guarani",
  },
  {
    id: "ron",
    name: "Romanian Leu",
  },
  {
    id: "rwf",
    name: "Rwandan Franc",
  },
  {
    id: "sek",
    name: "Swedish Krona",
  },
  {
    id: "thb",
    name: "Thai Baht",
  },
  {
    id: "try",
    name: "Turkish Lira",
  },
  {
    id: "twd",
    name: "New Taiwan Dollar",
  },
  {
    id: "usd",
    name: "United States Dollar",
  },
  {
    id: "uyu",
    name: "Uruguayan Peso",
  },
  {
    id: "vnd",
    name: "Vietnamese Đồng",
  },
  {
    id: "zar",
    name: "South African Rand",
  },
  {
    id: "chf",
    name: "Swiss Franc",
  },
  {
    id: "jpy",
    name: "Japanese Yen",
  },
  {
    id: "isk",
    name: "Icelandic Króna",
  },
  {
    id: "bzd",
    name: "Belize Dollar",
  },
  {
    id: "jmd",
    name: "Jamaican Dollar",
  },
  {
    id: "bbd",
    name: "Barbadian Dollar",
  },
  {
    id: "xof",
    name: "CFA Franc BCEAO",
  },
  {
    id: "xcd",
    name: "East Caribbean Dollar",
  },
  {
    id: "kmf",
    name: "Comorian Franc",
  },
  {
    id: "scr",
    name: "Seychellois Rupee",
  },
  {
    id: "aoa",
    name: "Angolan Kwanza",
  },
  {
    id: "kgs",
    name: "Kyrgyzstani Som",
  },
  {
    id: "mga",
    name: "Malagasy Ariary",
  },
  {
    id: "mzn",
    name: "Mozambican Metical",
  },
  {
    id: "tzs",
    name: "Tanzanian Shilling",
  },
  {
    id: "khr",
    name: "Cambodian Riel",
  },
  {
    id: "sgd",
    name: "Singapore Dollar",
  },
  {
    id: "kes",
    name: "Kenyan Shilling",
  },
  {
    id: "ngn",
    name: "Nigerian Naira",
  },
  {
    id: "fjd",
    name: "Fijian Dollar",
  },
  {
    id: "bmd",
    name: "Bermudian Dollar",
  },
  {
    id: "fkp",
    name: "Falkland Islands Pound",
  },
  {
    id: "gip",
    name: "Gibraltar Pound",
  },
  {
    id: "bnd",
    name: "Brunei Dollar",
  },
  {
    id: "xaf",
    name: "CFA Franc BEAC",
  },
  {
    id: "djf",
    name: "Djiboutian Franc",
  },
  {
    id: "kzt",
    name: "Kazakhstani Tenge",
  },
  {
    id: "mwk",
    name: "Malawian Kwacha",
  },
  {
    id: "mru",
    name: "Mauritanian Ouguiya",
  },
  {
    id: "pgk",
    name: "Kina",
  },
  {
    id: "stn",
    name: "Dobra",
  },
  {
    id: "sbd",
    name: "Solomon Islands Dollar",
  },
  {
    id: "srd",
    name: "Suriname Dollar",
  },
  {
    id: "szl",
    name: "Lilangeni",
  },
  {
    id: "tjs",
    name: "Somoni",
  },
  {
    id: "top",
    name: "Pa’anga",
  },
  {
    id: "tmt",
    name: "Turkmenistan New Manat",
  },
  {
    id: "mkd",
    name: "Macedonia Denar",
  },
  {
    id: "amd",
    name: "Armenian dram",
  },
  {
    id: "jod",
    name: "Jordanian Dinar",
  },
  {
    id: "ghs",
    name: "Ghana Cedi",
  },
  {
    id: "rsd",
    name: "Serbia Dinar",
  },
  {
    id: "ang",
    name: "Netherlands Antilles Guilder",
  },
  {
    id: "bsd",
    name: "Bahamas Dollar",
  },
  {
    id: "kyd",
    name: "Cayman Islands Dollar",
  },
  {
    id: "bam",
    name: "Bosnia and Herzegovina Convertible Mark",
  },
  {
    id: "ttd",
    name: "Trinidad and Tobago Dollar",
  },
  {
    id: "pab",
    name: "Panama Balboa",
  },
];

export default supportedCurrencies;
