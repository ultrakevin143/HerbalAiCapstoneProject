export interface RegionalHerbInfo {
  canonicalLocalName: string; // Exact match to DB localName
  scientificName: string;
  english: string;
  tagalog: string;
  cebuano: string;
  ilocano: string;
  bikol: string;
  hiligaynon?: string;
  otherDialects?: string;
  stuartUrl?: string;
}

export const REGIONAL_HERB_REGISTRY: Record<string, RegionalHerbInfo> = {
  "abutilonindicum": {
    "canonicalLocalName": "Abutilon indicum",
    "scientificName": "Abutilon indicum",
    "english": "Indian Mallow, Country Mallow",
    "tagalog": "Malvas, Kuakuakohan",
    "cebuano": "Malbas, Dalupang",
    "ilocano": "Luplupit, Taratakop",
    "bikol": "Dulupang",
    "hiligaynon": "Malbas",
    "otherDialects": "Gilingita (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Malbas.html"
  },
  "akapulko": {
    "canonicalLocalName": "Akapulko",
    "scientificName": "Senna alata",
    "english": "Ringworm Bush, Candle Bush",
    "tagalog": "Akapulko, Katanda",
    "cebuano": "Katanduk, Sunting, Palochina",
    "ilocano": "Andadasi, Andadasi-dakkel",
    "bikol": "Bayabas-bayabasan",
    "hiligaynon": "Kasitas, Katanduk",
    "otherDialects": "Pakagonkon (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Akapulko.html"
  },
  "alibangbang": {
    "canonicalLocalName": "Alibangbang",
    "scientificName": "Piliostigma malabaricum",
    "english": "Malabar Orchid Tree",
    "tagalog": "Alibangbang",
    "cebuano": "Alambangbang",
    "ilocano": "Balisbik, Kalibangbang",
    "bikol": "Alibangbang",
    "hiligaynon": "Alibangbang",
    "otherDialects": "Kulibangbang (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Alibangbang.html"
  },
  "ampalaya": {
    "canonicalLocalName": "Ampalaya",
    "scientificName": "Momordica charantia",
    "english": "Bitter Melon, Bitter Gourd",
    "tagalog": "Ampalaya, Margoso",
    "cebuano": "Paliya, Palia",
    "ilocano": "Pariya, Paria",
    "bikol": "Paria, Pariu",
    "hiligaynon": "Palia, Amargoso",
    "otherDialects": "Apalia (Pamp.), Apape (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Ampalaya.html"
  },
  "anonas": {
    "canonicalLocalName": "Anonas",
    "scientificName": "Annona reticulata",
    "english": "Custard Apple, Bullock's Heart",
    "tagalog": "Anonas",
    "cebuano": "Anonas",
    "ilocano": "Anonas",
    "bikol": "Anonas",
    "hiligaynon": "Anonas",
    "otherDialects": "Sariwaya (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Anonas.html"
  },
  "aratiles": {
    "canonicalLocalName": "Aratiles",
    "scientificName": "Muntingia calabura",
    "english": "Jamaica Cherry, Cotton Candy Berry",
    "tagalog": "Aratiles, Datiles",
    "cebuano": "Mansanitas, Manzanitas",
    "ilocano": "Zanitas, Ceresas",
    "bikol": "Aratiles",
    "hiligaynon": "Mansanitas",
    "otherDialects": "Dares (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Aratiles.html"
  },
  "asana": {
    "canonicalLocalName": "Asana",
    "scientificName": "Pterocarpus indicus",
    "english": "Narra Tree, Red Sandalwood",
    "tagalog": "Narra, Asana",
    "cebuano": "Narra, Asana, Nega",
    "ilocano": "Narra",
    "bikol": "Naga",
    "hiligaynon": "Narra",
    "otherDialects": "Daitan (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Narra.html"
  },
  "atis": {
    "canonicalLocalName": "Atis",
    "scientificName": "Annona squamosa",
    "english": "Sugar Apple, Sweetsop",
    "tagalog": "Atis",
    "cebuano": "Atis",
    "ilocano": "Atis",
    "bikol": "Atis",
    "hiligaynon": "Atis",
    "otherDialects": "Yate (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Atis.html"
  },
  "atsuete": {
    "canonicalLocalName": "Atsuete",
    "scientificName": "Bixa orellana",
    "english": "Annatto, Lipstick Tree",
    "tagalog": "Atsuete, Achuete",
    "cebuano": "Achiote, Natin, Suwiti",
    "ilocano": "Atsuete, Asuete",
    "bikol": "Atsuete",
    "hiligaynon": "Achiote",
    "otherDialects": "Chanang (Sul.), Soté (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Achuete.html"
  },
  "ayapana": {
    "canonicalLocalName": "Ayapana",
    "scientificName": "Ayapana triplinervis",
    "english": "Ayapana Tea, Water Hemp",
    "tagalog": "Ayapana",
    "cebuano": "Ayapana",
    "ilocano": "Ayapana",
    "bikol": "Ayapana",
    "hiligaynon": "Ayapana",
    "otherDialects": "Aiapana (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Ayapana.html"
  },
  "balanay": {
    "canonicalLocalName": "Balanay",
    "scientificName": "Ocimum tenuiflorum",
    "english": "Holy Basil, Tulsi",
    "tagalog": "Sulasi, Balanoy",
    "cebuano": "Balanay, Sulasi",
    "ilocano": "Bidai",
    "bikol": "Kamange",
    "hiligaynon": "Balanay",
    "otherDialects": "Loko-loko (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Sulasi.html"
  },
  "balibago": {
    "canonicalLocalName": "Balibago",
    "scientificName": "Hibiscus tiliaceus",
    "english": "Sea Hibiscus, Beach Hibiscus",
    "tagalog": "Balibago",
    "cebuano": "Balibago, Ragindi",
    "ilocano": "Bago",
    "bikol": "Malabago",
    "hiligaynon": "Balibago",
    "otherDialects": "Malabago (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Balibago.html"
  },
  "balimbing": {
    "canonicalLocalName": "Balimbing",
    "scientificName": "Averrhoa carambola",
    "english": "Star Fruit, Carambola",
    "tagalog": "Balimbing",
    "cebuano": "Balimbing, Galangan",
    "ilocano": "Daligan",
    "bikol": "Balimbing",
    "hiligaynon": "Balimbing",
    "otherDialects": "Garahan (Bis. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Balimbing.html"
  },
  "bankundo": {
    "canonicalLocalName": "Bankundo",
    "scientificName": "Morinda citrifolia",
    "english": "Noni, Indian Mulberry",
    "tagalog": "Bankundo, Nino, Apatot",
    "cebuano": "Bankundo, Apatot",
    "ilocano": "Apatot",
    "bikol": "Bangkoro",
    "hiligaynon": "Bankundo",
    "otherDialects": "Nino (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Apatot.html"
  },
  "bawang": {
    "canonicalLocalName": "Bawang",
    "scientificName": "Allium sativum",
    "english": "Garlic",
    "tagalog": "Bawang, Bauang",
    "cebuano": "Ahos",
    "ilocano": "Bawsing, Lasona",
    "bikol": "Bawang, Ahos",
    "hiligaynon": "Ahos",
    "otherDialects": "Ganding (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Bawang.html"
  },
  "bayabas": {
    "canonicalLocalName": "Bayabas",
    "scientificName": "Psidium guajava",
    "english": "Guava",
    "tagalog": "Bayabas, Kalimbahin",
    "cebuano": "Bayabas",
    "ilocano": "Bayawas",
    "bikol": "Bayawas",
    "hiligaynon": "Bayabas",
    "otherDialects": "Biabas (Sul.), Gaiyabat (If.)",
    "stuartUrl": "https://www.stuartxchange.org/Bayabas.html"
  },
  "bottlegourd": {
    "canonicalLocalName": "Bottle gourd",
    "scientificName": "Lagenaria siceraria",
    "english": "Bottle Gourd, Calabash",
    "tagalog": "Upo",
    "cebuano": "Upo, Sikay",
    "ilocano": "Tabungaw",
    "bikol": "Upo",
    "hiligaynon": "Upo",
    "otherDialects": "Bagang (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Upo.html"
  },
  "butterflypea": {
    "canonicalLocalName": "Butterfly pea",
    "scientificName": "Clitoria ternatea",
    "english": "Butterfly Pea, Blue Pea",
    "tagalog": "Kolokanting, Pukingan",
    "cebuano": "Pukingan, Kolokanting",
    "ilocano": "Sam-sam-ping, Puki-reyna",
    "bikol": "Kolokanting",
    "hiligaynon": "Pukingan",
    "otherDialects": "Balog-balog (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/ButterflyPea.html"
  },
  "cacao": {
    "canonicalLocalName": "Cacao",
    "scientificName": "Theobroma cacao",
    "english": "Cacao, Cocoa Tree",
    "tagalog": "Kakaw, Cacao",
    "cebuano": "Kakaw",
    "ilocano": "Kakaw",
    "bikol": "Kakaw",
    "hiligaynon": "Kakaw",
    "otherDialects": "Cacau (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Cacao.html"
  },
  "chico": {
    "canonicalLocalName": "Chico",
    "scientificName": "Manilkara zapota",
    "english": "Sapodilla, Chiku",
    "tagalog": "Tsiko, Chico",
    "cebuano": "Tsiko, Siko",
    "ilocano": "Tsiko",
    "bikol": "Tsiko",
    "hiligaynon": "Tsiko",
    "otherDialects": "Chico (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Chico.html"
  },
  "coffee": {
    "canonicalLocalName": "Coffee",
    "scientificName": "Coffea arabica",
    "english": "Arabian Coffee",
    "tagalog": "Kape",
    "cebuano": "Kape",
    "ilocano": "Kape",
    "bikol": "Kape",
    "hiligaynon": "Kape",
    "otherDialects": "Kafe (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Kape.html"
  },
  "damongmaria": {
    "canonicalLocalName": "Damong Maria",
    "scientificName": "Artemisia vulgaris",
    "english": "Mugwort, Maidenwort",
    "tagalog": "Damong Maria, Kamaria",
    "cebuano": "Gilbas, Hilbas",
    "ilocano": "Arbaaka, Erbaaka",
    "bikol": "Damong Maria",
    "hiligaynon": "Gilbas",
    "otherDialects": "Erbaca (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/DamongMaria.html"
  },
  "doldol": {
    "canonicalLocalName": "Doldol",
    "scientificName": "Ceiba pentandra",
    "english": "Kapok, Silk-Cotton Tree",
    "tagalog": "Kapok, Bulak",
    "cebuano": "Doldol, Kapok",
    "ilocano": "Kapas-sanglay",
    "bikol": "Doldol",
    "hiligaynon": "Doldol",
    "otherDialects": "Kayu (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Kapok.html"
  },
  "duhat": {
    "canonicalLocalName": "Duhat",
    "scientificName": "Syzygium cumini",
    "english": "Java Plum, Black Plum",
    "tagalog": "Duhat",
    "cebuano": "Lomboy, Lumboy",
    "ilocano": "Lungboy, Dungboy",
    "bikol": "Duhat, Lomboy",
    "hiligaynon": "Lomboy",
    "otherDialects": "Dughat (Kin.)",
    "stuartUrl": "https://www.stuartxchange.org/Duhat.html"
  },
  "fennel": {
    "canonicalLocalName": "Fennel",
    "scientificName": "Foeniculum vulgare",
    "english": "Fennel, Sweet Fennel",
    "tagalog": "Haras, Anis",
    "cebuano": "Harani, Anis",
    "ilocano": "Haras",
    "bikol": "Haras",
    "hiligaynon": "Haras",
    "otherDialects": "Anis (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Haras.html"
  },
  "gabi": {
    "canonicalLocalName": "Gabi",
    "scientificName": "Colocasia esculenta",
    "english": "Taro, Elephant Ear",
    "tagalog": "Gabi, Gandus",
    "cebuano": "Karlang, Gaway-gaway",
    "ilocano": "Aba, Aba-aba",
    "bikol": "Gabi, Dagmay, Natong",
    "hiligaynon": "Gabi, Dagmay",
    "otherDialects": "Lagway (War.)",
    "stuartUrl": "https://www.stuartxchange.org/Gabi.html"
  },
  "granada": {
    "canonicalLocalName": "Granada",
    "scientificName": "Punica granatum",
    "english": "Pomegranate",
    "tagalog": "Granada",
    "cebuano": "Granada",
    "ilocano": "Granada",
    "bikol": "Granada",
    "hiligaynon": "Granada",
    "otherDialects": "Dalima (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Granada.html"
  },
  "gumamela": {
    "canonicalLocalName": "Gumamela",
    "scientificName": "Hibiscus rosa-sinensis",
    "english": "China Rose, Hibiscus",
    "tagalog": "Gumamela",
    "cebuano": "Antolanga, Kayanga",
    "ilocano": "Tarokanga, Kayanga",
    "bikol": "Gumamela, Kayanga",
    "hiligaynon": "Tapulanga, Antolanga",
    "otherDialects": "Arotangan (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Gumamela.html"
  },
  "indianheliotrope": {
    "canonicalLocalName": "Indian Heliotrope",
    "scientificName": "Heliotropium indicum",
    "english": "Indian Heliotrope, Turnsole",
    "tagalog": "Hinlalayon, Trompa ng Elepante",
    "cebuano": "Hinlalayon, Kamo-kamo",
    "ilocano": "Elk-elko, Pengka-pengka",
    "bikol": "Trompa elepante",
    "hiligaynon": "Kamo-kamo",
    "otherDialects": "Malatukod (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/TrompaElepante.html"
  },
  "kabiki": {
    "canonicalLocalName": "Kabiki",
    "scientificName": "Mimusops elengi",
    "english": "Spanish Cherry, Bullet Wood",
    "tagalog": "Kabiki",
    "cebuano": "Kabiki",
    "ilocano": "Kabiki",
    "bikol": "Kabiki",
    "hiligaynon": "Kabiki",
    "otherDialects": "Bansalagin (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Kabiki.html"
  },
  "kahel": {
    "canonicalLocalName": "Kahel",
    "scientificName": "Citrus aurantium",
    "english": "Bitter Orange, Seville Orange",
    "tagalog": "Kahel, Dalandan",
    "cebuano": "Kahel, Kolobot",
    "ilocano": "Kahel",
    "bikol": "Kahel",
    "hiligaynon": "Kahel",
    "otherDialects": "Kolobot (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Kahel.html"
  },
  "kalingag": {
    "canonicalLocalName": "Kalingag",
    "scientificName": "Cinnamomum mercadoi",
    "english": "Philippine Cinnamon",
    "tagalog": "Kalingag, Samiling",
    "cebuano": "Kaningag, Kalingag",
    "ilocano": "Kasiu, Kalingag",
    "bikol": "Canela, Kalingag",
    "hiligaynon": "Kaningag",
    "otherDialects": "Maragao (Mar.)",
    "stuartUrl": "https://www.stuartxchange.org/Kalingag.html"
  },
  "kalumpang": {
    "canonicalLocalName": "Kalumpang",
    "scientificName": "Sterculia foetida",
    "english": "Java Olive, Wild Almond",
    "tagalog": "Kalumpang",
    "cebuano": "Kalumpang, Bangad",
    "ilocano": "Bangar",
    "bikol": "Kalumpang",
    "hiligaynon": "Kalumpang",
    "otherDialects": "Bobog (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Kalumpang.html"
  },
  "kamias": {
    "canonicalLocalName": "Kamias",
    "scientificName": "Averrhoa bilimbi",
    "english": "Bilimbi, Cucumber Tree",
    "tagalog": "Kamias, Kalamyas",
    "cebuano": "Iba, Kalingi",
    "ilocano": "Pias",
    "bikol": "Iba",
    "hiligaynon": "Iba",
    "otherDialects": "Kolonanas (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Kamias.html"
  },
  "kamote": {
    "canonicalLocalName": "Kamote",
    "scientificName": "Ipomoea batatas",
    "english": "Sweet Potato",
    "tagalog": "Kamote",
    "cebuano": "Kamote",
    "ilocano": "Kamote",
    "bikol": "Kamote",
    "hiligaynon": "Kamote",
    "otherDialects": "Lapni (If.), Lokto (Igorot)",
    "stuartUrl": "https://www.stuartxchange.org/Kamote.html"
  },
  "kastuli": {
    "canonicalLocalName": "Kastuli",
    "scientificName": "Abelmoschus moschatus",
    "english": "Musk Mallow, Ambrette",
    "tagalog": "Kastuli",
    "cebuano": "Kastuli, Dalupang",
    "ilocano": "Kastuli",
    "bikol": "Kastuli",
    "hiligaynon": "Kastuli",
    "otherDialects": "Marikum (Bis.)",
    "stuartUrl": "https://www.stuartxchange.org/Kastuli.html"
  },
  "kasuy": {
    "canonicalLocalName": "Kasuy",
    "scientificName": "Anacardium occidentale",
    "english": "Cashew Nut, Cashew Apple",
    "tagalog": "Kasuy, Kasoy",
    "cebuano": "Kasoy",
    "ilocano": "Kasoy",
    "bikol": "Kasoy",
    "hiligaynon": "Kasoy",
    "otherDialects": "Balubad (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Kasuy.html"
  },
  "katakataka": {
    "canonicalLocalName": "Katakataka",
    "scientificName": "Kalanchoe pinnata",
    "english": "Miracle Leaf, Cathedral Bells",
    "tagalog": "Katakataka",
    "cebuano": "Maritana, Abaniko, Hito-hito",
    "ilocano": "Katakataka, Siempre viva",
    "bikol": "Karitana",
    "hiligaynon": "Maritana",
    "otherDialects": "Ditana (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Katakataka.html"
  },
  "katuray": {
    "canonicalLocalName": "Katuray",
    "scientificName": "Sesbania grandiflora",
    "english": "Vegetable Hummingbird, Agati",
    "tagalog": "Katuray",
    "cebuano": "Katuray, Gaway-gaway",
    "ilocano": "Katuday",
    "bikol": "Katuray",
    "hiligaynon": "Gaway-gaway",
    "otherDialects": "Diana (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Katuray.html"
  },
  "kupang": {
    "canonicalLocalName": "Kupang",
    "scientificName": "Parkia timoriana",
    "english": "Tree Bean, Timor Parkia",
    "tagalog": "Kupang",
    "cebuano": "Kupang",
    "ilocano": "Kupang",
    "bikol": "Kupang",
    "hiligaynon": "Kupang",
    "otherDialects": "Amarang (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Kupang.html"
  },
  "lagundi": {
    "canonicalLocalName": "Lagundi",
    "scientificName": "Vitex negundo",
    "english": "Five-leaved Chaste Tree",
    "tagalog": "Lagundi, Kamalan",
    "cebuano": "Dangla, Lagundi, Turagay",
    "ilocano": "Dangla, Limo-limo",
    "bikol": "Dangla, Agno-casto",
    "hiligaynon": "Lagundi",
    "otherDialects": "Dabtan (If.), Gei (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Lagundi.html"
  },
  "langka": {
    "canonicalLocalName": "Langka",
    "scientificName": "Artocarpus heterophyllus",
    "english": "Jackfruit",
    "tagalog": "Langka, Nangka",
    "cebuano": "Nangka, Lanka",
    "ilocano": "Langka",
    "bikol": "Langka",
    "hiligaynon": "Nangka",
    "otherDialects": "Anangka (Ilk. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Langka.html"
  },
  "linga": {
    "canonicalLocalName": "Linga",
    "scientificName": "Sesamum indicum",
    "english": "Sesame, Gingelly",
    "tagalog": "Linga",
    "cebuano": "Linga",
    "ilocano": "Lenga",
    "bikol": "Linga",
    "hiligaynon": "Linga",
    "otherDialects": "Langis (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Linga.html"
  },
  "lokoloko": {
    "canonicalLocalName": "Lokoloko",
    "scientificName": "Ocimum gratissimum",
    "english": "Clove Basil, African Basil",
    "tagalog": "Lokoloko",
    "cebuano": "Lokoloko, Kalo-kalo",
    "ilocano": "Loko-loko",
    "bikol": "Lokoloko",
    "hiligaynon": "Lokoloko",
    "otherDialects": "Kolon-kogon (Bis.)",
    "stuartUrl": "https://www.stuartxchange.org/Lokoloko.html"
  },
  "luffaaegyptiaca": {
    "canonicalLocalName": "Luffa aegyptiaca",
    "scientificName": "Luffa aegyptiaca",
    "english": "Sponge Gourd, Smooth Loofah",
    "tagalog": "Patola",
    "cebuano": "Patola, Kabatiti",
    "ilocano": "Kabatiti",
    "bikol": "Patola",
    "hiligaynon": "Patola",
    "otherDialects": "Salag-salag (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Patola.html"
  },
  "luya": {
    "canonicalLocalName": "Luya",
    "scientificName": "Zingiber officinale",
    "english": "Ginger",
    "tagalog": "Luya",
    "cebuano": "Luy-a",
    "ilocano": "Laya",
    "bikol": "Luy-a",
    "hiligaynon": "Luy-a",
    "otherDialects": "Baseng (Ilk.), Gome (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Luya.html"
  },
  "luyangdilaw": {
    "canonicalLocalName": "Luyang dilaw",
    "scientificName": "Curcuma longa",
    "english": "Turmeric, Yellow Ginger",
    "tagalog": "Luyang Dilaw, Dilaw",
    "cebuano": "Dulaw, Kalawag, Talaw",
    "ilocano": "Kunig",
    "bikol": "Dilaw, Kalawag",
    "hiligaynon": "Dulaw",
    "otherDialects": "Kalabaga (Bis./Man.), Pangas (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Dilaw.html"
  },
  "mabolo": {
    "canonicalLocalName": "Mabolo",
    "scientificName": "Diospyros blancoi",
    "english": "Velvet Apple, Mabolo",
    "tagalog": "Mabolo, Kamagong",
    "cebuano": "Kamagong, Talang",
    "ilocano": "Kamagong, Mabolo",
    "bikol": "Mabolo",
    "hiligaynon": "Kamagong",
    "otherDialects": "Amaga (Tagbanua)",
    "stuartUrl": "https://www.stuartxchange.org/Mabolo.html"
  },
  "maize": {
    "canonicalLocalName": "Maize",
    "scientificName": "Zea mays",
    "english": "Corn, Maize",
    "tagalog": "Mais",
    "cebuano": "Mais",
    "ilocano": "Mais",
    "bikol": "Mais",
    "hiligaynon": "Mais",
    "otherDialects": "Borona (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Mais.html"
  },
  "makabuhay": {
    "canonicalLocalName": "Makabuhay",
    "scientificName": "Tinospora crispa",
    "english": "Heavenly Elixir, Bitter Grape",
    "tagalog": "Makabuhay",
    "cebuano": "Panyawan, Paliaban",
    "ilocano": "Pangiawan, Makabuhay",
    "bikol": "Makabuhay",
    "hiligaynon": "Panyawan",
    "otherDialects": "Manungal (Bis. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Makabuhay.html"
  },
  "malunggay": {
    "canonicalLocalName": "Malunggay",
    "scientificName": "Moringa oleifera",
    "english": "Moringa, Drumstick Tree",
    "tagalog": "Malunggay",
    "cebuano": "Kamalunggay, Kalunggay",
    "ilocano": "Marunggay",
    "bikol": "Malunggay",
    "hiligaynon": "Balunggay, Kamalunggay",
    "otherDialects": "Dool (Pamp.), Arunggay (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Malunggay.html"
  },
  "mangga": {
    "canonicalLocalName": "Mangga",
    "scientificName": "Mangifera indica",
    "english": "Mango",
    "tagalog": "Mangga",
    "cebuano": "Paho, Mangga",
    "ilocano": "Manga",
    "bikol": "Manga",
    "hiligaynon": "Paho, Mangga",
    "otherDialects": "Pao (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Mangga.html"
  },
  "mangosteen": {
    "canonicalLocalName": "Mangosteen",
    "scientificName": "Garcinia mangostana",
    "english": "Mangosteen, Queen of Fruits",
    "tagalog": "Mangostan, Mangosteen",
    "cebuano": "Mangostan",
    "ilocano": "Mangostan",
    "bikol": "Mangostan",
    "hiligaynon": "Mangostan",
    "otherDialects": "Manggis (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Mangostan.html"
  },
  "manzanitas": {
    "canonicalLocalName": "Manzanitas",
    "scientificName": "Ziziphus mauritiana",
    "english": "Indian Jujube, Chinese Date",
    "tagalog": "Manzanitas",
    "cebuano": "Mansanitas",
    "ilocano": "Zanitas",
    "bikol": "Manzanitas",
    "hiligaynon": "Mansanitas",
    "otherDialects": "Diklap (Ilk.)",
    "stuartUrl": "https://www.stuartxchange.org/Manzanitas.html"
  },
  "mayana": {
    "canonicalLocalName": "Mayana",
    "scientificName": "Coleus scutellarioides",
    "english": "Coleus, Painted Nettle",
    "tagalog": "Mayana",
    "cebuano": "Lampunaya, Mayana, Daponaya",
    "ilocano": "Sapiro, Maliana",
    "bikol": "Mayana",
    "hiligaynon": "Lampunaya",
    "otherDialects": "Badayang (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Mayana.html"
  },
  "mustasa": {
    "canonicalLocalName": "Mustasa",
    "scientificName": "Brassica juncea",
    "english": "Mustard Greens, Indian Mustard",
    "tagalog": "Mustasa",
    "cebuano": "Mustasa",
    "ilocano": "Mustasa",
    "bikol": "Mustasa",
    "hiligaynon": "Mustasa",
    "otherDialects": "Mostaza (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Mustasa.html"
  },
  "niog": {
    "canonicalLocalName": "Niog",
    "scientificName": "Cocos nucifera",
    "english": "Coconut Tree",
    "tagalog": "Niyog, Niog",
    "cebuano": "Lubi",
    "ilocano": "Niog",
    "bikol": "Niyog",
    "hiligaynon": "Lubi",
    "otherDialects": "Ongot (Chamorro/Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Niog.html"
  },
  "nipa": {
    "canonicalLocalName": "Nipa",
    "scientificName": "Nypa fruticans",
    "english": "Nipa Palm, Mangrove Palm",
    "tagalog": "Nipa, Sasa",
    "cebuano": "Nipa, Sasa",
    "ilocano": "Nipa",
    "bikol": "Nipa",
    "hiligaynon": "Nipa",
    "otherDialects": "Pinok (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Nipa.html"
  },
  "niyogniyogan": {
    "canonicalLocalName": "Niyog-niyogan",
    "scientificName": "Combretum indicum",
    "english": "Chinese Honeysuckle, Rangoon Creeper",
    "tagalog": "Niyog-niyogan, Niog-niogan",
    "cebuano": "Balitadham, Tartaraok",
    "ilocano": "Babebabe, Balitambal",
    "bikol": "Bawe-bawe",
    "hiligaynon": "Balitadham",
    "otherDialects": "Kasunbal (Bon.), Pinio (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Niog-niogan.html"
  },
  "okra": {
    "canonicalLocalName": "Okra",
    "scientificName": "Abelmoschus esculentus",
    "english": "Lady's Finger, Okra, Gumbo",
    "tagalog": "Okra",
    "cebuano": "Okra",
    "ilocano": "Okra",
    "bikol": "Okra",
    "hiligaynon": "Okra",
    "otherDialects": "Gumbo",
    "stuartUrl": "https://www.stuartxchange.org/Okra.html"
  },
  "olasiman": {
    "canonicalLocalName": "Olasiman",
    "scientificName": "Portulaca oleracea",
    "english": "Purslane, Little Hogweed",
    "tagalog": "Olasiman, Gulasiman",
    "cebuano": "Alusiman, Gulasiman",
    "ilocano": "Ngalug",
    "bikol": "Gulasiman",
    "hiligaynon": "Alusiman",
    "otherDialects": "Dup-dupil (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Gulasiman.html"
  },
  "oregano": {
    "canonicalLocalName": "Oregano",
    "scientificName": "Coleus amboinicus",
    "english": "Mexican Mint, Cuban Oregano",
    "tagalog": "Oregano, Suganda",
    "cebuano": "Kalabo, Suganda, Torongil",
    "ilocano": "Suganda, Oregano",
    "bikol": "Oregano",
    "hiligaynon": "Kalabo",
    "otherDialects": "Bilagoh (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Oregano.html"
  },
  "oxaliscorniculata": {
    "canonicalLocalName": "Oxalis corniculata",
    "scientificName": "Oxalis corniculata",
    "english": "Creeping Woodsorrel",
    "tagalog": "Taingang-daga, Susocayohan",
    "cebuano": "Koto-koto, Taingang-daga",
    "ilocano": "Marasiksik, Salamagi",
    "bikol": "Taingang-daga",
    "hiligaynon": "Koto-koto",
    "otherDialects": "Picho-picho (Bis.)",
    "stuartUrl": "https://www.stuartxchange.org/TaingangDaga.html"
  },
  "paminta": {
    "canonicalLocalName": "Paminta",
    "scientificName": "Piper nigrum",
    "english": "Black Pepper, White Pepper",
    "tagalog": "Paminta, Pimienta",
    "cebuano": "Paminta, Pimienta",
    "ilocano": "Paminta",
    "bikol": "Paminta",
    "hiligaynon": "Paminta",
    "otherDialects": "Malisa (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Paminta.html"
  },
  "pandan": {
    "canonicalLocalName": "Pandan",
    "scientificName": "Pandanus amaryllifolius",
    "english": "Fragrant Pandan, Screwpine",
    "tagalog": "Pandan, Pandan-mabango",
    "cebuano": "Pandan, Pandan-mabango",
    "ilocano": "Pandan",
    "bikol": "Pandan",
    "hiligaynon": "Pandan",
    "otherDialects": "Pangdan (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/PandanMabango.html"
  },
  "papaya": {
    "canonicalLocalName": "Papaya",
    "scientificName": "Carica papaya",
    "english": "Papaya, Pawpaw",
    "tagalog": "Papaya",
    "cebuano": "Kapayas",
    "ilocano": "Papaya",
    "bikol": "Papaya",
    "hiligaynon": "Kapayas",
    "otherDialects": "Tapayas (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Papaya.html"
  },
  "radish": {
    "canonicalLocalName": "Radish",
    "scientificName": "Raphanus sativus",
    "english": "Radish, Daikon",
    "tagalog": "Labanos, Rabanos",
    "cebuano": "Rabanos, Labanos",
    "ilocano": "Rabanos",
    "bikol": "Labanos",
    "hiligaynon": "Rabanos",
    "otherDialects": "Rabanos (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Labanos.html"
  },
  "romero": {
    "canonicalLocalName": "Romero",
    "scientificName": "Salvia rosmarinus",
    "english": "Rosemary",
    "tagalog": "Romero",
    "cebuano": "Romero",
    "ilocano": "Romero",
    "bikol": "Romero",
    "hiligaynon": "Romero",
    "otherDialects": "Romero (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Romero.html"
  },
  "sabila": {
    "canonicalLocalName": "Sabila",
    "scientificName": "Aloe vera",
    "english": "Aloe Vera, Medicinal Aloe",
    "tagalog": "Sabila, Sabila-pinya",
    "cebuano": "Sabila, Dilang buwaya",
    "ilocano": "Sabila",
    "bikol": "Sabila",
    "hiligaynon": "Sabila",
    "otherDialects": "Dilang-halo (Bis. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Sabila.html"
  },
  "saluyot": {
    "canonicalLocalName": "Saluyot",
    "scientificName": "Corchorus aestuans",
    "english": "Jute Mallow, Bush Okra",
    "tagalog": "Saluyot",
    "cebuano": "Tagabang, Tugbang",
    "ilocano": "Saluyot",
    "bikol": "Saluyot",
    "hiligaynon": "Tagabang",
    "otherDialects": "Pasau-na-bilog (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Saluyot.html"
  },
  "sambong": {
    "canonicalLocalName": "Sambong",
    "scientificName": "Blumea balsamifera",
    "english": "Blumea Camphor, Ngai Camphor",
    "tagalog": "Sambong",
    "cebuano": "Alibhon, Gabuen, Alimon",
    "ilocano": "Sob-sob, Subusub, Subsob",
    "bikol": "Sambong",
    "hiligaynon": "Alibhon, Lalakdan",
    "otherDialects": "Sambun (Sul.), Kaliban (Tagbanua)",
    "stuartUrl": "https://www.stuartxchange.org/Sambong.html"
  },
  "sampaguita": {
    "canonicalLocalName": "Sampaguita",
    "scientificName": "Jasminum sambac",
    "english": "Arabian Jasmine, Sampaguita",
    "tagalog": "Sampaguita",
    "cebuano": "Sampaguita, Manul",
    "ilocano": "Kampopot",
    "bikol": "Sampaguita",
    "hiligaynon": "Manul",
    "otherDialects": "Hubar (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Sampaguita.html"
  },
  "sampalok": {
    "canonicalLocalName": "Sampalok",
    "scientificName": "Tamarindus indica",
    "english": "Tamarind",
    "tagalog": "Sampalok, Sambalok",
    "cebuano": "Sambag, Sambak",
    "ilocano": "Salamagi, Salomagi",
    "bikol": "Sampalok",
    "hiligaynon": "Sambag",
    "otherDialects": "Kalamagi (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Sampalok.html"
  },
  "santan": {
    "canonicalLocalName": "Santan",
    "scientificName": "Ixora coccinea",
    "english": "Jungle Flame, Flame of Woods",
    "tagalog": "Santan-pula, Santan",
    "cebuano": "Santan, Tangpupo",
    "ilocano": "Santan",
    "bikol": "Santan",
    "hiligaynon": "Tangpupo",
    "otherDialects": "Asuncion (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Santan.html"
  },
  "santol": {
    "canonicalLocalName": "Santol",
    "scientificName": "Sandoricum koetjape",
    "english": "Cotton Fruit, Santol",
    "tagalog": "Santol",
    "cebuano": "Santol",
    "ilocano": "Santol",
    "bikol": "Santol",
    "hiligaynon": "Santol",
    "otherDialects": "Katul (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Santol.html"
  },
  "sibuyas": {
    "canonicalLocalName": "Sibuyas",
    "scientificName": "Allium cepa",
    "english": "Onion",
    "tagalog": "Sibuyas, Lasona",
    "cebuano": "Sibuyas, Bumbay",
    "ilocano": "Lasona, Sibuyas",
    "bikol": "Sibuyas",
    "hiligaynon": "Sibuyas, Bumbay",
    "otherDialects": "Lasuna (Ilk. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Sibuyas.html"
  },
  "solasi": {
    "canonicalLocalName": "Solasi",
    "scientificName": "Ocimum basilicum",
    "english": "Sweet Basil, Common Basil",
    "tagalog": "Balanoy, Solasi",
    "cebuano": "Solasi, Balanoy",
    "ilocano": "Samilig",
    "bikol": "Balanoy",
    "hiligaynon": "Balanoy",
    "otherDialects": "Bouak (Bis.)",
    "stuartUrl": "https://www.stuartxchange.org/Balanoy.html"
  },
  "suha": {
    "canonicalLocalName": "Suha",
    "scientificName": "Citrus maxima",
    "english": "Pomelo, Shaddock",
    "tagalog": "Suha, Lukban",
    "cebuano": "Kabugao, Lukban",
    "ilocano": "Suha, Lucban",
    "bikol": "Suha",
    "hiligaynon": "Kabugao",
    "otherDialects": "Tambuyok (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Suha.html"
  },
  "takipkohol": {
    "canonicalLocalName": "Takip-kohol",
    "scientificName": "Centella asiatica",
    "english": "Gotu Kola, Asiatic Pennywort",
    "tagalog": "Takip-kohol, Tahepbukid",
    "cebuano": "Yahong-yahong",
    "ilocano": "Pano-pano",
    "bikol": "Hagonoy",
    "hiligaynon": "Yahong-yahong",
    "otherDialects": "Paitan-paitan (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/TakipKohol.html"
  },
  "talisay": {
    "canonicalLocalName": "Talisay",
    "scientificName": "Terminalia catappa",
    "english": "Tropical Almond, Sea Almond",
    "tagalog": "Talisay",
    "cebuano": "Talisay",
    "ilocano": "Lugo, Talisay",
    "bikol": "Talisay",
    "hiligaynon": "Talisay",
    "otherDialects": "Banilak (Pamp.), Hitoma (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Talisay.html"
  },
  "tanglad": {
    "canonicalLocalName": "Tanglad",
    "scientificName": "Cymbopogon citratus",
    "english": "Lemongrass",
    "tagalog": "Tanglad",
    "cebuano": "Tanglad, Balioko",
    "ilocano": "Baraniw",
    "bikol": "Tanglad",
    "hiligaynon": "Tanglad",
    "otherDialects": "Salay (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Tanglad.html"
  },
  "thespesiapopulnea": {
    "canonicalLocalName": "Thespesia populnea",
    "scientificName": "Thespesia populnea",
    "english": "Portia Tree, Pacific Rosewood",
    "tagalog": "Banalo, Boboi-gubat",
    "cebuano": "Banalo, Malabago",
    "ilocano": "Bulakan",
    "bikol": "Banalo",
    "hiligaynon": "Banalo",
    "otherDialects": "Valo (Ivatan)",
    "stuartUrl": "https://www.stuartxchange.org/Banalo.html"
  },
  "tsaanggubat": {
    "canonicalLocalName": "Tsaang Gubat",
    "scientificName": "Ehretia microphylla",
    "english": "Wild Tea, Philippine Tea",
    "tagalog": "Tsaang Gubat, Chaang-bundok",
    "cebuano": "Kagidkid, Putputai, Alangit",
    "ilocano": "Itsa, Icha-ti-bakir",
    "bikol": "Putputai",
    "hiligaynon": "Kagidkid, Maragundinas",
    "otherDialects": "Santing (Sul.), Maratia (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Tsaang.html"
  },
  "tsampaka": {
    "canonicalLocalName": "Tsampaka",
    "scientificName": "Magnolia champaca",
    "english": "Champak, Joy Perfume Tree",
    "tagalog": "Tsampaka, Sampakang-pula",
    "cebuano": "Tsampaka, Sampaka",
    "ilocano": "Tsampaka",
    "bikol": "Tsampaka",
    "hiligaynon": "Tsampaka",
    "otherDialects": "Champaca (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/TsampakangPula.html"
  },
  "tubo": {
    "canonicalLocalName": "Tubo",
    "scientificName": "Saccharum officinarum",
    "english": "Sugarcane",
    "tagalog": "Tubo",
    "cebuano": "Tubo",
    "ilocano": "Unas",
    "bikol": "Tubo",
    "hiligaynon": "Tubo",
    "otherDialects": "Agbo (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Tubo.html"
  },
  "ulasimangbato": {
    "canonicalLocalName": "Ulasimang Bato",
    "scientificName": "Peperomia pellucida",
    "english": "Silver Bush, Shiny Bush, Peperomia",
    "tagalog": "Ulasimang Bato, Pansit-pansitan",
    "cebuano": "Sinaw-sinaw, Pansit-pansitan",
    "ilocano": "Lin-linaaw, Ulasiman-bato",
    "bikol": "Lasa",
    "hiligaynon": "Sinaw-sinaw",
    "otherDialects": "Sahica-puti (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Pansit.html"
  },
  "yerbabuena": {
    "canonicalLocalName": "Yerba Buena",
    "scientificName": "Mentha × villosa",
    "english": "Peppermint, Spearmint, Mint",
    "tagalog": "Yerba Buena, Hierba Buena",
    "cebuano": "Herba Buena, Hilbas",
    "ilocano": "Erba buena",
    "bikol": "Yerba buena",
    "hiligaynon": "Hilbas",
    "otherDialects": "Ablebana (If.)",
    "stuartUrl": "https://www.stuartxchange.org/Yerba.html"
  },
  "ylangylang": {
    "canonicalLocalName": "Ylang-ylang",
    "scientificName": "Cananga odorata",
    "english": "Perfume Tree, Ylang-ylang",
    "tagalog": "Ilang-ilang, Ylang-ylang",
    "cebuano": "Ilang-ilang",
    "ilocano": "Alang-ilang",
    "bikol": "Ilang-ilang",
    "hiligaynon": "Ilang-ilang",
    "otherDialects": "Ngoran (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/IlangIlang.html"
  },
  "abukado": {
      "canonicalLocalName": "Abukado",
      "scientificName": "Persea americana",
      "english": "Avocado",
      "tagalog": "Abukado",
      "cebuano": "Abokado",
      "ilocano": "Abukado",
      "bikol": "Abukado",
      "hiligaynon": "Abokado",
      "stuartUrl": "https://www.stuartxchange.org/Abukado.html"
  },
  "adgaw": {
      "canonicalLocalName": "Adgaw",
      "scientificName": "Premna odorata",
      "english": "Fragrant Premna",
      "tagalog": "Adgaw",
      "cebuano": "Alagaw",
      "ilocano": "Adgaw",
      "bikol": "Adgaw",
      "hiligaynon": "Alagaw",
      "stuartUrl": "https://www.stuartxchange.org/Adgaw.html"
  },
  "agasahas": {
      "canonicalLocalName": "Agas-ahas",
      "scientificName": "Euphorbia tirucalli",
      "english": "Pencil Cactus / Milk Bush",
      "tagalog": "Agas-ahas",
      "cebuano": "Bali-bali",
      "ilocano": "Agas-ahas",
      "bikol": "Agas-ahas",
      "hiligaynon": "Bali-bali",
      "stuartUrl": "https://www.stuartxchange.org/Agasahas.html"
  },
  "agosip": {
      "canonicalLocalName": "Agosip",
      "scientificName": "Symplocos cochinchinensis",
      "english": "Sapphire Berry",
      "tagalog": "Agosip",
      "cebuano": "Kagagahan",
      "ilocano": "Agosip",
      "bikol": "Agosip",
      "hiligaynon": "Kagagahan",
      "stuartUrl": "https://www.stuartxchange.org/Agosip.html"
  },
  "alangilangdechina": {
      "canonicalLocalName": "Alang-ilang de China",
      "scientificName": "Desmos chinensis",
      "english": "Dwarf Ylang-ylang",
      "tagalog": "Alang-ilang de China",
      "cebuano": "Alang-ilang sa bukid",
      "ilocano": "Alang-ilang de China",
      "bikol": "Alang-ilang de China",
      "hiligaynon": "Alang-ilang sa bukid",
      "stuartUrl": "https://www.stuartxchange.org/AlangilangdeChina.html"
  },
  "alipata": {
      "canonicalLocalName": "Alipata",
      "scientificName": "Excoecaria agallocha",
      "english": "Blind-your-eye Mangrove",
      "tagalog": "Alipata",
      "cebuano": "Buta-buta",
      "ilocano": "Alipata",
      "bikol": "Alipata",
      "hiligaynon": "Buta-buta",
      "stuartUrl": "https://www.stuartxchange.org/Alipata.html"
  },
  "alpasotes": {
      "canonicalLocalName": "Alpasotes",
      "scientificName": "Dysphania ambrosioides",
      "english": "Mexican Tea / Wormseed",
      "tagalog": "Alpasotes",
      "cebuano": "Apasote",
      "ilocano": "Alpasotes",
      "bikol": "Alpasotes",
      "hiligaynon": "Apasote",
      "stuartUrl": "https://www.stuartxchange.org/Alpasotes.html"
  },
  "anibong": {
      "canonicalLocalName": "Anibong",
      "scientificName": "Oncosperma tigillarium",
      "english": "Nibung Palm",
      "tagalog": "Anibong",
      "cebuano": "Anibung",
      "ilocano": "Anibong",
      "bikol": "Anibong",
      "hiligaynon": "Anibung",
      "stuartUrl": "https://www.stuartxchange.org/Anibong.html"
  },
  "anito": {
      "canonicalLocalName": "Anito",
      "scientificName": "Emilia sonchifolia",
      "english": "Lilac Tasselflower",
      "tagalog": "Anito",
      "cebuano": "Tagulinaw",
      "ilocano": "Anito",
      "bikol": "Anito",
      "hiligaynon": "Tagulinaw",
      "stuartUrl": "https://www.stuartxchange.org/Anito.html"
  },
  "apanapan": {
      "canonicalLocalName": "Apan-apan",
      "scientificName": "Sida acuta",
      "english": "Common Wireweed",
      "tagalog": "Apan-apan",
      "cebuano": "Wawalisan",
      "ilocano": "Apan-apan",
      "bikol": "Apan-apan",
      "hiligaynon": "Wawalisan",
      "stuartUrl": "https://www.stuartxchange.org/Apanapan.html"
  },
  "apis": {
      "canonicalLocalName": "Apis",
      "scientificName": "Elephantopus tomentosus",
      "english": "Woolly Elephant-foot",
      "tagalog": "Apis",
      "cebuano": "Dilang-toro",
      "ilocano": "Apis",
      "bikol": "Apis",
      "hiligaynon": "Dilang-toro",
      "stuartUrl": "https://www.stuartxchange.org/Apis.html"
  },
  "apitong": {
      "canonicalLocalName": "Apitong",
      "scientificName": "Dipterocarpus grandiflorus",
      "english": "Apitong Wood / Keruing",
      "tagalog": "Apitong",
      "cebuano": "Hagakhak-kahoy",
      "ilocano": "Apitong",
      "bikol": "Apitong",
      "hiligaynon": "Hagakhak-kahoy",
      "stuartUrl": "https://www.stuartxchange.org/Apitong.html"
  },
  "asistasya": {
      "canonicalLocalName": "Asistasya",
      "scientificName": "Asystasia gangetica",
      "english": "Chinese Violet",
      "tagalog": "Asistasya",
      "cebuano": "Ganges Primrose",
      "ilocano": "Asistasya",
      "bikol": "Asistasya",
      "hiligaynon": "Ganges Primrose",
      "stuartUrl": "https://www.stuartxchange.org/Asistasya.html"
  },
  "bagtikan": {
      "canonicalLocalName": "Bagtikan",
      "scientificName": "Parashorea malaanonan",
      "english": "Philippine Bagtikan",
      "tagalog": "Bagtikan",
      "cebuano": "White Lauan cousin",
      "ilocano": "Bagtikan",
      "bikol": "Bagtikan",
      "hiligaynon": "White Lauan cousin",
      "stuartUrl": "https://www.stuartxchange.org/Bagtikan.html"
  },
  "bakawan": {
      "canonicalLocalName": "Bakawan",
      "scientificName": "Rhizophora mucronata",
      "english": "Red Mangrove / Loop-root Mangrove",
      "tagalog": "Bakawan",
      "cebuano": "Bakhaw",
      "ilocano": "Bakawan",
      "bikol": "Bakawan",
      "hiligaynon": "Bakhaw",
      "stuartUrl": "https://www.stuartxchange.org/Bakawan.html"
  },
  "balanoyparang": {
      "canonicalLocalName": "Balanoy-parang",
      "scientificName": "Ocimum americanum",
      "english": "American Basil / Hoary Basil",
      "tagalog": "Balanoy-parang",
      "cebuano": "Kambing-kambing",
      "ilocano": "Balanoy-parang",
      "bikol": "Balanoy-parang",
      "hiligaynon": "Kambing-kambing",
      "stuartUrl": "https://www.stuartxchange.org/Balanoyparang.html"
  },
  "balete": {
      "canonicalLocalName": "Balete",
      "scientificName": "Ficus benjamina",
      "english": "Weeping Fig",
      "tagalog": "Balete",
      "cebuano": "Dalakit",
      "ilocano": "Balete",
      "bikol": "Balete",
      "hiligaynon": "Dalakit",
      "stuartUrl": "https://www.stuartxchange.org/Balete.html"
  },
  "balitbitan": {
      "canonicalLocalName": "Balitbitan",
      "scientificName": "Cynometra ramiflora",
      "english": "Wrinkled Pod Mangrove",
      "tagalog": "Balitbitan",
      "cebuano": "Oring",
      "ilocano": "Balitbitan",
      "bikol": "Balitbitan",
      "hiligaynon": "Oring",
      "stuartUrl": "https://www.stuartxchange.org/Balitbitan.html"
  },
  "bamban": {
      "canonicalLocalName": "Bamban",
      "scientificName": "Donax canniformis",
      "english": "Donax Cane",
      "tagalog": "Bamban",
      "cebuano": "Bamban-tubig",
      "ilocano": "Bamban",
      "bikol": "Bamban",
      "hiligaynon": "Bamban-tubig",
      "stuartUrl": "https://www.stuartxchange.org/Bamban.html"
  },
  "bangkal": {
      "canonicalLocalName": "Bangkal",
      "scientificName": "Nauclea orientalis",
      "english": "Leichhardt Tree / Yellow Cheesewood",
      "tagalog": "Bangkal",
      "cebuano": "Mambog",
      "ilocano": "Bangkal",
      "bikol": "Bangkal",
      "hiligaynon": "Mambog",
      "stuartUrl": "https://www.stuartxchange.org/Bangkal.html"
  },
  "barabaras": {
      "canonicalLocalName": "Bara-baras",
      "scientificName": "Gomphrena celosioides",
      "english": "Prostrate Globe Amaranth",
      "tagalog": "Bara-baras",
      "cebuano": "Botones-botones",
      "ilocano": "Bara-baras",
      "bikol": "Bara-baras",
      "hiligaynon": "Botones-botones",
      "stuartUrl": "https://www.stuartxchange.org/Barabaras.html"
  },
  "barit": {
      "canonicalLocalName": "Barit",
      "scientificName": "Pinus kesiya",
      "english": "Benguet Pine / Khasi Pine",
      "tagalog": "Barit",
      "cebuano": "Pino",
      "ilocano": "Barit",
      "bikol": "Barit",
      "hiligaynon": "Pino",
      "stuartUrl": "https://www.stuartxchange.org/Barit.html"
  },
  "batino": {
      "canonicalLocalName": "Batino",
      "scientificName": "Alstonia macrophylla",
      "english": "Hard Alstonia",
      "tagalog": "Batino",
      "cebuano": "Batino-pula",
      "ilocano": "Batino",
      "bikol": "Batino",
      "hiligaynon": "Batino-pula",
      "stuartUrl": "https://www.stuartxchange.org/Batino.html"
  },
  "bayagusa": {
      "canonicalLocalName": "Bayag-usa",
      "scientificName": "Voacanga globosa",
      "english": "Philippine Voacanga",
      "tagalog": "Bayag-usa",
      "cebuano": "Bita-bita",
      "ilocano": "Bayag-usa",
      "bikol": "Bayag-usa",
      "hiligaynon": "Bita-bita",
      "stuartUrl": "https://www.stuartxchange.org/Bayagusa.html"
  },
  "bikas": {
      "canonicalLocalName": "Bikas",
      "scientificName": "Mikania cordata",
      "english": "Heartleaf Hempvine",
      "tagalog": "Bikas",
      "cebuano": "Ubi-ubihan",
      "ilocano": "Bikas",
      "bikol": "Bikas",
      "hiligaynon": "Ubi-ubihan",
      "stuartUrl": "https://www.stuartxchange.org/Bikas.html"
  },
  "binunga": {
      "canonicalLocalName": "Binunga",
      "scientificName": "Macaranga tanarius",
      "english": "Elephant Ear Tree / Blush Macaranga",
      "tagalog": "Binunga",
      "cebuano": "Binonga",
      "ilocano": "Binunga",
      "bikol": "Binunga",
      "hiligaynon": "Binonga",
      "stuartUrl": "https://www.stuartxchange.org/Binunga.html"
  },
  "bogo": {
      "canonicalLocalName": "Bogo",
      "scientificName": "Garuga floribunda",
      "english": "Garuga Tree",
      "tagalog": "Bogo",
      "cebuano": "Bogo-kahoy",
      "ilocano": "Bogo",
      "bikol": "Bogo",
      "hiligaynon": "Bogo-kahoy",
      "stuartUrl": "https://www.stuartxchange.org/Bogo.html"
  },
  "buntotpusa": {
      "canonicalLocalName": "Buntot-pusa",
      "scientificName": "Acalypha hispida",
      "english": "Chenille Plant / Red Hot Cat's Tail",
      "tagalog": "Buntot-pusa",
      "cebuano": "Ikog-iring",
      "ilocano": "Buntot-pusa",
      "bikol": "Buntot-pusa",
      "hiligaynon": "Ikog-iring",
      "stuartUrl": "https://www.stuartxchange.org/Buntotpusa.html"
  },
  "buyobuyo": {
      "canonicalLocalName": "Buyo-buyo",
      "scientificName": "Piper sarmentosum",
      "english": "Wild Betel Leaf / Lolot",
      "tagalog": "Buyo-buyo",
      "cebuano": "Kudok-kudok",
      "ilocano": "Buyo-buyo",
      "bikol": "Buyo-buyo",
      "hiligaynon": "Kudok-kudok",
      "stuartUrl": "https://www.stuartxchange.org/Buyobuyo.html"
  },
  "dadap": {
      "canonicalLocalName": "Dadap",
      "scientificName": "Erythrina variegata",
      "english": "Tiger's Claw / Indian Coral Tree",
      "tagalog": "Dadap",
      "cebuano": "Dapdap",
      "ilocano": "Dadap",
      "bikol": "Dadap",
      "hiligaynon": "Dapdap",
      "stuartUrl": "https://www.stuartxchange.org/Dadap.html"
  },
  "dampol": {
      "canonicalLocalName": "Dampol",
      "scientificName": "Glochidion album",
      "english": "White Glochidion",
      "tagalog": "Dampol",
      "cebuano": "Bagnay-pula",
      "ilocano": "Dampol",
      "bikol": "Dampol",
      "hiligaynon": "Bagnay-pula",
      "stuartUrl": "https://www.stuartxchange.org/Dampol.html"
  },
  "dilangaso": {
      "canonicalLocalName": "Dilang-aso",
      "scientificName": "Elephantopus scaber",
      "english": "Elephant's Foot",
      "tagalog": "Dilang-aso",
      "cebuano": "Tabataba",
      "ilocano": "Dilang-aso",
      "bikol": "Dilang-aso",
      "hiligaynon": "Tabataba",
      "stuartUrl": "https://www.stuartxchange.org/Dilangaso.html"
  },
  "ditaditahan": {
      "canonicalLocalName": "Dita-ditahan",
      "scientificName": "Rauvolfia serpentina",
      "english": "Serpentine Wood",
      "tagalog": "Dita-ditahan",
      "cebuano": "Indian Snakeroot",
      "ilocano": "Dita-ditahan",
      "bikol": "Dita-ditahan",
      "hiligaynon": "Indian Snakeroot",
      "stuartUrl": "https://www.stuartxchange.org/Ditaditahan.html"
  },
  "ditakanding": {
      "canonicalLocalName": "Dita-kanding",
      "scientificName": "Alstonia spectabilis",
      "english": "Mountain Dita",
      "tagalog": "Dita-kanding",
      "cebuano": "Dita-gamay",
      "ilocano": "Dita-kanding",
      "bikol": "Dita-kanding",
      "hiligaynon": "Dita-gamay",
      "stuartUrl": "https://www.stuartxchange.org/Ditakanding.html"
  },
  "dungon": {
      "canonicalLocalName": "Dungon",
      "scientificName": "Heritiera littoralis",
      "english": "Looking-glass Mangrove",
      "tagalog": "Dungon",
      "cebuano": "Dungun",
      "ilocano": "Dungon",
      "bikol": "Dungon",
      "hiligaynon": "Dungun",
      "stuartUrl": "https://www.stuartxchange.org/Dungon.html"
  },
  "dungonlate": {
      "canonicalLocalName": "Dungon-late",
      "scientificName": "Heritiera sylvatica",
      "english": "Inland Dungon",
      "tagalog": "Dungon-late",
      "cebuano": "Dungun-ilahas",
      "ilocano": "Dungon-late",
      "bikol": "Dungon-late",
      "hiligaynon": "Dungun-ilahas",
      "stuartUrl": "https://www.stuartxchange.org/Dungonlate.html"
  },
  "gagabutan": {
      "canonicalLocalName": "Gagabutan",
      "scientificName": "Eleusine indica",
      "english": "Goosegrass / Wiregrass",
      "tagalog": "Gagabutan",
      "cebuano": "Paragis",
      "ilocano": "Gagabutan",
      "bikol": "Gagabutan",
      "hiligaynon": "Paragis",
      "stuartUrl": "https://www.stuartxchange.org/Gagabutan.html"
  },
  "gatasgatas": {
      "canonicalLocalName": "Gatas-gatas",
      "scientificName": "Euphorbia thymifolia",
      "english": "Gulf Sandmat / Chickenweed",
      "tagalog": "Gatas-gatas",
      "cebuano": "Makikitot",
      "ilocano": "Gatas-gatas",
      "bikol": "Gatas-gatas",
      "hiligaynon": "Makikitot",
      "stuartUrl": "https://www.stuartxchange.org/Gatasgatas.html"
  },
  "gumamelaasul": {
      "canonicalLocalName": "Gumamela-asul",
      "scientificName": "Hibiscus syriacus",
      "english": "Blue Hibiscus / Rose of Sharon",
      "tagalog": "Gumamela-asul",
      "cebuano": "Rose of Sharon",
      "ilocano": "Gumamela-asul",
      "bikol": "Gumamela-asul",
      "hiligaynon": "Rose of Sharon",
      "stuartUrl": "https://www.stuartxchange.org/Gumamelaasul.html"
  },
  "guyod": {
      "canonicalLocalName": "Guyod",
      "scientificName": "Derris elliptica",
      "english": "Poison Vine / Derris Root",
      "tagalog": "Guyod",
      "cebuano": "Tubli",
      "ilocano": "Guyod",
      "bikol": "Guyod",
      "hiligaynon": "Tubli",
      "stuartUrl": "https://www.stuartxchange.org/Guyod.html"
  },
  "hagakhak": {
      "canonicalLocalName": "Hagakhak",
      "scientificName": "Dipterocarpus kerrii",
      "english": "Keruing Tree",
      "tagalog": "Hagakhak",
      "cebuano": "Hagakhak-pula",
      "ilocano": "Hagakhak",
      "bikol": "Hagakhak",
      "hiligaynon": "Hagakhak-pula",
      "stuartUrl": "https://www.stuartxchange.org/Hagakhak.html"
  },
  "hamindang": {
      "canonicalLocalName": "Hamindang",
      "scientificName": "Macaranga bicolor",
      "english": "Two-color Macaranga",
      "tagalog": "Hamindang",
      "cebuano": "Binunga-bicolor",
      "ilocano": "Hamindang",
      "bikol": "Hamindang",
      "hiligaynon": "Binunga-bicolor",
      "stuartUrl": "https://www.stuartxchange.org/Hamindang.html"
  },
  "hangod": {
      "canonicalLocalName": "Hangod",
      "scientificName": "Laportea meyeniana",
      "english": "Poison Nettle Tree",
      "tagalog": "Hangod",
      "cebuano": "Lipa-meyeni",
      "ilocano": "Hangod",
      "bikol": "Hangod",
      "hiligaynon": "Lipa-meyeni",
      "stuartUrl": "https://www.stuartxchange.org/Hangod.html"
  },
  "hauili": {
      "canonicalLocalName": "Hauili",
      "scientificName": "Ficus septica",
      "english": "Seven Golden Fig",
      "tagalog": "Hauili",
      "cebuano": "Labnog",
      "ilocano": "Hauili",
      "bikol": "Hauili",
      "hiligaynon": "Labnog",
      "stuartUrl": "https://www.stuartxchange.org/Hauili.html"
  },
  "hibau": {
      "canonicalLocalName": "Hibau",
      "scientificName": "Aglaia harmsiana",
      "english": "Harms Aglaia",
      "tagalog": "Hibau",
      "cebuano": "Malasaging",
      "ilocano": "Hibau",
      "bikol": "Hibau",
      "hiligaynon": "Malasaging",
      "stuartUrl": "https://www.stuartxchange.org/Hibau.html"
  },
  "inyam": {
      "canonicalLocalName": "Inyam",
      "scientificName": "Antidesma ghaesembilla",
      "english": "Black Currant Tree",
      "tagalog": "Inyam",
      "cebuano": "Binayuyu",
      "ilocano": "Inyam",
      "bikol": "Inyam",
      "hiligaynon": "Binayuyu",
      "stuartUrl": "https://www.stuartxchange.org/Inyam.html"
  },
  "kaburaw": {
      "canonicalLocalName": "Kaburaw",
      "scientificName": "Citrus hystrix",
      "english": "Kaffir Lime / Makrut Lime",
      "tagalog": "Kaburaw",
      "cebuano": "Kolobot",
      "ilocano": "Kaburaw",
      "bikol": "Kaburaw",
      "hiligaynon": "Kolobot",
      "stuartUrl": "https://www.stuartxchange.org/Kaburaw.html"
  },
  "kalabasa": {
      "canonicalLocalName": "Kalabasa",
      "scientificName": "Cucurbita moschata",
      "english": "Squash / Pumpkin",
      "tagalog": "Kalabasa",
      "cebuano": "Kalabasa-pula",
      "ilocano": "Kalabasa",
      "bikol": "Kalabasa",
      "hiligaynon": "Kalabasa-pula",
      "stuartUrl": "https://www.stuartxchange.org/Kalabasa.html"
  },
  "kalamiasgubat": {
      "canonicalLocalName": "Kalamias-gubat",
      "scientificName": "Ailanthus triphysa",
      "english": "White Bean Tree",
      "tagalog": "Kalamias-gubat",
      "cebuano": "Malabalite",
      "ilocano": "Kalamias-gubat",
      "bikol": "Kalamias-gubat",
      "hiligaynon": "Malabalite",
      "stuartUrl": "https://www.stuartxchange.org/Kalamiasgubat.html"
  },
  "kalatsutsinggubat": {
      "canonicalLocalName": "Kalatsutsing-gubat",
      "scientificName": "Tabernaemontana pandacaqui",
      "english": "Windmill Bush",
      "tagalog": "Kalatsutsing-gubat",
      "cebuano": "Pandakaki-puti",
      "ilocano": "Kalatsutsing-gubat",
      "bikol": "Kalatsutsing-gubat",
      "hiligaynon": "Pandakaki-puti",
      "stuartUrl": "https://www.stuartxchange.org/Kalatsutsinggubat.html"
  },
  "kalios": {
      "canonicalLocalName": "Kalios",
      "scientificName": "Streblus asper",
      "english": "Toothbrush Tree / Sandpaper Tree",
      "tagalog": "Kalios",
      "cebuano": "Bogos",
      "ilocano": "Kalios",
      "bikol": "Kalios",
      "hiligaynon": "Bogos",
      "stuartUrl": "https://www.stuartxchange.org/Kalios.html"
  },
  "kalumpit": {
      "canonicalLocalName": "Kalumpit",
      "scientificName": "Terminalia microcarpa",
      "english": "Kalumpit Tree",
      "tagalog": "Kalumpit",
      "cebuano": "Alupi",
      "ilocano": "Kalumpit",
      "bikol": "Kalumpit",
      "hiligaynon": "Alupi",
      "stuartUrl": "https://www.stuartxchange.org/Kalumpit.html"
  },
  "kamagsa": {
      "canonicalLocalName": "Kamagsa",
      "scientificName": "Rourea minor",
      "english": "Small-leaved Rourea",
      "tagalog": "Kamagsa",
      "cebuano": "Gikos-gikos",
      "ilocano": "Kamagsa",
      "bikol": "Kamagsa",
      "hiligaynon": "Gikos-gikos",
      "stuartUrl": "https://www.stuartxchange.org/Kamagsa.html"
  },
  "kamas": {
      "canonicalLocalName": "Kamas",
      "scientificName": "Pachyrhizus erosus",
      "english": "Jicama / Yam Bean",
      "tagalog": "Kamas",
      "cebuano": "Singkamas",
      "ilocano": "Kamas",
      "bikol": "Kamas",
      "hiligaynon": "Singkamas",
      "stuartUrl": "https://www.stuartxchange.org/Kamas.html"
  },
  "kamatsile": {
      "canonicalLocalName": "Kamatsile",
      "scientificName": "Pithecellobium dulce",
      "english": "Manila Tamarind",
      "tagalog": "Kamatsile",
      "cebuano": "Kamonsil",
      "ilocano": "Kamatsile",
      "bikol": "Kamatsile",
      "hiligaynon": "Kamonsil",
      "stuartUrl": "https://www.stuartxchange.org/Kamatsile.html"
  },
  "kanyapistula": {
      "canonicalLocalName": "Kanya-pistula",
      "scientificName": "Cassia fistula",
      "english": "Golden Shower / Purging Cassia",
      "tagalog": "Kanya-pistula",
      "cebuano": "Ibihas",
      "ilocano": "Kanya-pistula",
      "bikol": "Kanya-pistula",
      "hiligaynon": "Ibihas",
      "stuartUrl": "https://www.stuartxchange.org/Kanyapistula.html"
  },
  "kariskis": {
      "canonicalLocalName": "Kariskis",
      "scientificName": "Albizia lebbekoides",
      "english": "Forest Siris",
      "tagalog": "Kariskis",
      "cebuano": "Haluganay",
      "ilocano": "Kariskis",
      "bikol": "Kariskis",
      "hiligaynon": "Haluganay",
      "stuartUrl": "https://www.stuartxchange.org/Kariskis.html"
  },
  "katilbuk": {
      "canonicalLocalName": "Katilbuk",
      "scientificName": "Impatiens platypetala",
      "english": "Wild Balsam",
      "tagalog": "Katilbuk",
      "cebuano": "Kamantigue-bukid",
      "ilocano": "Katilbuk",
      "bikol": "Katilbuk",
      "hiligaynon": "Kamantigue-bukid",
      "stuartUrl": "https://www.stuartxchange.org/Katilbuk.html"
  },
  "katutay": {
      "canonicalLocalName": "Katutay",
      "scientificName": "Bauhinia purpurea",
      "english": "Purple Orchid Tree",
      "tagalog": "Katutay",
      "cebuano": "Alibangbang-pula",
      "ilocano": "Katutay",
      "bikol": "Katutay",
      "hiligaynon": "Alibangbang-pula",
      "stuartUrl": "https://www.stuartxchange.org/Katutay.html"
  },
  "kayoman": {
      "canonicalLocalName": "Kayoman",
      "scientificName": "Ficus ulmifolia",
      "english": "Elm-leaved Fig",
      "tagalog": "Kayoman",
      "cebuano": "Isis",
      "ilocano": "Kayoman",
      "bikol": "Kayoman",
      "hiligaynon": "Isis",
      "stuartUrl": "https://www.stuartxchange.org/Kayoman.html"
  },
  "kolowratia": {
      "canonicalLocalName": "Kolowratia",
      "scientificName": "Alpinia elegans",
      "english": "Elegant Galangal",
      "tagalog": "Kolowratia",
      "cebuano": "Tagbak",
      "ilocano": "Kolowratia",
      "bikol": "Kolowratia",
      "hiligaynon": "Tagbak",
      "stuartUrl": "https://www.stuartxchange.org/Kolowratia.html"
  },
  "kubili": {
      "canonicalLocalName": "Kubili",
      "scientificName": "Cubilia cubili",
      "english": "Philippine Cubilia",
      "tagalog": "Kubili",
      "cebuano": "Kamut-kabayo",
      "ilocano": "Kubili",
      "bikol": "Kubili",
      "hiligaynon": "Kamut-kabayo",
      "stuartUrl": "https://www.stuartxchange.org/Kubili.html"
  },
  "kudzugubat": {
      "canonicalLocalName": "Kudzu-gubat",
      "scientificName": "Pueraria phaseoloides",
      "english": "Tropical Kudzu",
      "tagalog": "Kudzu-gubat",
      "cebuano": "Kudzu-ilahas",
      "ilocano": "Kudzu-gubat",
      "bikol": "Kudzu-gubat",
      "hiligaynon": "Kudzu-ilahas",
      "stuartUrl": "https://www.stuartxchange.org/Kudzugubat.html"
  },
  "kulipapa": {
      "canonicalLocalName": "Kulipapa",
      "scientificName": "Vitex parviflora",
      "english": "Molave Tree",
      "tagalog": "Kulipapa",
      "cebuano": "Molave",
      "ilocano": "Kulipapa",
      "bikol": "Kulipapa",
      "hiligaynon": "Molave",
      "stuartUrl": "https://www.stuartxchange.org/Kulipapa.html"
  },
  "kulitisparang": {
      "canonicalLocalName": "Kulitis-parang",
      "scientificName": "Celosia argentea",
      "english": "Cockscomb / Silver Cockscomb",
      "tagalog": "Kulitis-parang",
      "cebuano": "Kadiliyo",
      "ilocano": "Kulitis-parang",
      "bikol": "Kulitis-parang",
      "hiligaynon": "Kadiliyo",
      "stuartUrl": "https://www.stuartxchange.org/Kulitisparang.html"
  },
  "lagundidagat": {
      "canonicalLocalName": "Lagundi-dagat",
      "scientificName": "Vitex trifolia",
      "english": "Simpleleaf Chastetree / Coastal Vitex",
      "tagalog": "Lagundi-dagat",
      "cebuano": "Dangla-baybay",
      "ilocano": "Lagundi-dagat",
      "bikol": "Lagundi-dagat",
      "hiligaynon": "Dangla-baybay",
      "stuartUrl": "https://www.stuartxchange.org/Lagundidagat.html"
  },
  "lamio": {
      "canonicalLocalName": "Lamio",
      "scientificName": "Dracontomelon dao",
      "english": "Pacific Walnut / Dao Tree",
      "tagalog": "Lamio",
      "cebuano": "Dao",
      "ilocano": "Lamio",
      "bikol": "Lamio",
      "hiligaynon": "Dao",
      "stuartUrl": "https://www.stuartxchange.org/Lamio.html"
  },
  "libas": {
      "canonicalLocalName": "Libas",
      "scientificName": "Spondias pinnata",
      "english": "Wild Hog Plum",
      "tagalog": "Libas",
      "cebuano": "Alubihon",
      "ilocano": "Libas",
      "bikol": "Libas",
      "hiligaynon": "Alubihon",
      "stuartUrl": "https://www.stuartxchange.org/Libas.html"
  },
  "ligao": {
      "canonicalLocalName": "Ligao",
      "scientificName": "Ziziphus talanai",
      "english": "Philippine Jujube",
      "tagalog": "Ligao",
      "cebuano": "Talanay",
      "ilocano": "Ligao",
      "bikol": "Ligao",
      "hiligaynon": "Talanay",
      "stuartUrl": "https://www.stuartxchange.org/Ligao.html"
  },
  "linti": {
      "canonicalLocalName": "Linti",
      "scientificName": "Gnetum gnemon",
      "english": "Melinjo / Gnetum",
      "tagalog": "Linti",
      "cebuano": "Bago",
      "ilocano": "Linti",
      "bikol": "Linti",
      "hiligaynon": "Bago",
      "stuartUrl": "https://www.stuartxchange.org/Linti.html"
  },
  "lumbang": {
      "canonicalLocalName": "Lumbang",
      "scientificName": "Aleurites moluccanus",
      "english": "Candlenut Tree",
      "tagalog": "Lumbang",
      "cebuano": "Biaw",
      "ilocano": "Lumbang",
      "bikol": "Lumbang",
      "hiligaynon": "Biaw",
      "stuartUrl": "https://www.stuartxchange.org/Lumbang.html"
  },
  "lunas": {
      "canonicalLocalName": "Lunas",
      "scientificName": "Lunasia amara",
      "english": "Bitter Lunasia",
      "tagalog": "Lunas",
      "cebuano": "Lunas-bundok",
      "ilocano": "Lunas",
      "bikol": "Lunas",
      "hiligaynon": "Lunas-bundok",
      "stuartUrl": "https://www.stuartxchange.org/Lunas.html"
  },
  "lupa": {
      "canonicalLocalName": "Lupa",
      "scientificName": "Boehmeria nivea",
      "english": "Ramie",
      "tagalog": "Lupa",
      "cebuano": "Amirai",
      "ilocano": "Lupa",
      "bikol": "Lupa",
      "hiligaynon": "Amirai",
      "stuartUrl": "https://www.stuartxchange.org/Lupa.html"
  },
  "malabulak": {
      "canonicalLocalName": "Malabulak",
      "scientificName": "Bombax ceiba",
      "english": "Red Silk Cotton Tree",
      "tagalog": "Malabulak",
      "cebuano": "Salay",
      "ilocano": "Malabulak",
      "bikol": "Malabulak",
      "hiligaynon": "Salay",
      "stuartUrl": "https://www.stuartxchange.org/Malabulak.html"
  },
  "malunggaygubat": {
      "canonicalLocalName": "Malunggay-gubat",
      "scientificName": "Radermachera pinnata",
      "english": "Forest Radermachera",
      "tagalog": "Malunggay-gubat",
      "cebuano": "Bannay-bannay",
      "ilocano": "Malunggay-gubat",
      "bikol": "Malunggay-gubat",
      "hiligaynon": "Bannay-bannay",
      "stuartUrl": "https://www.stuartxchange.org/Malunggaygubat.html"
  },
  "mamalis": {
      "canonicalLocalName": "Mamalis",
      "scientificName": "Pittosporum pentandrum",
      "english": "Taiwanese Cheesewood",
      "tagalog": "Mamalis",
      "cebuano": "Duting-bato",
      "ilocano": "Mamalis",
      "bikol": "Mamalis",
      "hiligaynon": "Duting-bato",
      "stuartUrl": "https://www.stuartxchange.org/Mamalis.html"
  },
  "marang": {
      "canonicalLocalName": "Marang",
      "scientificName": "Artocarpus odoratissimus",
      "english": "Marang / Johey Oak",
      "tagalog": "Marang",
      "cebuano": "Marang-tam-is",
      "ilocano": "Marang",
      "bikol": "Marang",
      "hiligaynon": "Marang-tam-is",
      "stuartUrl": "https://www.stuartxchange.org/Marang.html"
  },
  "mirasol": {
      "canonicalLocalName": "Mirasol",
      "scientificName": "Helianthus annuus",
      "english": "Sunflower",
      "tagalog": "Mirasol",
      "cebuano": "Mirasol-dalag",
      "ilocano": "Mirasol",
      "bikol": "Mirasol",
      "hiligaynon": "Mirasol-dalag",
      "stuartUrl": "https://www.stuartxchange.org/Mirasol.html"
  },
  "nangkanangka": {
      "canonicalLocalName": "Nangka-nangka",
      "scientificName": "Annona glabra",
      "english": "Pond Apple / Alligator Apple",
      "tagalog": "Nangka-nangka",
      "cebuano": "Pond Apple",
      "ilocano": "Nangka-nangka",
      "bikol": "Nangka-nangka",
      "hiligaynon": "Pond Apple",
      "stuartUrl": "https://www.stuartxchange.org/Nangkanangka.html"
  },
  "ngipinngipin": {
      "canonicalLocalName": "Ngipin-ngipin",
      "scientificName": "Pseudarthria viscida",
      "english": "Sticky Desmodium cousin",
      "tagalog": "Ngipin-ngipin",
      "cebuano": "Maniy-maniy",
      "ilocano": "Ngipin-ngipin",
      "bikol": "Ngipin-ngipin",
      "hiligaynon": "Maniy-maniy",
      "stuartUrl": "https://www.stuartxchange.org/Ngipinngipin.html"
  },
  "pahutan": {
      "canonicalLocalName": "Pahutan",
      "scientificName": "Mangifera altissima",
      "english": "Wild Mango",
      "tagalog": "Pahutan",
      "cebuano": "Paho",
      "ilocano": "Pahutan",
      "bikol": "Pahutan",
      "hiligaynon": "Paho",
      "stuartUrl": "https://www.stuartxchange.org/Pahutan.html"
  },
  "palasan": {
      "canonicalLocalName": "Palasan",
      "scientificName": "Calamus merrillii",
      "english": "Philippine Rattan",
      "tagalog": "Palasan",
      "cebuano": "Uway",
      "ilocano": "Palasan",
      "bikol": "Palasan",
      "hiligaynon": "Uway",
      "stuartUrl": "https://www.stuartxchange.org/Palasan.html"
  },
  "palawan": {
      "canonicalLocalName": "Palawan",
      "scientificName": "Cyrtosperma merkusii",
      "english": "Giant Swamp Taro",
      "tagalog": "Palawan",
      "cebuano": "Palaw",
      "ilocano": "Palawan",
      "bikol": "Palawan",
      "hiligaynon": "Palaw",
      "stuartUrl": "https://www.stuartxchange.org/Palawan.html"
  },
  "pandakaki": {
      "canonicalLocalName": "Pandakaki",
      "scientificName": "Tabernaemontana divaricata",
      "english": "Crape Jasmine / Pinwheel Flower",
      "tagalog": "Pandakaki",
      "cebuano": "Pandakaki-doble",
      "ilocano": "Pandakaki",
      "bikol": "Pandakaki",
      "hiligaynon": "Pandakaki-doble",
      "stuartUrl": "https://www.stuartxchange.org/Pandakaki.html"
  },
  "pangi": {
      "canonicalLocalName": "Pangi",
      "scientificName": "Pangium edule",
      "english": "Football Fruit Tree",
      "tagalog": "Pangi",
      "cebuano": "Pangi-kahoy",
      "ilocano": "Pangi",
      "bikol": "Pangi",
      "hiligaynon": "Pangi-kahoy",
      "stuartUrl": "https://www.stuartxchange.org/Pangi.html"
  },
  "pasau": {
      "canonicalLocalName": "Pasau",
      "scientificName": "Corchorus olitorius",
      "english": "Jute Mallow / Nalta Jute",
      "tagalog": "Pasau",
      "cebuano": "Saluyot-haba",
      "ilocano": "Pasau",
      "bikol": "Pasau",
      "hiligaynon": "Saluyot-haba",
      "stuartUrl": "https://www.stuartxchange.org/Pasau.html"
  },
  "pastores": {
      "canonicalLocalName": "Pastores",
      "scientificName": "Euphorbia pulcherrima",
      "english": "Poinsettia",
      "tagalog": "Pastores",
      "cebuano": "Pascua",
      "ilocano": "Pastores",
      "bikol": "Pastores",
      "hiligaynon": "Pascua",
      "stuartUrl": "https://www.stuartxchange.org/Pastores.html"
  },
  "pata": {
      "canonicalLocalName": "Pata",
      "scientificName": "Bauhinia acuminata",
      "english": "White Orchid Tree / Snowy Orchid",
      "tagalog": "Pata",
      "cebuano": "Alibangbang-puti",
      "ilocano": "Pata",
      "bikol": "Pata",
      "hiligaynon": "Alibangbang-puti",
      "stuartUrl": "https://www.stuartxchange.org/Pata.html"
  },
  "pili": {
      "canonicalLocalName": "Pili",
      "scientificName": "Canarium ovatum",
      "english": "Pili Nut Tree",
      "tagalog": "Pili",
      "cebuano": "Pili-kahoy",
      "ilocano": "Pili",
      "bikol": "Pili",
      "hiligaynon": "Pili-kahoy",
      "stuartUrl": "https://www.stuartxchange.org/Pili.html"
  },
  "pipisik": {
      "canonicalLocalName": "Pipisik",
      "scientificName": "Avicennia marina",
      "english": "Grey Mangrove",
      "tagalog": "Pipisik",
      "cebuano": "Api-api",
      "ilocano": "Pipisik",
      "bikol": "Pipisik",
      "hiligaynon": "Api-api",
      "stuartUrl": "https://www.stuartxchange.org/Pipisik.html"
  },
  "rimas": {
      "canonicalLocalName": "Rimas",
      "scientificName": "Artocarpus altilis",
      "english": "Breadfruit",
      "tagalog": "Rimas",
      "cebuano": "Kolo",
      "ilocano": "Rimas",
      "bikol": "Rimas",
      "hiligaynon": "Kolo",
      "stuartUrl": "https://www.stuartxchange.org/Rimas.html"
  },
  "siniguelas": {
      "canonicalLocalName": "Siniguelas",
      "scientificName": "Spondias purpurea",
      "english": "Spanish Plum / Red Mombin",
      "tagalog": "Siniguelas",
      "cebuano": "Sirkuelas",
      "ilocano": "Siniguelas",
      "bikol": "Siniguelas",
      "hiligaynon": "Sirkuelas",
      "stuartUrl": "https://www.stuartxchange.org/Siniguelas.html"
  },
  "saging": {
      "canonicalLocalName": "Saging",
      "scientificName": "Musa acuminata",
      "english": "Banana",
      "tagalog": "Saging",
      "cebuano": "Saging-tindok",
      "ilocano": "Saging",
      "bikol": "Saging",
      "hiligaynon": "Saging-tindok",
      "stuartUrl": "https://www.stuartxchange.org/Saging.html"
  },
  "salingbobog": {
      "canonicalLocalName": "Salingbobog",
      "scientificName": "Crateva religiosa",
      "english": "Sacred Garlic Pear",
      "tagalog": "Salingbobog",
      "cebuano": "Balai-lamok",
      "ilocano": "Salingbobog",
      "bikol": "Salingbobog",
      "hiligaynon": "Balai-lamok",
      "stuartUrl": "https://www.stuartxchange.org/Salingbobog.html"
  },
  "salomaguegubat": {
      "canonicalLocalName": "Salomague-gubat",
      "scientificName": "Intsia bijuga",
      "english": "Moluccan Ironwood",
      "tagalog": "Salomague-gubat",
      "cebuano": "Ipil",
      "ilocano": "Salomague-gubat",
      "bikol": "Salomague-gubat",
      "hiligaynon": "Ipil",
      "stuartUrl": "https://www.stuartxchange.org/Salomaguegubat.html"
  },
  "sinamay": {
      "canonicalLocalName": "Sinamay",
      "scientificName": "Musa textilis",
      "english": "Abaca / Manila Hemp",
      "tagalog": "Sinamay",
      "cebuano": "Abaka",
      "ilocano": "Sinamay",
      "bikol": "Sinamay",
      "hiligaynon": "Abaka",
      "stuartUrl": "https://www.stuartxchange.org/Sinamay.html"
  },
  "tangantangan": {
      "canonicalLocalName": "Tangan-tangan",
      "scientificName": "Ricinus communis",
      "english": "Castor Bean / Castor Oil Plant",
      "tagalog": "Tangan-tangan",
      "cebuano": "Lantang",
      "ilocano": "Tangan-tangan",
      "bikol": "Tangan-tangan",
      "hiligaynon": "Lantang",
      "stuartUrl": "https://www.stuartxchange.org/Tangantangan.html"
  },
  "tagbakgubat": {
      "canonicalLocalName": "Tagbak-gubat",
      "scientificName": "Alpinia haenkei",
      "english": "Haenke's Galangal",
      "tagalog": "Tagbak-gubat",
      "cebuano": "Tagbak-dako",
      "ilocano": "Tagbak-gubat",
      "bikol": "Tagbak-gubat",
      "hiligaynon": "Tagbak-dako",
      "stuartUrl": "https://www.stuartxchange.org/Tagbakgubat.html"
  },
  "tambabalisa": {
      "canonicalLocalName": "Tambabalisa",
      "scientificName": "Cassia sophera",
      "english": "Pepper Bush / Sophera Senna",
      "tagalog": "Tambabalisa",
      "cebuano": "Kasitas-gubat",
      "ilocano": "Tambabalisa",
      "bikol": "Tambabalisa",
      "hiligaynon": "Kasitas-gubat",
      "stuartUrl": "https://www.stuartxchange.org/Tambabalisa.html"
  },
};

/**
 * Normalizes an herb name or search term for resilient dictionary lookup.
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds all herb canonical local names that match an English or regional search query.
 * Always returns exact database `localName` values for seamless WHERE localName IN (...) queries.
 */
export function findMatchingHerbNames(query: string): string[] {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const matched = new Set<string>();

  for (const [key, info] of Object.entries(REGIONAL_HERB_REGISTRY)) {
    if (
      key.includes(q) ||
      info.canonicalLocalName.toLowerCase().includes(q) ||
      info.scientificName.toLowerCase().includes(q) ||
      info.english.toLowerCase().includes(q) ||
      info.tagalog.toLowerCase().includes(q) ||
      info.cebuano.toLowerCase().includes(q) ||
      info.ilocano.toLowerCase().includes(q) ||
      info.bikol.toLowerCase().includes(q) ||
      (info.hiligaynon && info.hiligaynon.toLowerCase().includes(q)) ||
      (info.otherDialects && info.otherDialects.toLowerCase().includes(q))
    ) {
      matched.add(info.canonicalLocalName);
    }
  }

  return Array.from(matched);
}

/**
 * Retrieves regional names info by botanical or local name.
 */
export function getRegionalInfo(identifier: string): RegionalHerbInfo | null {
  if (!identifier) return null;
  const norm = normalizeKey(identifier);

  if (REGIONAL_HERB_REGISTRY[norm]) {
    return REGIONAL_HERB_REGISTRY[norm];
  }

  const lower = identifier.trim().toLowerCase();
  for (const info of Object.values(REGIONAL_HERB_REGISTRY)) {
    if (
      info.canonicalLocalName.toLowerCase() === lower ||
      info.scientificName.toLowerCase() === lower ||
      normalizeKey(info.canonicalLocalName) === norm ||
      normalizeKey(info.scientificName) === norm
    ) {
      return info;
    }
  }

  return null;
}

/**
 * Formats regional names dictionary for UI components.
 */
export function getHerbRegionalNames(herb: { localName?: string; scientificName?: string }): RegionalHerbInfo {
  const info = getRegionalInfo(herb?.localName || '') || getRegionalInfo(herb?.scientificName || '');
  if (info) return info;
  return {
    canonicalLocalName: herb?.localName || 'Herb',
    scientificName: herb?.scientificName || '',
    english: 'Philippine Herbal Plant',
    tagalog: herb?.localName || '',
    cebuano: '—',
    ilocano: '—',
    bikol: '—',
    stuartUrl: ''
  };
}

/**
 * Checks whether an herb matches a search query across any regional linguistic alias.
 */
export function matchesRegionalNames(herb: { localName?: string; scientificName?: string }, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const info = getHerbRegionalNames(herb);
  return (
    info.canonicalLocalName.toLowerCase().includes(q) ||
    info.scientificName.toLowerCase().includes(q) ||
    info.english.toLowerCase().includes(q) ||
    info.tagalog.toLowerCase().includes(q) ||
    info.cebuano.toLowerCase().includes(q) ||
    info.ilocano.toLowerCase().includes(q) ||
    info.bikol.toLowerCase().includes(q) ||
    (info.hiligaynon ? info.hiligaynon.toLowerCase().includes(q) : false) ||
    (info.otherDialects ? info.otherDialects.toLowerCase().includes(q) : false)
  );
}
